import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/activity_review_models.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/managed_activity_review_provider.dart';

void main() {
  test('does not call the runner after project access is lost', () async {
    final client = _ActivityClient(_projection());
    final container = ProviderContainer(
      overrides: [
        managedActivityReviewClientProvider.overrideWithValue(client),
      ],
    );
    addTearDown(container.dispose);

    final state = await container.read(
      managedActivityReviewProvider(
        const ManagedActivityReviewRequest(
          projectId: 'project-1',
          accessState: ProjectAccessState.accessLost,
        ),
      ).future,
    );

    expect(state.status, ManagedActivityReviewLoadStatus.accessLost);
    expect(client.calls, 0);
  });

  test('rejects a projection owned by another project', () async {
    final client = _ActivityClient(_projection(projectId: 'project-other'));
    final container = ProviderContainer(
      overrides: [
        managedActivityReviewClientProvider.overrideWithValue(client),
      ],
    );
    addTearDown(container.dispose);

    final state = await container.read(
      managedActivityReviewProvider(
        const ManagedActivityReviewRequest(
          projectId: 'project-1',
          accessState: ProjectAccessState.available,
        ),
      ).future,
    );

    expect(state.status, ManagedActivityReviewLoadStatus.degraded);
    expect(state.projection, isNull);
  });

  test('maps a server access denial to access lost', () async {
    final client = _ActivityClient.error(
      const ManagedRunnerException(
        code: 'projectForbidden',
        message: 'Forbidden',
        statusCode: 403,
      ),
    );
    final container = ProviderContainer(
      overrides: [
        managedActivityReviewClientProvider.overrideWithValue(client),
      ],
    );
    addTearDown(container.dispose);

    final state = await container.read(
      managedActivityReviewProvider(
        const ManagedActivityReviewRequest(
          projectId: 'project-1',
          accessState: ProjectAccessState.available,
        ),
      ).future,
    );

    expect(state.status, ManagedActivityReviewLoadStatus.accessLost);
  });

  test('rejects malformed or oversized normalized payloads', () {
    expect(
      () => ManagedActivityReviewProjection.fromJson({
        'projectId': 'project-1',
        'status': 'ready',
        'reasons': const [],
        'activity': List.filled(21, const {}),
        'review': const [],
      }),
      throwsFormatException,
    );
  });
}

class _ActivityClient implements ManagedActivityReviewClient {
  _ActivityClient(this.projection) : error = null;
  _ActivityClient.error(this.error) : projection = null;

  final ManagedActivityReviewProjection? projection;
  final ManagedRunnerException? error;
  int calls = 0;

  @override
  Future<ManagedActivityReviewProjection> loadActivityReview({
    required String projectId,
  }) async {
    calls += 1;
    if (error case final error?) throw error;
    return projection!;
  }
}

ManagedActivityReviewProjection _projection({String projectId = 'project-1'}) =>
    ManagedActivityReviewProjection(
      projectId: projectId,
      status: ManagedActivityReviewStatus.ready,
      reasons: const [],
      activity: const [],
      review: const [],
    );
