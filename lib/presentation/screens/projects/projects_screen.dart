import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/models/project.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import '../../widgets/offline_sync_status_chip.dart';
import '../../widgets/project_picker_action.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsState = ref.watch(projectsStateProvider);
    final activeProject = ref.watch(activeProjectProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Projects')),
        actions: [
          const ProjectPickerAction(),
          IconButton(
            tooltip: context.tr('Refresh'),
            onPressed: () => ref.invalidate(projectsStateProvider),
            icon: const Icon(Icons.refresh_rounded),
          ),
          IconButton(
            tooltip: context.tr('Create project'),
            onPressed: () =>
                context.push('/onboarding?mode=create&intent=project-manage'),
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
      body: projectsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => AppErrorView(
          scope: 'projects.screen',
          title: 'Project management unavailable',
          message: error.toString(),
          onRetry: () => ref.invalidate(projectsStateProvider),
        ),
        data: (state) {
          final availableProjects = state.items
              .where((project) => !project.isDeleted)
              .toList();
          final activeProjects = availableProjects
              .where((project) => !project.isArchived)
              .toList();
          final archivedProjects = availableProjects
              .where((project) => project.isArchived)
              .toList();
          if (availableProjects.isEmpty) {
            return _EmptyProjectsState(isDegraded: state.isDegraded);
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (state.isDegraded) ...[
                _NoticeCard(
                  message:
                      state.message ??
                      context.tr('Project management unavailable'),
                  tone: AppTheme.warningColor,
                ),
                const SizedBox(height: 16),
              ],
              Text(
                context.tr('Active project'),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              _ActiveProjectSummary(project: activeProject),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      context.tr('Projects'),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: () => context.push(
                      '/onboarding?mode=create&intent=project-manage',
                    ),
                    icon: const Icon(Icons.add_rounded),
                    label: Text(context.tr('Create project')),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...activeProjects.map(
                (project) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ProjectCard(
                    project: project,
                    isActive: activeProject?.id == project.id,
                    onSwitch: activeProject?.id == project.id
                        ? null
                        : () => _setActiveProject(context, ref, project),
                  ),
                ),
              ),
              if (archivedProjects.isNotEmpty) ...[
                const SizedBox(height: 20),
                Text(
                  context.tr('Archived projects'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 12),
                ...archivedProjects.map(
                  (project) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _ProjectCard(
                      project: project,
                      isActive: false,
                      onSwitch: null,
                      archivedView: true,
                    ),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  Future<void> _setActiveProject(
    BuildContext context,
    WidgetRef ref,
    Project project,
  ) async {
    try {
      await ref
          .read(activeProjectControllerProvider.notifier)
          .setActiveProject(project.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('Active project updated.'))),
        );
      }
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showDiagnosticSnackBar(
        context,
        ref,
        message: 'Could not switch project: $error',
        scope: 'projects.switch',
        error: error,
        stackTrace: stackTrace,
        contextData: {'projectId': project.id},
      );
    }
  }
}

class _ActiveProjectSummary extends StatelessWidget {
  const _ActiveProjectSummary({required this.project});

  final Project? project;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colorScheme.outlineVariant),
      ),
      child: Row(
        children: [
          Icon(Icons.folder_copy_rounded, color: colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              project?.name ?? context.tr('No project selected'),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProjectCard extends ConsumerWidget {
  const _ProjectCard({
    required this.project,
    required this.isActive,
    required this.onSwitch,
    this.archivedView = false,
  });

  final Project project;
  final bool isActive;
  final VoidCallback? onSwitch;
  final bool archivedView;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mutationState = ref.watch(projectMutationControllerProvider);
    final isDemoMode = ref.watch(authSessionProvider).isDemo;
    final syncInfo = ref.watch(
      offlineEntitySyncProvider(offlineEntityKey('project', project.id)),
    );
    final isBusy = mutationState.isLoading;
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive ? colorScheme.primary : colorScheme.outlineVariant,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  project.name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: colorScheme.onSurface,
                  ),
                ),
              ),
              if (syncInfo != null) ...[
                OfflineSyncStatusChip(info: syncInfo, compact: true),
                const SizedBox(width: 8),
              ],
              if (isActive)
                Chip(label: Text(context.tr('Active project')))
              else if (project.isArchived || archivedView)
                Chip(label: Text(context.tr('Archived')))
              else if (project.isDefault)
                Chip(label: Text(context.tr('Default'))),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            project.url.isNotEmpty ? project.url : context.tr('No source linked'),
            style: TextStyle(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (project.settings?.techStack != null)
                Chip(label: Text(project.settings!.techStack!.framework.name)),
              Chip(
                label: Text(
                  project.settings?.onboardingStatus.name ??
                      OnboardingStatus.pending.name,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (archivedView && !isDemoMode)
                OutlinedButton(
                  onPressed: isBusy ? null : () => _unarchiveProject(context, ref),
                  child: Text(context.tr('Unarchive project')),
                )
              else ...[
                if (onSwitch != null)
                  OutlinedButton(
                    onPressed: isBusy ? null : onSwitch,
                    child: Text(context.tr('Switch project')),
                  ),
                OutlinedButton(
                  onPressed: isBusy
                      ? null
                      : () => context.push(
                          '/onboarding?mode=edit&intent=project-manage&projectId=${project.id}',
                        ),
                  child: Text(context.tr('Edit project')),
                ),
                OutlinedButton(
                  onPressed: isBusy
                      ? null
                      : () => _setDefaultProject(context, ref, project),
                  child: Text(context.tr('Set as default')),
                ),
                if (!isDemoMode)
                  TextButton(
                    onPressed: isBusy ? null : () => _confirmArchive(context, ref),
                    child: Text(context.tr('Archive project')),
                  ),
              ],
            ],
          ),
          if (project.settings?.contentDirectories.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            Text(
              context.tr('Detected content directories'),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            ...project.settings!.contentDirectories.map(
              (directory) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  '• ${directory.path}${directory.fileExtensions.isNotEmpty ? ' (${directory.fileExtensions.join(', ')})' : ''}',
                  style: TextStyle(color: colorScheme.onSurfaceVariant),
                ),
              ),
            ),
          ],
          if (_configSections(project).isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              context.tr('Configured sources'),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _configSections(
                project,
              ).map((label) => Chip(label: Text(label))).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _setDefaultProject(
    BuildContext context,
    WidgetRef ref,
    Project project,
  ) async {
    try {
      await ref
          .read(currentUserSettingsProvider.notifier)
          .setDefaultProjectId(project.id);
      ref.invalidate(projectsStateProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('Active project updated.'))),
        );
      }
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showDiagnosticSnackBar(
        context,
        ref,
        message: 'Could not update default project: $error',
        scope: 'projects.default',
        error: error,
        stackTrace: stackTrace,
        contextData: {'projectId': project.id},
      );
    }
  }

  Future<void> _confirmArchive(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('Archive project')),
        content: Text(
          context.tr('Archive this project from the active workspace list?'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(context.tr('Archive')),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    await _runMutation(
      context,
      ref,
      action: () => ref
          .read(projectMutationControllerProvider.notifier)
          .archiveProject(project.id),
      scope: 'projects.archive',
      failureMessage: 'Could not archive project: ${project.name}',
    );
  }

  Future<void> _unarchiveProject(BuildContext context, WidgetRef ref) async {
    await _runMutation(
      context,
      ref,
      action: () => ref
          .read(projectMutationControllerProvider.notifier)
          .unarchiveProject(project.id),
      scope: 'projects.unarchive',
      failureMessage: 'Could not unarchive project: ${project.name}',
    );
  }

  Future<void> _runMutation(
    BuildContext context,
    WidgetRef ref, {
    required Future<void> Function() action,
    required String scope,
    required String failureMessage,
  }) async {
    try {
      await action();
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(context.tr('Project updated.'))));
      }
    } catch (error, stackTrace) {
      if (!context.mounted) return;
      showDiagnosticSnackBar(
        context,
        ref,
        message: failureMessage,
        scope: scope,
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  List<String> _configSections(Project project) {
    final sections = <String>[];
    final overrides = project.settings?.configOverrides;
    if (overrides?.contentConfig?.isNotEmpty == true) {
      sections.add('content');
    }
    if (overrides?.seoConfig?.isNotEmpty == true) {
      sections.add('seo');
    }
    if (overrides?.linkingConfig?.isNotEmpty == true) {
      sections.add('linking');
    }
    if (project.settings?.analyticsEnabled == true) {
      sections.add('analytics');
    }
    return sections;
  }
}

class _EmptyProjectsState extends StatelessWidget {
  const _EmptyProjectsState({required this.isDegraded});

  final bool isDegraded;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.folder_copy_outlined, size: 72),
            const SizedBox(height: 16),
            Text(
              context.tr('No projects yet'),
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              context.tr(
                isDegraded
                    ? 'Project management unavailable'
                    : 'Create project',
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () =>
                  context.push('/onboarding?mode=create&intent=project-manage'),
              child: Text(context.tr('Create project')),
            ),
          ],
        ),
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.message, this.tone});

  final String message;
  final Color? tone;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = tone ?? colorScheme.primary;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded, color: color),
          const SizedBox(width: 12),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}
