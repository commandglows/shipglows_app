import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../domain/project_health/project_health_models.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/managed_project_identity_provider.dart';
import '../widgets/dependency_posture_chip.dart';
import '../widgets/managed_conversation_panel.dart';
import '../widgets/shipglows_scaffold.dart';

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({
    required this.projectName,
    this.runnerProjectId,
    super.key,
  });

  final String projectName;
  final String? runnerProjectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    final resolvedRunnerProjectId =
        runnerProjectId ??
        ref.watch(managedRunnerProjectIdProvider(projectName));
    return ShipGlowsScaffold(
      title: projectName,
      body: dashboard.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Failed to load: $error')),
        data: (data) {
          ProjectHealth? project;
          for (final item in data.projects) {
            if (item.project == projectName) {
              project = item;
              break;
            }
          }
          if (project == null) {
            if (resolvedRunnerProjectId != null) {
              return _ServerProjectDetailBody(
                projectName: projectName,
                runnerProjectId: resolvedRunnerProjectId,
              );
            }
            return const Center(child: Text('Project not found.'));
          }
          return _ProjectDetailBody(
            project: project,
            runnerProjectId: resolvedRunnerProjectId,
          );
        },
      ),
    );
  }
}

class _ServerProjectDetailBody extends StatelessWidget {
  const _ServerProjectDetailBody({
    required this.projectName,
    required this.runnerProjectId,
  });

  final String projectName;
  final String runnerProjectId;

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                projectName,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                'Projet piloté par la projection serveur ShipGlows.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 6),
              Text(
                'Identité runner : $runnerProjectId',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 12),
      ManagedConversationPanel(projectId: runnerProjectId),
      const SizedBox(height: 12),
      _OperatorWorkspaceButton(
        projectName: projectName,
        projectId: runnerProjectId,
      ),
    ],
  );
}

class _ProjectDetailBody extends StatelessWidget {
  const _ProjectDetailBody({required this.project, this.runnerProjectId});

  final ProjectHealth project;
  final String? runnerProjectId;

  @override
  Widget build(BuildContext context) {
    final auditDate = project.latestAuditDate == null
        ? 'unknown'
        : DateFormat('yyyy-MM-dd').format(project.latestAuditDate!);
    final colorScheme = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        project.project,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                    ),
                    DependencyPostureChip(posture: project.dependencyPosture),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  project.path,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 6),
                Text(project.stack),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _DetailStat(label: 'Latest audit', value: auditDate),
                    _DetailStat(
                      label: 'Open tasks',
                      value: '${project.openTasks}',
                    ),
                    _DetailStat(
                      label: 'In progress',
                      value: '${project.inProgressTasks}',
                    ),
                    _DetailStat(
                      label: 'Active chantiers',
                      value: '${project.activeChantiers}',
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text('Dependency posture: ${project.dependencyMessage}'),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: colorScheme.outline),
                  ),
                  child: SelectableText(
                    'Recommended next command: ${project.nextCommand}',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(fontFamily: 'monospace'),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ManagedConversationPanel(projectId: runnerProjectId),
        if (runnerProjectId != null) ...[
          const SizedBox(height: 12),
          _OperatorWorkspaceButton(
            projectName: project.project,
            projectId: runnerProjectId!,
          ),
        ],
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Recent Dependency Events',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                if (project.recentDependencyEvents.isEmpty)
                  const Text('No dependency events recorded yet.'),
                ...project.recentDependencyEvents.map(
                  (event) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${event.eventType} · ${event.status} · ${event.riskLevel}',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(event.summary),
                        const SizedBox(height: 4),
                        Text(
                          'Event: ${event.eventId} · Next: ${event.nextStep}',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Diagnostics',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                if (project.diagnostics.isEmpty)
                  const Text('No diagnostics linked to this project.'),
                ...project.diagnostics.map(
                  (diag) => Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      color: colorScheme.surfaceContainerHighest,
                      border: Border.all(color: colorScheme.outline),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 2),
                          child: Icon(Icons.warning_amber_outlined, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(diag.message),
                              const SizedBox(height: 4),
                              Text(
                                diag.source,
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: colorScheme.onSurfaceVariant,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _OperatorWorkspaceButton extends StatelessWidget {
  const _OperatorWorkspaceButton({
    required this.projectName,
    required this.projectId,
  });

  final String projectName;
  final String projectId;

  @override
  Widget build(BuildContext context) => OutlinedButton.icon(
    onPressed: () => context.push(
      '/project/${Uri.encodeComponent(projectName)}/workspace'
      '?runnerProjectId=${Uri.encodeComponent(projectId)}',
    ),
    icon: const Icon(Icons.desktop_windows_outlined),
    label: const Text('Ouvrir le Workspace opérateur'),
  );
}

class _DetailStat extends StatelessWidget {
  const _DetailStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 6),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}
