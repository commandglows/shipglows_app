import 'package:supabase_flutter/supabase_flutter.dart';

enum ShipGlowsAuthStatus { signedOut, signedIn }

class ShipGlowsSession {
  const ShipGlowsSession({
    required this.userId,
    required this.accessToken,
    required this.expiresAt,
  });

  final String userId;
  final String accessToken;
  final DateTime? expiresAt;
}

class ShipGlowsAuthState {
  const ShipGlowsAuthState._(this.status, this.session);

  const ShipGlowsAuthState.signedOut() : this._(ShipGlowsAuthStatus.signedOut, null);

  const ShipGlowsAuthState.signedIn(ShipGlowsSession session)
      : this._(ShipGlowsAuthStatus.signedIn, session);

  final ShipGlowsAuthStatus status;
  final ShipGlowsSession? session;
}

abstract interface class ShipGlowsAuthProvider {
  Future<ShipGlowsSession?> currentSession();

  Stream<ShipGlowsAuthState> get authStateChanges;
}

class DisabledShipGlowsAuthProvider implements ShipGlowsAuthProvider {
  const DisabledShipGlowsAuthProvider();

  @override
  Stream<ShipGlowsAuthState> get authStateChanges =>
      const Stream<ShipGlowsAuthState>.empty();

  @override
  Future<ShipGlowsSession?> currentSession() async => null;
}

class SupabaseSessionSnapshot {
  const SupabaseSessionSnapshot({
    required this.userId,
    required this.accessToken,
    required this.expiresAt,
  });

  final String userId;
  final String accessToken;
  final DateTime? expiresAt;

  bool isExpiredAt(DateTime now) =>
      expiresAt != null && !expiresAt!.isAfter(now);
}

abstract interface class SupabaseSessionSource {
  SupabaseSessionSnapshot? get currentSession;

  Stream<SupabaseSessionSnapshot?> get sessionChanges;

  Future<SupabaseSessionSnapshot?> refreshSession();
}

class SupabaseFlutterSessionSource implements SupabaseSessionSource {
  SupabaseFlutterSessionSource(this._auth);

  final GoTrueClient _auth;

  @override
  SupabaseSessionSnapshot? get currentSession => _mapSession(_auth.currentSession);

  @override
  Stream<SupabaseSessionSnapshot?> get sessionChanges =>
      _auth.onAuthStateChange.map((event) => _mapSession(event.session));

  @override
  Future<SupabaseSessionSnapshot?> refreshSession() async =>
      _mapSession((await _auth.refreshSession()).session);

  SupabaseSessionSnapshot? _mapSession(Session? session) {
    if (session == null) return null;
    return SupabaseSessionSnapshot(
      userId: session.user.id,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(session.expiresAt! * 1000, isUtc: true),
    );
  }
}

class SupabaseShipGlowsAuthProvider implements ShipGlowsAuthProvider {
  SupabaseShipGlowsAuthProvider(
    this._source, {
    DateTime Function()? clock,
  }) : _clock = clock ?? DateTime.now;

  final SupabaseSessionSource _source;
  final DateTime Function() _clock;

  @override
  Stream<ShipGlowsAuthState> get authStateChanges =>
      _source.sessionChanges.map(_toState);

  @override
  Future<ShipGlowsSession?> currentSession() async {
    var snapshot = _source.currentSession;
    if (snapshot != null && snapshot.isExpiredAt(_clock())) {
      snapshot = await _source.refreshSession();
    }
    return _toSession(snapshot);
  }

  ShipGlowsAuthState _toState(SupabaseSessionSnapshot? snapshot) {
    final session = _toSession(snapshot);
    return session == null
        ? const ShipGlowsAuthState.signedOut()
        : ShipGlowsAuthState.signedIn(session);
  }

  ShipGlowsSession? _toSession(SupabaseSessionSnapshot? snapshot) {
    if (snapshot == null || snapshot.userId.isEmpty || snapshot.accessToken.isEmpty) {
      return null;
    }
    return ShipGlowsSession(
      userId: snapshot.userId,
      accessToken: snapshot.accessToken,
      expiresAt: snapshot.expiresAt,
    );
  }
}
