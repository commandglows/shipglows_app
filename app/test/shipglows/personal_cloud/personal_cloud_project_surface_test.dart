import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/personal_cloud/personal_cloud_models.dart';
import 'package:shipglows_app/shipglows/personal_cloud/personal_cloud_transports.dart';
import 'package:shipglows_app/shipglows/presentation/screens/personal_cloud_project_screen.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/personal_cloud/project_preview_pane.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/personal_cloud/reconnecting_workspace_terminal.dart';

void main() {
  testWidgets('keeps Preview and Terminal mounted in the compact surface', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final preview = _PreviewTransport([_readyPreview()]);
    final workspace = _WorkspaceTransport([_WorkspaceSocket()]);

    await tester.pumpWidget(
      _app(
        PersonalCloudProjectSurface(
          projectId: 'project-1',
          projectName: 'Projet test',
          previewTransport: preview,
          workspaceTransport: workspace,
          previewFrameBuilder: _previewFrame,
          workspaceReconnectPolicy: const WorkspaceReconnectPolicy(
            delays: [],
            heartbeatInterval: null,
          ),
        ),
      ),
    );
    await _pumpAsync(tester);

    expect(preview.openCount, 1);
    expect(workspace.createCount, 1);
    expect(find.text('Preview fixture'), findsOneWidget);

    await tester.tap(find.text('Terminal'));
    await _pumpAsync(tester);
    expect(find.text('Workspace connecté'), findsOneWidget);
    expect(find.text('Esc'), findsOneWidget);

    await tester.tap(find.text('Preview'));
    await _pumpAsync(tester);
    expect(preview.openCount, 1);
    expect(workspace.createCount, 1);
    expect(find.text('Preview fixture'), findsOneWidget);
  });

  testWidgets('shows Preview and Terminal together on expanded screens', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final workspace = _WorkspaceTransport([_WorkspaceSocket()]);

    await tester.pumpWidget(
      _app(
        PersonalCloudProjectSurface(
          projectId: 'project-1',
          projectName: 'Projet test',
          previewTransport: _PreviewTransport([_readyPreview()]),
          workspaceTransport: workspace,
          previewFrameBuilder: _previewFrame,
          workspaceReconnectPolicy: const WorkspaceReconnectPolicy(
            delays: [],
            heartbeatInterval: null,
          ),
        ),
      ),
    );
    await _pumpAsync(tester);

    expect(find.text('Preview fixture'), findsOneWidget);
    expect(find.text('Workspace connecté'), findsOneWidget);
    expect(find.byType(VerticalDivider), findsOneWidget);
  });

  testWidgets('retries a typed Preview failure without opening another tab', (
    tester,
  ) async {
    final preview = _PreviewTransport([
      const RemoteSurfaceException(
        failure: RemoteSurfaceFailure.network,
        message: 'La Preview est momentanément hors ligne.',
        retryable: true,
      ),
      _readyPreview(),
    ]);

    await tester.pumpWidget(
      _app(
        ProjectPreviewPane(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: preview,
          frameBuilder: _previewFrame,
        ),
      ),
    );
    await _pumpAsync(tester);
    expect(
      find.text('La Preview est momentanément hors ligne.'),
      findsOneWidget,
    );

    await tester.tap(find.widgetWithText(FilledButton, 'Réessayer'));
    await _pumpAsync(tester);
    expect(preview.openCount, 2);
    expect(find.text('Preview fixture'), findsOneWidget);
    expect(find.text('Connectée'), findsOneWidget);
  });

  testWidgets('uses a fresh capability after a terminal disconnect', (
    tester,
  ) async {
    final first = _WorkspaceSocket();
    final second = _WorkspaceSocket();
    final transport = _WorkspaceTransport([first, second]);

    await tester.pumpWidget(
      _app(
        ReconnectingWorkspaceTerminal(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: transport,
          reconnectPolicy: const WorkspaceReconnectPolicy(
            delays: [Duration.zero],
            heartbeatInterval: null,
          ),
          delay: (_) async {},
        ),
      ),
    );
    await _pumpAsync(tester);
    expect(transport.createCount, 1);

    await first.endFromServer();
    await _pumpAsync(tester);
    expect(transport.createCount, 2);
    expect(transport.releasedSessionIds, contains('session-1'));
    expect(find.text('Workspace connecté'), findsOneWidget);
  });

  testWidgets('renders an active-session conflict as a typed visible state', (
    tester,
  ) async {
    final transport = _WorkspaceTransport(
      const [],
      createFailure: const RemoteSurfaceException(
        failure: RemoteSurfaceFailure.activeElsewhere,
        message: 'Ce Workspace est déjà ouvert sur un autre appareil.',
        retryable: false,
      ),
    );

    await tester.pumpWidget(
      _app(
        ReconnectingWorkspaceTerminal(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: transport,
          reconnectPolicy: const WorkspaceReconnectPolicy(
            delays: [],
            heartbeatInterval: null,
          ),
        ),
      ),
    );
    await _pumpAsync(tester);

    expect(
      find.text('Ce Workspace est déjà ouvert sur un autre appareil.'),
      findsOneWidget,
    );
    expect(find.byIcon(Icons.desktop_access_disabled_outlined), findsOneWidget);
  });

  testWidgets('does not echo a server heartbeat frame', (tester) async {
    final socket = _WorkspaceSocket();
    await tester.pumpWidget(
      _app(
        ReconnectingWorkspaceTerminal(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: _WorkspaceTransport([socket]),
          reconnectPolicy: const WorkspaceReconnectPolicy(
            delays: [],
            heartbeatInterval: null,
          ),
        ),
      ),
    );
    await _pumpAsync(tester);
    socket.emitFromServer('{"type":"heartbeat","state":"alive"}');
    await _pumpAsync(tester);
    expect(socket.sent, isEmpty);
  });
}

