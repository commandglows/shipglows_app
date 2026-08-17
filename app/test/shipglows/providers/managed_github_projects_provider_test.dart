import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/managed_github_projects_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_runner_provider.dart';

void main() {
  test(
    'loads opaque pages and deduplicates candidates in stable order',
    () async {
      final runner = _PagedRunner((cursor) async {
        if (cursor == null) {
          return _page([_repository('alpha'), _repository('shared')], 'next');
        }
        expect(cursor, 'next');
        return _page([_repository('shared'), _repository('beta')], null);
      });
      final container = _container(runner);
      addTearDown(container.dispose);

      final initial = await container.read(
        managedGitHubRepositoriesProvider.future,
      );
      expect(initial.repositories.map((item) => item.candidateId), [
        'candidate_alpha',
        'candidate_shared',
      ]);

      await container
          .read(managedGitHubRepositoriesProvider.notifier)
          .loadNextPage();
      final complete = container
          .read(managedGitHubRepositoriesProvider)
          .requireValue;
      expect(complete.repositories.map((item) => item.candidateId), [
        'candidate_alpha',
        'candidate_shared',
        'candidate_beta',
      ]);
      expect(complete.hasNextPage, isFalse);
      expect(runner.requestedCursors, [null, 'next']);
    },
  );

  test(
    'retains verified candidates and retries only the failed page',
    () async {
      var nextAttempts = 0;
      final runner = _PagedRunner((cursor) async {
        if (cursor == null) return _page([_repository('alpha')], 'next');
        nextAttempts += 1;
        if (nextAttempts == 1) {
          throw const ManagedRunnerException(
            code: 'githubUnavailable',
            message: 'GitHub est momentanément indisponible.',
          );
        }
        return _page([_repository('beta')], null);
      });
      final container = _container(runner);
      addTearDown(container.dispose);

      await container.read(managedGitHubRepositoriesProvider.future);
      final controller = container.read(
        managedGitHubRepositoriesProvider.notifier,
      );
      await controller.loadNextPage();

      final failed = container
          .read(managedGitHubRepositoriesProvider)
          .requireValue;
      expect(failed.repositories.map((item) => item.candidateId), [
        'candidate_alpha',
      ]);
      expect(failed.canRetryNextPage, isTrue);
      expect(
        failed.pageErrorMessage,
        'Impossible de charger la page GitHub suivante.',
      );

      await controller.retryNextPage();
      final recovered = container
          .read(managedGitHubRepositoriesProvider)
          .requireValue;
      expect(recovered.repositories.map((item) => item.candidateId), [
        'candidate_alpha',
        'candidate_beta',
      ]);
      expect(recovered.pageErrorMessage, isNull);
      expect(runner.requestedCursors, [null, 'next', 'next']);
    },
  );

  test('stops safely when the runner repeats an opaque cursor', () async {
    final runner = _PagedRunner((cursor) async {
      if (cursor == null) return _page([_repository('alpha')], 'loop');
      return _page([_repository('beta')], 'loop');
    });
    final container = _container(runner);
    addTearDown(container.dispose);

    await container.read(managedGitHubRepositoriesProvider.future);
    await container
        .read(managedGitHubRepositoriesProvider.notifier)
        .loadNextPage();

    final stopped = container
        .read(managedGitHubRepositoriesProvider)
        .requireValue;
    expect(stopped.repositories.map((item) => item.candidateId), [
      'candidate_alpha',
      'candidate_beta',
    ]);
    expect(stopped.hasNextPage, isFalse);
    expect(stopped.canRetryNextPage, isFalse);
    expect(stopped.pageErrorMessage, contains('interrompue'));

    await container
        .read(managedGitHubRepositoriesProvider.notifier)
        .loadNextPage();
    expect(runner.requestedCursors, [null, 'loop']);
  });

  test('bounds a non-repeating cursor stream to fifty pages', () async {
    var pageNumber = 0;
    final runner = _PagedRunner((cursor) async {
      pageNumber += 1;
      return _page([_repository('page_$pageNumber')], 'cursor_$pageNumber');
    });
    final container = _container(runner);
    addTearDown(container.dispose);

    var pagination = await container.read(
      managedGitHubRepositoriesProvider.future,
    );
    while (pagination.hasNextPage) {
      await container
          .read(managedGitHubRepositoriesProvider.notifier)
          .loadNextPage();
      pagination = container
          .read(managedGitHubRepositoriesProvider)
          .requireValue;
    }

    expect(runner.requestedCursors, hasLength(50));
    expect(pagination.repositories, hasLength(50));
    expect(pagination.pageErrorMessage, contains('limite de pages'));
    expect(pagination.canRetryNextPage, isFalse);
  });
}

ProviderContainer _container(ManagedRunnerApi runner) => ProviderContainer(
  overrides: [managedRunnerApiProvider.overrideWithValue(runner)],
);

ManagedGitHubRepositoryPage _page(
  List<ManagedGitHubRepositoryCandidate> repositories,
  String? nextCursor,
) => ManagedGitHubRepositoryPage(
  repositories: repositories,
  nextCursor: nextCursor,
);

ManagedGitHubRepositoryCandidate _repository(String name) =>
    ManagedGitHubRepositoryCandidate(
      candidateId: 'candidate_$name',
      fullName: 'shipglows/$name',
      defaultBranch: 'main',
      isPrivate: true,
      archived: false,
    );

class _PagedRunner extends ManagedRunnerApi {
  _PagedRunner(this._handler) : super(baseUrl: 'http://127.0.0.1');

  final Future<ManagedGitHubRepositoryPage> Function(String? cursor) _handler;
  final List<String?> requestedCursors = <String?>[];

  @override
  Future<ManagedGitHubRepositoryPage> listGitHubRepositories({String? cursor}) {
    requestedCursors.add(cursor);
    return _handler(cursor);
  }
}
