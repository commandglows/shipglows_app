import 'personal_cloud_models.dart';

abstract interface class ProjectPreviewTransport {
  Future<ProjectPreviewSnapshot> openPreview({required String projectId});
}

abstract interface class ProjectPreviewDiagnosticsTransport {
  Future<void> reportPreviewDiagnostic({
    required String projectId,
    required String diagnosticId,
    required String stage,
    required String code,
    required DateTime occurredAt,
  });
}

abstract interface class RemoteWorkspaceSocket {
  Future<void> get ready;
  Stream<Object?> get messages;

  void send(String data);
  Future<void> close();
}

abstract interface class RemoteWorkspaceTransport {
  Future<RemoteWorkspaceCapability> createCapability({
    required String projectId,
    required String idempotencyKey,
  });

  RemoteWorkspaceSocket connect(RemoteWorkspaceCapability capability);

  Future<void> releaseCapability({required String sessionId});
}
