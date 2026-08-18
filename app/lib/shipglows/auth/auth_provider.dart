import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

enum ShipGlowsAuthStatus { signedOut, signedIn }

enum ShipGlowsAuthFailure {
  cancelled,
  popupBlocked,
  network,
  unsupported,
  unknown,
}

class ShipGlowsAuthException implements Exception {
  const ShipGlowsAuthException({required this.failure, required this.message});

  final ShipGlowsAuthFailure failure;
  final String message;

  @override
  String toString() => message;
}

class ShipGlowsSession {
  const ShipGlowsSession({
    required this.userId,
    required this.accessToken,
    required this.expiresAt,
    this.displayName,
    this.email,
    this.photoUrl,
    this.providerId,
  });

  final String userId;
  final String accessToken;
  final DateTime? expiresAt;
  final String? displayName;
  final String? email;
  final String? photoUrl;
  final String? providerId;
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
  bool get requiresAuthentication;

  Future<ShipGlowsSession?> currentSession({bool forceRefresh = false});

  Stream<ShipGlowsAuthState> get authStateChanges;

  Future<void> signInWithGoogle();

  Future<void> signOut();
}

class DisabledShipGlowsAuthProvider implements ShipGlowsAuthProvider {
  const DisabledShipGlowsAuthProvider();

  @override
  bool get requiresAuthentication => false;

  @override
  Stream<ShipGlowsAuthState> get authStateChanges =>
      const Stream<ShipGlowsAuthState>.empty();

  @override
  Future<ShipGlowsSession?> currentSession({bool forceRefresh = false}) async =>
      null;

  @override
  Future<void> signInWithGoogle() async {}

  @override
  Future<void> signOut() async {}
}

class FirebaseSessionSnapshot {
  const FirebaseSessionSnapshot({
    required this.userId,
    required this.accessToken,
    required this.expiresAt,
    this.displayName,
    this.email,
    this.photoUrl,
    this.providerId,
  });

  final String userId;
  final String accessToken;
  final DateTime? expiresAt;
  final String? displayName;
  final String? email;
  final String? photoUrl;
  final String? providerId;

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
      displayName: user.displayName,
      email: user.email,
      photoUrl: user.photoURL,
      providerId: user.providerData
          .map((provider) => provider.providerId)
          .where((providerId) => providerId.isNotEmpty)
          .firstOrNull,
    );
  }
}

class FirebaseShipGlowsAuthProvider implements ShipGlowsAuthProvider {
  FirebaseShipGlowsAuthProvider(
    this._source, {
    DateTime Function()? clock,
    Future<void> Function()? googleSignIn,
    Future<void> Function()? signOut,
  }) : _clock = clock ?? DateTime.now,
       _googleSignIn = googleSignIn,
       _signOut = signOut;

  final FirebaseSessionSource _source;
  final DateTime Function() _clock;
  final Future<void> Function()? _googleSignIn;
  final Future<void> Function()? _signOut;
  Future<FirebaseSessionSnapshot?>? _refreshInFlight;

  static const _refreshSkew = Duration(minutes: 1);

  @override
  bool get requiresAuthentication => true;

  @override
  Future<void> signInWithGoogle() async {
    final signIn = _googleSignIn;
    if (signIn == null) {
      throw const ShipGlowsAuthException(
        failure: ShipGlowsAuthFailure.unsupported,
        message: 'La connexion Google est disponible dans l’application Web.',
      );
    }
    try {
      await signIn();
    } on FirebaseAuthException catch (error) {
      debugPrint('ShipGlows Google sign-in failed: ${error.code}.');
      throw _mapFirebaseAuthError(error);
    }
  }

  @override
  Future<void> signOut() async => _signOut?.call();

  ShipGlowsAuthException _mapFirebaseAuthError(FirebaseAuthException error) {
    return switch (error.code) {
      'popup-closed-by-user' ||
      'cancelled-popup-request' => const ShipGlowsAuthException(
        failure: ShipGlowsAuthFailure.cancelled,
        message: 'La connexion Google a été annulée.',
      ),
      'popup-blocked' => const ShipGlowsAuthException(
        failure: ShipGlowsAuthFailure.popupBlocked,
        message:
            'Le navigateur a bloqué la fenêtre Google. Autorisez les pop-ups puis réessayez.',
      ),
      'network-request-failed' => const ShipGlowsAuthException(
        failure: ShipGlowsAuthFailure.network,
        message:
            'La connexion réseau a échoué. Vérifiez votre accès puis réessayez.',
      ),
      _ => const ShipGlowsAuthException(
        failure: ShipGlowsAuthFailure.unknown,
        message:
            'La connexion Google a échoué. Réessayez sans partager de jeton.',
      ),
    };
  }

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
      displayName: snapshot.displayName,
      email: snapshot.email,
      photoUrl: snapshot.photoUrl,
      providerId: snapshot.providerId,
    );
  }
}
