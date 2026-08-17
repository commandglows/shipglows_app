import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../presentation/theme/app_theme.dart';
import '../../../data/activity_review_models.dart';
import '../../../data/cockpit/cockpit_models.dart';
import '../../../providers/managed_activity_review_provider.dart';

class ActivityReviewPanel extends ConsumerWidget {
  const ActivityReviewPanel({
    required this.projectId,
    required this.accessState,
    required this.onOpenConversations,
    super.key,
  });

  final String projectId;
  final ProjectAccessState accessState;
  final VoidCallback onOpenConversations;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final request = ManagedActivityReviewRequest(
      projectId: projectId,
      accessState: accessState,
    );
    final summary = ref.watch(managedActivityReviewProvider(request));
    final tokens = AppTheme.tokensOf(context);
    return Semantics(
      container: true,
      label: 'Activité récente et éléments à revoir',
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(tokens.spacing.md),
          child: summary.when(
            loading: () => const _LoadingSummary(),
            error: (_, _) => _UnavailableSummary(
              onRetry: () =>
                  ref.invalidate(managedActivityReviewProvider(request)),
            ),
            data: (state) => _Summary(
              state: state,
              onRetry: () =>
                  ref.invalidate(managedActivityReviewProvider(request)),
              onOpenConversations: onOpenConversations,
            ),
          ),
        ),
      ),
    );
  }
}

class _LoadingSummary extends StatelessWidget {
  const _LoadingSummary();

  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    label: 'Chargement de l’activité récente',
    child: const Center(child: CircularProgressIndicator()),
  );
}

class _UnavailableSummary extends StatelessWidget {
  const _UnavailableSummary({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Activité et revue', style: Theme.of(context).textTheme.titleMedium),
      SizedBox(height: AppTheme.tokensOf(context).spacing.xs),
      const Text(
        'Le résumé opérationnel est indisponible. Aucun état sain n’est supposé.',
      ),
      SizedBox(height: AppTheme.tokensOf(context).spacing.sm),
      FilledButton.tonalIcon(
        onPressed: onRetry,
        icon: const Icon(Icons.refresh_rounded),
        label: const Text('Réessayer'),
      ),
    ],
  );
}

class _Summary extends StatelessWidget {
  const _Summary({
    required this.state,
    required this.onRetry,
    required this.onOpenConversations,
  });

  final ManagedActivityReviewState state;
  final VoidCallback onRetry;
  final VoidCallback onOpenConversations;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final projection = state.projection;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: tokens.spacing.sm,
          runSpacing: tokens.spacing.xs,
          children: [
            Text(
              'Activité et revue',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            _StatusChip(status: state.status),
          ],
        ),
        SizedBox(height: tokens.spacing.xs),
        Text(state.message),
        if (projection != null) ...[
          SizedBox(height: tokens.spacing.md),
          Text('À revoir', style: Theme.of(context).textTheme.titleSmall),
          SizedBox(height: tokens.spacing.xs),
          if (projection.review.isEmpty)
            const Text('Aucune approbation vérifiable en attente.')
          else
            for (final item in projection.review.take(3))
              _ReviewRow(item: item),
          SizedBox(height: tokens.spacing.md),
          Text(
            'Activité récente',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          SizedBox(height: tokens.spacing.xs),
          if (projection.activity.isEmpty)
            const Text('Aucune activité normalisée disponible.')
          else
            for (final item in projection.activity.take(5))
              _ActivityRow(item: item),
          SizedBox(height: tokens.spacing.md),
          const Text(
            'La revue Studio globale n’est pas projetée sans session vérifiable.',
          ),
          SizedBox(height: tokens.spacing.sm),
          FilledButton.tonalIcon(
            onPressed: onOpenConversations,
            icon: const Icon(Icons.forum_outlined),
            label: const Text('Ouvrir Conversations'),
          ),
        ] else ...[
          SizedBox(height: tokens.spacing.sm),
          if (state.status == ManagedActivityReviewLoadStatus.degraded)
            FilledButton.tonalIcon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Réessayer'),
            ),
        ],
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final ManagedActivityReviewLoadStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, icon) = switch (status) {
      ManagedActivityReviewLoadStatus.ready => (
        'Vérifié',
        Icons.verified_outlined,
      ),
      ManagedActivityReviewLoadStatus.degraded => (
        'Partiel',
        Icons.warning_amber_outlined,
      ),
      ManagedActivityReviewLoadStatus.accessLost => (
        'Accès perdu',
        Icons.gpp_bad_outlined,
      ),
    };
    return Semantics(
      label: 'État du résumé : $label',
      child: Chip(avatar: Icon(icon), label: Text(label)),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow({required this.item});

  final ManagedReviewItem item;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    leading: const Icon(Icons.approval_outlined),
    title: Text(item.label),
    subtitle: Text('${item.conversationTitle} · ${_time(item.occurredAt)}'),
  );
}

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({required this.item});

  final ManagedActivityItem item;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: EdgeInsets.zero,
    leading: Icon(_activityIcon(item.kind)),
    title: Text(item.label),
    subtitle: Text('${item.conversationTitle} · ${_time(item.occurredAt)}'),
  );
}

IconData _activityIcon(ManagedActivityKind kind) => switch (kind) {
  ManagedActivityKind.approval => Icons.approval_outlined,
  ManagedActivityKind.change => Icons.edit_note_outlined,
  ManagedActivityKind.diagnostic => Icons.warning_amber_outlined,
  ManagedActivityKind.evidence => Icons.fact_check_outlined,
  ManagedActivityKind.run => Icons.play_circle_outline,
};

String _time(DateTime value) {
  final utc = value.toUtc();
  return '${utc.hour.toString().padLeft(2, '0')}:'
      '${utc.minute.toString().padLeft(2, '0')} UTC';
}
