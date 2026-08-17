import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../providers/managed_project_context_provider.dart';

class ProjectContextPanel extends ConsumerStatefulWidget {
  const ProjectContextPanel({required this.projectId, super.key});

  final String projectId;

  @override
  ConsumerState<ProjectContextPanel> createState() =>
      _ProjectContextPanelState();
}

class _ProjectContextPanelState extends ConsumerState<ProjectContextPanel> {
  bool _refreshing = false;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(managedProjectContextProvider(widget.projectId));
    final tokens = AppTheme.tokensOf(context);
    return Card(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.md),
        child: state.when(
          loading: () => const _Loading(),
          error: (_, _) => _Unavailable(onRetry: _retry),
          data: (value) => _Content(
            state: value,
            onRetry: _retry,
            onRefresh: _refresh,
            refreshing: _refreshing,
          ),
        ),
      ),
    );
  }

  void _retry() {
    ref.invalidate(managedProjectContextProvider(widget.projectId));
  }

  Future<void> _refresh() async {
    final client = ref.read(managedProjectContextClientProvider);
    if (client == null || _refreshing) return;
    setState(() => _refreshing = true);
    try {
      await client.refreshProjectContext(
        projectId: widget.projectId,
        idempotencyKey:
            'context:${widget.projectId}:${DateTime.now().microsecondsSinceEpoch}',
      );
      if (mounted) {
        ref.invalidate(managedProjectContextProvider(widget.projectId));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible d’actualiser le contexte.')),
        );
      }
    } finally {
      if (mounted) setState(() => _refreshing = false);
    }
  }
}

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Chargement du contexte du projet',
    child: const Center(child: CircularProgressIndicator()),
  );
}

class _Content extends StatelessWidget {
  const _Content({
    required this.state,
    required this.onRetry,
    this.onRefresh,
    this.refreshing = false,
  });

  final ManagedProjectContextState state;
  final VoidCallback onRetry;
  final VoidCallback? onRefresh;
  final bool refreshing;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final projection = state.projection;
    final (label, icon) = switch (state.status) {
      ManagedProjectContextLoadStatus.ready => (
        'Vérifié',
        Icons.verified_outlined,
      ),
      ManagedProjectContextLoadStatus.stale => (
        'À actualiser',
        Icons.history_outlined,
      ),
      ManagedProjectContextLoadStatus.missing => ('Absent', Icons.info_outline),
      ManagedProjectContextLoadStatus.accessLost => (
        'Accès perdu',
        Icons.gpp_bad_outlined,
      ),
      ManagedProjectContextLoadStatus.unavailable => (
        'Indisponible',
        Icons.warning_amber_outlined,
      ),
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: tokens.spacing.sm,
          runSpacing: tokens.spacing.xs,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(
              'Contexte du projet',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Chip(avatar: Icon(icon), label: Text(label)),
          ],
        ),
        SizedBox(height: tokens.spacing.xs),
        Text(_message(state.status)),
        if (projection != null &&
            state.status != ManagedProjectContextLoadStatus.missing) ...[
          SizedBox(height: tokens.spacing.md),
          Wrap(
            spacing: tokens.spacing.md,
            runSpacing: tokens.spacing.sm,
            children: [
              _Fact(
                label: 'Commit',
                value: _shortCommit(projection.sourceCommit),
              ),
              _Fact(
                label: 'Observé',
                value: projection.observedAt == null
                    ? 'Inconnu'
                    : DateFormat(
                        'yyyy-MM-dd',
                      ).format(projection.observedAt!.toLocal()),
              ),
              _Fact(
                label: 'Sources dépôt',
                value: '${projection.repositorySnapshotCount}',
              ),
              _Fact(
                label: 'Artefacts ShipGlows',
                value: '${projection.shipglowsArtifactCount}',
              ),
              _Fact(
                label: 'Champs expurgés',
                value: '${projection.redactionCount}',
              ),
            ],
          ),
        ],
        if (state.status == ManagedProjectContextLoadStatus.unavailable) ...[
          SizedBox(height: tokens.spacing.sm),
          FilledButton.tonalIcon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Réessayer'),
          ),
        ] else if (state.status !=
            ManagedProjectContextLoadStatus.accessLost) ...[
          SizedBox(height: tokens.spacing.sm),
          FilledButton.tonalIcon(
            onPressed: refreshing ? null : onRefresh,
            icon: refreshing
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh_rounded),
            label: Text(
              refreshing ? 'Actualisation…' : 'Actualiser le contexte',
            ),
          ),
        ],
      ],
    );
  }
}

class _Unavailable extends StatelessWidget {
  const _Unavailable({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => _Content(
    state: const ManagedProjectContextState(
      ManagedProjectContextLoadStatus.unavailable,
    ),
    onRetry: onRetry,
  );
}

class _Fact extends StatelessWidget {
  const _Fact({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Semantics(
    label: '$label : $value',
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        Text(value, style: Theme.of(context).textTheme.bodyMedium),
      ],
    ),
  );
}

String _message(ManagedProjectContextLoadStatus status) => switch (status) {
  ManagedProjectContextLoadStatus.ready =>
    'La provenance du contexte est vérifiée et rattachée à ce projet.',
  ManagedProjectContextLoadStatus.stale =>
    'Le dernier contexte vérifié date de plus de 30 jours.',
  ManagedProjectContextLoadStatus.missing =>
    'Aucun contexte vérifié n’a encore été produit pour ce projet.',
  ManagedProjectContextLoadStatus.accessLost =>
    'L’accès au projet est perdu. Aucun contexte privé n’est affiché.',
  ManagedProjectContextLoadStatus.unavailable =>
    'Le contexte du projet est temporairement indisponible.',
};

String _shortCommit(String? value) {
  if (value == null || value.isEmpty) return 'Inconnu';
  return value.length <= 12 ? value : value.substring(0, 12);
}
