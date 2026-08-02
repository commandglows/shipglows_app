import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/app_config.dart';
import '../data/managed_runner_api.dart';
import 'auth_provider.dart';

final managedRunnerApiProvider = Provider<ManagedRunnerClient?>((ref) {
  if (!AppConfig.managedRunnerEnabled) return null;
  final auth = ref.watch(shipGlowzAuthProvider);
  return ManagedRunnerApi(
    baseUrl: AppConfig.managedRunnerBaseUrl,
    accessTokenProvider: () async => (await auth.currentSession())?.accessToken,
  );
});
