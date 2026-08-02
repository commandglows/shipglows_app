import '../../data/firestore_projection/firestore_projection_models.dart';
import '../../data/firestore_projection/firestore_projection_validators.dart';

enum DashboardProjectionLoadStatus { signedOut, ready }

enum DashboardProjectViewState {
  ready,
  indexing,
  stale,
  accessLost,
  corpusMissing,
  partial,
  failed,
  hidden,
  archived,
  deleted,
  unknown,
}

enum DashboardArtifactFamily {
  business,
  technical,
  editorial,
  workflow,
  tracker,
  spec,
  bug,
  test,
  unknown,
}

enum DashboardProjectSort { updatedDesc, status, name }

class DashboardReadonlyFilter {
  const DashboardReadonlyFilter({
    this.projectQuery = '',
    this.status,
    this.sort = DashboardProjectSort.updatedDesc,
  });

  final String projectQuery;
  final DashboardProjectViewState? status;
  final DashboardProjectSort sort;
}

class DashboardProjectSummary {
  const DashboardProjectSummary({
    required this.projectId,
    required this.displayName,
    required this.githubFullName,
    required this.state,
    required this.projectionStatus,
    required this.accessStatus,
    required this.sourceCommit,
    required this.updatedAt,
    required this.artifactCount,
    required this.diagnosticCount,
    this.staleReason,
    this.refreshDisabledReason,
  });

  final String projectId;
  final String displayName;
  final String githubFullName;
  final DashboardProjectViewState state;
  final ProjectionStatus projectionStatus;
  final GitHubAccessStatus accessStatus;
  final String? sourceCommit;
  final DateTime updatedAt;
  final int artifactCount;
  final int diagnosticCount;
  final String? staleReason;
  final String? refreshDisabledReason;

  bool get canRequestRefresh =>
      accessStatus == GitHubAccessStatus.connected ||
      accessStatus == GitHubAccessStatus.accessCached;

  Map<String, Object?> toMap() => <String, Object?>{
    'projectId': projectId,
    'displayName': displayName,
    'githubFullName': githubFullName,
    'state': state.name,
    'projectionStatus': projectionStatus.wireName,
    'accessStatus': accessStatus.wireName,
    'sourceCommit': sourceCommit,
    'updatedAt': updatedAt.toIso8601String(),
    'artifactCount': artifactCount,
    'diagnosticCount': diagnosticCount,
    'staleReason': staleReason,
    'refreshDisabledReason': refreshDisabledReason,
  };
}

class DashboardArtifactSummary {
  const DashboardArtifactSummary({
    required this.fileId,
    required this.projectId,
    required this.path,
    required this.family,
    required this.artifactType,
    required this.sourceCommit,
    required this.deleted,
    required this.parseStatus,
  });

  final String fileId;
  final String projectId;
  final String path;
  final DashboardArtifactFamily family;
  final String artifactType;
  final String sourceCommit;
  final bool deleted;
  final IndexedFileParseStatus parseStatus;

  bool get isActive => !deleted;

  Map<String, Object?> toMap() => <String, Object?>{
    'fileId': fileId,
    'projectId': projectId,
    'path': path,
    'family': family.name,
    'artifactType': artifactType,
    'sourceCommit': sourceCommit,
    'deleted': deleted,
    'parseStatus': parseStatus.wireName,
  };
}

class DashboardDiagnosticSummary {
  const DashboardDiagnosticSummary({
    required this.diagnosticId,
    required this.projectId,
    required this.code,
    required this.severity,
    required this.message,
    required this.createdAt,
    this.redactedPath,
  });

  final String diagnosticId;
  final String projectId;
  final String code;
  final String severity;
  final String message;
  final DateTime createdAt;
  final String? redactedPath;

  Map<String, Object?> toMap() => <String, Object?>{
    'diagnosticId': diagnosticId,
    'projectId': projectId,
    'code': code,
    'severity': severity,
    'message': message,
    'createdAt': createdAt.toIso8601String(),
    'redactedPath': redactedPath,
  };
}

