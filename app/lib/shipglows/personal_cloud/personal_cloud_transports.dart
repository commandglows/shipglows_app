import 'personal_cloud_models.dart';

abstract interface class ProjectPreviewTransport {
  Future<ProjectPreviewSnapshot> openPreview({required String projectId});
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
