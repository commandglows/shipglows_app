import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:shipglowz_app/shipglowz/auth/auth_provider.dart';
import 'package:shipglowz_app/shipglowz/auth/supabase_bootstrap.dart';

class _FakeSessionSource implements SupabaseSessionSource {
  _FakeSessionSource(this.currentSession);

  @override
  SupabaseSessionSnapshot? currentSession;

  SupabaseSessionSnapshot? refreshedSession;
  var refreshCount = 0;
  final StreamController<SupabaseSessionSnapshot?> _changes =
      StreamController<SupabaseSessionSnapshot?>.broadcast();

  @override
  Stream<SupabaseSessionSnapshot?> get sessionChanges => _changes.stream;

  @override
  Future<SupabaseSessionSnapshot?> refreshSession() async {
    refreshCount += 1;
    return refreshedSession;
  }

  void emit(SupabaseSessionSnapshot? session) => _changes.add(session);

  Future<void> dispose() => _changes.close();
}

SupabaseSessionSnapshot _session({DateTime? expiresAt}) =>
    SupabaseSessionSnapshot(
      userId: 'user_000000000001',
      accessToken: 'signed.access.token',
      expiresAt: expiresAt,
    );

void main() {
  test('refreshes an expired Supabase session before exposing a runner token', () async {
    final now = DateTime.utc(2026, 8, 1, 12);
    final source = _FakeSessionSource(_session(expiresAt: now.subtract(const Duration(seconds: 1))))
      ..refreshedSession = _session(expiresAt: now.add(const Duration(minutes: 5)));
    final provider = SupabaseShipGlowzAuthProvider(source, clock: () => now);

    final session = await provider.currentSession();

    expect(session?.accessToken, 'signed.access.token');
    expect(source.refreshCount, 1);
    await source.dispose();
  });

  test('normalizes Supabase session changes without exposing a provider wire type', () async {
    final source = _FakeSessionSource(null);
    final provider = SupabaseShipGlowzAuthProvider(source);
    final states = <ShipGlowzAuthState>[];
    final subscription = provider.authStateChanges.listen(states.add);

    source.emit(_session());
    source.emit(null);
    await Future<void>.delayed(Duration.zero);

    expect(states.map((state) => state.status), [
      ShipGlowzAuthStatus.signedIn,
      ShipGlowzAuthStatus.signedOut,
    ]);
    expect(states.first.session?.userId, 'user_000000000001');
    await subscription.cancel();
    await source.dispose();
  });

  test('keeps the local dashboard auth adapter disabled without build config', () async {
    final provider = await bootstrapShipGlowzAuth(
      const SupabaseBootstrapConfiguration(url: '', publishableKey: ''),
    );

    expect(provider, isA<DisabledShipGlowzAuthProvider>());
    expect(await provider.currentSession(), isNull);
  });

  test('does not initialize Supabase from an invalid URL', () async {
    final provider = await bootstrapShipGlowzAuth(
      const SupabaseBootstrapConfiguration(
        url: 'file:///not-a-supabase-project',
        publishableKey: 'publishable-key',
      ),
    );

    expect(provider, isA<DisabledShipGlowzAuthProvider>());
  });
}
