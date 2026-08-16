import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/studio/studio_contracts.dart';
import '../data/managed_runner_api.dart';
import 'managed_runner_provider.dart';

final managedStudioCapabilityProvider = FutureProvider.autoDispose
    .family<StudioPreviewCapability?, String>((ref, projectId) async {
      final client = ref.watch(managedRunnerApiProvider);
      if (client == null || client is! ManagedStudioTransport) return null;
      final studio = client as ManagedStudioTransport;
      try {
        return await studio.studioCapability(projectId: projectId);
      } catch (_) {
        return null;
      }
    });
