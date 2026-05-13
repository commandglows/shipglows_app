import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/app_access_state.dart';

String? resolveAppRedirect({
  required Uri uri,
  required AsyncValue<AppAccessState> appAccessAsync,
}) {
  final location = uri.path;
  final isRoot = location == '/';
  final isEntry = location == '/entry';
  final isAuth = location == '/auth';
  final isFeedback = location == '/feedback';
  final isFeedbackAdmin = location == '/feedback-admin';
  final isOnboarding = location == '/onboarding';
  final onboardingIntent = uri.queryParameters['intent'];
  final onboardingMode = uri.queryParameters['mode'];
  final allowOnboarding =
      onboardingIntent == 'entry' ||
      onboardingIntent == 'project-manage' ||
      onboardingMode == 'create' ||
      onboardingMode == 'edit';
  final access = appAccessAsync.value;

  if (appAccessAsync.isLoading || access == null) {
    if (isRoot) {
      return '/entry';
    }
    return null;
  }

  switch (access.stage) {
    case AppAccessStage.restoringSession:
    case AppAccessStage.checkingBackend:
    case AppAccessStage.checkingWorkspace:
      if (isRoot) {
        return '/entry';
      }
      return null;
    case AppAccessStage.signedOut:
    case AppAccessStage.bootstrapUnauthorized:
      if (!isEntry && !isAuth && !isFeedback) {
        return '/entry';
      }
      return null;
    case AppAccessStage.demo:
      if (isAuth) {
        return '/entry';
      }
      if (isOnboarding && !allowOnboarding) {
        return '/entry';
      }
      if (access.bootstrap?.shouldOnboard == true &&
          !isEntry &&
          !isOnboarding &&
          !isFeedback) {
        return '/entry';
      }
      if (access.bootstrap?.shouldOnboard == false && isOnboarding) {
        return '/entry';
      }
      return null;
    case AppAccessStage.apiUnavailable:
    case AppAccessStage.bootstrapFailed:
      if (isAuth || isOnboarding) {
        return '/entry';
      }
      if (isEntry && access.bootstrap?.shouldOnboard == false) {
        return '/feed';
      }
      return null;
    case AppAccessStage.needsOnboarding:
      if (isAuth) {
        return '/entry';
      }
      if (isOnboarding && !allowOnboarding) {
        return '/entry';
      }
      if (!isEntry && !isOnboarding && !isFeedback && !isFeedbackAdmin) {
        return '/entry';
      }
      return null;
    case AppAccessStage.ready:
      if (isAuth) {
        return '/entry';
      }
      if (isOnboarding && !allowOnboarding) {
        return '/entry';
      }
      if (isEntry) {
        return '/feed';
      }
      return null;
  }
}
