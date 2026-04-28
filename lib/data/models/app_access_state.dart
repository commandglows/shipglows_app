import 'app_bootstrap.dart';

enum AppAccessStage {
  signedOut,
  restoringSession,
  demo,
  checkingBackend,
  apiUnavailable,
  checkingWorkspace,
  bootstrapFailed,
  bootstrapUnauthorized,
  needsOnboarding,
  ready,
}

class AppAccessState {
  const AppAccessState({
    required this.stage,
    this.backendHealth,
    this.bootstrap,
    this.statusCode,
    this.message,
    this.checkedAt,
  });

  final AppAccessStage stage;
  final Map<String, dynamic>? backendHealth;
  final AppBootstrap? bootstrap;
  final int? statusCode;
  final String? message;
  final DateTime? checkedAt;

  bool get isSignedOut => stage == AppAccessStage.signedOut;
  bool get isDemo => stage == AppAccessStage.demo;
  bool get isReady => stage == AppAccessStage.ready;
  bool get needsOnboarding => stage == AppAccessStage.needsOnboarding;
  bool get requiresReauth => stage == AppAccessStage.bootstrapUnauthorized;
  bool get hasBootstrap => bootstrap != null;
  bool get canUseWorkspaceData =>
      stage == AppAccessStage.ready ||
      stage == AppAccessStage.needsOnboarding ||
      ((stage == AppAccessStage.apiUnavailable ||
              stage == AppAccessStage.bootstrapFailed) &&
          bootstrap != null);
  bool get isChecking =>
      stage == AppAccessStage.restoringSession ||
      stage == AppAccessStage.checkingBackend ||
      stage == AppAccessStage.checkingWorkspace;
  bool get isDegraded =>
      stage == AppAccessStage.apiUnavailable ||
      stage == AppAccessStage.bootstrapFailed;
  bool get backendReachable =>
      backendHealth != null &&
      (backendHealth!['status'] == 'ok' ||
          backendHealth!['status'] == 'healthy');

  String get backendStatusLabel {
    if (backendHealth == null) {
      return 'unknown';
    }
    return backendHealth!['status']?.toString() ?? 'unknown';
  }

  String get bootstrapStatusLabel {
    if (bootstrap != null) {
      return 'success';
    }
    return switch (stage) {
      AppAccessStage.checkingWorkspace => 'loading',
      AppAccessStage.bootstrapUnauthorized => 'unauthorized',
      AppAccessStage.bootstrapFailed => 'failed',
      AppAccessStage.needsOnboarding => 'success',
      AppAccessStage.ready => 'success',
      _ => 'not_started',
    };
  }

  String get diagnosticsLabel => stage.name;

  AppAccessState copyWith({
    AppAccessStage? stage,
    Map<String, dynamic>? backendHealth,
    bool clearBackendHealth = false,
    AppBootstrap? bootstrap,
    bool clearBootstrap = false,
    int? statusCode,
    bool clearStatusCode = false,
    String? message,
    bool clearMessage = false,
    DateTime? checkedAt,
  }) {
    return AppAccessState(
      stage: stage ?? this.stage,
      backendHealth: clearBackendHealth
          ? null
          : (backendHealth ?? this.backendHealth),
      bootstrap: clearBootstrap ? null : (bootstrap ?? this.bootstrap),
      statusCode: clearStatusCode ? null : (statusCode ?? this.statusCode),
      message: clearMessage ? null : (message ?? this.message),
      checkedAt: checkedAt ?? this.checkedAt,
    );
  }
}
