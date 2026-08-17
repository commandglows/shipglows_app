import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/app_config.dart';
import '../data/managed_runner_api.dart';
import 'auth_provider.dart';

final managedRunnerApiProvider = Provider<ManagedRunnerClient?>((ref) {
  if (!AppConfig.managedRunnerEnabled) return null;
  if (AppConfig.localStudioAuthEnabled) {
    return ManagedRunnerApi(baseUrl: AppConfig.managedRunnerBaseUrl);
  }
  final auth = ref.watch(shipGlowsAuthProvider);
  return ManagedRunnerApi(
    baseUrl: AppConfig.managedRunnerBaseUrl,
    accessTokenProvider: ({forceRefresh = false}) async =>
        (await auth.currentSession(forceRefresh: forceRefresh))?.accessToken,
  );
});
