import 'package:firebase_auth/firebase_auth.dart';

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

  const ShipGlowsAuthState.signedOut()
    : this._(ShipGlowsAuthStatus.signedOut, null);

  const ShipGlowsAuthState.signedIn(ShipGlowsSession session)
    : this._(ShipGlowsAuthStatus.signedIn, session);

  final ShipGlowsAuthStatus status;
  final ShipGlowsSession? session;
}

abstract interface class ShipGlowsAuthProvider {
  Future<ShipGlowsSession?> currentSession({bool forceRefresh = false});

  Stream<ShipGlowsAuthState> get authStateChanges;
}

class DisabledShipGlowsAuthProvider implements ShipGlowsAuthProvider {
  const DisabledShipGlowsAuthProvider();

  @override
  Stream<ShipGlowsAuthState> get authStateChanges =>
      const Stream<ShipGlowsAuthState>.empty();

  @override
  Future<ShipGlowsSession?> currentSession({bool forceRefresh = false}) async =>
      null;
}

class FirebaseSessionSnapshot {
  const FirebaseSessionSnapshot({
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

abstract interface class FirebaseSessionSource {
  FirebaseSessionSnapshot? get currentSession;

  Stream<FirebaseSessionSnapshot?> get sessionChanges;

  Future<FirebaseSessionSnapshot?> loadSession({required bool forceRefresh});
}

class FirebaseFlutterSessionSource implements FirebaseSessionSource {
  FirebaseFlutterSessionSource(this._auth);

  final FirebaseAuth _auth;
  FirebaseSessionSnapshot? _snapshot;

  @override
  FirebaseSessionSnapshot? get currentSession => _snapshot;

  @override
  Stream<FirebaseSessionSnapshot?> get sessionChanges =>
      _auth.idTokenChanges().asyncMap(_mapUser);

  @override
  Future<FirebaseSessionSnapshot?> loadSession({
    required bool forceRefresh,
  }) async => _mapUser(_auth.currentUser, forceRefresh: forceRefresh);

  Future<FirebaseSessionSnapshot?> _mapUser(
    User? user, {
    bool forceRefresh = false,
  }) async {
    if (user == null) return _snapshot = null;
    final token = await user.getIdTokenResult(forceRefresh);
    final accessToken = token.token;
    if (accessToken == null || accessToken.isEmpty) return _snapshot = null;
    return _snapshot = FirebaseSessionSnapshot(
      userId: user.uid,
      accessToken: accessToken,
      expiresAt: token.expirationTime?.toUtc(),
    );
  }
}

class FirebaseShipGlowsAuthProvider implements ShipGlowsAuthProvider {
  FirebaseShipGlowsAuthProvider(this._source, {DateTime Function()? clock})
    : _clock = clock ?? DateTime.now;

  final FirebaseSessionSource _source;
  final DateTime Function() _clock;
  Future<FirebaseSessionSnapshot?>? _refreshInFlight;

  static const _refreshSkew = Duration(minutes: 1);

  @override
  Stream<ShipGlowsAuthState> get authStateChanges =>
      _source.sessionChanges.map(_toState);

  @override
  Future<ShipGlowsSession?> currentSession({bool forceRefresh = false}) async {
    var snapshot = _source.currentSession;
    final now = _clock().toUtc();
    final expiresAt = snapshot?.expiresAt;
    final needsRefresh =
        forceRefresh ||
        snapshot == null ||
        snapshot.isExpiredAt(now) ||
        (expiresAt != null && !expiresAt.isAfter(now.add(_refreshSkew)));
    if (needsRefresh) {
      snapshot = await _loadSession(
        forceRefresh: forceRefresh || snapshot != null,
      );
    }
    return _toSession(snapshot);
  }

  Future<FirebaseSessionSnapshot?> _loadSession({required bool forceRefresh}) {
    final inFlight = _refreshInFlight;
    if (inFlight != null) return inFlight;

    final refresh = _source.loadSession(forceRefresh: forceRefresh);
    _refreshInFlight = refresh;
    return refresh.whenComplete(() {
      if (identical(_refreshInFlight, refresh)) {
        _refreshInFlight = null;
      }
    });
  }

  ShipGlowsAuthState _toState(FirebaseSessionSnapshot? snapshot) {
    final session = _toSession(snapshot);
    return session == null
        ? const ShipGlowsAuthState.signedOut()
        : ShipGlowsAuthState.signedIn(session);
  }

  ShipGlowsSession? _toSession(FirebaseSessionSnapshot? snapshot) {
    if (snapshot == null ||
        snapshot.userId.isEmpty ||
        snapshot.accessToken.isEmpty) {
      return null;
    }
    return ShipGlowsSession(
      userId: snapshot.userId,
      accessToken: snapshot.accessToken,
      expiresAt: snapshot.expiresAt,
    );
  }
}
