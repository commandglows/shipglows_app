import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/personal_cloud/personal_cloud_models.dart';
import 'package:shipglows_app/shipglows/personal_cloud/personal_cloud_transports.dart';
import 'package:shipglows_app/shipglows/providers/personal_cloud/personal_cloud_projects_provider.dart';
import 'package:shipglows_app/shipglows/presentation/screens/personal_cloud_project_screen.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/personal_cloud/project_preview_pane.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/personal_cloud/reconnecting_workspace_terminal.dart';
import 'package:xterm/xterm.dart';

void main() {
  testWidgets('blocks a deep link outside the authorized project catalog', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/project/foreign/cloud',
      routes: [
        GoRoute(
          path: '/project/:name/cloud',
          builder: (_, _) => const PersonalCloudProjectScreen(
            projectId: 'foreign-project',
            projectName: 'Foreign',
          ),
        ),
        GoRoute(
          path: '/projects',
          builder: (_, _) => const Scaffold(body: Text('Projects')),
        ),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          personalCloudProjectsProvider.overrideWith(
            (ref) async => const [
              PersonalCloudProject(
                id: 'authorized-project',
                name: 'Authorized',
                status: 'online',
                preview: true,
                workspace: true,
              ),
            ],
          ),
        ],
        child: MaterialApp.router(
          theme: AppTheme.lightTheme,
          routerConfig: router,
        ),
      ),
    );
    await _pumpAsync(tester);

    expect(find.text('Projet non autorisé'), findsOneWidget);
    expect(
      find.byKey(const ValueKey('personal-cloud-preview-pane')),
      findsNothing,
    );
    expect(
      find.byKey(const ValueKey('personal-cloud-workspace-pane')),
      findsNothing,
    );
  });

  testWidgets(
    'switches between Preview, Editor and Terminal with one Workspace',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final preview = _PreviewTransport([_readyPreview()]);
      final workspace = _WorkspaceTransport([
        _WorkspaceSocket(),
        _WorkspaceSocket(),
      ]);

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
      expect(find.text('Éditeur Neovim'), findsOneWidget);
      expect(workspace.surfaces, [RemoteWorkspaceSurface.editor]);
      expect(
        workspace.sockets.first.sent.map(jsonDecode),
        contains(
          allOf(
            containsPair('type', 'resize'),
            containsPair('columns', isA<int>()),
            containsPair('rows', isA<int>()),
          ),
        ),
      );

      await tester.tap(find.text('Terminal'));
      await _pumpAsync(tester, frames: 12);
      expect(
        tester
            .widget<SegmentedButton<PersonalCloudPane>>(
              find.byType(SegmentedButton<PersonalCloudPane>),
            )
            .selected,
        {PersonalCloudPane.terminal},
      );
      expect(
        tester
            .widget<ReconnectingWorkspaceTerminal>(
              find.byKey(const ValueKey('personal-cloud-workspace-pane')),
            )
            .surface,
        RemoteWorkspaceSurface.terminal,
      );
      expect(workspace.releasedSessionIds, contains('session-1'));
      expect(workspace.surfaces, [
        RemoteWorkspaceSurface.editor,
        RemoteWorkspaceSurface.terminal,
      ]);
      expect(find.text('Terminal connecté'), findsOneWidget);
      expect(find.text('Esc'), findsOneWidget);

      await tester.tap(find.text('Preview'));
      await _pumpAsync(tester);
      expect(preview.openCount, 1);
      expect(workspace.createCount, 2);
      expect(find.text('Preview fixture'), findsOneWidget);
    },
  );

  testWidgets(
    'shows Preview and the Neovim editor together on expanded screens',
    (tester) async {
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
      expect(find.text('Neovim connecté'), findsOneWidget);
      expect(find.text('Éditeur Neovim'), findsOneWidget);
      expect(find.byType(VerticalDivider), findsOneWidget);

      await tester.tap(find.byTooltip('Agrandir l’espace de travail'));
      await _pumpAsync(tester);
      expect(find.byType(VerticalDivider), findsNothing);
      expect(workspace.createCount, 1);
      expect(find.byTooltip('Afficher la Preview à côté'), findsOneWidget);

      await tester.tap(find.byTooltip('Afficher la Preview à côté'));
      await _pumpAsync(tester);
      expect(find.byType(VerticalDivider), findsOneWidget);
      expect(workspace.createCount, 1);
    },
  );

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

  testWidgets('guides recovery when the embedded Preview stays blocked', (
    tester,
  ) async {
    Uri? openedOrigin;
    final preview = _PreviewTransport([_readyPreview(), _readyPreview()]);

    await tester.pumpWidget(
      _app(
        ProjectPreviewPane(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: preview,
          previewLoadTimeout: Duration.zero,
          openExternal: (origin) async {
            openedOrigin = origin;
            return true;
          },
          frameBuilder: (_, _, _, _) => const SizedBox.expand(),
        ),
      ),
    );
    await _pumpAsync(tester);

    expect(
      find.text('La Preview semble bloquée par le navigateur'),
      findsOneWidget,
    );
    expect(find.textContaining('bouclier'), findsOneWidget);
    expect(find.text('J’ai autorisé, réessayer'), findsOneWidget);
    expect(find.text('Copier l’URL'), findsOneWidget);

    await tester.tap(find.text('Ouvrir dans un nouvel onglet'));
    await tester.pump();
    expect(openedOrigin, Uri.parse('https://project.shipglows.com'));

    await tester.tap(find.text('J’ai autorisé, réessayer'));
    await _pumpAsync(tester);
    expect(preview.openCount, 2);
  });

  testWidgets('keeps browser recovery help available after a frame load', (
    tester,
  ) async {
    final preview = _PreviewTransport([_readyPreview()]);
    await tester.pumpWidget(
      _app(
        ProjectPreviewPane(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: preview,
          frameBuilder: (_, _, onLoaded, _) {
            scheduleMicrotask(onLoaded);
            return const SizedBox.expand();
          },
        ),
      ),
    );
    await _pumpAsync(tester);

    expect(find.text('La Preview ne s’affiche pas ?'), findsOneWidget);
    expect(find.byTooltip('Aide navigateur Preview'), findsOneWidget);
    await tester.tap(find.byTooltip('Aide navigateur Preview'));
    await tester.pump();
    expect(
      find.text('La Preview semble bloquée par le navigateur'),
      findsOneWidget,
    );
    await tester.tap(find.text('Signaler le problème'));
    await tester.pump();
    expect(preview.diagnostics.last['code'], 'reported');
    expect(find.textContaining('Diagnostic pd_'), findsWidgets);
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
          surface: RemoteWorkspaceSurface.terminal,
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
    expect(find.text('Terminal connecté'), findsOneWidget);
  });

  testWidgets('stops reconnecting after repeated short-lived connections', (
    tester,
  ) async {
    final sockets = [
      _WorkspaceSocket(),
      _WorkspaceSocket(),
      _WorkspaceSocket(),
    ];
    final transport = _WorkspaceTransport(sockets);

    await tester.pumpWidget(
      _app(
        ReconnectingWorkspaceTerminal(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: transport,
          surface: RemoteWorkspaceSurface.editor,
          reconnectPolicy: const WorkspaceReconnectPolicy(
            delays: [Duration.zero, Duration.zero],
            heartbeatInterval: null,
          ),
          delay: (_) async {},
        ),
      ),
    );
    await _pumpAsync(tester);
    await sockets[0].endFromServer();
    await _pumpAsync(tester);
    await sockets[1].endFromServer();
    await _pumpAsync(tester);
    await sockets[2].endFromServer();
    await _pumpAsync(tester);

    expect(transport.createCount, 3);
    expect(find.text('Le flux Workspace a été interrompu.'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Reconnecter'), findsOneWidget);
    expect(
      find.text('L’environnement tmux reste conservé sur le serveur.'),
      findsOneWidget,
    );
    expect(find.textContaining('Diagnostic wd_'), findsOneWidget);
    expect(
      transport.diagnostics.where(
        (event) => event['code'] == 'retry_exhausted',
      ),
      isNotEmpty,
    );
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
          surface: RemoteWorkspaceSurface.terminal,
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
    expect(find.text('Workspace déjà actif ailleurs'), findsOneWidget);
  });

  testWidgets('does not echo a server heartbeat frame', (tester) async {
    final socket = _WorkspaceSocket();
    await tester.pumpWidget(
      _app(
        ReconnectingWorkspaceTerminal(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: _WorkspaceTransport([socket]),
          surface: RemoteWorkspaceSurface.terminal,
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

  testWidgets('sends continuous non-mobile terminal input without spaces', (
    tester,
  ) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.windows;
    addTearDown(() => debugDefaultTargetPlatformOverride = null);
    final socket = _WorkspaceSocket();
    await tester.pumpWidget(
      _app(
        ReconnectingWorkspaceTerminal(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: _WorkspaceTransport([socket]),
          surface: RemoteWorkspaceSurface.terminal,
          reconnectPolicy: const WorkspaceReconnectPolicy(
            delays: [],
            heartbeatInterval: null,
          ),
        ),
      ),
    );
    await _pumpAsync(tester);

    final terminalView = tester.widget<TerminalView>(find.byType(TerminalView));
    expect(terminalView.deleteDetection, isFalse);
    await tester.tap(find.byType(TerminalView));
    await tester.pump();
    tester.testTextInput.enterText('shipglows');
    await tester.pump(const Duration(milliseconds: 301));

    debugDefaultTargetPlatformOverride = null;
    expect(_inputFrames(socket), ['shipglows']);
  });

  test('enables delete detection only on native mobile platforms', () {
    expect(
      shouldUseWorkspaceDeleteDetection(
        isWeb: true,
        platform: TargetPlatform.android,
      ),
      isFalse,
    );
    expect(
      shouldUseWorkspaceDeleteDetection(
        isWeb: false,
        platform: TargetPlatform.windows,
      ),
      isFalse,
    );
    expect(
      shouldUseWorkspaceDeleteDetection(
        isWeb: false,
        platform: TargetPlatform.android,
      ),
      isTrue,
    );
    expect(
      shouldUseWorkspaceDeleteDetection(
        isWeb: false,
        platform: TargetPlatform.iOS,
      ),
      isTrue,
    );
  });

  testWidgets('uses one declared monospace style for editor and terminal', (
    tester,
  ) async {
    final transport = _WorkspaceTransport([
      _WorkspaceSocket(),
      _WorkspaceSocket(),
    ]);

    Widget workspace(RemoteWorkspaceSurface surface) => _app(
      ReconnectingWorkspaceTerminal(
        projectId: 'project-1',
        projectName: 'Projet test',
        transport: transport,
        surface: surface,
        reconnectPolicy: const WorkspaceReconnectPolicy(
          delays: [],
          heartbeatInterval: null,
        ),
      ),
    );

    await tester.pumpWidget(workspace(RemoteWorkspaceSurface.editor));
    await _pumpAsync(tester);
    final editorView = tester.widget<TerminalView>(find.byType(TerminalView));
    final declaredStyle = AppTheme.workspaceTerminalTextStyle(
      tester.element(find.byType(TerminalView)),
    );

    expect(editorView.textStyle.fontFamily, declaredStyle.fontFamily);
    expect(editorView.textStyle.fontFamily, startsWith('RobotoMono'));

    await tester.pumpWidget(workspace(RemoteWorkspaceSurface.terminal));
    await _pumpAsync(tester, frames: 12);
    final terminalView = tester.widget<TerminalView>(find.byType(TerminalView));

    expect(terminalView.textStyle.fontFamily, editorView.textStyle.fontFamily);
    expect(
      terminalView.textStyle.fontFamilyFallback,
      editorView.textStyle.fontFamilyFallback,
    );
  });

  testWidgets(
    'pastes exact bracketed text and recovers after clipboard failure',
    (tester) async {
      var clipboardReads = 0;
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        (call) async {
          if (call.method != 'Clipboard.getData') return null;
          clipboardReads += 1;
          if (clipboardReads == 1) {
            throw PlatformException(code: 'clipboard-unavailable');
          }
          return {'text': 'git status\n'};
        },
      );
      addTearDown(
        () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          SystemChannels.platform,
          null,
        ),
      );
      final socket = _WorkspaceSocket();
      await tester.pumpWidget(
        _app(
          ReconnectingWorkspaceTerminal(
            projectId: 'project-1',
            projectName: 'Projet test',
            transport: _WorkspaceTransport([socket]),
            surface: RemoteWorkspaceSurface.terminal,
            reconnectPolicy: const WorkspaceReconnectPolicy(
              delays: [],
              heartbeatInterval: null,
            ),
          ),
        ),
      );
      await _pumpAsync(tester);

      await tester.tap(find.widgetWithText(TextButton, 'Coller'));
      await tester.pump();
      expect(
        find.text(
          'Impossible de lire le presse-papiers. Vous pouvez réessayer.',
        ),
        findsOneWidget,
      );
      expect(_inputFrames(socket), isEmpty);

      socket.emitFromServer(
        jsonEncode({'type': 'output', 'data': '\x1b[?2004h'}),
      );
      await tester.pump();
      await tester.tap(find.widgetWithText(TextButton, 'Coller'));
      await tester.pump();

      expect(find.text('Texte collé dans le terminal.'), findsOneWidget);
      expect(_inputFrames(socket), ['\x1b[200~git status\n\x1b[201~']);
    },
  );

  testWidgets(
    'reports an empty text clipboard without sending terminal input',
    (tester) async {
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        (call) async =>
            call.method == 'Clipboard.getData' ? {'text': ''} : null,
      );
      addTearDown(
        () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          SystemChannels.platform,
          null,
        ),
      );
      final socket = _WorkspaceSocket();
      await tester.pumpWidget(
        _app(
          ReconnectingWorkspaceTerminal(
            projectId: 'project-1',
            projectName: 'Projet test',
            transport: _WorkspaceTransport([socket]),
            surface: RemoteWorkspaceSurface.terminal,
            reconnectPolicy: const WorkspaceReconnectPolicy(
              delays: [],
              heartbeatInterval: null,
            ),
          ),
        ),
      );
      await _pumpAsync(tester);

      await tester.tap(find.widgetWithText(TextButton, 'Coller'));
      await tester.pump();

      expect(
        find.text('Le presse-papiers ne contient aucun texte.'),
        findsOneWidget,
      );
      expect(_inputFrames(socket), isEmpty);
    },
  );

  testWidgets('keeps recovery available when stale cleanup fails', (
    tester,
  ) async {
    final first = _WorkspaceSocket(closeFailure: true);
    final second = _WorkspaceSocket();
    final transport = _WorkspaceTransport([
      first,
      second,
    ], releaseFailureCount: 1);
    await tester.pumpWidget(
      _app(
        ReconnectingWorkspaceTerminal(
          projectId: 'project-1',
          projectName: 'Projet test',
          transport: transport,
          surface: RemoteWorkspaceSurface.editor,
          reconnectPolicy: const WorkspaceReconnectPolicy(
            delays: [Duration.zero],
            heartbeatInterval: null,
          ),
          delay: (_) async {},
        ),
      ),
    );
    await _pumpAsync(tester);
    await first.endFromServer();
    await _pumpAsync(tester, frames: 12);

    expect(transport.createCount, 2);
    expect(find.text('Neovim connecté'), findsOneWidget);
    expect(
      transport.diagnostics.where((event) => event['code'] == 'cleanup_failed'),
      isNotEmpty,
    );
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
  origin: Uri.parse('https://project.shipglows.com'),
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

class _PreviewTransport
    implements ProjectPreviewTransport, ProjectPreviewDiagnosticsTransport {
  _PreviewTransport(this.results);

  final List<Object> results;
  var openCount = 0;
  final diagnostics = <Map<String, Object>>[];

  @override
  Future<ProjectPreviewSnapshot> openPreview({
    required String projectId,
  }) async {
    final result = results[openCount++];
    if (result is RemoteSurfaceException) throw result;
    return result as ProjectPreviewSnapshot;
  }

  @override
  Future<void> reportPreviewDiagnostic({
    required String projectId,
    required String diagnosticId,
    required String stage,
    required String code,
    required DateTime occurredAt,
  }) async {
    diagnostics.add({
      'projectId': projectId,
      'diagnosticId': diagnosticId,
      'stage': stage,
      'code': code,
      'occurredAt': occurredAt,
    });
  }
}

class _WorkspaceTransport
    implements RemoteWorkspaceTransport, RemoteWorkspaceDiagnosticsTransport {
  _WorkspaceTransport(
    this.sockets, {
    this.createFailure,
    this.releaseFailureCount = 0,
  });

  final List<_WorkspaceSocket> sockets;
  final RemoteSurfaceException? createFailure;
  int releaseFailureCount;
  final releasedSessionIds = <String>[];
  final surfaces = <RemoteWorkspaceSurface>[];
  final diagnostics = <Map<String, Object>>[];
  var createCount = 0;

  @override
  Future<RemoteWorkspaceCapability> createCapability({
    required String projectId,
    required RemoteWorkspaceSurface surface,
    required String idempotencyKey,
  }) async {
    final failure = createFailure;
    if (failure != null) throw failure;
    createCount += 1;
    surfaces.add(surface);
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
    if (releaseFailureCount > 0) {
      releaseFailureCount -= 1;
      throw StateError('fixture cleanup failure');
    }
    releasedSessionIds.add(sessionId);
  }

  @override
  Future<void> reportWorkspaceDiagnostic({
    required String projectId,
    required RemoteWorkspaceSurface surface,
    required String diagnosticId,
    required String stage,
    required String code,
    required DateTime occurredAt,
  }) async {
    diagnostics.add({
      'projectId': projectId,
      'surface': surface,
      'diagnosticId': diagnosticId,
      'stage': stage,
      'code': code,
      'occurredAt': occurredAt,
    });
  }
}

class _WorkspaceSocket implements RemoteWorkspaceSocket {
  _WorkspaceSocket({this.closeFailure = false});

  final _messages = StreamController<Object?>();
  final bool closeFailure;
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
    if (closeFailure) throw StateError('fixture socket close failure');
  }

  Future<void> endFromServer() => _messages.close();
  void emitFromServer(Object? frame) => _messages.add(frame);
}

List<String> _inputFrames(_WorkspaceSocket socket) => socket.sent
    .map((frame) => jsonDecode(frame) as Map<String, dynamic>)
    .where((frame) => frame['type'] == 'input')
    .map((frame) => frame['data'] as String)
    .toList();
