import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:xterm/xterm.dart';

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
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.desktop_windows_outlined, size: 32),
              const SizedBox(height: 16),
              Text(
                'Workspace avancé non disponible',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                reason ??
                    'La passerelle opérateur doit être activée sur le serveur avant d’ouvrir une session interactive.',
              ),
              const SizedBox(height: 16),
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
  ConsumerState<_InteractiveWorkspace> createState() => _InteractiveWorkspaceState();
}

class _InteractiveWorkspaceState extends ConsumerState<_InteractiveWorkspace> {
  late final Terminal _terminal;
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
      onResize: (width, height, _, _) => _send({'type': 'resize', 'columns': width, 'rows': height}),
    );
    unawaited(_connect());
  }

  Future<void> _connect() async {
    final transport = ref.read(managedWorkspaceTransportProvider);
    if (transport == null) {
      setState(() { _connecting = false; _error = 'La connexion interactive n’est pas configurée dans cette application.'; });
      return;
    }
    try {
      final session = await transport.createOperatorSession(
        projectId: widget.projectId,
        idempotencyKey: 'workspace-${widget.projectId}-${DateTime.now().microsecondsSinceEpoch}',
      );
      final channel = transport.connectOperatorSession(session);
      await channel.ready;
      if (!mounted) { await channel.sink.close(); return; }
      _session = session;
      _channel = channel;
      _subscription = channel.stream.listen(_receive, onError: (Object error) {
        if (mounted) setState(() => _error = 'La connexion au Workspace a été interrompue.');
      }, onDone: () {
        if (mounted) setState(() => _connecting = false);
      });
      setState(() { _connecting = false; _error = null; });
    } catch (_) {
      if (mounted) setState(() { _connecting = false; _error = 'Impossible d’ouvrir la session opérateur protégée.'; });
    }
  }

  void _receive(dynamic raw) {
    try {
      final decoded = jsonDecode(raw.toString());
      if (decoded is Map && decoded['type'] == 'output' && decoded['data'] is String) _terminal.write(decoded['data'] as String);
      if (decoded is Map && decoded['type'] == 'status' && decoded['state'] == 'closed' && mounted) setState(() => _error = 'La session Workspace est fermée.');
    } catch (_) {
      // Malformed or unknown server frames are ignored and never rendered.
    }
  }

  void _send(Map<String, Object> frame) {
    if (_channel != null) _channel!.sink.add(jsonEncode(frame));
  }

  @override
  void dispose() {
    final session = _session;
    final transport = ref.read(managedWorkspaceTransportProvider);
    unawaited(_subscription?.cancel());
    unawaited(_channel?.sink.close());
    if (session != null && transport != null) unawaited(transport.closeOperatorSession(sessionId: session.sessionId));
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_connecting) return const Center(child: CircularProgressIndicator());
    if (_error != null && _channel == null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Text(_error!), const SizedBox(height: 16), FilledButton.icon(onPressed: () { setState(() { _connecting = true; _error = null; }); unawaited(_connect()); }, icon: const Icon(Icons.refresh), label: const Text('Réessayer'))]));
    }
    return Column(
      children: [
        if (_error != null) MaterialBanner(content: Text(_error!), actions: [TextButton(onPressed: () => Navigator.of(context).maybePop(), child: const Text('Fermer'))]),
        Expanded(child: ColoredBox(color: Colors.black, child: Padding(padding: const EdgeInsets.all(8), child: TerminalView(_terminal, autofocus: true)))),
      ],
    );
  }
}