class DashboardIndexRunSummary {
  const DashboardIndexRunSummary({
    required this.projectId,
    required this.runId,
    required this.requestId,
    required this.status,
    required this.sourceCommit,
    required this.startedAt,
    required this.finishedAt,
  });

  final String projectId;
  final String runId;
  final String requestId;
  final IndexRunStatus status;
  final String sourceCommit;
  final DateTime startedAt;
  final DateTime? finishedAt;

  Map<String, Object?> toMap() => <String, Object?>{
    'projectId': projectId,
    'runId': runId,
    'requestId': requestId,
    'status': status.wireName,
    'sourceCommit': sourceCommit,
    'startedAt': startedAt.toIso8601String(),
    'finishedAt': finishedAt?.toIso8601String(),
  };
}

class DashboardReadonlySnapshot {
  const DashboardReadonlySnapshot({
    required this.status,
    required this.uid,
    required this.generatedAt,
    required this.projects,
    required this.artifacts,
    required this.diagnostics,
    required this.indexRuns,
  });

  final DashboardProjectionLoadStatus status;
  final String? uid;
  final DateTime generatedAt;
  final List<DashboardProjectSummary> projects;
  final List<DashboardArtifactSummary> artifacts;
  final List<DashboardDiagnosticSummary> diagnostics;
  final List<DashboardIndexRunSummary> indexRuns;

  bool get isSignedOut => status == DashboardProjectionLoadStatus.signedOut;
}

abstract class DashboardReadonlyProjectionRepository {
  Future<DashboardReadonlySnapshot> loadDashboard({
    required String? uid,
    DashboardReadonlyFilter filter = const DashboardReadonlyFilter(),
  });
}

