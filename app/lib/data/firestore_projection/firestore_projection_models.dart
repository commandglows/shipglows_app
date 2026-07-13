enum ShipGlowzProjectRole { owner, viewer }

enum ProjectionStatus { fresh, stale, indexing, partial, accessLost, error }

enum IndexRunStatus {
  queued,
  running,
  alreadyRunning,
  success,
  partial,
  failed,
  canceled,
}

enum IndexRequestStatus {
  queued,
  running,
  alreadyRunning,
  fresh,
  stale,
  partial,
  failed,
}

enum GitHubAccessStatus {
  notConnected,
  needsGithubApp,
  connected,
  accessCached,
  githubAccessLost,
  installationSuspended,
  accessCheckFailed,
}

enum RunnerDiagnosticCode {
  accessDenied,
  accessCheckFailed,
  tokenRefreshRetried,
  cloneFailed,
  parseFailed,
  sourceTooLarge,
  refreshTooLarge,
  indexTimeout,
  projectionFailed,
  alreadyRunning,
  deletedFile,
  staleProjection,
  forbiddenField,
}

enum IndexedFileParseStatus { parsed, parseFailed, skipped, deleted }

extension ProjectionStatusWireName on ProjectionStatus {
  String get wireName => switch (this) {
    ProjectionStatus.accessLost => 'access_lost',
    _ => name,
  };
}

extension IndexRunStatusWireName on IndexRunStatus {
  String get wireName => switch (this) {
    IndexRunStatus.alreadyRunning => 'already_running',
    _ => name,
  };
}

extension IndexRequestStatusWireName on IndexRequestStatus {
  String get wireName => switch (this) {
    IndexRequestStatus.alreadyRunning => 'already_running',
    _ => name,
  };
}

extension GitHubAccessStatusWireName on GitHubAccessStatus {
  String get wireName => switch (this) {
    GitHubAccessStatus.notConnected => 'not_connected',
    GitHubAccessStatus.needsGithubApp => 'needs_github_app',
    GitHubAccessStatus.accessCached => 'access_cached',
    GitHubAccessStatus.githubAccessLost => 'github_access_lost',
    GitHubAccessStatus.installationSuspended => 'installation_suspended',
    GitHubAccessStatus.accessCheckFailed => 'access_check_failed',
    _ => name,
  };
}

extension RunnerDiagnosticCodeWireName on RunnerDiagnosticCode {
  String get wireName => switch (this) {
    RunnerDiagnosticCode.accessDenied => 'access_denied',
    RunnerDiagnosticCode.accessCheckFailed => 'access_check_failed',
    RunnerDiagnosticCode.tokenRefreshRetried => 'token_refresh_retried',
    RunnerDiagnosticCode.cloneFailed => 'clone_failed',
    RunnerDiagnosticCode.parseFailed => 'parse_failed',
    RunnerDiagnosticCode.sourceTooLarge => 'source_too_large',
    RunnerDiagnosticCode.refreshTooLarge => 'refresh_too_large',
    RunnerDiagnosticCode.indexTimeout => 'index_timeout',
    RunnerDiagnosticCode.projectionFailed => 'projection_failed',
    RunnerDiagnosticCode.alreadyRunning => 'already_running',
    RunnerDiagnosticCode.deletedFile => 'deleted_file',
    RunnerDiagnosticCode.staleProjection => 'stale_projection',
    RunnerDiagnosticCode.forbiddenField => 'forbidden_field',
  };
}

extension IndexedFileParseStatusWireName on IndexedFileParseStatus {
  String get wireName => switch (this) {
    IndexedFileParseStatus.parseFailed => 'parse_failed',
    _ => name,
  };
}

class ShipGlowzUserProfile {
  const ShipGlowzUserProfile({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.githubConnectionStatus,
    required this.dashboardDefaultProjectId,
    required this.createdAt,
    required this.updatedAt,
  });

  final String uid;
  final String email;
  final String displayName;
  final String githubConnectionStatus;
  final String? dashboardDefaultProjectId;
  final DateTime createdAt;
  final DateTime updatedAt;

