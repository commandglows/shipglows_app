import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/cockpit/cockpit_models.dart';
import '../data/managed_runner_api.dart';
import 'managed_runner_provider.dart';

enum ManagedCockpitStatus { localOnly, active, empty, sessionExpired, failure }

class ManagedCockpitState {
  const ManagedCockpitState._({
    required this.status,
    this.snapshot,
    this.safeMessage,
  });

  const ManagedCockpitState.localOnly()
    : this._(status: ManagedCockpitStatus.localOnly);

  const ManagedCockpitState.sessionExpired()
    : this._(
        status: ManagedCockpitStatus.sessionExpired,
        safeMessage: 'Your session has expired. Sign in again, then retry.',
      );

  const ManagedCockpitState.failure()
    : this._(
        status: ManagedCockpitStatus.failure,
        safeMessage: 'The managed Cockpit is temporarily unavailable.',
      );

  factory ManagedCockpitState.server(CockpitSnapshot snapshot) =>
      ManagedCockpitState._(
        status: snapshot.projects.isEmpty
            ? ManagedCockpitStatus.empty
            : ManagedCockpitStatus.active,
        snapshot: snapshot,
      );

  final ManagedCockpitStatus status;
  final CockpitSnapshot? snapshot;
  final String? safeMessage;
}

final managedCockpitSnapshotProvider =
    FutureProvider.autoDispose<ManagedCockpitState>((ref) async {
      final client = ref.watch(managedRunnerApiProvider);
      if (client == null) return const ManagedCockpitState.localOnly();
      try {
        return ManagedCockpitState.server(await client.loadCockpit());
      } on ManagedRunnerException catch (error) {
        if (error.statusCode == 401 || error.code == 'unauthorized') {
          return const ManagedCockpitState.sessionExpired();
        }
        return const ManagedCockpitState.failure();
      } catch (_) {
        return const ManagedCockpitState.failure();
      }
    });
