import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/auth/auth_provider.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/profile_settings_group.dart';
import 'package:shipglows_app/shipglows/providers/auth_provider.dart';

void main() {
  testWidgets(
    'shows the active Google identity without technical credentials',
    (tester) async {
      final auth = _ProfileAuthProvider();
      await tester.pumpWidget(_app(auth));
      await tester.pumpAndSettle();

      expect(find.text('Profil'), findsOneWidget);
      expect(find.text('Diane ShipGlows'), findsOneWidget);
      expect(
        find.text('diane@example.com · Connecté avec Google'),
        findsOneWidget,
      );
      expect(find.textContaining('private-user-id'), findsNothing);
      expect(find.textContaining('private-access-token'), findsNothing);

      await tester.tap(find.text('Se déconnecter'));
      expect(auth.signOutCount, 1);
    },
  );

  testWidgets('hides the profile group when authentication is disabled', (
    tester,
  ) async {
    await tester.pumpWidget(_app(const DisabledShipGlowsAuthProvider()));
    await tester.pumpAndSettle();

    expect(find.text('Profil'), findsNothing);
  });
}

Widget _app(ShipGlowsAuthProvider auth) => ProviderScope(
  overrides: [shipGlowsAuthProvider.overrideWithValue(auth)],
  child: MaterialApp(
    theme: AppTheme.buildForTesting(Brightness.light),
    home: const Scaffold(body: ShipGlowsProfileSettingsGroup()),
  ),
);

class _ProfileAuthProvider implements ShipGlowsAuthProvider {
  var signOutCount = 0;

  @override
  bool get requiresAuthentication => true;

  @override
  Stream<ShipGlowsAuthState> get authStateChanges =>
      const Stream<ShipGlowsAuthState>.empty();

  @override
  Future<ShipGlowsSession?> currentSession({bool forceRefresh = false}) async =>
      ShipGlowsSession(
        userId: 'private-user-id',
        accessToken: 'private-access-token',
        expiresAt: DateTime.utc(2026, 8, 18, 12),
        displayName: 'Diane ShipGlows',
        email: 'diane@example.com',
        providerId: 'google.com',
      );

  @override
  Future<void> signInWithGoogle() async {}

  @override
  Future<void> signOut() async {
    signOutCount += 1;
  }
}
