import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:xterm/xterm.dart';

import '../../../../presentation/theme/app_theme.dart';
import '../../../personal_cloud/personal_cloud_models.dart';
import '../../../personal_cloud/personal_cloud_transports.dart';

enum WorkspaceConnectionState {
  connecting,
  connected,
  reconnecting,
  activeElsewhere,
  denied,
  unsupported,
  failed,
}

class WorkspaceReconnectPolicy {
  const WorkspaceReconnectPolicy({
    this.delays = const [
      Duration(milliseconds: 250),
      Duration(seconds: 1),
      Duration(seconds: 2),
    ],
    this.heartbeatInterval = const Duration(seconds: 15),
  });

  final List<Duration> delays;
  final Duration? heartbeatInterval;
}

typedef WorkspaceDelay = Future<void> Function(Duration duration);

Future<void> defaultWorkspaceDelay(Duration duration) =>
    Future<void>.delayed(duration);

@visibleForTesting
bool shouldUseWorkspaceDeleteDetection({
  required bool isWeb,
  required TargetPlatform platform,
}) =>
    !isWeb &&
    (platform == TargetPlatform.android || platform == TargetPlatform.iOS);

class ReconnectingWorkspaceTerminal extends StatefulWidget {
  const ReconnectingWorkspaceTerminal({
    required this.projectId,
    required this.projectName,
    required this.transport,
    required this.surface,
    this.showAccessoryKeys = false,
    this.reconnectPolicy = const WorkspaceReconnectPolicy(),
    this.delay = defaultWorkspaceDelay,
    super.key,
  });

  final String projectId;
  final String projectName;
  final RemoteWorkspaceTransport? transport;
  final RemoteWorkspaceSurface surface;
  final bool showAccessoryKeys;
  final WorkspaceReconnectPolicy reconnectPolicy;
  final WorkspaceDelay delay;

  @override
  State<ReconnectingWorkspaceTerminal> createState() =>
      _ReconnectingWorkspaceTerminalState();
}