  Map<String, Object?> toMap() => <String, Object?>{
    'uid': uid,
    'email': email,
    'displayName': displayName,
    'githubConnectionStatus': githubConnectionStatus,
    'dashboardDefaultProjectId': dashboardDefaultProjectId,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class ShipGlowzProjectRecord {
  const ShipGlowzProjectRecord({
    required this.projectId,
    required this.githubOwner,
    required this.githubRepo,
    required this.githubFullName,
    required this.githubDefaultBranch,
    required this.githubHeadCommit,
    required this.projectionStatus,
    required this.createdAt,
    required this.updatedAt,
    this.accessStatus = GitHubAccessStatus.notConnected,
    this.activeIndexRun,
  });

  final String projectId;
  final String githubOwner;
  final String githubRepo;
  final String githubFullName;
  final String githubDefaultBranch;
  final String githubHeadCommit;
  final ProjectionStatus projectionStatus;
  final DateTime createdAt;
  final DateTime updatedAt;
  final GitHubAccessStatus accessStatus;
  final ActiveIndexRunRecord? activeIndexRun;

  Map<String, Object?> toMap() => <String, Object?>{
    'projectId': projectId,
    'github': <String, Object?>{
      'owner': githubOwner,
      'repo': githubRepo,
      'fullName': githubFullName,
      'defaultBranch': githubDefaultBranch,
      'headCommit': githubHeadCommit,
    },
    'projectionStatus': projectionStatus.wireName,
    'accessStatus': accessStatus.wireName,
    'activeIndexRun': activeIndexRun?.toMap(),
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class ProjectMemberRecord {
  const ProjectMemberRecord({
    required this.uid,
    required this.role,
    required this.addedAt,
  });

  final String uid;
  final ShipGlowzProjectRole role;
  final DateTime addedAt;

  Map<String, Object?> toMap() => <String, Object?>{
    'uid': uid,
    'role': role.name,
    'addedAt': addedAt.toIso8601String(),
  };
}

class IndexedFileRecord {
  const IndexedFileRecord({
    required this.fileId,
    required this.path,
    required this.artifactType,
    required this.sourceCommit,
    required this.contentHash,
    required this.projectionStatus,
    required this.deleted,
    required this.indexedAt,
    this.parseStatus = IndexedFileParseStatus.parsed,
    this.frontmatter = const <String, Object?>{},
    this.markdownBody,
  });

  final String fileId;
  final String path;
  final String artifactType;
  final String sourceCommit;
  final String contentHash;
  final ProjectionStatus projectionStatus;
  final bool deleted;
  final DateTime indexedAt;
  final IndexedFileParseStatus parseStatus;
  final Map<String, Object?> frontmatter;
  final String? markdownBody;

  Map<String, Object?> toMap() => <String, Object?>{
    'fileId': fileId,
    'path': path,
    'artifactType': artifactType,
    'sourceCommit': sourceCommit,
    'contentHash': contentHash,
    'projectionStatus': projectionStatus.wireName,
    'parseStatus': parseStatus.wireName,
    'frontmatter': frontmatter,
    'deleted': deleted,
    'indexedAt': indexedAt.toIso8601String(),
    'markdownBody': markdownBody,
  };
}

class IndexRunRecord {
  const IndexRunRecord({
    required this.runId,
    required this.requestId,
    required this.sourceCommit,
    required this.status,
    required this.startedAt,
    required this.finishedAt,
    required this.filesIndexed,
    required this.filesDeleted,
  });

  final String runId;
  final String requestId;
  final String sourceCommit;
  final IndexRunStatus status;
  final DateTime startedAt;
  final DateTime? finishedAt;
  final int filesIndexed;
  final int filesDeleted;

  Map<String, Object?> toMap() => <String, Object?>{
    'runId': runId,
    'requestId': requestId,
    'sourceCommit': sourceCommit,
    'status': status.wireName,
    'startedAt': startedAt.toIso8601String(),
    'finishedAt': finishedAt?.toIso8601String(),
    'filesIndexed': filesIndexed,
    'filesDeleted': filesDeleted,
  };
}

class ActiveIndexRunRecord {
  const ActiveIndexRunRecord({
    required this.runId,
    required this.requestId,
    required this.status,
    required this.startedAt,
  });

  final String runId;
  final String requestId;
  final IndexRunStatus status;
  final DateTime startedAt;

  Map<String, Object?> toMap() => <String, Object?>{
    'runId': runId,
    'requestId': requestId,
    'status': status.wireName,
    'startedAt': startedAt.toIso8601String(),
  };
}

class IndexRequestRecord {
  const IndexRequestRecord({
    required this.projectId,
    required this.requestId,
    required this.githubOwner,
    required this.githubRepo,
    required this.githubFullName,
    required this.status,
    required this.requestedAt,
    this.sourceCommit,
    this.runId,
  });

  final String projectId;
  final String requestId;
  final String githubOwner;
  final String githubRepo;
  final String githubFullName;
  final IndexRequestStatus status;
  final DateTime requestedAt;
  final String? sourceCommit;
  final String? runId;

  Map<String, Object?> toMap() => <String, Object?>{
    'projectId': projectId,
    'requestId': requestId,
    'github': <String, Object?>{
      'owner': githubOwner,
      'repo': githubRepo,
      'fullName': githubFullName,
    },
    'status': status.wireName,
    'requestedAt': requestedAt.toIso8601String(),
    'sourceCommit': sourceCommit,
    'runId': runId,
  };
}

class DiagnosticRecord {
  const DiagnosticRecord({
    required this.diagnosticId,
    required this.code,
    required this.severity,
    required this.message,
    required this.createdAt,
    this.redactedPath,
  });

  final String diagnosticId;
  final String code;
  final String severity;
  final String message;
  final DateTime createdAt;
  final String? redactedPath;

  Map<String, Object?> toMap() => <String, Object?>{
    'diagnosticId': diagnosticId,
    'code': code,
    'severity': severity,
    'message': message,
    'createdAt': createdAt.toIso8601String(),
    'redactedPath': redactedPath,
  };
}

class UserProjectRef {
  const UserProjectRef({
    required this.projectId,
    required this.role,
    required this.projectionStatus,
    required this.updatedAt,
  });

  final String projectId;
  final ShipGlowzProjectRole role;
  final ProjectionStatus projectionStatus;
  final DateTime updatedAt;

  Map<String, Object?> toMap() => <String, Object?>{
    'projectId': projectId,
    'role': role.name,
    'projectionStatus': projectionStatus.wireName,
    'updatedAt': updatedAt.toIso8601String(),
  };
}

class UserFeedItem {
  const UserFeedItem({
    required this.itemId,
    required this.projectId,
    required this.title,
    required this.createdAt,
  });

  final String itemId;
  final String projectId;
  final String title;
  final DateTime createdAt;

  Map<String, Object?> toMap() => <String, Object?>{
    'itemId': itemId,
    'projectId': projectId,
    'title': title,
    'createdAt': createdAt.toIso8601String(),
  };
}
