import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../domain/project_health/project_health_models.dart';
import '../../providers/dashboard_provider.dart';
import '../widgets/dependency_posture_chip.dart';
import '../widgets/shipglows_scaffold.dart';

class OverviewScreen extends ConsumerWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);

    return ShipGlowsScaffold(
      title: 'ShipGlows Operations Dashboard',
      actions: [
        IconButton(
          tooltip: 'Refresh',
          onPressed: () => ref.read(dashboardProvider.notifier).refresh(),
          icon: const Icon(Icons.refresh),
        ),
      ],
      body: dashboard.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Failed to load dashboard: $error'),
          ),
        ),
        data: (data) {
          if (data.projects.isEmpty) {
            return const Center(
              child: Text('No projects found in PROJECTS.md.'),
            );
          }
          final generatedAt = DateFormat(
            'yyyy-MM-dd HH:mm:ss',
          ).format(data.generatedAt.toLocal());
          final openTasks = data.projects.fold<int>(
            0,
            (sum, project) => sum + project.openTasks,
          );
          final activeTasks = data.projects.fold<int>(
            0,
            (sum, project) => sum + project.inProgressTasks,
          );

          return RefreshIndicator(
            onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _OverviewMetric(
                      label: 'Projects',
                      value: '${data.projects.length}',
                      detail: '${data.allowlistedRoots.length} roots indexed',
                    ),
                    _OverviewMetric(
                      label: 'Open Tasks',
                      value: '$openTasks',
                      detail: '$activeTasks active now',
                    ),
                    _OverviewMetric(
                      label: 'Diagnostics',
                      value: '${data.diagnostics.length}',
                      detail: 'Last refresh $generatedAt',
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  'Project estate',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Current dependency posture, task pressure, and next operator action.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                for (final project in data.projects) ...[
                  _ProjectCard(project: project),
                  const SizedBox(height: 12),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _OverviewMetric extends StatelessWidget {
  const _OverviewMetric({
    required this.label,
    required this.value,
    required this.detail,
  });

  final String label;
  final String value;
  final String detail;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return SizedBox(
      width: 260,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                detail,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({required this.project});

  final ProjectHealth project;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () =>
            context.go('/project/${Uri.encodeComponent(project.project)}'),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          project.project,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          project.stack,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  DependencyPostureChip(posture: project.dependencyPosture),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                project.path,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              Text(project.dependencyMessage),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  _smallStat(context, 'todo', '${project.openTasks}'),
                  _smallStat(
                    context,
                    'in_progress',
                    '${project.inProgressTasks}',
                  ),
                  _smallStat(
                    context,
                    'active_chantiers',
                    '${project.activeChantiers}',
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: colorScheme.outline),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Recommended next command',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 8),
                    SelectableText(
                      project.nextCommand,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _smallStat(BuildContext context, String label, String value) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: colorScheme.surfaceContainerHighest,
        border: Border.all(color: colorScheme.outline),
      ),
      child: Text(
        '$label: $value',
        style: Theme.of(context).textTheme.labelMedium,
      ),
    );
  }
}
