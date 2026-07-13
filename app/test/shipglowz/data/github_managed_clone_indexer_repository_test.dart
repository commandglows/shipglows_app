import 'package:flutter_test/flutter_test.dart';
import 'package:shipglowz_app/data/firestore_projection/firestore_projection_models.dart';
import 'package:shipglowz_app/data/firestore_projection/firestore_projection_validators.dart';
import 'package:shipglowz_app/shipglowz/data/github_managed_clone_indexer_repository.dart';

void main() {
  group('InMemoryGitHubManagedCloneIndexerRepository', () {
    test('queues index requests without secret-like fields', () async {
      final repository = InMemoryGitHubManagedCloneIndexerRepository();

      final status = await repository.requestIndex(
        const GitHubIndexRepositoryRequest(
          projectId: 'proj_123',
          requestId: 'req-123456',
          githubOwner: 'octocat',
          githubRepo: 'hello-world',
        ),
      );

      expect(status.status, IndexRequestStatus.queued);
      expect(status.projectionStatus, ProjectionStatus.indexing);
      expect(
        () => FirestoreProjectionValidators.validateNoSecretLikeFields(
          status.toMap(),
        ),
        returnsNormally,
      );
    });

    test(
      'replays duplicate requestId and blocks overlapping active request',
      () async {
        final repository = InMemoryGitHubManagedCloneIndexerRepository();
        const firstRequest = GitHubIndexRepositoryRequest(
          projectId: 'proj_123',
          requestId: 'req-123456',
          githubOwner: 'octocat',
          githubRepo: 'hello-world',
        );

        final first = await repository.requestIndex(firstRequest);
        final replay = await repository.requestIndex(firstRequest);
        expect(identical(first, replay), isTrue);

        final overlap = await repository.requestIndex(
          const GitHubIndexRepositoryRequest(
            projectId: 'proj_123',
            requestId: 'req-abcdef',
            githubOwner: 'octocat',
            githubRepo: 'hello-world',
          ),
        );
        expect(overlap.status, IndexRequestStatus.alreadyRunning);
        expect(overlap.diagnostics.single.code, 'already_running');
        expect(overlap.toMap()['status'], 'already_running');
      },
    );

    test('keeps project/request cache isolated by key', () async {
      final repository = InMemoryGitHubManagedCloneIndexerRepository();
      await repository.requestIndex(
        const GitHubIndexRepositoryRequest(
          projectId: 'proj_a',
          requestId: 'req-123456',
          githubOwner: 'octocat',
          githubRepo: 'hello-world',
        ),
      );
      await repository.requestIndex(
        const GitHubIndexRepositoryRequest(
          projectId: 'proj_b',
          requestId: 'req-123456',
          githubOwner: 'octocat',
          githubRepo: 'hello-world',
        ),
      );

      expect(
        await repository.getIndexStatus(
          projectId: 'proj_a',
          requestId: 'req-123456',
        ),
        isNotNull,
      );
      expect(
        await repository.getIndexStatus(
          projectId: 'proj_b',
          requestId: 'req-123456',
        ),
        isNotNull,
      );
      expect(
        await repository.getIndexStatus(
          projectId: 'proj_c',
          requestId: 'req-123456',
        ),
        isNull,
      );
    });

    test('rejects invalid request payloads', () async {
      final repository = InMemoryGitHubManagedCloneIndexerRepository();

      expect(
        () => repository.requestIndex(
          const GitHubIndexRepositoryRequest(
            projectId: 'proj_123',
            requestId: 'short',
            githubOwner: 'octocat',
            githubRepo: 'hello-world',
          ),
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });
  });
}
