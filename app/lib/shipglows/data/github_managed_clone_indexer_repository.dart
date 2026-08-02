import '../../data/firestore_projection/firestore_projection_models.dart';
import '../../data/firestore_projection/firestore_projection_validators.dart';

class GitHubIndexRepositoryRequest {
  const GitHubIndexRepositoryRequest({
    required this.projectId,
    required this.requestId,
    required this.githubOwner,
    required this.githubRepo,
  });

  final String projectId;
  final String requestId;
  final String githubOwner;
  final String githubRepo;
}

class GitHubIndexStatusSummary {
  const GitHubIndexStatusSummary({
    required this.projectId,
    required this.requestId,
    required this.status,
    required this.projectionStatus,
    required this.sourceCommit,
    required this.diagnostics,
  });

  final String projectId;
  final String requestId;
  final IndexRequestStatus status;
  final ProjectionStatus projectionStatus;
  final String? sourceCommit;
  final List<DiagnosticRecord> diagnostics;

  Map<String, Object?> toMap() => <String, Object?>{
    'projectId': projectId,
    'requestId': requestId,
    'status': status.wireName,
    'projectionStatus': projectionStatus.wireName,
    'sourceCommit': sourceCommit,
    'diagnostics': diagnostics
        .map((diagnostic) => diagnostic.toMap())
        .toList(growable: false),
  };
}

abstract class GitHubManagedCloneIndexerRepository {
  Future<GitHubIndexStatusSummary> requestIndex(
    GitHubIndexRepositoryRequest request,
  );

  Future<GitHubIndexStatusSummary?> getIndexStatus({
    required String projectId,
    required String requestId,
  });
}

class InMemoryGitHubManagedCloneIndexerRepository
    implements GitHubManagedCloneIndexerRepository {
  InMemoryGitHubManagedCloneIndexerRepository({
    Map<String, GitHubIndexStatusSummary>? initialStatuses,
  }) : _statuses = {...?initialStatuses};

  final Map<String, GitHubIndexStatusSummary> _statuses;

  @override
  Future<GitHubIndexStatusSummary> requestIndex(
    GitHubIndexRepositoryRequest request,
  ) async {
    FirestoreProjectionValidators.validateRequestId(request.requestId);
    FirestoreProjectionValidators.validateGitHubRepository(
      owner: request.githubOwner,
      repo: request.githubRepo,
      fullName: '${request.githubOwner}/${request.githubRepo}',
    );

    final key = _key(request.projectId, request.requestId);
    final existing = _statuses[key];
    if (existing != null) {
      FirestoreProjectionValidators.validateNoSecretLikeFields(
        existing.toMap(),
      );
      return existing;
    }

    final activeForProject = _statuses.values.where(
      (status) =>
          status.projectId == request.projectId &&
          (status.status == IndexRequestStatus.queued ||
              status.status == IndexRequestStatus.running),
    );
    if (activeForProject.isNotEmpty) {
      final summary = GitHubIndexStatusSummary(
        projectId: request.projectId,
        requestId: request.requestId,
        status: IndexRequestStatus.alreadyRunning,
        projectionStatus: ProjectionStatus.indexing,
        sourceCommit: null,
        diagnostics: [
          DiagnosticRecord(
            diagnosticId: 'diag_already_running',
            code: RunnerDiagnosticCode.alreadyRunning.wireName,
            severity: 'warning',
            message:
                'A different index request is already queued or running for this project.',
            createdAt: DateTime.now().toUtc(),
          ),
        ],
      );
      FirestoreProjectionValidators.validateNoSecretLikeFields(summary.toMap());
      return summary;
    }

    final summary = GitHubIndexStatusSummary(
      projectId: request.projectId,
      requestId: request.requestId,
      status: IndexRequestStatus.queued,
      projectionStatus: ProjectionStatus.indexing,
      sourceCommit: null,
      diagnostics: const <DiagnosticRecord>[],
    );
    _statuses[key] = summary;
    FirestoreProjectionValidators.validateNoSecretLikeFields(summary.toMap());
    return summary;
  }

  @override
  Future<GitHubIndexStatusSummary?> getIndexStatus({
    required String projectId,
    required String requestId,
  }) async {
    FirestoreProjectionValidators.validateRequestId(requestId);
    final status = _statuses[_key(projectId, requestId)];
    if (status != null) {
      FirestoreProjectionValidators.validateNoSecretLikeFields(status.toMap());
    }
    return status;
  }

  void upsertForTest(GitHubIndexStatusSummary summary) {
    FirestoreProjectionValidators.validateNoSecretLikeFields(summary.toMap());
    _statuses[_key(summary.projectId, summary.requestId)] = summary;
  }

  String _key(String projectId, String requestId) => '$projectId::$requestId';
}
