import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/managed_runner_api.dart';
import 'managed_runner_provider.dart';

enum ManagedProjectContextLoadStatus {
  ready,
  stale,
  missing,
  accessLost,
  unavailable,
}

class ManagedProjectContextState {
  const ManagedProjectContextState(this.status, {this.projection});

  final ManagedProjectContextLoadStatus status;
  final ManagedProjectContextProjection? projection;
}

final managedProjectContextClientProvider =
    Provider<ManagedProjectContextClient?>((ref) {
      final client = ref.watch(managedRunnerApiProvider);
      return client is ManagedProjectContextClient
          ? client as ManagedProjectContextClient
          : null;
    });

final managedProjectContextProvider = FutureProvider.autoDispose
    .family<ManagedProjectContextState, String>((ref, projectId) async {
      final client = ref.watch(managedProjectContextClientProvider);
      if (client == null) {
        return const ManagedProjectContextState(
          ManagedProjectContextLoadStatus.unavailable,
        );
      }
      try {
        final projection = await client.loadProjectContext(
          projectId: projectId,
        );
        if (projection.projectId != projectId) {
          return const ManagedProjectContextState(
            ManagedProjectContextLoadStatus.unavailable,
          );
        }
        final status = switch (projection.status) {
          ManagedProjectContextStatus.ready =>
            ManagedProjectContextLoadStatus.ready,
          ManagedProjectContextStatus.stale =>
            ManagedProjectContextLoadStatus.stale,
          ManagedProjectContextStatus.missing =>
            ManagedProjectContextLoadStatus.missing,
        };
        return ManagedProjectContextState(status, projection: projection);
      } on ManagedRunnerException catch (error) {
        if (error.statusCode == 403 ||
            error.code == 'projectForbidden' ||
            error.code == 'projectAccessLost') {
          return const ManagedProjectContextState(
            ManagedProjectContextLoadStatus.accessLost,
          );
        }
        return const ManagedProjectContextState(
          ManagedProjectContextLoadStatus.unavailable,
        );
      } catch (_) {
        return const ManagedProjectContextState(
          ManagedProjectContextLoadStatus.unavailable,
        );
      }
    });
