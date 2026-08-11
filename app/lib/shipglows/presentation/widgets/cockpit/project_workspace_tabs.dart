import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../presentation/theme/app_theme.dart';
import '../../../data/cockpit/cockpit_models.dart';

class ProjectWorkspaceTabs extends StatelessWidget {
  const ProjectWorkspaceTabs({required this.projects, super.key});

  final List<CockpitProject> projects;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Semantics(
      container: true,
      label: 'Project workspaces',
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (final project in projects) ...[
              ActionChip(
                avatar: const Icon(Icons.folder_open_outlined),
                label: Text(project.name),
                tooltip: 'Open ${project.name} project workspace',
                onPressed: () => context.go(_projectLocation(project)),
              ),
              SizedBox(width: tokens.spacing.xs),
            ],
          ],
        ),
      ),
    );
  }

  static String _projectLocation(CockpitProject project) =>
      '/project/${Uri.encodeComponent(project.name)}'
      '?runnerProjectId=${Uri.encodeComponent(project.id)}';
}
