import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/managed_runner_api.dart';
import 'managed_runner_provider.dart';

final managedWorkspaceCapabilityProvider = FutureProvider.autoDispose
    .family<ManagedWorkspaceCapability?, String>((ref, projectId) async {
      final client = ref.watch(managedRunnerApiProvider);
      if (client == null) return null;
      try {
        return await client.workspaceCapability(projectId: projectId);
      } catch (_) {
        return null;
      }
    });

final managedWorkspaceTransportProvider = Provider<ManagedWorkspaceTransport?>((ref) {
  final client = ref.watch(managedRunnerApiProvider);
  return client is ManagedWorkspaceTransport
      ? client as ManagedWorkspaceTransport
      : null;
});