class _ReconnectingWorkspaceTerminalState
    extends State<ReconnectingWorkspaceTerminal> {
  static const _terminalScrollbackLines = 5000;

  late final Terminal _terminal;
  late final Future<void> _workspaceTerminalFontReady;
  late final String _diagnosticId;
  RemoteWorkspaceSocket? _socket;
  RemoteWorkspaceCapability? _capability;
  StreamSubscription<Object?>? _messages;
  Timer? _heartbeat;
  Timer? _stabilityTimer;
  WorkspaceConnectionState _connectionState =
      WorkspaceConnectionState.connecting;
  String _statusMessage = 'Ouverture du Workspace protégé…';
  bool _retryable = false;
  int _attempt = 0;
  int _generation = 0;
  bool _handlingDisconnect = false;

  @override
  void initState() {
    super.initState();
    _diagnosticId =
        'wd_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}';
    _workspaceTerminalFontReady = AppTheme.loadWorkspaceTerminalFont();
    _terminal = Terminal(
      maxLines: _terminalScrollbackLines,
      onOutput: (data) => _send({'type': 'input', 'data': data}),
      onResize: (columns, rows, _, _) =>
          _send({'type': 'resize', 'columns': columns, 'rows': rows}),
    );
    unawaited(_connect(freshSequence: true));
  }

  @override
  void didUpdateWidget(covariant ReconnectingWorkspaceTerminal oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.projectId != widget.projectId ||
        oldWidget.transport != widget.transport ||
        oldWidget.surface != widget.surface) {
      unawaited(_restart());
    }
  }

  Future<void> _restart() async {
    try {
      _generation += 1;
      await _releaseCurrent();
      if (!mounted) return;
      _terminal.eraseDisplay();
      await _connect(freshSequence: true);
    } catch (_, stackTrace) {
      FlutterError.reportError(
        FlutterErrorDetails(
          exception: StateError(
            'Workspace surface change failed ($_diagnosticId).',
          ),
          stack: stackTrace,
          library: 'ShipGlows Workspace',
          context: ErrorDescription('while changing Workspace surface'),
        ),
      );
      _showFailure(
        const RemoteSurfaceException(
          failure: RemoteSurfaceFailure.protocol,
          message: 'Impossible de changer d’espace de travail.',
          retryable: true,
        ),
      );
    }
  }

  Future<void> _connect({required bool freshSequence}) async {
    final generation = ++_generation;
    final transport = widget.transport;
    if (freshSequence) _attempt = 0;
    if (transport == null) {
      _showFailure(
        const RemoteSurfaceException(
          failure: RemoteSurfaceFailure.unsupported,
          message: 'Le Workspace distant n’est pas relié à cette application.',
          retryable: false,
        ),
      );
      return;
    }
    setState(() {
      _connectionState = _attempt == 0
          ? WorkspaceConnectionState.connecting
          : WorkspaceConnectionState.reconnecting;
      _statusMessage = _attempt == 0
          ? 'Ouverture du Workspace protégé…'
          : 'Reconnexion au même environnement tmux…';
      _retryable = false;
    });
    RemoteWorkspaceCapability? capability;
    RemoteWorkspaceSocket? socket;
    try {
      capability = await transport.createCapability(
        projectId: widget.projectId,
        surface: widget.surface,
        idempotencyKey:
            'workspace-${widget.surface.name}-${widget.projectId}-$generation-${DateTime.now().microsecondsSinceEpoch}',
      );
      if (!mounted || generation != _generation) {
        await transport.releaseCapability(sessionId: capability.sessionId);
        return;
      }
      socket = transport.connect(capability);
      await socket.ready;
      if (!mounted || generation != _generation) {
        await socket.close();
        await transport.releaseCapability(sessionId: capability.sessionId);
        return;
      }
      _capability = capability;
      _socket = socket;
      _messages = socket.messages.listen(
        _receive,
        onError: (_) {
          _messages = null;
          unawaited(_handleDisconnect(generation));
        },
        onDone: () {
          // Do not await cancellation of the subscription from inside its own
          // completion callback; some stream implementations would deadlock.
          _messages = null;
          unawaited(_handleDisconnect(generation));
        },
        cancelOnError: true,
      );
      _startHeartbeat();
      _stabilityTimer?.cancel();
      _stabilityTimer = Timer(const Duration(seconds: 30), () {
        if (mounted && generation == _generation) _attempt = 0;
      });
      setState(() {
        _connectionState = WorkspaceConnectionState.connected;
        _statusMessage = widget.surface == RemoteWorkspaceSurface.editor
            ? 'Neovim connecté'
            : 'Terminal connecté';
        _retryable = false;
      });
    } on RemoteSurfaceException catch (error) {
      await _closeTransient(socket, capability, transport);
      unawaited(_reportDiagnostic(stage: 'capability', code: 'connect_failed'));
      if (mounted && generation == _generation) {
        await _recoverOrFail(error);
      }
    } catch (_, stackTrace) {
      await _closeTransient(socket, capability, transport);
      unawaited(_reportDiagnostic(stage: 'capability', code: 'connect_failed'));
      FlutterError.reportError(
        FlutterErrorDetails(
          exception: StateError(
            'Workspace connection failed ($_diagnosticId).',
          ),
          stack: stackTrace,
          library: 'ShipGlows Workspace',
          context: ErrorDescription('while opening a Workspace connection'),
        ),
      );
      if (mounted && generation == _generation) {
        await _recoverOrFail(
          const RemoteSurfaceException(
            failure: RemoteSurfaceFailure.network,
            message: 'La connexion au Workspace a été interrompue.',
            retryable: true,
          ),
        );
      }
    }
  }

  Future<void> _handleDisconnect(int generation) async {
    if (!mounted || generation != _generation || _handlingDisconnect) return;
    _handlingDisconnect = true;
    try {
      _generation += 1;
      unawaited(_reportDiagnostic(stage: 'stream', code: 'stream_closed'));
      await _releaseCurrent();
      if (mounted) {
        await _recoverOrFail(
          const RemoteSurfaceException(
            failure: RemoteSurfaceFailure.network,
            message: 'Le flux Workspace a été interrompu.',
            retryable: true,
          ),
        );
      }
    } finally {
      _handlingDisconnect = false;
    }
  }

  Future<void> _recoverOrFail(RemoteSurfaceException error) async {
    if (!error.retryable || _attempt >= widget.reconnectPolicy.delays.length) {
      unawaited(_reportDiagnostic(stage: 'recovery', code: 'retry_exhausted'));
      _showFailure(error);
      return;
    }
    final delay = widget.reconnectPolicy.delays[_attempt];
    _attempt += 1;
    setState(() {
      _connectionState = WorkspaceConnectionState.reconnecting;
      _statusMessage = 'Reconnexion au même environnement tmux…';
    });
    await widget.delay(delay);
    if (mounted) await _connect(freshSequence: false);
  }

  void _showFailure(RemoteSurfaceException error) {
    if (!mounted) return;
    setState(() {
      _connectionState = switch (error.failure) {
        RemoteSurfaceFailure.activeElsewhere =>
          WorkspaceConnectionState.activeElsewhere,
        RemoteSurfaceFailure.denied ||
        RemoteSurfaceFailure.unauthorized => WorkspaceConnectionState.denied,
        RemoteSurfaceFailure.unsupported =>
          WorkspaceConnectionState.unsupported,
        _ => WorkspaceConnectionState.failed,
      };
      _statusMessage = error.message;
      _retryable = error.retryable;
    });
  }

  void _receive(Object? raw) {
    try {
      final decoded = jsonDecode(raw.toString());
      if (decoded is! Map) return;
      if (decoded['type'] == 'output' && decoded['data'] is String) {
        _terminal.write(decoded['data'] as String);
      }
      if (decoded['type'] == 'status' && decoded['state'] == 'closed') {
        unawaited(_handleDisconnect(_generation));
      }
    } catch (_) {
      // Unknown or malformed frames are ignored and never rendered.
    }
  }

  void _send(Map<String, Object> frame) {
    if (_connectionState != WorkspaceConnectionState.connected) return;
    _socket?.send(jsonEncode(frame));
  }

  void _startHeartbeat() {
    _heartbeat?.cancel();
    final interval = widget.reconnectPolicy.heartbeatInterval;
    if (interval == null) return;
    _heartbeat = Timer.periodic(interval, (_) => _send({'type': 'heartbeat'}));
  }

  Future<void> _releaseCurrent() async {
    _heartbeat?.cancel();
    _heartbeat = null;
    _stabilityTimer?.cancel();
    _stabilityTimer = null;
    final messages = _messages;
    final socket = _socket;
    final capability = _capability;
    _messages = null;
    _socket = null;
    _capability = null;
    if (messages != null) {
      unawaited(
        messages.cancel().catchError((_) {
          unawaited(
            _reportDiagnostic(stage: 'recovery', code: 'cleanup_failed'),
          );
        }),
      );
    }
    await Future.wait([
      if (socket != null) _closeSocket(socket),
      if (capability != null && widget.transport != null)
        _releaseCapability(widget.transport!, capability.sessionId),
    ]);
  }

  Future<void> _closeSocket(RemoteWorkspaceSocket socket) async {
    try {
      await socket.close();
    } catch (_) {
      unawaited(_reportDiagnostic(stage: 'recovery', code: 'cleanup_failed'));
    }
  }

  Future<void> _releaseCapability(
    RemoteWorkspaceTransport transport,
    String sessionId,
  ) async {
    try {
      await transport.releaseCapability(sessionId: sessionId);
    } catch (_) {
      unawaited(_reportDiagnostic(stage: 'recovery', code: 'cleanup_failed'));
    }
  }

  Future<void> _closeTransient(
    RemoteWorkspaceSocket? socket,
    RemoteWorkspaceCapability? capability,
    RemoteWorkspaceTransport transport,
  ) async {
    try {
      await socket?.close();
    } catch (_) {
      unawaited(_reportDiagnostic(stage: 'recovery', code: 'cleanup_failed'));
    }
    if (capability == null) return;
    try {
      await transport.releaseCapability(sessionId: capability.sessionId);
    } catch (_) {
      unawaited(_reportDiagnostic(stage: 'recovery', code: 'cleanup_failed'));
    }
  }

  Future<void> _reportDiagnostic({
    required String stage,
    required String code,
  }) async {
    final transport = widget.transport;
    if (transport is! RemoteWorkspaceDiagnosticsTransport) return;
    final diagnostics = transport as RemoteWorkspaceDiagnosticsTransport;
    try {
      await diagnostics.reportWorkspaceDiagnostic(
        projectId: widget.projectId,
        surface: widget.surface,
        diagnosticId: _diagnosticId,
        stage: stage,
        code: code,
        occurredAt: DateTime.now().toUtc(),
      );
    } catch (_) {
      // Diagnostics must never block Workspace recovery.
    }
  }

  Future<void> _retry() async {
    _generation += 1;
    await _releaseCurrent();
    if (mounted) await _connect(freshSequence: true);
  }

  void _reportProblem() {
    unawaited(_reportDiagnostic(stage: 'recovery', code: 'reported'));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Diagnostic $_diagnosticId enregistré.')),
    );
  }

  Future<void> _pasteClipboard() async {
    const emptyMessage = 'Le presse-papiers ne contient aucun texte.';
    const successMessage = 'Texte collé dans le terminal.';
    const failureMessage =
        'Impossible de lire le presse-papiers. Vous pouvez réessayer.';
    try {
      final text = (await Clipboard.getData(Clipboard.kTextPlain))?.text;
      if (!mounted) return;
      if (text == null || text.isEmpty) {
        _showClipboardFeedback(emptyMessage);
        return;
      }
      _terminal.paste(text);
      _showClipboardFeedback(successMessage);
    } catch (_) {
      if (mounted) _showClipboardFeedback(failureMessage);
    }
  }

  void _showClipboardFeedback(String message) {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    _generation += 1;
    unawaited(_releaseCurrent());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Semantics(
      container: true,
      label: widget.surface == RemoteWorkspaceSurface.editor
          ? 'Éditeur Neovim du projet ${widget.projectName}'
          : 'Terminal du projet ${widget.projectName}',
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: tokens.spacing.md,
                vertical: tokens.spacing.sm,
              ),
              child: Row(
                children: [
                  Icon(
                    widget.surface == RemoteWorkspaceSurface.editor
                        ? Icons.code_rounded
                        : Icons.terminal_rounded,
                  ),
                  SizedBox(width: tokens.spacing.sm),
                  Expanded(
                    child: Text(
                      widget.surface == RemoteWorkspaceSurface.editor
                          ? 'Éditeur Neovim'
                          : 'Terminal',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  TextButton.icon(
                    onPressed:
                        _connectionState == WorkspaceConnectionState.connected
                        ? () => unawaited(_pasteClipboard())
                        : null,
                    icon: const Icon(Icons.content_paste_rounded),
                    label: const Text('Coller'),
                  ),
                ],
              ),
            ),
            _WorkspaceStatus(state: _connectionState, message: _statusMessage),
            if (widget.showAccessoryKeys)
              _TerminalAccessoryKeys(onInput: _terminal.textInput),
            Expanded(
              child:
                  _connectionState == WorkspaceConnectionState.connected ||
                      _connectionState == WorkspaceConnectionState.connecting ||
                      _connectionState == WorkspaceConnectionState.reconnecting
                  ? FutureBuilder<void>(
                      future: _workspaceTerminalFontReady,
                      builder: (context, _) => TerminalView(
                        _terminal,
                        autofocus: true,
                        deleteDetection: shouldUseWorkspaceDeleteDetection(
                          isWeb: kIsWeb,
                          platform: defaultTargetPlatform,
                        ),
                        padding: EdgeInsets.all(tokens.spacing.xs),
                        textStyle: TerminalStyle.fromTextStyle(
                          AppTheme.workspaceTerminalTextStyle(context),
                        ),
                      ),
                    )
                  : _WorkspaceRecoveryPanel(
                      state: _connectionState,
                      diagnosticId: _diagnosticId,
                      retryable: _retryable,
                      onRetry: () => unawaited(_retry()),
                      onReport: _reportProblem,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkspaceRecoveryPanel extends StatelessWidget {
  const _WorkspaceRecoveryPanel({
    required this.state,
    required this.diagnosticId,
    required this.retryable,
    required this.onRetry,
    required this.onReport,
  });

  final WorkspaceConnectionState state;
  final String diagnosticId;
  final bool retryable;
  final VoidCallback onRetry;
  final VoidCallback onReport;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final icon = switch (state) {
      WorkspaceConnectionState.activeElsewhere =>
        Icons.desktop_access_disabled_outlined,
      WorkspaceConnectionState.denied => Icons.lock_outline,
      WorkspaceConnectionState.unsupported => Icons.system_update_alt_rounded,
      _ => Icons.sync_problem_outlined,
    };
    final title = switch (state) {
      WorkspaceConnectionState.activeElsewhere =>
        'Workspace déjà actif ailleurs',
      WorkspaceConnectionState.denied => 'Accès au Workspace refusé',
      WorkspaceConnectionState.unsupported => 'Mise à jour du runner requise',
      _ => 'Workspace à reconnecter',
    };
    return Center(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon),
            SizedBox(height: tokens.spacing.sm),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: tokens.spacing.xs),
            const Text(
              'L’environnement tmux reste conservé sur le serveur.',
              textAlign: TextAlign.center,
            ),
            SizedBox(height: tokens.spacing.md),
            Wrap(
              spacing: tokens.spacing.sm,
              runSpacing: tokens.spacing.sm,
              alignment: WrapAlignment.center,
              children: [
                if (retryable)
                  FilledButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Reconnecter'),
                  ),
                OutlinedButton.icon(
                  onPressed: onReport,
                  icon: const Icon(Icons.bug_report_outlined),
                  label: const Text('Signaler'),
                ),
              ],
            ),
            SizedBox(height: tokens.spacing.sm),
            SelectableText(
              'Diagnostic $diagnosticId',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkspaceStatus extends StatelessWidget {
  const _WorkspaceStatus({required this.state, required this.message});

  final WorkspaceConnectionState state;
  final String message;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final (icon, color) = switch (state) {
      WorkspaceConnectionState.connected => (
        Icons.check_circle_outline,
        tokens.health.healthy,
      ),
      WorkspaceConnectionState.connecting ||
      WorkspaceConnectionState.reconnecting => (
        Icons.sync_rounded,
        tokens.execution.running,
      ),
      WorkspaceConnectionState.activeElsewhere => (
        Icons.desktop_access_disabled_outlined,
        tokens.health.warning,
      ),
      WorkspaceConnectionState.denied => (
        Icons.lock_outline,
        tokens.health.critical,
      ),
      WorkspaceConnectionState.unsupported => (
        Icons.devices_other_outlined,
        tokens.health.unknown,
      ),
      WorkspaceConnectionState.failed => (
        Icons.sync_problem_outlined,
        tokens.health.critical,
      ),
    };
    return Semantics(
      liveRegion: true,
      label: message,
      child: Container(
        color: color.withValues(alpha: 0.12),
        padding: EdgeInsets.symmetric(
          horizontal: tokens.spacing.md,
          vertical: tokens.spacing.xs,
        ),
        child: Row(
          children: [
            Icon(icon, color: color),
            SizedBox(width: tokens.spacing.xs),
            Expanded(child: Text(message)),
          ],
        ),
      ),
    );
  }
}

class _TerminalAccessoryKeys extends StatelessWidget {
  const _TerminalAccessoryKeys({required this.onInput});

  final ValueChanged<String> onInput;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    const keys = <(String, String)>[
      ('Esc', '\x1b'),
      ('Ctrl+C', '\x03'),
      ('Tab', '\t'),
      ('←', '\x1b[D'),
      ('↓', '\x1b[B'),
      ('↑', '\x1b[A'),
      ('→', '\x1b[C'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: EdgeInsets.symmetric(horizontal: tokens.spacing.xs),
      child: Row(
        children: [
          for (final key in keys)
            Padding(
              padding: EdgeInsets.only(right: tokens.spacing.xs),
              child: SizedBox(
                height: tokens.minimumTarget,
                child: OutlinedButton(
                  onPressed: () => onInput(key.$2),
                  child: Text(key.$1),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
