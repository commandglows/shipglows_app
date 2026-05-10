enum ShipFlowProjectRole { owner, viewer }

enum ProjectionStatus { fresh, stale, indexing, partial, accessLost, error }

enum IndexRunStatus { running, success, partial, failed, canceled }

class ShipFlowUserProfile {
  const ShipFlowUserProfile({
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

class ShipFlowProjectRecord {
  const ShipFlowProjectRecord({
    required this.projectId,
    required this.githubOwner,
    required this.githubRepo,
    required this.githubFullName,
    required this.githubDefaultBranch,
    required this.githubHeadCommit,
    required this.projectionStatus,
    required this.createdAt,
    required this.updatedAt,
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

  Map<String, Object?> toMap() => <String, Object?>{
    'projectId': projectId,
    'github': <String, Object?>{
      'owner': githubOwner,
      'repo': githubRepo,
      'fullName': githubFullName,
      'defaultBranch': githubDefaultBranch,
      'headCommit': githubHeadCommit,
    },
    'projectionStatus': projectionStatus.name,
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
  final ShipFlowProjectRole role;
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
  final String? markdownBody;

  Map<String, Object?> toMap() => <String, Object?>{
    'fileId': fileId,
    'path': path,
    'artifactType': artifactType,
    'sourceCommit': sourceCommit,
    'contentHash': contentHash,
    'projectionStatus': projectionStatus.name,
    'deleted': deleted,
    'indexedAt': indexedAt.toIso8601String(),
    'markdownBody': markdownBody,
  };
}

class IndexRunRecord {
  const IndexRunRecord({
    required this.runId,
    required this.sourceCommit,
    required this.status,
    required this.startedAt,
    required this.finishedAt,
    required this.filesIndexed,
    required this.filesDeleted,
  });

  final String runId;
  final String sourceCommit;
  final IndexRunStatus status;
  final DateTime startedAt;
  final DateTime? finishedAt;
  final int filesIndexed;
  final int filesDeleted;

  Map<String, Object?> toMap() => <String, Object?>{
    'runId': runId,
    'sourceCommit': sourceCommit,
    'status': status.name,
    'startedAt': startedAt.toIso8601String(),
    'finishedAt': finishedAt?.toIso8601String(),
    'filesIndexed': filesIndexed,
    'filesDeleted': filesDeleted,
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
  final ShipFlowProjectRole role;
  final ProjectionStatus projectionStatus;
  final DateTime updatedAt;

  Map<String, Object?> toMap() => <String, Object?>{
    'projectId': projectId,
    'role': role.name,
    'projectionStatus': projectionStatus.name,
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
