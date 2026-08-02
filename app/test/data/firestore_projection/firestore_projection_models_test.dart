import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/firestore_projection/firestore_projection_models.dart';

void main() {
  group('Firestore projection models', () {
    test('serialize all document shapes to maps', () {
      final now = DateTime.utc(2026, 5, 10, 12);

      expect(
        ShipGlowsUserProfile(
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

      final project = ShipGlowsProjectRecord(
        projectId: 'proj1',
        githubOwner: 'octocat',
        githubRepo: 'hello-world',
        githubFullName: 'octocat/hello-world',
        githubDefaultBranch: 'main',
        githubHeadCommit: 'abc123',
        projectionStatus: ProjectionStatus.accessLost,
        accessStatus: GitHubAccessStatus.needsGithubApp,
        activeIndexRun: ActiveIndexRunRecord(
          runId: 'r-active',
          requestId: 'req-active1',
          status: IndexRunStatus.alreadyRunning,
          startedAt: now,
        ),
        createdAt: now,
        updatedAt: now,
      ).toMap();
      expect(project['projectId'], 'proj1');
      expect(project['projectionStatus'], 'access_lost');
      expect(project['accessStatus'], 'needs_github_app');
      expect(
        (project['activeIndexRun']! as Map<String, Object?>)['status'],
        'already_running',
      );

      expect(
        ProjectMemberRecord(
          uid: 'u1',
          role: ShipGlowsProjectRole.owner,
          addedAt: now,
        ).toMap()['role'],
        'owner',
      );

      final indexedFile = IndexedFileRecord(
        fileId: 'f1',
        path: 'shipglows_data/workflow/specs/demo.md',
        artifactType: 'spec',
        sourceCommit: 'abc123',
        contentHash: 'hash1',
        projectionStatus: ProjectionStatus.partial,
        parseStatus: IndexedFileParseStatus.parseFailed,
        deleted: false,
        indexedAt: now,
        markdownBody: '# Demo',
      ).toMap();
      expect(indexedFile['sourceCommit'], 'abc123');
      expect(indexedFile['projectionStatus'], 'partial');
      expect(indexedFile['parseStatus'], 'parse_failed');

      final indexRun = IndexRunRecord(
        runId: 'r1',
        requestId: 'req-123456',
        sourceCommit: 'abc123',
        status: IndexRunStatus.alreadyRunning,
        startedAt: now,
        finishedAt: now,
        filesIndexed: 5,
        filesDeleted: 1,
      ).toMap();
      expect(indexRun['runId'], 'r1');
      expect(indexRun['status'], 'already_running');

      final indexRequest = IndexRequestRecord(
        projectId: 'proj1',
        requestId: 'req-123456',
        githubOwner: 'octocat',
        githubRepo: 'hello-world',
        githubFullName: 'octocat/hello-world',
        status: IndexRequestStatus.alreadyRunning,
        requestedAt: now,
      ).toMap();
      expect(indexRequest['requestId'], 'req-123456');
      expect(indexRequest['status'], 'already_running');

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
          role: ShipGlowsProjectRole.viewer,
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
