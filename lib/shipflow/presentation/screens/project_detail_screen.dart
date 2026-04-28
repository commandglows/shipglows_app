import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../domain/project_health/project_health_models.dart';
import '../../providers/dashboard_provider.dart';
import '../widgets/dependency_posture_chip.dart';
import '../widgets/shipflow_scaffold.dart';

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({required this.projectName, super.key});

  final String projectName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    return ShipFlowScaffold(
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
            return const Center(child: Text('Project not found.'));
          }
          return _ProjectDetailBody(project: project);
        },
      ),
    );
  }
}

class _ProjectDetailBody extends StatelessWidget {
  const _ProjectDetailBody({required this.project});

  final ProjectHealth project;

  @override
  Widget build(BuildContext context) {
    final auditDate = project.latestAuditDate == null
        ? 'unknown'
        : DateFormat('yyyy-MM-dd').format(project.latestAuditDate!);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
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
                const SizedBox(height: 8),
                Text(project.path),
                const SizedBox(height: 6),
                Text(project.stack),
                const SizedBox(height: 16),
                Text('Dependency posture: ${project.dependencyMessage}'),
                const SizedBox(height: 4),
                Text('Latest audit date: $auditDate'),
                const SizedBox(height: 4),
                Text('Open tasks: ${project.openTasks}'),
                const SizedBox(height: 4),
                Text('In progress tasks: ${project.inProgressTasks}'),
                const SizedBox(height: 4),
                Text('Active chantiers: ${project.activeChantiers}'),
                const SizedBox(height: 12),
                SelectableText(
                  'Recommended next command: ${project.nextCommand}',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
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
                        ),
                        Text(event.summary),
                        Text(
                          'Event: ${event.eventId} · Next: ${event.nextStep}',
                          style: Theme.of(context).textTheme.bodySmall,
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
            padding: const EdgeInsets.all(16),
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
                  (diag) => ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.warning_amber_outlined, size: 18),
                    title: Text(diag.message),
                    subtitle: Text(diag.source),
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
