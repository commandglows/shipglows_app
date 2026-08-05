import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/cockpit/cockpit_models.dart';
import 'managed_runner_provider.dart';

final managedCockpitSnapshotProvider =
    FutureProvider.autoDispose<CockpitSnapshot?>((ref) async {
      final client = ref.watch(managedRunnerApiProvider);
      if (client == null) return null;
      try {
        return await client.loadCockpit();
      } catch (_) {
        // The local projection remains the safe fallback until the runner is ready.
        return null;
      }
    });
