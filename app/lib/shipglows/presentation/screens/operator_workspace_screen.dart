import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:xterm/xterm.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../data/managed_runner_api.dart';
import '../../providers/managed_workspace_provider.dart';
import '../widgets/shipglows_scaffold.dart';

class OperatorWorkspaceScreen extends ConsumerWidget {
  const OperatorWorkspaceScreen({
    required this.projectId,
    required this.projectName,
    super.key,
  });

  final String projectId;
  final String projectName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final capability = ref.watch(managedWorkspaceCapabilityProvider(projectId));
    return ShipGlowsScaffold(
      title: 'Workspace opérateur · $projectName',
      body: capability.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const _WorkspaceUnavailableCard(),
        data: (value) => value == null || !value.available
            ? _WorkspaceUnavailableCard(reason: value?.reason)
            : _InteractiveWorkspace(projectId: projectId),
      ),
    );
  }
}

class _WorkspaceUnavailableCard extends StatelessWidget {
  const _WorkspaceUnavailableCard({this.reason});

  final String? reason;

  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 640),
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(AppTheme.tokensOf(context).spacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.desktop_windows_outlined, size: 32),
              SizedBox(height: AppTheme.tokensOf(context).spacing.md),
              Text(
                'Workspace avancé non disponible',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              SizedBox(height: AppTheme.tokensOf(context).spacing.sm),
              Text(
                reason ??
                    'La passerelle opérateur doit être activée sur le serveur avant d’ouvrir une session interactive.',
              ),
              SizedBox(height: AppTheme.tokensOf(context).spacing.md),
              const Text(
                'Le Cockpit et les conversations Codex restent disponibles. Cette surface séparée ne recevra jamais de clé SSH ni de chemin serveur.',
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _InteractiveWorkspace extends ConsumerStatefulWidget {
  const _InteractiveWorkspace({required this.projectId});
  final String projectId;

  @override
  ConsumerState<_InteractiveWorkspace> createState() =>
      _InteractiveWorkspaceState();
}

class _InteractiveWorkspaceState extends ConsumerState<_InteractiveWorkspace> {
  late final Terminal _terminal;
  late final TerminalController _terminalController;
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  ManagedOperatorSession? _session;
  String? _error;
  bool _connecting = true;

  @override
  void initState() {
    super.initState();
    _terminal = Terminal(
      maxLines: 5000,
      onOutput: (data) => _send({'type': 'input', 'data': data}),
      onResize: (width, height, _, _) =>
          _send({'type': 'resize', 'columns': width, 'rows': height}),
    );
    _terminalController = TerminalController();
    unawaited(_connect());
  }

  Future<void> _connect() async {
    final transport = ref.read(managedWorkspaceTransportProvider);
    if (transport == null) {
      setState(() {
        _connecting = false;
        _error =
            'La connexion interactive n’est pas configurée dans cette application.';
      });
      return;
    }
    try {
      final session = await transport.createOperatorSession(
        projectId: widget.projectId,
        surface: ManagedWorkspaceSurface.terminal,
        idempotencyKey:
            'workspace-${widget.projectId}-${DateTime.now().microsecondsSinceEpoch}',
      );
      final channel = transport.connectOperatorSession(session);
      await channel.ready;
      if (!mounted) {
        await channel.sink.close();
        return;
      }
      _session = session;
      _channel = channel;
      _subscription = channel.stream.listen(
        _receive,
        onError: (Object error) {
          if (mounted) {
            setState(
              () => _error = 'La connexion au Workspace a été interrompue.',
            );
          }
        },
        onDone: () {
          if (mounted) {
            setState(() => _connecting = false);
          }
        },
      );
      setState(() {
        _connecting = false;
        _error = null;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _connecting = false;
          _error = 'Impossible d’ouvrir la session opérateur protégée.';
        });
      }
    }
  }

  void _receive(dynamic raw) {
    try {
      final decoded = jsonDecode(raw.toString());
      if (decoded is Map &&
          decoded['type'] == 'output' &&
          decoded['data'] is String) {
        _terminal.write(decoded['data'] as String);
      }
      if (decoded is Map &&
          decoded['type'] == 'status' &&
          decoded['state'] == 'closed' &&
          mounted) {
        setState(() => _error = 'La session Workspace est fermée.');
      }
    } catch (_) {
      // Malformed or unknown server frames are ignored and never rendered.
    }
  }

  void _send(Map<String, Object> frame) {
    if (_channel != null) _channel!.sink.add(jsonEncode(frame));
  }

  Future<void> _copyTerminalSelection() async {
    final selection = _terminalController.selection;
    if (selection == null) return;
    final text = _terminal.buffer.getText(selection);
    if (text.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sélection du terminal copiée.')),
    );
  }

  @override
  void dispose() {
    final session = _session;
    final transport = ref.read(managedWorkspaceTransportProvider);
    unawaited(_subscription?.cancel());
    unawaited(_channel?.sink.close());
    if (session != null && transport != null) {
      unawaited(transport.closeOperatorSession(sessionId: session.sessionId));
    }
    _terminalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    if (_connecting) return const Center(child: CircularProgressIndicator());
    if (_error != null && _channel == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            SizedBox(height: tokens.spacing.md),
            FilledButton.icon(
              onPressed: () {
                setState(() {
                  _connecting = true;
                  _error = null;
                });
                unawaited(_connect());
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }
    return Column(
      children: [
        if (_error != null)
          MaterialBanner(
            content: Text(_error!),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).maybePop(),
                child: const Text('Fermer'),
              ),
            ],
          ),
        ListenableBuilder(
          listenable: _terminalController,
          builder: (context, _) => Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: _terminalController.selection == null
                  ? null
                  : () => unawaited(_copyTerminalSelection()),
              icon: const Icon(Icons.content_copy_rounded),
              label: const Text('Copier la sélection'),
            ),
          ),
        ),
        Expanded(
          child: ColoredBox(
            color: Theme.of(context).colorScheme.surface,
            child: Padding(
              padding: EdgeInsets.all(tokens.spacing.sm),
              child: TerminalView(
                _terminal,
                controller: _terminalController,
                autofocus: true,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
