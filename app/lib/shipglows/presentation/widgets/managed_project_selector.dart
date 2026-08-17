import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../data/cockpit/cockpit_models.dart';
import '../../data/managed_runner_api.dart';
import '../../providers/managed_cockpit_provider.dart';
import '../../providers/managed_project_selection_provider.dart';
import '../../providers/managed_projects_provider.dart';

class ManagedProjectSelector extends ConsumerWidget {
  const ManagedProjectSelector({super.key});

  static const _automaticCommand = '__project_automatic__';
  static const _noneCommand = '__project_none__';
  static const _settingsCommand = '__project_settings__';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cockpit = ref.watch(managedCockpitSnapshotProvider);
    final tokens = AppTheme.tokensOf(context);
    final registry = ref.watch(managedProjectsProvider).value ?? const [];
    final selection = ref.watch(managedProjectSelectionProvider);

    return cockpit.when(
      loading: () => Padding(
        padding: EdgeInsets.symmetric(horizontal: tokens.spacing.sm),
        child: SizedBox.square(
          dimension: tokens.spacing.md,
          child: CircularProgressIndicator(strokeWidth: tokens.focus.width),
        ),
      ),
      error: (_, _) => _UnavailableSelector(
        onRetry: () => ref.invalidate(managedCockpitSnapshotProvider),
      ),
      data: (state) {
        final projects = state.snapshot?.projects ?? const <CockpitProject>[];
        if (state.status != ManagedCockpitStatus.active || projects.isEmpty) {
          return _UnavailableSelector(
            tooltip: _statusLabel(state.status),
            onRetry: () => ref.invalidate(managedCockpitSnapshotProvider),
          );
        }

        final effectiveProjectId = resolveManagedProjectId(
          selection: selection,
          availableProjectIds: registry
              .where((project) => !project.isArchived)
              .map((project) => project.id),
          defaultProjectId: _defaultProjectId(registry),
        );
        CockpitProject? selected;
        for (final project in projects) {
          if (project.id == effectiveProjectId) selected = project;
        }

        return PopupMenuButton<String>(
          key: const ValueKey('managed-project-selector'),
          tooltip: 'Changer de projet',
          onSelected: (value) async {
            if (value == _automaticCommand) {
              await ref
                  .read(managedProjectSelectionProvider.notifier)
                  .useAutomaticSelection();
              return;
            }
            if (value == _noneCommand) {
              await ref
                  .read(managedProjectSelectionProvider.notifier)
                  .selectNone();
              return;
            }
            if (value == _settingsCommand) {
              context.go('/projects');
              return;
            }
            final project = projects.where((item) => item.id == value).first;
            await ref
                .read(managedProjectSelectionProvider.notifier)
                .select(project.id);
            if (context.mounted) context.go(managedProjectLocation(project));
          },
          itemBuilder: (context) => [
            PopupMenuItem<String>(
              key: const ValueKey('managed-project-selection-auto'),
              value: _automaticCommand,
              child: ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.auto_awesome_outlined),
                title: const Text('Sélection automatique'),
                subtitle: const Text('Utiliser le projet par défaut'),
                trailing: selection.isAutomatic
                    ? Icon(Icons.check_rounded, size: tokens.spacing.md)
                    : null,
              ),
            ),
            PopupMenuItem<String>(
              key: const ValueKey('managed-project-selection-none'),
              value: _noneCommand,
              child: ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.folder_off_outlined),
                title: const Text('Aucun projet'),
                subtitle: const Text('Ne pas activer de projet'),
                trailing: selection.hasNoProject
                    ? Icon(Icons.check_rounded, size: tokens.spacing.md)
                    : null,
              ),
            ),
            const PopupMenuDivider(),
            for (final project in projects)
              PopupMenuItem<String>(
                value: project.id,
                child: ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(
                    project.accessState == ProjectAccessState.available
                        ? Icons.folder_copy_rounded
                        : Icons.folder_off_outlined,
                  ),
                  title: Text(project.name),
                  subtitle: Text(
                    project.repositoryFullName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing:
                      selection.hasSelectedProject &&
                          selection.projectId == project.id
                      ? Icon(Icons.check_rounded, size: tokens.spacing.md)
                      : null,
                ),
              ),
            const PopupMenuDivider(),
            const PopupMenuItem<String>(
              value: _settingsCommand,
              child: ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: Icon(Icons.settings_outlined),
                title: Text('Gérer les projets'),
              ),
            ),
          ],
          child: Semantics(
            button: true,
            label: switch (selection.mode) {
              ManagedProjectSelectionMode.automatic =>
                'Sélection automatique${selected == null ? '' : ' : ${selected.name}'}',
              ManagedProjectSelectionMode.none => 'Aucun projet actif',
              ManagedProjectSelectionMode.selected =>
                selected == null
                    ? 'Choisir un projet'
                    : 'Projet actif : ${selected.name}',
            },
            child: Padding(
              padding: EdgeInsets.all(tokens.spacing.xs),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.folder_copy_rounded),
                  SizedBox(width: tokens.spacing.xs),
                  Flexible(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: tokens.studio.surfaceRailWidth,
                      ),
                      child: Text(
                        switch (selection.mode) {
                          ManagedProjectSelectionMode.automatic =>
                            'Sélection automatique',
                          ManagedProjectSelectionMode.none => 'Aucun projet',
                          ManagedProjectSelectionMode.selected =>
                            selected?.name ?? 'Choisir un projet',
                        },
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down_rounded),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  static String _statusLabel(ManagedCockpitStatus status) => switch (status) {
    ManagedCockpitStatus.empty => 'Aucun projet connecté',
    ManagedCockpitStatus.sessionExpired => 'Session expirée',
    ManagedCockpitStatus.localOnly => 'Runner non configuré',
    ManagedCockpitStatus.failure => 'Projets indisponibles',
    ManagedCockpitStatus.active => 'Choisir un projet',
  };
}

String? _defaultProjectId(List<ManagedProjectRecord> projects) {
  for (final project in projects) {
    if (project.isDefault && !project.isArchived) return project.id;
  }
  return null;
}

class _UnavailableSelector extends StatelessWidget {
  const _UnavailableSelector({
    required this.onRetry,
    this.tooltip = 'Projets indisponibles',
  });

  final VoidCallback onRetry;
  final String tooltip;

  @override
  Widget build(BuildContext context) => IconButton(
    tooltip: '$tooltip · réessayer',
    onPressed: onRetry,
    icon: const Icon(Icons.folder_off_outlined),
  );
}

String managedProjectLocation(CockpitProject project) =>
    '/project/${Uri.encodeComponent(project.name)}'
    '?runnerProjectId=${Uri.encodeComponent(project.id)}';

String managedProjectSurfaceLocation(CockpitProject project, String surface) =>
    '/project/${Uri.encodeComponent(project.name)}/$surface'
    '?runnerProjectId=${Uri.encodeComponent(project.id)}';