class InMemoryDashboardReadonlyProjectionRepository
    implements DashboardReadonlyProjectionRepository {
  InMemoryDashboardReadonlyProjectionRepository({
    required Map<String, List<UserProjectRef>> userProjectRefs,
    required Map<String, ShipGlowsProjectRecord> projects,
    List<IndexedFileRecord> indexedFiles = const <IndexedFileRecord>[],
    List<DiagnosticRecord> diagnostics = const <DiagnosticRecord>[],
    List<IndexRunRecord> indexRuns = const <IndexRunRecord>[],
    DateTime? now,
  }) : _userProjectRefs = userProjectRefs,
       _projects = projects,
       _indexedFiles = indexedFiles,
       _diagnostics = diagnostics,
       _indexRuns = indexRuns,
       _now = now;

  final Map<String, List<UserProjectRef>> _userProjectRefs;
  final Map<String, ShipGlowsProjectRecord> _projects;
  final List<IndexedFileRecord> _indexedFiles;
  final List<DiagnosticRecord> _diagnostics;
  final List<IndexRunRecord> _indexRuns;
  final DateTime? _now;

  @override
  Future<DashboardReadonlySnapshot> loadDashboard({
    required String? uid,
    DashboardReadonlyFilter filter = const DashboardReadonlyFilter(),
  }) async {
    final normalizedUid = uid?.trim();
    if (normalizedUid == null || normalizedUid.isEmpty) {
      return DashboardReadonlySnapshot(
        status: DashboardProjectionLoadStatus.signedOut,
        uid: null,
        generatedAt: _now ?? DateTime.now().toUtc(),
        projects: const <DashboardProjectSummary>[],
        artifacts: const <DashboardArtifactSummary>[],
        diagnostics: const <DashboardDiagnosticSummary>[],
        indexRuns: const <DashboardIndexRunSummary>[],
      );
    }

    final refs = _userProjectRefs[normalizedUid] ?? const <UserProjectRef>[];
    final visibleProjectIds = refs.map((ref) => ref.projectId).toSet();
    final projects = _projectSummaries(visibleProjectIds, filter);
    final activeProjectIds = projects
        .map((project) => project.projectId)
        .toSet();

    final artifacts = _indexedFiles
        .where((file) => activeProjectIds.contains(_projectIdForFile(file)))
        .map(_artifactSummary)
        .where((artifact) => artifact.isActive)
        .toList(growable: false);
    final diagnostics = _diagnostics
        .where(
          (diagnostic) =>
              activeProjectIds.contains(_projectIdForDiagnostic(diagnostic)),
        )
        .map((diagnostic) {
          final projectId = _projectIdForDiagnostic(diagnostic);
          final summary = DashboardDiagnosticSummary(
            diagnosticId: diagnostic.diagnosticId,
            projectId: projectId,
            code: diagnostic.code,
            severity: diagnostic.severity,
            message: diagnostic.message,
            createdAt: diagnostic.createdAt,
            redactedPath: diagnostic.redactedPath,
          );
          FirestoreProjectionValidators.validateNoSecretLikeFields(
            summary.toMap(),
          );
          return summary;
        })
        .toList(growable: false);
    final indexRuns = _indexRuns
        .where((run) => activeProjectIds.contains(_projectIdForRun(run)))
        .map((run) {
          final projectId = _projectIdForRun(run);
          final summary = DashboardIndexRunSummary(
            projectId: projectId,
            runId: run.runId,
            requestId: run.requestId,
            status: run.status,
            sourceCommit: run.sourceCommit,
            startedAt: run.startedAt,
            finishedAt: run.finishedAt,
          );
          FirestoreProjectionValidators.validateNoSecretLikeFields(
            summary.toMap(),
          );
          return summary;
        })
        .toList(growable: false);

    return DashboardReadonlySnapshot(
      status: DashboardProjectionLoadStatus.ready,
      uid: normalizedUid,
      generatedAt: _now ?? DateTime.now().toUtc(),
      projects: projects,
      artifacts: artifacts,
      diagnostics: diagnostics,
      indexRuns: indexRuns,
    );
  }

  List<DashboardProjectSummary> _projectSummaries(
    Set<String> visibleProjectIds,
    DashboardReadonlyFilter filter,
  ) {
    var summaries = _projects.values
        .where((project) => visibleProjectIds.contains(project.projectId))
        .map((project) {
          final artifactCount = _indexedFiles
              .where(
                (file) =>
                    _projectIdForFile(file) == project.projectId &&
                    !file.deleted,
              )
              .length;
          final diagnosticCount = _diagnostics
              .where(
                (diagnostic) =>
                    _projectIdForDiagnostic(diagnostic) == project.projectId,
              )
              .length;
          final summary = DashboardProjectSummary(
            projectId: project.projectId,
            displayName: project.githubRepo,
            githubFullName: project.githubFullName,
            state: _viewStateFor(project, artifactCount, diagnosticCount),
            projectionStatus: project.projectionStatus,
            accessStatus: project.accessStatus,
            sourceCommit: project.githubHeadCommit,
            updatedAt: project.updatedAt,
            artifactCount: artifactCount,
            diagnosticCount: diagnosticCount,
            staleReason: project.projectionStatus == ProjectionStatus.stale
                ? 'Projection is behind the repository head.'
                : null,
            refreshDisabledReason: _refreshDisabledReason(project.accessStatus),
          );
          FirestoreProjectionValidators.validateNoSecretLikeFields(
            summary.toMap(),
          );
          return summary;
        })
        .where(
          (project) => filter.status == null || project.state == filter.status,
        )
        .where((project) {
          final query = filter.projectQuery.trim().toLowerCase();
          if (query.isEmpty) {
            return true;
          }
          return project.displayName.toLowerCase().contains(query) ||
              project.githubFullName.toLowerCase().contains(query);
        })
        .toList(growable: false);

    summaries = [...summaries];
    switch (filter.sort) {
      case DashboardProjectSort.updatedDesc:
        summaries.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
      case DashboardProjectSort.status:
        summaries.sort((a, b) => a.state.name.compareTo(b.state.name));
      case DashboardProjectSort.name:
        summaries.sort((a, b) => a.displayName.compareTo(b.displayName));
    }
    return summaries;
  }

  DashboardProjectViewState _viewStateFor(
    ShipGlowsProjectRecord project,
    int artifactCount,
    int diagnosticCount,
  ) {
    if (project.accessStatus == GitHubAccessStatus.githubAccessLost ||
        project.accessStatus == GitHubAccessStatus.installationSuspended ||
        project.accessStatus == GitHubAccessStatus.accessCheckFailed) {
      return DashboardProjectViewState.accessLost;
    }
    return switch (project.projectionStatus) {
      ProjectionStatus.fresh =>
        artifactCount == 0
            ? DashboardProjectViewState.corpusMissing
            : DashboardProjectViewState.ready,
      ProjectionStatus.indexing => DashboardProjectViewState.indexing,
      ProjectionStatus.stale => DashboardProjectViewState.stale,
      ProjectionStatus.partial => DashboardProjectViewState.partial,
      ProjectionStatus.accessLost => DashboardProjectViewState.accessLost,
      ProjectionStatus.error => DashboardProjectViewState.failed,
    };
  }

  String? _refreshDisabledReason(GitHubAccessStatus accessStatus) {
    if (accessStatus == GitHubAccessStatus.connected ||
        accessStatus == GitHubAccessStatus.accessCached) {
      return null;
    }
    return 'GitHub access must be restored before refresh or indexing.';
  }

  DashboardArtifactSummary _artifactSummary(IndexedFileRecord file) {
    final summary = DashboardArtifactSummary(
      fileId: file.fileId,
      projectId: _projectIdForFile(file),
      path: file.path,
      family: _familyFor(file),
      artifactType: file.artifactType,
      sourceCommit: file.sourceCommit,
      deleted: file.deleted,
      parseStatus: file.parseStatus,
    );
    FirestoreProjectionValidators.validateNoSecretLikeFields(summary.toMap());
    return summary;
  }

  DashboardArtifactFamily _familyFor(IndexedFileRecord file) {
    final path = file.path;
    if (path.startsWith('shipglows_data/business/')) {
      return DashboardArtifactFamily.business;
    }
    if (path.startsWith('shipglows_data/technical/')) {
      return DashboardArtifactFamily.technical;
    }
    if (path.startsWith('shipglows_data/editorial/')) {
      return DashboardArtifactFamily.editorial;
    }
    if (path.startsWith('shipglows_data/workflow/specs/')) {
      return DashboardArtifactFamily.spec;
    }
    if (path.startsWith('shipglows_data/workflow/bugs/')) {
      return DashboardArtifactFamily.bug;
    }
    if (path.startsWith('shipglows_data/workflow/')) {
      return file.artifactType == 'tracker'
          ? DashboardArtifactFamily.tracker
          : DashboardArtifactFamily.workflow;
    }
    if (path.contains('/test') || path.contains('TEST_LOG')) {
      return DashboardArtifactFamily.test;
    }
    return DashboardArtifactFamily.unknown;
  }

  String _projectIdForFile(IndexedFileRecord file) {
    final separator = file.fileId.indexOf(':');
    return separator > 0 ? file.fileId.substring(0, separator) : '';
  }

  String _projectIdForDiagnostic(DiagnosticRecord diagnostic) {
    final separator = diagnostic.diagnosticId.indexOf(':');
    return separator > 0 ? diagnostic.diagnosticId.substring(0, separator) : '';
  }

  String _projectIdForRun(IndexRunRecord run) {
    final separator = run.runId.indexOf(':');
    return separator > 0 ? run.runId.substring(0, separator) : '';
  }
}
