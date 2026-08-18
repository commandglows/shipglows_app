import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/auth/auth_provider.dart';
import 'package:shipglows_app/shipglows/auth/shipglows_auth_gate.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/auth_provider.dart';

void main() {
  testWidgets('lets the local disabled-auth runtime through immediately', (
    tester,
  ) async {
    await tester.pumpWidget(_app(const DisabledShipGlowsAuthProvider()));

    expect(find.text('Contenu protégé'), findsOneWidget);
    expect(find.text('Se connecter avec Google'), findsNothing);
    expect(find.bySemanticsLabel('Se déconnecter'), findsNothing);
  });

  testWidgets('shows signed-out, loading and signed-in states', (tester) async {
    final auth = _FakeAuthProvider();
    await tester.pumpWidget(_app(auth));
    await _pumpAsync(tester);

    expect(find.text('Se connecter avec Google'), findsOneWidget);
    expect(find.text('Contenu protégé'), findsNothing);

    await tester.tap(find.text('Se connecter avec Google'));
    await _pumpAsync(tester);

    expect(auth.signInCount, 1);
    expect(find.text('Contenu protégé'), findsOneWidget);
  });

  testWidgets('renders a recoverable typed popup error without token details', (
    tester,
  ) async {
    final auth = _FakeAuthProvider(
      signInFailure: const ShipGlowsAuthException(
        failure: ShipGlowsAuthFailure.popupBlocked,
        message: 'Le navigateur a bloqué la fenêtre Google.',
      ),
    );
    await tester.pumpWidget(_app(auth));
    await _pumpAsync(tester);

    await tester.tap(find.text('Se connecter avec Google'));
    await _pumpAsync(tester);

    expect(
      find.text('Le navigateur a bloqué la fenêtre Google.'),
      findsOneWidget,
    );
    expect(find.textContaining('opaque-token'), findsNothing);
    expect(find.text('Revérifier la session'), findsOneWidget);
  });

  testWidgets('never mounts protected content for a server-denied account', (
    tester,
  ) async {
    final auth = _FakeAuthProvider(session: _session());
    await tester.pumpWidget(
      _app(
        auth,
        authorizeSession: (_) async => throw const ManagedRunnerException(
          code: 'unauthorized',
          message: 'Unauthorized.',
          statusCode: 401,
        ),
      ),
    );
    await _pumpAsync(tester);

    expect(find.text('Contenu protégé'), findsNothing);
    expect(
      find.text('Ce compte n’a pas accès à ce Personal Cloud.'),
      findsOneWidget,
    );
    expect(find.text('Changer de compte'), findsOneWidget);
  });
}

Widget _app(
  ShipGlowsAuthProvider auth, {
  ShipGlowsSessionAuthorizer? authorizeSession,
}) => ProviderScope(
  overrides: [shipGlowsAuthProvider.overrideWithValue(auth)],
  child: MaterialApp(
    theme: AppTheme.lightTheme,
    home: ShipGlowsAuthGate(
      authorizeSession: authorizeSession,
      child: const Scaffold(body: Text('Contenu protégé')),
    ),
  ),
);

Future<void> _pumpAsync(WidgetTester tester) async {
  for (var index = 0; index < 4; index += 1) {
    await tester.pump(const Duration(milliseconds: 16));
  }
}

ShipGlowsSession _session() => ShipGlowsSession(
  userId: 'allowed-user',
  accessToken: 'opaque-token',
  expiresAt: DateTime.utc(2026, 8, 18, 23),
);

class _FakeAuthProvider implements ShipGlowsAuthProvider {
  _FakeAuthProvider({this.session, this.signInFailure});

  ShipGlowsSession? session;
  final ShipGlowsAuthException? signInFailure;
  final _states = StreamController<ShipGlowsAuthState>.broadcast();
  var signInCount = 0;
  var signOutCount = 0;

  @override
  bool get requiresAuthentication => true;

  @override
  Stream<ShipGlowsAuthState> get authStateChanges => _states.stream;

  @override
  Future<ShipGlowsSession?> currentSession({bool forceRefresh = false}) async =>
      session;

  @override
  Future<void> signInWithGoogle() async {
    signInCount += 1;
    final failure = signInFailure;
    if (failure != null) throw failure;
    session = _session();
    _states.add(ShipGlowsAuthState.signedIn(session!));
  }

  @override
  Future<void> signOut() async {
    signOutCount += 1;
    session = null;
    _states.add(const ShipGlowsAuthState.signedOut());
  }
}
