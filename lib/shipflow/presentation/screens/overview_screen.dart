import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../domain/project_health/project_health_models.dart';
import '../../providers/dashboard_provider.dart';
import '../widgets/dependency_posture_chip.dart';
import '../widgets/shipflow_scaffold.dart';

class OverviewScreen extends ConsumerWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);

    return ShipFlowScaffold(
      title: 'ShipFlow Operations Dashboard',
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

          return RefreshIndicator(
            onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: data.projects.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return Card(
                    child: ListTile(
                      title: const Text('Latest refresh'),
                      subtitle: Text(
                        '$generatedAt local time\n'
                        'Diagnostics: ${data.diagnostics.length}',
                      ),
                    ),
                  );
                }
                final project = data.projects[index - 1];
                return _ProjectCard(project: project);
              },
            ),
          );
        },
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({required this.project});

  final ProjectHealth project;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(top: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () =>
            context.go('/project/${Uri.encodeComponent(project.project)}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
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
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  DependencyPostureChip(posture: project.dependencyPosture),
                ],
              ),
              const SizedBox(height: 8),
              Text(project.dependencyMessage),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 6,
                children: [
                  _smallStat('todo', '${project.openTasks}'),
                  _smallStat('in_progress', '${project.inProgressTasks}'),
                  _smallStat('active_chantiers', '${project.activeChantiers}'),
                  _smallStat('next', project.nextCommand),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _smallStat(String label, String value) {
    return Builder(
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(100),
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
        ),
        child: Text(
          '$label: $value',
          style: Theme.of(context).textTheme.labelMedium,
        ),
      ),
    );
  }
}
