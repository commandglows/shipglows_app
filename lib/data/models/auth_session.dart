enum AuthStatus { loading, signedOut, demo, authenticated }

class AuthSession {
  final AuthStatus status;
  final String? bearerToken;
  final bool onboardingComplete;
  final String? email;

  const AuthSession({
    required this.status,
    this.bearerToken,
    this.onboardingComplete = false,
    this.email,
  });

  bool get isLoading => status == AuthStatus.loading;
  bool get isSignedIn =>
      status == AuthStatus.demo || status == AuthStatus.authenticated;
  bool get isDemo => status == AuthStatus.demo;
  bool get isAuthenticated => status == AuthStatus.authenticated;

  AuthSession copyWith({
    AuthStatus? status,
    String? bearerToken,
    bool clearBearerToken = false,
    bool? onboardingComplete,
    String? email,
    bool clearEmail = false,
  }) {
    return AuthSession(
      status: status ?? this.status,
      bearerToken: clearBearerToken ? null : (bearerToken ?? this.bearerToken),
      onboardingComplete: onboardingComplete ?? this.onboardingComplete,
      email: clearEmail ? null : (email ?? this.email),
    );
  }
}
