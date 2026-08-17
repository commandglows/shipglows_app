import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
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

class ReconnectingWorkspaceTerminal extends StatefulWidget {
  const ReconnectingWorkspaceTerminal({
    required this.projectId,
    required this.projectName,
    required this.transport,
    this.showAccessoryKeys = false,
    this.reconnectPolicy = const WorkspaceReconnectPolicy(),
    this.delay = defaultWorkspaceDelay,
    super.key,
  });

  final String projectId;
  final String projectName;
  final RemoteWorkspaceTransport? transport;
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
  RemoteWorkspaceSocket? _socket;
  RemoteWorkspaceCapability? _capability;
  StreamSubscription<Object?>? _messages;
  Timer? _heartbeat;
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
        oldWidget.transport != widget.transport) {
      unawaited(_restart());
    }
  }

  Future<void> _restart() async {
    _generation += 1;
    await _releaseCurrent();
    if (!mounted) return;
    _terminal.eraseDisplay();
    await _connect(freshSequence: true);
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
        idempotencyKey:
            'workspace-${widget.projectId}-$generation-${DateTime.now().microsecondsSinceEpoch}',
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
      setState(() {
        _connectionState = WorkspaceConnectionState.connected;
        _statusMessage = 'Workspace connecté';
        _retryable = false;
        _attempt = 0;
      });
    } on RemoteSurfaceException catch (error) {
      if (capability != null) {
        await socket?.close();
        await transport.releaseCapability(sessionId: capability.sessionId);
      }
      if (mounted && generation == _generation) {
        await _recoverOrFail(error);
      }
    } catch (_) {
      if (capability != null) {
        await socket?.close();
        await transport.releaseCapability(sessionId: capability.sessionId);
      }
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
    _generation += 1;
    await _releaseCurrent();
    if (mounted) {
      await _recoverOrFail(
        const RemoteSurfaceException(
          failure: RemoteSurfaceFailure.network,
          message: 'Le flux terminal a été interrompu.',
          retryable: true,
        ),
      );
    }
    _handlingDisconnect = false;
  }

  Future<void> _recoverOrFail(RemoteSurfaceException error) async {
    if (!error.retryable || _attempt >= widget.reconnectPolicy.delays.length) {
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
    final messages = _messages;
    final socket = _socket;
    final capability = _capability;
    _messages = null;
    _socket = null;
    _capability = null;
    await messages?.cancel();
    await socket?.close();
    if (capability != null && widget.transport != null) {
      try {
        await widget.transport!.releaseCapability(
          sessionId: capability.sessionId,
        );
      } catch (_) {
        // Releasing a stale client capability is best effort. tmux is server-owned.
      }
    }
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
      label: 'Terminal du projet ${widget.projectName}',
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
                  const Icon(Icons.terminal_rounded),
                  SizedBox(width: tokens.spacing.sm),
                  Expanded(
                    child: Text(
                      'Terminal',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  if (_retryable)
                    IconButton(
                      tooltip: 'Reconnecter le Workspace',
                      onPressed: () => unawaited(_connect(freshSequence: true)),
                      icon: const Icon(Icons.refresh_rounded),
                    ),
                ],
              ),
            ),
            _WorkspaceStatus(state: _connectionState, message: _statusMessage),
            if (widget.showAccessoryKeys)
              _TerminalAccessoryKeys(onInput: _terminal.textInput),
            Expanded(
              child: TerminalView(
                _terminal,
                autofocus: true,
                deleteDetection: true,
                padding: EdgeInsets.all(tokens.spacing.xs),
              ),
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
