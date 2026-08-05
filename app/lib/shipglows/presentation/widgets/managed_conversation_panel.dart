import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/managed_conversation_provider.dart';

class ManagedConversationPanel extends ConsumerStatefulWidget {
  const ManagedConversationPanel({required this.projectId, super.key});

  final String? projectId;

  @override
  ConsumerState<ManagedConversationPanel> createState() =>
      _ManagedConversationPanelState();
}

class _ManagedConversationPanelState
    extends ConsumerState<ManagedConversationPanel> {
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final projectId = widget.projectId;
    if (projectId == null || projectId.trim().isEmpty) {
      return const _UnresolvedManagedProjectPanel();
    }
    final workspace = ref.watch(
      managedConversationWorkspaceProvider(projectId),
    );
    final notifier = ref.read(
      managedConversationWorkspaceProvider(projectId).notifier,
    );
    final state = notifier.activeState;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final unavailable = state.phase == ManagedConversationPhase.unavailable;
    final busy =
        state.phase == ManagedConversationPhase.creating ||
        state.phase == ManagedConversationPhase.sending ||
        state.phase == ManagedConversationPhase.streaming;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Managed agent',
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                _PhaseChip(phase: state.phase),
              ],
            ),
            const SizedBox(height: 14),
            _ConversationTabs(
              workspace: workspace,
              onAdd: notifier.addTab,
              onSelect: notifier.selectTab,
            ),
            const SizedBox(height: 6),
            Text(
              unavailable
                  ? 'Configure MANAGED_RUNNER_BASE_URL pour activer les conversations distantes.'
                  : 'Conversation sécurisée via le runner ShipGlows.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: scheme.onSurfaceVariant,
              ),
            ),
            if (state.errorMessage != null) ...[
              const SizedBox(height: 10),
              Text(state.errorMessage!, style: TextStyle(color: scheme.error)),
            ],
            if (!unavailable && state.conversationId == null) ...[
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: busy ? null : notifier.createConversation,
                icon: const Icon(Icons.forum_outlined),
                label: const Text('Ouvrir une conversation'),
              ),
            ],
            if (state.events.isNotEmpty) ...[
              const SizedBox(height: 14),
              SizedBox(
                height: 260,
                child: ListView.separated(
                  itemCount: state.events.length,
                  separatorBuilder: (_, _) => const Divider(height: 16),
                  itemBuilder: (context, index) {
                    final event = state.events[index];
                    return _EventTile(
                      eventType: event.type,
                      payload: event.payload,
                    );
                  },
                ),
              ),
            ],
            if (state.pendingApprovalId != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: scheme.secondary.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: scheme.secondary),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.lock_outline),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text('Cette action attend votre approbation.'),
                    ),
                    TextButton(
                      onPressed: () => notifier.resolveApproval(false),
                      child: const Text('Refuser'),
                    ),
                    FilledButton(
                      onPressed: () => notifier.resolveApproval(true),
                      child: const Text('Autoriser'),
                    ),
                  ],
                ),
              ),
            ],
            if (!unavailable && state.conversationId != null) ...[
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      enabled: !busy,
                      minLines: 1,
                      maxLines: 4,
                      onSubmitted: (_) => _send(notifier),
                      decoration: const InputDecoration(
                        hintText: 'Demander à l’agent…',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: busy ? null : () => _send(notifier),
                    icon: const Icon(Icons.send_outlined),
                    tooltip: 'Envoyer',
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  if (busy)
                    OutlinedButton.icon(
                      onPressed: notifier.interrupt,
                      icon: const Icon(Icons.stop),
                      label: const Text('Interrompre'),
                    ),
                  if (state.phase == ManagedConversationPhase.interrupted ||
                      state.phase == ManagedConversationPhase.failed)
                    OutlinedButton.icon(
                      onPressed: notifier.resume,
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Reprendre'),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _send(ManagedConversationWorkspaceNotifier notifier) {
    final text = _messageController.text;
    _messageController.clear();
    notifier.sendMessage(text);
  }
}

class _UnresolvedManagedProjectPanel extends StatelessWidget {
  const _UnresolvedManagedProjectPanel();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.link_off_outlined, color: scheme.onSurfaceVariant),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Agent managé indisponible : ce projet local n’est pas encore relié à un projectId runner opaque.',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConversationTabs extends StatelessWidget {
  const _ConversationTabs({
    required this.workspace,
    required this.onAdd,
    required this.onSelect,
  });

  final ManagedConversationWorkspaceState workspace;
  final VoidCallback onAdd;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (var index = 0; index < workspace.tabs.length; index++)
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(workspace.tabs[index].title),
                    selected: index == workspace.activeIndex,
                    onSelected: (_) => onSelect(index),
                  ),
                ),
            ],
          ),
        ),
      ),
      IconButton(
        tooltip: 'Nouvelle conversation',
        onPressed: onAdd,
        icon: const Icon(Icons.add),
      ),
    ],
  );
}

class _PhaseChip extends StatelessWidget {
  const _PhaseChip({required this.phase});

  final ManagedConversationPhase phase;

  @override
  Widget build(BuildContext context) => Chip(
    label: Text(switch (phase) {
      ManagedConversationPhase.unavailable => 'désactivé',
      ManagedConversationPhase.idle => 'prêt',
      ManagedConversationPhase.creating => 'ouverture…',
      ManagedConversationPhase.ready => 'prêt',
      ManagedConversationPhase.sending => 'envoi…',
      ManagedConversationPhase.streaming => 'en cours',
      ManagedConversationPhase.waitingApproval => 'approbation',
      ManagedConversationPhase.interrupted => 'interrompu',
      ManagedConversationPhase.completed => 'terminé',
      ManagedConversationPhase.failed => 'erreur',
    }),
  );
}

class _EventTile extends StatelessWidget {
  const _EventTile({required this.eventType, required this.payload});

  final String eventType;
  final Map<String, dynamic> payload;

  @override
  Widget build(BuildContext context) {
    final body = payload['text'] ?? payload['message'] ?? payload['summary'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(eventType, style: Theme.of(context).textTheme.labelMedium),
        if (body != null) ...[const SizedBox(height: 3), Text(body.toString())],
      ],
    );
  }
}
