import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../domain/studio/studio_contracts.dart';
import '../../../domain/studio/studio_session.dart';
import '../../../presentation/theme/app_theme.dart';
import '../../providers/studio_provider.dart';
import '../widgets/shipglows_scaffold.dart';
import '../widgets/studio/studio_preview_frame.dart';

typedef StudioPreviewBuilder =
    Widget Function(
      StudioPreviewCapability capability,
      ValueChanged<String> onSelected,
      ValueChanged<StudioPreviewHandshake> onHandshakeChanged,
      String? selectedSurfaceId,
      List<VisualCommand> commands,
    );

class StudioScreen extends ConsumerWidget {
  const StudioScreen({
    required this.projectId,
    required this.projectName,
    this.previewBuilder,
    super.key,
  });

  final String projectId;
  final String projectName;
  final StudioPreviewBuilder? previewBuilder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final capability = ref.watch(managedStudioCapabilityProvider(projectId));
    return ShipGlowsScaffold(
      title: 'Studio · $projectName',
      body: capability.when(
        loading: () => const _StudioLoading(),
        error: (error, _) => _StudioFailed(
          onRetry: () =>
              ref.invalidate(managedStudioCapabilityProvider(projectId)),
        ),
        data: (value) => value == null
            ? _StudioUnavailable(
                onRetry: () =>
                    ref.invalidate(managedStudioCapabilityProvider(projectId)),
              )
            : _StudioWorkspace(
                projectId: projectId,
                capability: value,
                previewBuilder: previewBuilder,
              ),
      ),
    );
  }
}

class _StudioLoading extends StatelessWidget {
  const _StudioLoading();

  @override
  Widget build(BuildContext context) => Center(
    child: Semantics(
      liveRegion: true,
      label: 'Chargement du Studio',
      child: const CircularProgressIndicator(),
    ),
  );
}

