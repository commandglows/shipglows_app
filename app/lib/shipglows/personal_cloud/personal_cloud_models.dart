enum ProjectPreviewState {
  starting,
  ready,
  reconnecting,
  stopped,
  expired,
  denied,
  unsupported,
}

class PersonalCloudProject {
  const PersonalCloudProject({
    required this.id,
    required this.name,
    required this.status,
    required this.preview,
    required this.workspace,
  });
  final String id;
  final String name;
  final String status;
  final bool preview;
  final bool workspace;
}

class ProjectPreviewSnapshot {
  const ProjectPreviewSnapshot({
    required this.state,
    required this.message,
    this.origin,
  });

  final ProjectPreviewState state;
  final String message;
  final Uri? origin;

  bool get canRender => state == ProjectPreviewState.ready && origin != null;
}

enum RemoteSurfaceFailure {
  unauthorized,
  denied,
  expired,
  activeElsewhere,
  unavailable,
  network,
  protocol,
  unsupported,
}

class RemoteSurfaceException implements Exception {
  const RemoteSurfaceException({
    required this.failure,
    required this.message,
    required this.retryable,
  });

  final RemoteSurfaceFailure failure;
  final String message;
  final bool retryable;

  @override
  String toString() => 'RemoteSurfaceException($failure)';
}

class RemoteWorkspaceCapability {
  const RemoteWorkspaceCapability({
    required this.sessionId,
    required this.token,
    required this.expiresAt,
  });

  final String sessionId;
  final String token;
  final DateTime expiresAt;
}
