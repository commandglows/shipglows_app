import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/managed_runner_api.dart';
import 'managed_runner_provider.dart';

ManagedProjectRegistryClient _client(Ref ref) {
  final client = ref.read(managedRunnerApiProvider);
  if (client case final ManagedProjectRegistryClient registry) return registry;
  throw const ManagedRunnerException(
    code: 'projectManagementUnavailable',
    message: 'La connexion GitHub des projets est indisponible.',
  );
}

final managedGitHubSourceStatusProvider = FutureProvider.autoDispose(
  (ref) => _client(ref).getGitHubProjectSourceStatus(),
);

final managedGitHubRepositoriesProvider =
    AsyncNotifierProvider.autoDispose<
      ManagedGitHubRepositoriesController,
      ManagedGitHubRepositoriesState
    >(ManagedGitHubRepositoriesController.new);

class ManagedGitHubRepositoriesState {
  const ManagedGitHubRepositoriesState({
    required this.repositories,
    required this.nextCursor,
    this.isLoadingNextPage = false,
    this.pageErrorMessage,
  });

  final List<ManagedGitHubRepositoryCandidate> repositories;
  final String? nextCursor;
  final bool isLoadingNextPage;
  final String? pageErrorMessage;

  bool get hasNextPage => nextCursor != null;
  bool get canRetryNextPage => hasNextPage && pageErrorMessage != null;
}

class ManagedGitHubRepositoriesController
    extends AsyncNotifier<ManagedGitHubRepositoriesState> {
  static const _maxPages = 50;
  static const _maxRepositories = 5000;
  static const _maxCursorLength = 256;

  final Set<String> _seenCandidateIds = <String>{};
  final Set<String> _consumedCursors = <String>{};
  var _pageCount = 0;

  @override
  Future<ManagedGitHubRepositoriesState> build() async {
    _seenCandidateIds.clear();
    _consumedCursors.clear();
    _pageCount = 0;

    final page = await _client(ref).listGitHubRepositories();
    _pageCount = 1;
    return _mergePage(const <ManagedGitHubRepositoryCandidate>[], page);
  }

  Future<void> loadNextPage() async {
    final current = state.value;
    final cursor = current?.nextCursor;
    if (current == null ||
        cursor == null ||
        current.isLoadingNextPage ||
        current.pageErrorMessage != null) {
      return;
    }
    await _requestNextPage(current, cursor);
  }

  Future<void> retryNextPage() async {
    final current = state.value;
    final cursor = current?.nextCursor;
    if (current == null ||
        cursor == null ||
        current.isLoadingNextPage ||
        current.pageErrorMessage == null) {
      return;
    }
    await _requestNextPage(current, cursor);
  }

  Future<void> _requestNextPage(
    ManagedGitHubRepositoriesState current,
    String cursor,
  ) async {
    state = AsyncData(
      ManagedGitHubRepositoriesState(
        repositories: current.repositories,
        nextCursor: cursor,
        isLoadingNextPage: true,
      ),
    );

    try {
      final page = await _client(ref).listGitHubRepositories(cursor: cursor);
      _consumedCursors.add(cursor);
      _pageCount += 1;
      state = AsyncData(_mergePage(current.repositories, page));
    } catch (error) {
      state = AsyncData(
        ManagedGitHubRepositoriesState(
          repositories: current.repositories,
          nextCursor: cursor,
          pageErrorMessage: _controlledPaginationMessage(error),
        ),
      );
    }
  }

  ManagedGitHubRepositoriesState _mergePage(
    List<ManagedGitHubRepositoryCandidate> current,
    ManagedGitHubRepositoryPage page,
  ) {
    final merged = <ManagedGitHubRepositoryCandidate>[...current];
    for (final repository in page.repositories) {
      if (_seenCandidateIds.add(repository.candidateId)) {
        if (merged.length == _maxRepositories) {
          return ManagedGitHubRepositoriesState(
            repositories: List.unmodifiable(merged),
            nextCursor: null,
            pageErrorMessage:
                'La limite de repositories consultables a été atteinte.',
          );
        }
        merged.add(repository);
      }
    }

    final nextCursor = page.nextCursor;
    if (nextCursor == null) {
      return ManagedGitHubRepositoriesState(
        repositories: List.unmodifiable(merged),
        nextCursor: null,
      );
    }
    if (nextCursor.isEmpty || nextCursor.length > _maxCursorLength) {
      return ManagedGitHubRepositoriesState(
        repositories: List.unmodifiable(merged),
        nextCursor: null,
        pageErrorMessage: 'La pagination GitHub a renvoyé un curseur invalide.',
      );
    }
    if (_consumedCursors.contains(nextCursor)) {
      return ManagedGitHubRepositoriesState(
        repositories: List.unmodifiable(merged),
        nextCursor: null,
        pageErrorMessage: 'La pagination GitHub a été interrompue en sécurité.',
      );
    }
    if (_pageCount >= _maxPages) {
      return ManagedGitHubRepositoriesState(
        repositories: List.unmodifiable(merged),
        nextCursor: null,
        pageErrorMessage:
            'La limite de pages GitHub consultables a été atteinte.',
      );
    }
    return ManagedGitHubRepositoriesState(
      repositories: List.unmodifiable(merged),
      nextCursor: nextCursor,
    );
  }
}

String _controlledPaginationMessage(Object _) =>
    'Impossible de charger la page GitHub suivante.';

final managedGitHubSetupActionsProvider = Provider(
  (ref) => ManagedGitHubSetupActions(ref),
);

class ManagedGitHubSetupActions {
  const ManagedGitHubSetupActions(this.ref);

  final Ref ref;

  Future<ManagedGitHubSetup> begin() => _client(ref).beginGitHubSetup();

  Future<ManagedGitHubSourceStatus> complete({
    required int installationId,
    required String state,
  }) async {
    final status = await _client(
      ref,
    ).completeGitHubSetup(installationId: installationId, state: state);
    ref.invalidate(managedGitHubSourceStatusProvider);
    ref.invalidate(managedGitHubRepositoriesProvider);
    return status;
  }

  Future<void> disconnect() async {
    await _client(ref).disconnectGitHubSource();
    ref.invalidate(managedGitHubSourceStatusProvider);
    ref.invalidate(managedGitHubRepositoriesProvider);
  }
}
