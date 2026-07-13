import 'package:flutter_test/flutter_test.dart';
import 'package:shipglowz_app/data/firestore_projection/firestore_projection_models.dart';
import 'package:shipglowz_app/data/firestore_projection/firestore_projection_validators.dart';
import 'package:shipglowz_app/shipglowz/data/dashboard_readonly_projection_repository.dart';

void main() {
  group('InMemoryDashboardReadonlyProjectionRepository', () {
    test('returns signed-out state without project reads', () async {
      final repository = _repository();

      final snapshot = await repository.loadDashboard(uid: null);

      expect(snapshot.isSignedOut, isTrue);
      expect(snapshot.projects, isEmpty);
      expect(snapshot.artifacts, isEmpty);
      expect(snapshot.diagnostics, isEmpty);
    });

    test('lists only user-scoped project refs and active artifacts', () async {
      final repository = _repository();

      final snapshot = await repository.loadDashboard(uid: 'user_a');

      expect(snapshot.projects.map((project) => project.projectId), ['proj_a']);
      expect(snapshot.projects.single.state, DashboardProjectViewState.ready);
      expect(snapshot.artifacts.map((artifact) => artifact.path), [
        'shipglowz_data/workflow/TASKS.md',
        'shipglowz_data/technical/architecture.md',
      ]);
      expect(
        snapshot.artifacts.any((artifact) => artifact.path.endsWith('old.md')),
        isFalse,
      );
    });

    test(
      'keeps cached projection visible when GitHub access is lost',
      () async {
        final repository = _repository();

        final snapshot = await repository.loadDashboard(uid: 'user_b');

        expect(
          snapshot.projects.single.state,
          DashboardProjectViewState.accessLost,
        );
        expect(snapshot.projects.single.canRequestRefresh, isFalse);
        expect(
          snapshot.projects.single.refreshDisabledReason,
          contains('GitHub access'),
        );
        expect(
          snapshot.artifacts.single.path,
          'shipglowz_data/workflow/specs/demo.md',
        );
      },
    );

    test('supports project filters and projection-backed sorting', () async {
      final repository = _repository();

      final filtered = await repository.loadDashboard(
        uid: 'user_all',
        filter: const DashboardReadonlyFilter(
          projectQuery: 'beta',
          sort: DashboardProjectSort.name,
        ),
      );
      expect(filtered.projects.map((project) => project.displayName), ['beta']);

      final statusFiltered = await repository.loadDashboard(
        uid: 'user_all',
        filter: const DashboardReadonlyFilter(
          status: DashboardProjectViewState.accessLost,
        ),
      );
      expect(statusFiltered.projects.single.projectId, 'proj_b');
    });

    test('maps empty fresh projection to corpus missing setup state', () async {
      final repository = _repository();

      final snapshot = await repository.loadDashboard(uid: 'user_empty');

      expect(snapshot.projects.single.projectId, 'proj_empty');
      expect(
        snapshot.projects.single.state,
        DashboardProjectViewState.corpusMissing,
      );
      expect(snapshot.artifacts, isEmpty);
    });

    test('partitions data by Firebase user on account switch', () async {
      final repository = _repository();

      final firstUser = await repository.loadDashboard(uid: 'user_a');
      final secondUser = await repository.loadDashboard(uid: 'user_b');

      expect(firstUser.projects.single.projectId, 'proj_a');
      expect(secondUser.projects.single.projectId, 'proj_b');
      expect(
        secondUser.artifacts.any((artifact) => artifact.projectId == 'proj_a'),
        isFalse,
      );
    });

    test('rejects forbidden secret-like fields in dashboard summaries', () {
      expect(
        () => FirestoreProjectionValidators.validateNoSecretLikeFields({
          'projectId': 'proj_a',
          'clonePath': '/tmp/private/clone',
        }),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });
  });
}

InMemoryDashboardReadonlyProjectionRepository _repository() {
  final now = DateTime.utc(2026, 5, 30, 12);
  return InMemoryDashboardReadonlyProjectionRepository(
    now: now,
    userProjectRefs: {
      'user_a': [
        UserProjectRef(
          projectId: 'proj_a',
          role: ShipGlowzProjectRole.owner,
          projectionStatus: ProjectionStatus.fresh,
          updatedAt: now,
        ),
      ],
      'user_b': [
        UserProjectRef(
          projectId: 'proj_b',
          role: ShipGlowzProjectRole.viewer,
          projectionStatus: ProjectionStatus.accessLost,
          updatedAt: now,
        ),
      ],
      'user_all': [
        UserProjectRef(
          projectId: 'proj_a',
          role: ShipGlowzProjectRole.owner,
          projectionStatus: ProjectionStatus.fresh,
          updatedAt: now,
        ),
        UserProjectRef(
          projectId: 'proj_b',
          role: ShipGlowzProjectRole.viewer,
          projectionStatus: ProjectionStatus.accessLost,
          updatedAt: now,
        ),
      ],
      'user_empty': [
        UserProjectRef(
          projectId: 'proj_empty',
          role: ShipGlowzProjectRole.owner,
          projectionStatus: ProjectionStatus.fresh,
          updatedAt: now,
        ),
      ],
    },
    projects: {
      'proj_a': ShipGlowzProjectRecord(
        projectId: 'proj_a',
        githubOwner: 'acme',
        githubRepo: 'alpha',
        githubFullName: 'acme/alpha',
        githubDefaultBranch: 'main',
        githubHeadCommit: 'abcdef1',
        projectionStatus: ProjectionStatus.fresh,
        accessStatus: GitHubAccessStatus.connected,
        createdAt: now,
        updatedAt: now,
      ),
      'proj_b': ShipGlowzProjectRecord(
        projectId: 'proj_b',
        githubOwner: 'acme',
        githubRepo: 'beta',
        githubFullName: 'acme/beta',
        githubDefaultBranch: 'main',
        githubHeadCommit: '1234567',
        projectionStatus: ProjectionStatus.accessLost,
        accessStatus: GitHubAccessStatus.githubAccessLost,
        createdAt: now,
        updatedAt: now.subtract(const Duration(days: 1)),
      ),
      'proj_private': ShipGlowzProjectRecord(
        projectId: 'proj_private',
        githubOwner: 'acme',
        githubRepo: 'private',
        githubFullName: 'acme/private',
        githubDefaultBranch: 'main',
        githubHeadCommit: '7654321',
        projectionStatus: ProjectionStatus.fresh,
        accessStatus: GitHubAccessStatus.connected,
        createdAt: now,
        updatedAt: now,
      ),
      'proj_empty': ShipGlowzProjectRecord(
        projectId: 'proj_empty',
        githubOwner: 'acme',
        githubRepo: 'empty',
        githubFullName: 'acme/empty',
        githubDefaultBranch: 'main',
        githubHeadCommit: 'abcdef2',
        projectionStatus: ProjectionStatus.fresh,
        accessStatus: GitHubAccessStatus.connected,
        createdAt: now,
        updatedAt: now,
      ),
    },
    indexedFiles: [
      IndexedFileRecord(
        fileId: 'proj_a:tasks',
        path: 'shipglowz_data/workflow/TASKS.md',
        artifactType: 'tracker',
        sourceCommit: 'abcdef1',
        contentHash: 'hash-a',
        projectionStatus: ProjectionStatus.fresh,
        deleted: false,
        indexedAt: now,
      ),
      IndexedFileRecord(
        fileId: 'proj_a:architecture',
        path: 'shipglowz_data/technical/architecture.md',
        artifactType: 'technical',
        sourceCommit: 'abcdef1',
        contentHash: 'hash-b',
        projectionStatus: ProjectionStatus.fresh,
        deleted: false,
        indexedAt: now,
      ),
      IndexedFileRecord(
        fileId: 'proj_a:old',
        path: 'shipglowz_data/technical/old.md',
        artifactType: 'technical',
        sourceCommit: 'abcdef1',
        contentHash: 'hash-old',
        projectionStatus: ProjectionStatus.stale,
        deleted: true,
        indexedAt: now,
      ),
      IndexedFileRecord(
        fileId: 'proj_b:spec',
        path: 'shipglowz_data/workflow/specs/demo.md',
        artifactType: 'spec',
        sourceCommit: '1234567',
        contentHash: 'hash-c',
        projectionStatus: ProjectionStatus.accessLost,
        deleted: false,
        indexedAt: now,
      ),
    ],
    diagnostics: [
      DiagnosticRecord(
        diagnosticId: 'proj_b:diag-access',
        code: RunnerDiagnosticCode.accessDenied.wireName,
        severity: 'warning',
        message: 'GitHub access must be restored.',
        createdAt: now,
        redactedPath: 'shipglowz_data/**',
      ),
    ],
    indexRuns: [
      IndexRunRecord(
        runId: 'proj_a:run-1',
        requestId: 'req-abcdef',
        sourceCommit: 'abcdef1',
        status: IndexRunStatus.success,
        startedAt: now.subtract(const Duration(minutes: 2)),
        finishedAt: now,
        filesIndexed: 2,
        filesDeleted: 1,
      ),
    ],
  );
}
