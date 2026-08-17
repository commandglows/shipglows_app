import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../data/cockpit/cockpit_models.dart';
import '../../data/managed_runner_api.dart';
import '../../providers/managed_cockpit_provider.dart';
import '../../providers/managed_project_selection_provider.dart';
import '../../providers/managed_projects_provider.dart';
import 'managed_project_selector.dart';

class ManagedProjectsSettingsPanel extends ConsumerWidget {
  const ManagedProjectsSettingsPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cockpit = ref.watch(managedCockpitSnapshotProvider);
    final tokens = AppTheme.tokensOf(context);
    final registry = ref.watch(managedProjectsProvider);
    final selection = ref.watch(managedProjectSelectionProvider);
    final registeredProjects = switch (registry) {
      AsyncData(:final value) => value,
      _ => const <ManagedProjectRecord>[],
    };
    return Card(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Projets', style: Theme.of(context).textTheme.titleLarge),
            SizedBox(height: tokens.spacing.xs),
            Text(
              'Choisissez le projet utilisé par le Cockpit, le Studio et le Workspace.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            SizedBox(height: tokens.spacing.md),
            _SelectionModeControls(selection: selection),
            SizedBox(height: tokens.spacing.md),
            cockpit.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, _) => _Status(
                message: 'Les projets sont temporairement indisponibles.',
                onRetry: () => ref.invalidate(managedCockpitSnapshotProvider),
              ),
              data: (state) =>
                  _body(context, ref, state, selection, registeredProjects),
            ),
            SizedBox(height: tokens.spacing.sm),
            Tooltip(
              message: 'Ouvrir la gestion complète des projets.',
              child: OutlinedButton.icon(
                onPressed: () => context.go('/projects'),
                icon: const Icon(Icons.folder_copy_outlined),
                label: const Text('Gérer les projets'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _body(
    BuildContext context,
    WidgetRef ref,
    ManagedCockpitState state,
    ManagedProjectSelection selection,
    List<ManagedProjectRecord> registeredProjects,
  ) {
    final tokens = AppTheme.tokensOf(context);
    final projects = state.snapshot?.projects ?? const <CockpitProject>[];
    if (state.status != ManagedCockpitStatus.active || projects.isEmpty) {
      return _Status(
        message: switch (state.status) {
          ManagedCockpitStatus.empty => 'Aucun projet connecté.',
          ManagedCockpitStatus.sessionExpired =>
            'La session a expiré. Reconnectez-vous puis réessayez.',
          ManagedCockpitStatus.localOnly =>
            'Le runner géré n’est pas configuré.',
          _ => 'Les projets sont temporairement indisponibles.',
        },
        onRetry: () => ref.invalidate(managedCockpitSnapshotProvider),
      );
    }

    final effectiveProjectId = resolveManagedProjectId(
      selection: selection,
      availableProjectIds: registeredProjects
          .where((project) => !project.isArchived)
          .map((project) => project.id),
      defaultProjectId: _defaultProjectId(registeredProjects),
    );

    return Column(
      children: [
        for (final project in projects) ...[
          _ProjectTile(
            project: project,
            selected: project.id == effectiveProjectId,
            automatic: selection.isAutomatic,
            onSelect: () async {
              await ref
                  .read(managedProjectSelectionProvider.notifier)
                  .select(project.id);
            },
            onOpen: () => context.go(managedProjectLocation(project)),
            onStudio:
                _registeredProject(
                      registeredProjects,
                      project.id,
                    )?.capabilities.studio ==
                    true
                ? () => context.go(
                    managedProjectSurfaceLocation(project, 'studio'),
                  )
                : null,
            onWorkspace:
                _registeredProject(
                      registeredProjects,
                      project.id,
                    )?.capabilities.workspace ==
                    true
                ? () => context.go(
                    managedProjectSurfaceLocation(project, 'workspace'),
                  )
                : null,
          ),
          if (project != projects.last) SizedBox(height: tokens.spacing.sm),
        ],
      ],
    );
  }

  String? _defaultProjectId(List<ManagedProjectRecord> projects) {
    for (final project in projects) {
      if (project.isDefault && !project.isArchived) return project.id;
    }
    return null;
  }

  ManagedProjectRecord? _registeredProject(
    List<ManagedProjectRecord> projects,
    String id,
  ) {
    for (final project in projects) {
      if (project.id == id) return project;
    }
    return null;
  }
}

class _SelectionModeControls extends ConsumerWidget {
  const _SelectionModeControls({required this.selection});

  final ManagedProjectSelection selection;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = AppTheme.tokensOf(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Mode de sélection',
          style: Theme.of(context).textTheme.titleSmall,
        ),
        SizedBox(height: tokens.spacing.xs),
        Wrap(
          spacing: tokens.spacing.xs,
          runSpacing: tokens.spacing.xs,
          children: [
            FilterChip(
              key: const ValueKey('managed-project-selection-auto'),
              avatar: const Icon(Icons.auto_awesome_outlined),
              label: const Text('Sélection automatique'),
              selected: selection.isAutomatic,
              onSelected: (_) => ref
                  .read(managedProjectSelectionProvider.notifier)
                  .useAutomaticSelection(),
            ),
            FilterChip(
              key: const ValueKey('managed-project-selection-none'),
              avatar: const Icon(Icons.folder_off_outlined),
              label: const Text('Aucun projet'),
              selected: selection.hasNoProject,
              onSelected: (_) => ref
                  .read(managedProjectSelectionProvider.notifier)
                  .selectNone(),
            ),
          ],
        ),
        SizedBox(height: tokens.spacing.xs),
        Text(
          selection.hasNoProject
              ? 'Cockpit, Studio et Workspace restent sans projet actif.'
              : selection.isAutomatic
              ? 'Le projet par défaut disponible est utilisé automatiquement.'
              : 'Le projet choisi reste actif jusqu’à un nouveau choix.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _ProjectTile extends StatelessWidget {
  const _ProjectTile({
    required this.project,
    required this.selected,
    required this.automatic,
    required this.onSelect,
    required this.onOpen,
    required this.onStudio,
    required this.onWorkspace,
  });

  final CockpitProject project;
  final bool selected;
  final bool automatic;
  final VoidCallback onSelect;
  final VoidCallback onOpen;
  final VoidCallback? onStudio;
  final VoidCallback? onWorkspace;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final tokens = AppTheme.tokensOf(context);
    return Semantics(
      container: true,
      label:
          '${project.name}, ${selected ? 'projet actif' : 'projet disponible'}',
      child: Container(
        padding: EdgeInsets.all(tokens.spacing.sm),
        decoration: BoxDecoration(
          color: selected
              ? colors.primaryContainer.withValues(alpha: 0.35)
              : colors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(tokens.radii.card),
          border: Border.all(
            color: selected ? colors.primary : colors.outlineVariant,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  selected
                      ? Icons.folder_special_rounded
                      : Icons.folder_copy_outlined,
                  color: selected ? colors.primary : colors.onSurfaceVariant,
                ),
                SizedBox(width: tokens.spacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.name,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      Text(
                        project.repositoryFullName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                if (selected)
                  Chip(
                    label: Text(automatic ? 'Actif automatiquement' : 'Actif'),
                  ),
              ],
            ),
            SizedBox(height: tokens.spacing.sm),
            Wrap(
              spacing: tokens.spacing.xs,
              runSpacing: tokens.spacing.xs,
              children: [
                if (!selected)
                  FilledButton.tonal(
                    onPressed: onSelect,
                    child: const Text('Choisir'),
                  ),
                OutlinedButton(onPressed: onOpen, child: const Text('Ouvrir')),
                OutlinedButton(
                  onPressed: onStudio,
                  child: const Text('Studio'),
                ),
                OutlinedButton(
                  onPressed: onWorkspace,
                  child: const Text('Workspace'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Status extends StatelessWidget {
  const _Status({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Row(
      children: [
        const Icon(Icons.info_outline),
        SizedBox(width: tokens.spacing.sm),
        Expanded(child: Text(message)),
        IconButton(
          tooltip: 'Réessayer',
          onPressed: onRetry,
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
    );
  }
}
