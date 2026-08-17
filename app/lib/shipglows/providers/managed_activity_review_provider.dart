import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/activity_review_models.dart';
import '../data/cockpit/cockpit_models.dart';
import '../data/managed_runner_api.dart';
import 'managed_runner_provider.dart';

enum ManagedActivityReviewLoadStatus { ready, degraded, accessLost }

class ManagedActivityReviewRequest {
  const ManagedActivityReviewRequest({
    required this.projectId,
    required this.accessState,
  });

  final String projectId;
  final ProjectAccessState accessState;

  @override
  bool operator ==(Object other) =>
      other is ManagedActivityReviewRequest &&
      other.projectId == projectId &&
      other.accessState == accessState;

  @override
  int get hashCode => Object.hash(projectId, accessState);
}

class ManagedActivityReviewState {
  const ManagedActivityReviewState({
    required this.status,
    this.projection,
    required this.message,
  });

  const ManagedActivityReviewState.degraded({
    this.message =
        'L’activité récente et les éléments à revoir sont indisponibles.',
  }) : status = ManagedActivityReviewLoadStatus.degraded,
       projection = null;

  const ManagedActivityReviewState.accessLost()
    : status = ManagedActivityReviewLoadStatus.accessLost,
      projection = null,
      message =
          'L’accès au projet est perdu. Aucune activité ni revue n’est chargée.';

  final ManagedActivityReviewLoadStatus status;
  final ManagedActivityReviewProjection? projection;
  final String message;
}

final managedActivityReviewClientProvider =
    Provider<ManagedActivityReviewClient?>((ref) {
      final client = ref.watch(managedRunnerApiProvider);
      return client is ManagedActivityReviewClient
          ? client as ManagedActivityReviewClient
          : null;
    });

final managedActivityReviewProvider = FutureProvider.autoDispose
    .family<ManagedActivityReviewState, ManagedActivityReviewRequest>((
      ref,
      request,
    ) async {
      if (request.accessState != ProjectAccessState.available) {
        return const ManagedActivityReviewState.accessLost();
      }
      final client = ref.watch(managedActivityReviewClientProvider);
      if (client == null) {
        return const ManagedActivityReviewState.degraded();
      }
      try {
        final projection = await client.loadActivityReview(
          projectId: request.projectId,
        );
        if (projection.projectId != request.projectId) {
          return const ManagedActivityReviewState.degraded(
            message: 'Le résumé reçu ne correspond pas au projet sélectionné.',
          );
        }
        final degraded =
            projection.status == ManagedActivityReviewStatus.degraded;
        return ManagedActivityReviewState(
          status: degraded
              ? ManagedActivityReviewLoadStatus.degraded
              : ManagedActivityReviewLoadStatus.ready,
          projection: projection,
          message: degraded
              ? 'Résumé partiel : seules les données vérifiables sont affichées.'
              : 'Résumé opérationnel à jour.',
        );
      } on ManagedRunnerException catch (error) {
        if (error.statusCode == 403 ||
            error.code == 'projectForbidden' ||
            error.code == 'projectAccessLost') {
          return const ManagedActivityReviewState.accessLost();
        }
        return const ManagedActivityReviewState.degraded();
      } catch (_) {
        return const ManagedActivityReviewState.degraded();
      }
    });
