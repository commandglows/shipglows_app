import 'package:supabase_flutter/supabase_flutter.dart';

enum ShipGlowzAuthStatus { signedOut, signedIn }

class ShipGlowzSession {
  const ShipGlowzSession({
    required this.userId,
    required this.accessToken,
    required this.expiresAt,
  });

  final String userId;
  final String accessToken;
  final DateTime? expiresAt;
}

class ShipGlowzAuthState {
  const ShipGlowzAuthState._(this.status, this.session);

  const ShipGlowzAuthState.signedOut() : this._(ShipGlowzAuthStatus.signedOut, null);

  const ShipGlowzAuthState.signedIn(ShipGlowzSession session)
      : this._(ShipGlowzAuthStatus.signedIn, session);

  final ShipGlowzAuthStatus status;
  final ShipGlowzSession? session;
}

abstract interface class ShipGlowzAuthProvider {
  Future<ShipGlowzSession?> currentSession();

  Stream<ShipGlowzAuthState> get authStateChanges;
}

class DisabledShipGlowzAuthProvider implements ShipGlowzAuthProvider {
  const DisabledShipGlowzAuthProvider();

  @override
  Stream<ShipGlowzAuthState> get authStateChanges =>
      const Stream<ShipGlowzAuthState>.empty();

  @override
  Future<ShipGlowzSession?> currentSession() async => null;
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

class SupabaseShipGlowzAuthProvider implements ShipGlowzAuthProvider {
  SupabaseShipGlowzAuthProvider(
    this._source, {
    DateTime Function()? clock,
  }) : _clock = clock ?? DateTime.now;

  final SupabaseSessionSource _source;
  final DateTime Function() _clock;

  @override
  Stream<ShipGlowzAuthState> get authStateChanges =>
      _source.sessionChanges.map(_toState);

  @override
  Future<ShipGlowzSession?> currentSession() async {
    var snapshot = _source.currentSession;
    if (snapshot != null && snapshot.isExpiredAt(_clock())) {
      snapshot = await _source.refreshSession();
    }
    return _toSession(snapshot);
  }

  ShipGlowzAuthState _toState(SupabaseSessionSnapshot? snapshot) {
    final session = _toSession(snapshot);
    return session == null
        ? const ShipGlowzAuthState.signedOut()
        : ShipGlowzAuthState.signedIn(session);
  }

  ShipGlowzSession? _toSession(SupabaseSessionSnapshot? snapshot) {
    if (snapshot == null || snapshot.userId.isEmpty || snapshot.accessToken.isEmpty) {
      return null;
    }
    return ShipGlowzSession(
      userId: snapshot.userId,
      accessToken: snapshot.accessToken,
      expiresAt: snapshot.expiresAt,
    );
  }
}
