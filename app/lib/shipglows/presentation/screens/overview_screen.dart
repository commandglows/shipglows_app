import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../domain/project_health/project_health_models.dart';
import '../../data/cockpit/cockpit_models.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/managed_cockpit_provider.dart';
import '../widgets/dependency_posture_chip.dart';
import '../widgets/shipglows_scaffold.dart';

class OverviewScreen extends ConsumerWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    final managedCockpit = ref.watch(managedCockpitSnapshotProvider);

    return ShipGlowsScaffold(
      title: 'ShipGlows Cockpit',
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
          final serverSnapshot = managedCockpit.asData?.value;
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
                if (managedCockpit.asData?.value case final serverCockpit?) ...[
                  _ServerCockpitBanner(snapshot: serverCockpit),
                  const SizedBox(height: 16),
                ],
                Text(
                  'Project estate',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Vue globale de la santé de tes projets et des actions disponibles.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                if (serverSnapshot != null)
                  for (final project in serverSnapshot.projects) ...[
                    _ServerProjectCard(project: project),
                    const SizedBox(height: 12),
                  ]
                else
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
              Text(value, style: Theme.of(context).textTheme.headlineMedium),
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

class _ServerCockpitBanner extends StatelessWidget {
  const _ServerCockpitBanner({required this.snapshot});

  final CockpitSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final activeRuns = snapshot.projects.fold<int>(
      0,
      (total, project) => total + project.activeRunCount,
    );
    return Card(
      color: scheme.secondary.withValues(alpha: 0.10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.cloud_done_outlined, color: scheme.secondary),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Projection serveur active · ${snapshot.projects.length} projets · $activeRuns exécutions en cours',
              ),
            ),
          ],
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
              _HealthMatrixRow(health: project.health),
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
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(fontFamily: 'monospace'),
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

class _ServerProjectCard extends StatelessWidget {
  const _ServerProjectCard({required this.project});

  final CockpitProject project;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => context.go(
          '/project/${Uri.encodeComponent(project.name)}?runnerProjectId=${Uri.encodeComponent(project.id)}',
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      project.name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  Text(
                    '${project.conversationCount} conversations · ${project.activeRunCount} en cours',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                project.repositoryFullName,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: HealthDimension.values.map((dimension) {
                  final item = project.health.dimension(dimension);
                  final color = switch (item.status) {
                    HealthStatus.healthy => scheme.secondary,
                    HealthStatus.warning ||
                    HealthStatus.stale => scheme.primary,
                    HealthStatus.critical => scheme.error,
                    HealthStatus.unknown ||
                    HealthStatus.notReported => scheme.onSurfaceVariant,
                  };
                  return Chip(
                    avatar: CircleAvatar(backgroundColor: color, radius: 4),
                    label: Text(
                      '${dimension.wireName} · ${item.status.wireName}',
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HealthMatrixRow extends StatelessWidget {
  const _HealthMatrixRow({required this.health});

  final ProjectHealthMatrix health;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: HealthDimension.values.map((dimension) {
        final item = health.dimension(dimension);
        final color = switch (item.status) {
          HealthStatus.healthy => colorScheme.secondary,
          HealthStatus.warning || HealthStatus.stale => colorScheme.primary,
          HealthStatus.critical => colorScheme.error,
          HealthStatus.unknown ||
          HealthStatus.notReported => colorScheme.onSurfaceVariant,
        };
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: color.withValues(alpha: 0.12),
            border: Border.all(color: color.withValues(alpha: 0.42)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
              Text('${dimension.wireName} · ${item.status.wireName}'),
            ],
          ),
        );
      }).toList(),
    );
  }
}