class _StudioUnavailable extends StatelessWidget {
  const _StudioUnavailable({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => _StudioNotice(
    icon: Icons.visibility_off_outlined,
    title: 'Studio indisponible',
    message:
        'Le runner n’a pas admis le profil Astro exact pour cette révision. '
        'Aucun aperçu ni contrôle de code n’est activé.',
    actionLabel: 'Vérifier à nouveau',
    onAction: onRetry,
  );
}

class _StudioFailed extends StatelessWidget {
  const _StudioFailed({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => _StudioNotice(
    icon: Icons.sync_problem_outlined,
    title: 'Connexion au Studio interrompue',
    message:
        'Le runner n’a pas pu confirmer la capacité Studio. La source reste inchangée.',
    actionLabel: 'Réessayer',
    onAction: onRetry,
  );
}

class _StudioNotice extends StatelessWidget {
  const _StudioNotice({
    required this.icon,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: tokens.conversation.messageMaxWidth,
        ),
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(tokens.spacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon),
                SizedBox(height: tokens.spacing.md),
                Text(title, style: Theme.of(context).textTheme.headlineSmall),
                SizedBox(height: tokens.spacing.xs),
                Text(message),
                SizedBox(height: tokens.spacing.md),
                FilledButton.tonal(
                  onPressed: onAction,
                  child: Text(actionLabel),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StudioWorkspace extends ConsumerWidget {
  const _StudioWorkspace({
    required this.projectId,
    required this.capability,
    this.previewBuilder,
  });

  final String projectId;
  final StudioPreviewCapability capability;
  final StudioPreviewBuilder? previewBuilder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final key = StudioSessionKey(projectId: projectId, capability: capability);
    final state = ref.watch(studioSessionProvider(key));
    final notifier = ref.read(studioSessionProvider(key).notifier);
    final tokens = AppTheme.tokensOf(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < tokens.breakpoints.tablet;
        final preview =
            previewBuilder?.call(
              capability,
              notifier.selectSurface,
              notifier.markHandshake,
              state.selectedSurfaceId,
              state.journal.activeCommands,
            ) ??
            StudioPreviewFrame(
              capability: capability,
              onSurfaceSelected: notifier.selectSurface,
              onHandshakeChanged: notifier.markHandshake,
              selectedSurfaceId: state.selectedSurfaceId,
              commands: state.journal.activeCommands,
              journalRevision: state.runnerSession?.revision ?? 0,
              retryRevision: state.previewRetryRevision,
            );
        final previewPane = _PreviewPane(
          state: state,
          preview: preview,
          onRetry: notifier.retryPreview,
        );
        final inspector = _StudioInspector(
          state: state,
          compact: compact,
          onSelected: notifier.selectSurface,
          onApplyEdit: notifier.applySemanticEdit,
        );

        return Column(
          children: [
            _StudioToolbar(
              state: state,
              compact: compact,
              onUndo: notifier.undo,
              onRedo: notifier.redo,
              onEnterLaboratory: notifier.enterLaboratory,
              onCompile: () => _showCompilePreflight(context, notifier),
            ),
            SizedBox(height: tokens.spacing.sm),
            if (compact)
              Padding(
                padding: EdgeInsets.only(bottom: tokens.spacing.sm),
                child: const _CompactModeNotice(),
              ),
            Expanded(
              child: compact
                  ? Column(
                      children: [
                        Expanded(flex: 3, child: previewPane),
                        Divider(height: tokens.spacing.xxs),
                        Expanded(flex: 2, child: inspector),
                      ],
                    )
                  : Row(
                      children: [
                        SizedBox(
                          width: tokens.studio.surfaceRailWidth,
                          child: _StudioRail(state: state, notifier: notifier),
                        ),
                        VerticalDivider(width: tokens.spacing.xxs),
                        Expanded(child: previewPane),
                        VerticalDivider(width: tokens.spacing.xxs),
                        SizedBox(
                          width: tokens.studio.inspectorWidth,
                          child: inspector,
                        ),
                      ],
                    ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _showCompilePreflight(
    BuildContext context,
    StudioSessionNotifier notifier,
  ) async {
    final intent = notifier.freezeCompileIntent();
    if (intent == null || !context.mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Préflight de compilation'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Cette intention est figée et ne modifie pas encore la source.',
            ),
            SizedBox(height: AppTheme.tokensOf(context).spacing.sm),
            Text('Variante : ${intent.variantId}'),
            Text('Révision : ${intent.baseRevision}'),
            Text('Surfaces : ${intent.affectedSurfaceIds.join(', ')}'),
            Text('Fichiers attendus : ${intent.expectedPaths.join(', ')}'),
            const Text(
              'Preuve requise : worker OCI isolé puis vérification séparée.',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Demander la compilation isolée'),
          ),
        ],
      ),
    );
    if (confirmed == true) await notifier.compile(intent);
  }
}

class _CompactModeNotice extends StatelessWidget {
  const _CompactModeNotice();

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Mode compact en lecture et revue uniquement',
    child: MaterialBanner(
      content: const Text(
        'Mode compact : lecture, sélection et revue uniquement. Les contrôles de précision restent sur ordinateur.',
      ),
      actions: const [SizedBox.shrink()],
    ),
  );
}

class _StudioToolbar extends StatelessWidget {
  const _StudioToolbar({
    required this.state,
    required this.compact,
    required this.onUndo,
    required this.onRedo,
    required this.onEnterLaboratory,
    required this.onCompile,
  });

  final StudioSessionState state;
  final bool compact;
  final VoidCallback onUndo;
  final VoidCallback onRedo;
  final VoidCallback onEnterLaboratory;
  final VoidCallback onCompile;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final laboratory = state.laboratory;
    final status = _laboratoryPresentation(
      tokens,
      laboratory.level,
      state.compile.status,
    );
    final canCompile =
        !compact &&
        state.handshake == StudioPreviewHandshake.ready &&
        laboratory.level == StudioLaboratoryLevel.active &&
        state.journal.activeCommands.isNotEmpty &&
        state.capability.compileAdmission.available &&
        state.sessionReady &&
        !state.synchronizing;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: tokens.spacing.xs,
          runSpacing: tokens.spacing.xs,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _HandshakeChip(handshake: state.handshake),
            Tooltip(
              message: 'Annuler le dernier ajustement de prévisualisation',
              child: IconButton(
                onPressed:
                    !compact &&
                        state.sessionReady &&
                        !state.synchronizing &&
                        state.journal.canUndo
                    ? onUndo
                    : null,
                icon: const Icon(Icons.undo),
              ),
            ),
            Tooltip(
              message: 'Rétablir le dernier ajustement de prévisualisation',
              child: IconButton(
                onPressed:
                    !compact &&
                        state.sessionReady &&
                        !state.synchronizing &&
                        state.journal.canRedo
                    ? onRedo
                    : null,
                icon: const Icon(Icons.redo),
              ),
            ),
            Semantics(
              label: status.label,
              button: laboratory.level != StudioLaboratoryLevel.active,
              child: OutlinedButton.icon(
                onPressed:
                    compact ||
                        !state.sessionReady ||
                        state.synchronizing ||
                        laboratory.level == StudioLaboratoryLevel.active
                    ? null
                    : onEnterLaboratory,
                icon: Icon(status.icon, color: status.color),
                label: Text(status.label),
              ),
            ),
            FilledButton.icon(
              onPressed: canCompile ? onCompile : null,
              icon: const Icon(Icons.code_outlined),
              label: const Text('Compiler en code'),
            ),
          ],
        ),
        SizedBox(height: tokens.spacing.xs),
        Semantics(
          liveRegion: true,
          child: Text(
            canCompile
                ? 'Compilation prête pour un préflight immuable.'
                : state.capability.compileAdmission.message,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}

class _HandshakeChip extends StatelessWidget {
  const _HandshakeChip({required this.handshake});

  final StudioPreviewHandshake handshake;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final (icon, label, color) = switch (handshake) {
      StudioPreviewHandshake.waiting => (
        Icons.sync,
        'Aperçu en connexion',
        tokens.execution.running,
      ),
      StudioPreviewHandshake.ready => (
        Icons.link,
        'Aperçu connecté',
        tokens.health.healthy,
      ),
      StudioPreviewHandshake.failed => (
        Icons.link_off,
        'Aperçu inaccessible',
        tokens.health.critical,
      ),
    };
    return Semantics(
      label: label,
      liveRegion: true,
      child: Chip(
        avatar: Icon(icon, color: color),
        label: Text(label),
      ),
    );
  }
}

class _PreviewPane extends StatelessWidget {
  const _PreviewPane({
    required this.state,
    required this.preview,
    required this.onRetry,
  });

  final StudioSessionState state;
  final Widget preview;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return ConstrainedBox(
      constraints: BoxConstraints(minHeight: tokens.studio.previewMinHeight),
      child: Stack(
        fit: StackFit.expand,
        children: [
          preview,
          if (state.handshake != StudioPreviewHandshake.ready)
            IgnorePointer(
              child: ColoredBox(
                color: Theme.of(
                  context,
                ).colorScheme.surface.withValues(alpha: 0.88),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        state.handshake == StudioPreviewHandshake.failed
                            ? 'L’aperçu réel n’a pas confirmé le handshake.'
                            : 'Connexion à l’aperçu Astro réel…',
                        textAlign: TextAlign.center,
                      ),
                      if (state.handshake == StudioPreviewHandshake.failed) ...[
                        SizedBox(height: tokens.spacing.sm),
                        FilledButton.tonal(
                          onPressed: onRetry,
                          child: const Text('Reconnecter l’aperçu'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StudioRail extends StatelessWidget {
  const _StudioRail({required this.state, required this.notifier});

  final StudioSessionState state;
  final StudioSessionNotifier notifier;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return ListView(
      padding: EdgeInsets.all(tokens.spacing.sm),
      children: [
        Text('Surfaces', style: Theme.of(context).textTheme.titleMedium),
        SizedBox(height: tokens.spacing.xs),
        for (final surface in state.capability.surfaces)
          ListTile(
            dense: true,
            selected: state.selectedSurfaceId == surface.id,
            title: Text(surface.label),
            subtitle: Text(surface.id),
            onTap: () => notifier.selectSurface(surface.id),
          ),
        SizedBox(height: tokens.spacing.md),
        Row(
          children: [
            Expanded(
              child: Text(
                'Variantes',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            IconButton(
              tooltip: 'Créer une variante',
              onPressed:
                  state.sessionReady &&
                      !state.synchronizing &&
                      state.variants.length < StudioLimits.maxVariants
                  ? notifier.createVariant
                  : null,
              icon: const Icon(Icons.add),
            ),
          ],
        ),
        for (final variant in state.variants)
          ListTile(
            dense: true,
            selected: variant.id == state.activeVariantId,
            leading: const Icon(Icons.layers_outlined),
            title: Text(variant.name),
            subtitle: Text(
              '${variant.journal.activeCommands.length} ajustement(s)',
            ),
            onTap: state.sessionReady && !state.synchronizing
                ? () => notifier.selectVariant(variant.id)
                : null,
            trailing:
                state.sessionReady &&
                    !state.synchronizing &&
                    state.variants.length > 1
                ? IconButton(
                    tooltip: 'Supprimer ${variant.name}',
                    onPressed: () => notifier.removeVariant(variant.id),
                    icon: const Icon(Icons.close),
                  )
                : null,
          ),
      ],
    );
  }
}

class _StudioInspector extends StatelessWidget {
  const _StudioInspector({
    required this.state,
    required this.compact,
    required this.onSelected,
    required this.onApplyEdit,
  });

  final StudioSessionState state;
  final bool compact;
  final ValueChanged<String> onSelected;
  final Future<void> Function({
    required StudioCapability capability,
    required Map<String, Object> parameters,
    required Set<StudioDimension> dimensions,
    String? compactionKey,
  })
  onApplyEdit;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final selected = state.selectedSurface;
    final laboratory = state.laboratory;
    final admittedCapabilities =
        selected?.capabilities ?? const <StudioCapability>{};
    return ListView(
      padding: EdgeInsets.all(tokens.spacing.md),
      children: [
        Text('Inspection', style: Theme.of(context).textTheme.titleLarge),
        SizedBox(height: tokens.spacing.xs),
        const Text('Lecture seule par défaut · aucune modification source'),
        SizedBox(height: tokens.spacing.md),
        if (compact)
          for (final surface in state.capability.surfaces)
            ListTile(
              selected: selected?.id == surface.id,
              title: Text(surface.label),
              subtitle: Text(surface.id),
              onTap: () => onSelected(surface.id),
            ),
        if (selected == null)
          const Text(
            'Sélectionnez une surface sémantique dans l’aperçu ou la liste.',
          )
        else ...[
          Text(
            'Surface sélectionnée',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          SizedBox(height: tokens.spacing.xs),
          Text(selected.label),
          Text(selected.id, style: Theme.of(context).textTheme.bodySmall),
          Text(
            'Source : ${selected.sourceSymbol ?? selected.sourceConfidence}',
          ),
          SizedBox(height: tokens.spacing.md),
          FilledButton.tonalIcon(
            onPressed:
                compact ||
                    !state.sessionReady ||
                    state.synchronizing ||
                    admittedCapabilities.isEmpty
                ? null
                : () => _applyPreset(selected),
            icon: const Icon(Icons.tune),
            label: const Text('Ajouter un ajustement sémantique'),
          ),
          if (!compact && selected.capabilities.isEmpty)
            Padding(
              padding: EdgeInsets.only(top: tokens.spacing.xs),
              child: const Text(
                'Le profil actif admet seulement l’inspection ; aucun contrôle visuel n’est envoyé.',
              ),
            ),
        ],
        if (laboratory.reasons.isNotEmpty) ...[
          SizedBox(height: tokens.spacing.lg),
          Text(
            'Raisons du Laboratoire',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          for (final reason in laboratory.reasons)
            ListTile(
              dense: true,
              leading: Icon(
                reason.hard ? Icons.lock_outline : Icons.info_outline,
              ),
              title: Text(reason.message),
              subtitle: Text(
                reason.hard ? 'Raison obligatoire' : 'Signal recommandé',
              ),
            ),
        ],
        SizedBox(height: tokens.spacing.lg),
        Text('Compilation', style: Theme.of(context).textTheme.titleMedium),
        SizedBox(height: tokens.spacing.xs),
        Semantics(liveRegion: true, child: Text(state.compile.message)),
        if (state.safeMessage != null) ...[
          SizedBox(height: tokens.spacing.md),
          Semantics(liveRegion: true, child: Text(state.safeMessage!)),
        ],
      ],
    );
  }

  Future<void> _applyPreset(StudioSurfaceSummary surface) async {
    final admitted = surface.capabilities;
    if (admitted.isEmpty) return;
    final capability = admitted.first;
    final parameters = switch (capability) {
      StudioCapability.tokenSet => <String, Object>{
        'token': 'color.accent',
        'value': 'violet',
      },
      StudioCapability.spacingSet => <String, Object>{
        'property': 'gap',
        'value': 16,
      },
      StudioCapability.radiusSet => <String, Object>{
        'corner': 'all',
        'value': 16,
      },
      StudioCapability.opacitySet => <String, Object>{'value': 0.9},
      StudioCapability.transformSet => <String, Object>{
        'axis': 'translateY',
        'value': 0,
      },
      StudioCapability.visibilitySet => <String, Object>{'visible': true},
      StudioCapability.motionDuration => <String, Object>{'milliseconds': 200},
      StudioCapability.motionEasing => <String, Object>{
        'easing': 'ease-in-out',
      },
      _ => const <String, Object>{},
    };
    if (parameters.isEmpty) return;
    await onApplyEdit(
      capability: capability,
      parameters: parameters,
      dimensions: {
        switch (capability) {
          StudioCapability.layoutReorder => StudioDimension.structure,
          StudioCapability.motionDuration ||
          StudioCapability.motionEasing => StudioDimension.motion,
          StudioCapability.visibilitySet ||
          StudioCapability.stateSet => StudioDimension.function,
          _ => StudioDimension.design,
        },
      },
      compactionKey: '${surface.id}:${studioCapabilityWireName(capability)}',
    );
  }
}

({IconData icon, String label, Color color}) _laboratoryPresentation(
  AppThemeTokens tokens,
  StudioLaboratoryLevel level,
  StudioCompileStatus compile,
) {
  if (compile == StudioCompileStatus.compiling) {
    return (
      icon: Icons.sync,
      label: 'Compilation isolée en vérification',
      color: tokens.studio.compiling,
    );
  }
  if (compile == StudioCompileStatus.verified) {
    return (
      icon: Icons.verified_outlined,
      label: 'Vérifié dans le worktree',
      color: tokens.studio.verified,
    );
  }
  if (compile == StudioCompileStatus.conflict ||
      compile == StudioCompileStatus.failed) {
    return (
      icon: Icons.error_outline,
      label: compile == StudioCompileStatus.conflict
          ? 'Conflit de compilation'
          : 'Échec de compilation',
      color: tokens.studio.conflict,
    );
  }
  return switch (level) {
    StudioLaboratoryLevel.studio => (
      icon: Icons.science_outlined,
      label: 'Studio',
      color: tokens.studio.neutral,
    ),
    StudioLaboratoryLevel.recommended => (
      icon: Icons.science_outlined,
      label: 'Laboratoire recommandé',
      color: tokens.studio.recommended,
    ),
    StudioLaboratoryLevel.active => (
      icon: Icons.science,
      label: 'Laboratoire actif',
      color: tokens.studio.active,
    ),
  };
}
