import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/auth/auth_provider.dart';
import 'package:shipglows_app/shipglows/auth/firebase_bootstrap.dart';

class _FakeSessionSource implements FirebaseSessionSource {
  _FakeSessionSource(this.currentSession);

  @override
  FirebaseSessionSnapshot? currentSession;

  FirebaseSessionSnapshot? refreshedSession;
  var refreshCount = 0;
  final forceRefreshValues = <bool>[];
  final StreamController<FirebaseSessionSnapshot?> _changes =
      StreamController<FirebaseSessionSnapshot?>.broadcast();

  @override
  Stream<FirebaseSessionSnapshot?> get sessionChanges => _changes.stream;

  @override
  Future<FirebaseSessionSnapshot?> loadSession({
    required bool forceRefresh,
  }) async {
    refreshCount += 1;
    forceRefreshValues.add(forceRefresh);
    return refreshedSession;
  }

  void emit(FirebaseSessionSnapshot? session) => _changes.add(session);

  Future<void> dispose() => _changes.close();
}

FirebaseSessionSnapshot _session({DateTime? expiresAt}) =>
    FirebaseSessionSnapshot(
      userId: 'user_000000000001',
      accessToken: 'signed.access.token',
      expiresAt: expiresAt,
      displayName: 'Diane',
      email: 'diane@example.com',
      providerId: 'google.com',
    );

void main() {
  test(
    'refreshes an expired Firebase session before exposing a runner token',
    () async {
      final now = DateTime.utc(2026, 8, 1, 12);
      final source =
          _FakeSessionSource(
              _session(expiresAt: now.subtract(const Duration(seconds: 1))),
            )
            ..refreshedSession = _session(
              expiresAt: now.add(const Duration(minutes: 5)),
            );
      final provider = FirebaseShipGlowsAuthProvider(source, clock: () => now);

      final session = await provider.currentSession();

      expect(session?.accessToken, 'signed.access.token');
      expect(source.refreshCount, 1);
      expect(source.forceRefreshValues, [true]);
      await source.dispose();
    },
  );

  test(
    'restores the current Firebase user before auth listeners start',
    () async {
      final source = _FakeSessionSource(null)
        ..refreshedSession = _session(expiresAt: DateTime.utc(2026, 8, 1, 13));
      final provider = FirebaseShipGlowsAuthProvider(
        source,
        clock: () => DateTime.utc(2026, 8, 1, 12),
      );

      final session = await provider.currentSession();

      expect(session?.userId, 'user_000000000001');
      expect(session?.displayName, 'Diane');
      expect(session?.email, 'diane@example.com');
      expect(session?.providerId, 'google.com');
      expect(source.forceRefreshValues, [false]);
      await source.dispose();
    },
  );

  test('refreshes a token before it enters the expiry safety window', () async {
    final now = DateTime.utc(2026, 8, 1, 12);
    final source =
        _FakeSessionSource(
            _session(expiresAt: now.add(const Duration(seconds: 30))),
          )
          ..refreshedSession = _session(
            expiresAt: now.add(const Duration(hours: 1)),
          );
    final provider = FirebaseShipGlowsAuthProvider(source, clock: () => now);

    await provider.currentSession();

    expect(source.forceRefreshValues, [true]);
    await source.dispose();
  });

  test(
    'normalizes Firebase session changes without exposing a provider wire type',
    () async {
      final source = _FakeSessionSource(null);
      final provider = FirebaseShipGlowsAuthProvider(source);
      final states = <ShipGlowsAuthState>[];
      final subscription = provider.authStateChanges.listen(states.add);

      source.emit(_session());
      source.emit(null);
      await Future<void>.delayed(Duration.zero);

      expect(states.map((state) => state.status), [
        ShipGlowsAuthStatus.signedIn,
        ShipGlowsAuthStatus.signedOut,
      ]);
      expect(states.first.session?.userId, 'user_000000000001');
      await subscription.cancel();
      await source.dispose();
    },
  );

  test(
    'keeps the local dashboard auth adapter disabled without build config',
    () async {
      final provider = await bootstrapShipGlowsAuth(
        const FirebaseBootstrapConfiguration(
          apiKey: '',
          appId: '',
          messagingSenderId: '',
          projectId: '',
        ),
      );

      expect(provider, isA<DisabledShipGlowsAuthProvider>());
      expect(await provider.currentSession(), isNull);
    },
  );

  test(
    'does not initialize Firebase from an incomplete client configuration',
    () async {
      final provider = await bootstrapShipGlowsAuth(
        const FirebaseBootstrapConfiguration(
          apiKey: 'public-api-key',
          appId: '',
          messagingSenderId: 'sender-id',
          projectId: 'shipglows-test',
        ),
      );

      expect(provider, isA<DisabledShipGlowsAuthProvider>());
    },
  );
}
