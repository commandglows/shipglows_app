import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';

void main() {
  test('parses the exact bounded project context response', () {
    final context = ManagedProjectContextProjection.fromJson({
      'projectId': 'project-one',
      'status': 'ready',
      'observedAt': '2026-08-17T10:00:00.000Z',
      'sourceCommit': 'abc123',
      'repositorySnapshotCount': 1,
      'shipglowsArtifactCount': 2,
      'redactionCount': 3,
    });

    expect(context.status, ManagedProjectContextStatus.ready);
    expect(context.shipglowsArtifactCount, 2);
  });

  test('rejects extra fields and malformed missing state', () {
    expect(
      () => ManagedProjectContextProjection.fromJson({
        'projectId': 'project-one',
        'status': 'missing',
        'observedAt': null,
        'sourceCommit': null,
        'repositorySnapshotCount': 0,
        'shipglowsArtifactCount': 0,
        'redactionCount': 0,
        'sourceReference': 'private/path',
      }),
      throwsFormatException,
    );
    expect(
      () => ManagedProjectContextProjection.fromJson({
        'projectId': 'project-one',
        'status': 'missing',
        'observedAt': '2026-08-17T10:00:00.000Z',
        'sourceCommit': null,
        'repositorySnapshotCount': 0,
        'shipglowsArtifactCount': 0,
        'redactionCount': 0,
      }),
      throwsFormatException,
    );
  });
}
