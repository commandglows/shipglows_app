import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../providers/managed_conversation_provider.dart';
import 'conversations/conversation_tabs.dart';
import 'conversations/conversation_timeline.dart';

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
    final provider = managedConversationWorkspaceProvider(projectId);
    final workspace = ref.watch(provider);
    final notifier = ref.read(provider.notifier);
    final state = notifier.activeState;
    final theme = Theme.of(context);
    final tokens = AppTheme.tokensOf(context);
    final unavailable = state.phase == ManagedConversationPhase.unavailable;
    final busy = switch (state.phase) {
      ManagedConversationPhase.creating ||
      ManagedConversationPhase.sending ||
      ManagedConversationPhase.streaming => true,
      _ => false,
    };

    return Card(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Agent managé',
                    style: theme.textTheme.titleMedium,
                  ),
                ),
                _PhaseChip(phase: state.phase),
              ],
            ),
            SizedBox(height: tokens.spacing.sm),
            ConversationTabs(
              workspace: workspace,
              onSelect: notifier.selectTab,
              onClose: (index) => unawaited(notifier.closeTab(index)),
            ),
            SizedBox(height: tokens.spacing.xs),
            Text(
              unavailable
                  ? 'Configurez le runner pour activer les conversations distantes.'
                  : 'Conversation sémantique sécurisée via le runner ShipGlows.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (state.errorMessage != null) ...[
              SizedBox(height: tokens.spacing.sm),
              Semantics(
                liveRegion: true,
                label: state.errorMessage,
                child: Text(
                  state.errorMessage!,
                  style: TextStyle(color: theme.colorScheme.error),
                ),
              ),
            ],
            if (!unavailable && state.conversationId == null) ...[
              SizedBox(height: tokens.spacing.md),
              FilledButton.icon(
                onPressed: busy ? null : notifier.createConversation,
                icon: const Icon(Icons.forum_outlined),
                label: const Text('Ouvrir une conversation'),
              ),
            ],
            if (!unavailable && notifier.supportsManagedTasks) ...[
              SizedBox(height: tokens.spacing.md),
              Wrap(
                spacing: tokens.spacing.xs,
                runSpacing: tokens.spacing.xs,
                children: [
                  OutlinedButton.icon(
                    onPressed: busy ? null : notifier.runAudit,
                    icon: const Icon(Icons.fact_check_outlined),
                    label: const Text('Lancer un audit'),
                  ),
                  OutlinedButton.icon(
                    onPressed: busy
                        ? null
                        : () => _showFixProposal(context, notifier),
                    icon: const Icon(Icons.build_outlined),
                    label: const Text('Proposer un correctif'),
                  ),
                ],
              ),
            ],
            if (state.timeline.isNotEmpty) ...[
              SizedBox(height: tokens.spacing.sm),
              SizedBox(
                height: tokens.conversation.panelMinHeight,
                child: ConversationTimeline(items: state.timeline),
              ),
            ],
            if (state.pendingApprovalId != null) ...[
              SizedBox(height: tokens.spacing.sm),
              _ApprovalCard(
                onDeny: () => notifier.resolveApproval(false),
                onApprove: () => notifier.resolveApproval(true),
              ),
            ],
            if (!unavailable && state.conversationId != null) ...[
              SizedBox(height: tokens.spacing.sm),
              TextField(
                controller: _messageController,
                enabled: !busy && !state.authRequired,
                minLines: 1,
                maxLines: null,
                onSubmitted: (_) => _send(notifier),
                decoration: InputDecoration(
                  hintText: 'Demander à l’agent…',
                  suffixIcon: IconButton(
                    onPressed: busy || state.authRequired
                        ? null
                        : () => _send(notifier),
                    icon: const Icon(Icons.send_outlined),
                    tooltip: 'Envoyer',
                  ),
                ),
              ),
              SizedBox(height: tokens.spacing.xs),
              Wrap(
                spacing: tokens.spacing.xs,
                runSpacing: tokens.spacing.xs,
                children: [
                  if (busy)
                    OutlinedButton.icon(
                      onPressed: notifier.interrupt,
                      icon: const Icon(Icons.stop),
                      label: const Text('Interrompre'),
                    ),
                  if (!state.authRequired &&
                      state.phase == ManagedConversationPhase.interrupted)
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

  Future<void> _showFixProposal(
    BuildContext context,
    ManagedConversationWorkspaceNotifier notifier,
  ) => showDialog<void>(
    context: context,
    builder: (context) => _FixProposalDialog(
      onSubmit: ({required issueId, required instruction}) =>
          notifier.runFix(issueId: issueId, instruction: instruction),
    ),
  );
}

typedef _FixProposalSubmit =
    Future<void> Function({
      required String issueId,
      required String instruction,
    });

class _FixProposalDialog extends StatefulWidget {
  const _FixProposalDialog({required this.onSubmit});

  final _FixProposalSubmit onSubmit;

  @override
  State<_FixProposalDialog> createState() => _FixProposalDialogState();
}

class _FixProposalDialogState extends State<_FixProposalDialog> {
  final _formKey = GlobalKey<FormState>();
  final _issueController = TextEditingController();
  final _instructionController = TextEditingController();

  @override
  void dispose() {
    _issueController.dispose();
    _instructionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Semantics(
      label: 'Formulaire de proposition de correctif',
      explicitChildNodes: true,
      child: AlertDialog(
        title: const Text('Proposer un correctif'),
        contentPadding: EdgeInsets.all(tokens.spacing.lg),
        actionsPadding: EdgeInsets.all(tokens.spacing.md),
        content: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Semantics(
                label: 'Identifiant du problème',
                textField: true,
                child: TextFormField(
                  controller: _issueController,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'Identifiant du problème',
                  ),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Identifiant requis'
                      : null,
                ),
              ),
              SizedBox(height: tokens.spacing.md),
              Semantics(
                label: 'Instruction du correctif',
                textField: true,
                child: TextFormField(
                  controller: _instructionController,
                  decoration: const InputDecoration(
                    labelText: 'Instruction du correctif',
                  ),
                  minLines: 1,
                  maxLines: null,
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Instruction requise'
                      : null,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Annuler'),
          ),
          FilledButton(onPressed: _submit, child: const Text('Proposer')),
        ],
      ),
    );
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final issueId = _issueController.text.trim();
    final instruction = _instructionController.text.trim();
    Navigator.of(context).pop();
    widget.onSubmit(issueId: issueId, instruction: instruction);
  }
}

class _ApprovalCard extends StatelessWidget {
  const _ApprovalCard({required this.onDeny, required this.onApprove});

  final VoidCallback onDeny;
  final VoidCallback onApprove;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final palette = AppTheme.paletteOf(context);
    return Semantics(
      liveRegion: true,
      label: 'Une action attend votre approbation',
      child: Container(
        padding: EdgeInsets.all(tokens.spacing.md),
        decoration: BoxDecoration(
          color: palette.mutedSurface,
          borderRadius: BorderRadius.circular(tokens.radii.card),
          border: Border.all(color: tokens.execution.awaitingApproval),
        ),
        child: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: tokens.spacing.sm,
          runSpacing: tokens.spacing.xs,
          children: [
            const Icon(Icons.lock_outline),
            const Text('Cette action attend votre approbation.'),
            TextButton(onPressed: onDeny, child: const Text('Refuser')),
            FilledButton(onPressed: onApprove, child: const Text('Autoriser')),
          ],
        ),
      ),
    );
  }
}

class _UnresolvedManagedProjectPanel extends StatelessWidget {
  const _UnresolvedManagedProjectPanel();

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.link_off_outlined, color: scheme.onSurfaceVariant),
            SizedBox(width: tokens.spacing.sm),
            const Expanded(
              child: Text(
                'Agent managé indisponible : ce projet local n’est pas encore relié au runner.',
              ),
            ),
          ],
        ),
      ),
    );
  }
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
