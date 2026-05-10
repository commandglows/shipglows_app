import 'package:flutter_test/flutter_test.dart';
import 'package:shipflow_app/data/firestore_projection/firestore_projection_models.dart';

void main() {
  group('Firestore projection models', () {
    test('serialize all document shapes to maps', () {
      final now = DateTime.utc(2026, 5, 10, 12);

      expect(
        ShipFlowUserProfile(
          uid: 'u1',
          email: 'u1@example.com',
          displayName: 'User One',
          githubConnectionStatus: 'connected',
          dashboardDefaultProjectId: 'proj1',
          createdAt: now,
          updatedAt: now,
        ).toMap()['uid'],
        'u1',
      );

      expect(
        ShipFlowProjectRecord(
          projectId: 'proj1',
          githubOwner: 'octocat',
          githubRepo: 'hello-world',
          githubFullName: 'octocat/hello-world',
          githubDefaultBranch: 'main',
          githubHeadCommit: 'abc123',
          projectionStatus: ProjectionStatus.fresh,
          createdAt: now,
          updatedAt: now,
        ).toMap()['projectId'],
        'proj1',
      );

      expect(
        ProjectMemberRecord(
          uid: 'u1',
          role: ShipFlowProjectRole.owner,
          addedAt: now,
        ).toMap()['role'],
        'owner',
      );

      expect(
        IndexedFileRecord(
          fileId: 'f1',
          path: 'specs/demo.md',
          artifactType: 'spec',
          sourceCommit: 'abc123',
          contentHash: 'hash1',
          projectionStatus: ProjectionStatus.fresh,
          deleted: false,
          indexedAt: now,
          markdownBody: '# Demo',
        ).toMap()['sourceCommit'],
        'abc123',
      );

      expect(
        IndexRunRecord(
          runId: 'r1',
          sourceCommit: 'abc123',
          status: IndexRunStatus.success,
          startedAt: now,
          finishedAt: now,
          filesIndexed: 5,
          filesDeleted: 1,
        ).toMap()['runId'],
        'r1',
      );

      expect(
        DiagnosticRecord(
          diagnosticId: 'd1',
          code: 'parse_error',
          severity: 'warning',
          message: 'partial parse',
          createdAt: now,
          redactedPath: '/redacted/path.md',
        ).toMap()['diagnosticId'],
        'd1',
      );

      expect(
        UserProjectRef(
          projectId: 'proj1',
          role: ShipFlowProjectRole.viewer,
          projectionStatus: ProjectionStatus.stale,
          updatedAt: now,
        ).toMap()['projectId'],
        'proj1',
      );

      expect(
        UserFeedItem(
          itemId: 'i1',
          projectId: 'proj1',
          title: 'Index complete',
          createdAt: now,
        ).toMap()['itemId'],
        'i1',
      );
    });
  });
}
