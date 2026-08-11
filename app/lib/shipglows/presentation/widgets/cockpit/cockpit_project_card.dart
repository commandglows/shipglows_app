import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../domain/project_health/project_health_models.dart';
import '../../../../presentation/theme/app_theme.dart';
import '../../../data/cockpit/cockpit_models.dart';
import 'project_health_matrix.dart';

class CockpitProjectCard extends StatelessWidget {
  const CockpitProjectCard.server({required CockpitProject project, super.key})
    : _server = project,
      _local = null;

  const CockpitProjectCard.local({required ProjectHealth project, super.key})
    : _server = null,
      _local = project;

  final CockpitProject? _server;
  final ProjectHealth? _local;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final server = _server;
    final name = server?.name ?? _local!.project;
    final health = server?.health ?? _local!.health;
    final location = server == null
        ? '/project/${Uri.encodeComponent(name)}'
        : '/project/${Uri.encodeComponent(name)}'
              '?runnerProjectId=${Uri.encodeComponent(server.id)}';
    final actionsEnabled = server?.actionsEnabled ?? true;

    return Card(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: tokens.spacing.sm,
              runSpacing: tokens.spacing.xs,
              children: [
                Text(name, style: Theme.of(context).textTheme.titleMedium),
                if (server case final project?)
                  _AccessBadge(state: project.accessState),
              ],
            ),
            SizedBox(height: tokens.spacing.xs),
            Text(
              server?.repositoryFullName ?? 'Local repository projection',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            SizedBox(height: tokens.spacing.md),
            ProjectHealthMatrixView(projectName: name, health: health),
            SizedBox(height: tokens.spacing.md),
            _CoverageSummary(health: health),
            if (server case final project?) ...[
              SizedBox(height: tokens.spacing.sm),
              Text(
                '${project.conversationCount} conversations · '
                '${project.activeRunCount} active runs',
              ),
            ],
            SizedBox(height: tokens.spacing.md),
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: OutlinedButton.icon(
                onPressed: actionsEnabled ? () => context.go(location) : null,
                icon: const Icon(Icons.arrow_forward_rounded),
                label: Text(
                  server == null ? 'Open local view' : 'Open workspace',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CoverageSummary extends StatelessWidget {
  const _CoverageSummary({required this.health});

  final ProjectHealthMatrix health;

  @override
  Widget build(BuildContext context) {
    final coverage = (health.coverage * 100).round();
    final hasStale = health.dimensions.any(
      (dimension) => dimension.status == HealthStatus.stale,
    );
    return Wrap(
      spacing: AppTheme.tokensOf(context).spacing.sm,
      runSpacing: AppTheme.tokensOf(context).spacing.xs,
      children: [
        Text('Evidence coverage: $coverage%'),
        if (hasStale) const Text('Evidence needs refresh'),
      ],
    );
  }
}

class _AccessBadge extends StatelessWidget {
  const _AccessBadge({required this.state});

  final ProjectAccessState state;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final (label, color, icon) = switch (state) {
      ProjectAccessState.available => (
        'Access active',
        tokens.access.granted,
        Icons.verified_user_outlined,
      ),
      ProjectAccessState.installationSuspended => (
        'Access suspended',
        tokens.access.suspended,
        Icons.pause_circle_outline,
      ),
      ProjectAccessState.accessLost => (
        'Access lost',
        tokens.access.lost,
        Icons.gpp_bad_outlined,
      ),
      ProjectAccessState.needsGitHubApp => (
        'Access required',
        tokens.access.suspended,
        Icons.link_off_outlined,
      ),
      ProjectAccessState.unavailable => (
        'Unavailable',
        tokens.access.lost,
        Icons.block_outlined,
      ),
    };
    return Semantics(
      label: label,
      child: Chip(
        avatar: Icon(icon, color: color),
        label: Text(label),
        side: BorderSide(color: color),
      ),
    );
  }
}