Widget _app(Widget child) => MaterialApp(
  theme: AppTheme.lightTheme,
  darkTheme: AppTheme.darkTheme,
  home: Scaffold(body: child),
);

Future<void> _pumpAsync(WidgetTester tester, {int frames = 4}) async {
  for (var index = 0; index < frames; index += 1) {
    await tester.pump(const Duration(milliseconds: 16));
  }
}

ProjectPreviewSnapshot _readyPreview() => ProjectPreviewSnapshot(
  state: ProjectPreviewState.ready,
  message: 'Preview prête.',
  origin: Uri.parse('https://project.preview.shipglows.com'),
);

Widget _previewFrame(
  Uri origin,
  int reloadRevision,
  VoidCallback onLoaded,
  VoidCallback onFailed,
) {
  WidgetsBinding.instance.addPostFrameCallback((_) => onLoaded());
  return const Center(child: Text('Preview fixture'));
}

class _PreviewTransport implements ProjectPreviewTransport {
  _PreviewTransport(this.results);

  final List<Object> results;
  var openCount = 0;

  @override
  Future<ProjectPreviewSnapshot> openPreview({
    required String projectId,
  }) async {
    final result = results[openCount++];
    if (result is RemoteSurfaceException) throw result;
    return result as ProjectPreviewSnapshot;
  }
}

class _WorkspaceTransport implements RemoteWorkspaceTransport {
  _WorkspaceTransport(this.sockets, {this.createFailure});

  final List<_WorkspaceSocket> sockets;
  final RemoteSurfaceException? createFailure;
  final releasedSessionIds = <String>[];
  var createCount = 0;

  @override
  Future<RemoteWorkspaceCapability> createCapability({
    required String projectId,
    required String idempotencyKey,
  }) async {
    final failure = createFailure;
    if (failure != null) throw failure;
    createCount += 1;
    return RemoteWorkspaceCapability(
      sessionId: 'session-$createCount',
      token: 'opaque-$createCount',
      expiresAt: DateTime.utc(2026, 8, 18, 1),
    );
  }

  @override
  RemoteWorkspaceSocket connect(RemoteWorkspaceCapability capability) =>
      sockets[createCount - 1];

  @override
  Future<void> releaseCapability({required String sessionId}) async {
    releasedSessionIds.add(sessionId);
  }
}

class _WorkspaceSocket implements RemoteWorkspaceSocket {
  final _messages = StreamController<Object?>();
  final sent = <String>[];
  bool closed = false;

  @override
  Future<void> get ready async {}

  @override
  Stream<Object?> get messages => _messages.stream;

  @override
  void send(String data) => sent.add(data);

  @override
  Future<void> close() async {
    closed = true;
  }

  Future<void> endFromServer() => _messages.close();
  void emitFromServer(Object? frame) => _messages.add(frame);
}
