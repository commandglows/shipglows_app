import 'package:web_socket_channel/web_socket_channel.dart';

import '../data/managed_runner_api.dart';
import 'personal_cloud_models.dart';
import 'personal_cloud_transports.dart';

class ManagedProjectPreviewTransport
    implements ProjectPreviewTransport, ProjectPreviewDiagnosticsTransport {
  const ManagedProjectPreviewTransport(this.api);
  final ManagedRunnerApi api;

  @override
  Future<ProjectPreviewSnapshot> openPreview({
    required String projectId,
  }) async {
    try {
      final origin = await api.openPersonalCloudPreview(projectId: projectId);
      return ProjectPreviewSnapshot(
        state: ProjectPreviewState.ready,
        message: 'Preview distante connectée.',
        origin: origin,
      );
    } on ManagedRunnerException catch (error) {
      throw _surfaceError(error);
    }
  }

  @override
  Future<void> reportPreviewDiagnostic({
    required String projectId,
    required String diagnosticId,
    required String stage,
    required String code,
    required DateTime occurredAt,
  }) => api.reportPersonalCloudPreviewDiagnostic(
    projectId: projectId,
    diagnosticId: diagnosticId,
    stage: stage,
    code: code,
    occurredAt: occurredAt,
  );
}

class ManagedRemoteWorkspaceTransport
    implements RemoteWorkspaceTransport, RemoteWorkspaceDiagnosticsTransport {
  const ManagedRemoteWorkspaceTransport(this.api);
  final ManagedRunnerApi api;

  @override
  Future<RemoteWorkspaceCapability> createCapability({
    required String projectId,
    required RemoteWorkspaceSurface surface,
    required String idempotencyKey,
  }) async {
    try {
      final session = await api.createOperatorSession(
        projectId: projectId,
        surface: switch (surface) {
          RemoteWorkspaceSurface.editor => ManagedWorkspaceSurface.editor,
          RemoteWorkspaceSurface.terminal => ManagedWorkspaceSurface.terminal,
        },
        idempotencyKey: idempotencyKey,
      );
      return RemoteWorkspaceCapability(
        sessionId: session.sessionId,
        token: session.token,
        expiresAt: session.expiresAt,
      );
    } on ManagedRunnerException catch (error) {
      throw _surfaceError(error);
    }
  }

  @override
  RemoteWorkspaceSocket connect(RemoteWorkspaceCapability capability) {
    final channel = api.connectOperatorSession(
      ManagedOperatorSession(
        sessionId: capability.sessionId,
        token: capability.token,
        expiresAt: capability.expiresAt,
      ),
    );
    return _ManagedRemoteWorkspaceSocket(channel);
  }

  @override
  Future<void> releaseCapability({required String sessionId}) =>
      api.closeOperatorSession(sessionId: sessionId);

  @override
  Future<void> reportWorkspaceDiagnostic({
    required String projectId,
    required RemoteWorkspaceSurface surface,
    required String diagnosticId,
    required String stage,
    required String code,
    required DateTime occurredAt,
  }) => api.reportWorkspaceDiagnostic(
    projectId: projectId,
    surface: switch (surface) {
      RemoteWorkspaceSurface.editor => ManagedWorkspaceSurface.editor,
      RemoteWorkspaceSurface.terminal => ManagedWorkspaceSurface.terminal,
    },
    diagnosticId: diagnosticId,
    stage: stage,
    code: code,
    occurredAt: occurredAt,
  );
}

class _ManagedRemoteWorkspaceSocket implements RemoteWorkspaceSocket {
  const _ManagedRemoteWorkspaceSocket(this.channel);
  final WebSocketChannel channel;
  @override
  Future<void> get ready => channel.ready;
  @override
  Stream<Object?> get messages => channel.stream;
  @override
  void send(String data) => channel.sink.add(data);
  @override
  Future<void> close() async => channel.sink.close();
}

RemoteSurfaceException _surfaceError(ManagedRunnerException error) {
  final failure = switch (error.code) {
    'unauthorized' => RemoteSurfaceFailure.unauthorized,
    'projectForbidden' ||
    'previewDenied' ||
    'previewOriginDenied' => RemoteSurfaceFailure.denied,
    'previewExpired' => RemoteSurfaceFailure.expired,
    'operatorSessionActive' => RemoteSurfaceFailure.activeElsewhere,
    'operatorSessionConflict' => RemoteSurfaceFailure.protocol,
    'workspaceProtocolUnsupported' => RemoteSurfaceFailure.unsupported,
    'operatorWorkspaceUnavailable' ||
    'previewUnavailable' => RemoteSurfaceFailure.unavailable,
    _ => RemoteSurfaceFailure.network,
  };
  return RemoteSurfaceException(
    failure: failure,
    message: error.message,
    retryable:
        failure == RemoteSurfaceFailure.network ||
        failure == RemoteSurfaceFailure.unavailable ||
        failure == RemoteSurfaceFailure.expired,
  );
}
