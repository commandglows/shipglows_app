import 'package:shared_preferences/shared_preferences.dart';

class ClerkAuthResult {
  final String bearerToken;
  final String userId;
  final String? email;

  const ClerkAuthResult({
    required this.bearerToken,
    required this.userId,
    this.email,
  });
}

class ClerkAuthService {
  ClerkAuthService({
    required this.publishableKey,
    required this.sharedPreferences,
  });

  final String publishableKey;
  final SharedPreferences sharedPreferences;

  Future<ClerkAuthResult> signInWithPassword({
    required String email,
    required String password,
  }) async {
    throw StateError(
      'Clerk Flutter beta auth has been removed from production. '
      'Use the web Google flow or the legacy branch if you need the old SDK.',
    );
  }

  Future<ClerkAuthResult> signUpWithPassword({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    throw StateError(
      'Clerk Flutter beta auth has been removed from production. '
      'Use the web Google flow or the legacy branch if you need the old SDK.',
    );
  }

  Future<void> signOut() async {}

  Future<ClerkAuthResult?> restoreSession() async {
    return null;
  }

  Future<String?> getFreshToken({bool skipCache = false}) async {
    return null;
  }

  void terminate() {}
}
