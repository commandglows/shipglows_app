import 'package:flutter/material.dart';

import '../../../../domain/project_health/project_health_models.dart';
import '../../../../presentation/theme/app_theme.dart';

class ProjectHealthMatrixView extends StatelessWidget {
  const ProjectHealthMatrixView({
    required this.projectName,
    required this.health,
    super.key,
  });

  final String projectName;
  final ProjectHealthMatrix health;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: '$projectName health: ${_label(health.overallStatus)}',
      child: Wrap(
        spacing: tokens.spacing.xs,
        runSpacing: tokens.spacing.xs,
        children: [
          for (final dimension in HealthDimension.values)
            _HealthCell(item: health.dimension(dimension)),
        ],
      ),
    );
  }

  static String _label(HealthStatus status) => switch (status) {
    HealthStatus.healthy => 'healthy',
    HealthStatus.warning => 'warning',
    HealthStatus.critical => 'critical',
    HealthStatus.unknown => 'unknown',
    HealthStatus.notReported => 'not reported',
    HealthStatus.stale => 'stale',
  };
}

class _HealthCell extends StatelessWidget {
  const _HealthCell({required this.item});

  final ProjectHealthDimension item;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final color = switch (item.status) {
      HealthStatus.healthy => tokens.health.healthy,
      HealthStatus.warning || HealthStatus.stale => tokens.health.warning,
      HealthStatus.critical => tokens.health.critical,
      HealthStatus.unknown || HealthStatus.notReported => tokens.health.unknown,
    };
    final status = ProjectHealthMatrixView._label(item.status);
    return Semantics(
      container: true,
      excludeSemantics: true,
      label: '${item.dimension.wireName}: $status',
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minWidth: tokens.cockpit.healthCellMinWidth,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(tokens.radii.control),
            border: Border.all(color: color),
          ),
          child: Padding(
            padding: EdgeInsets.all(tokens.spacing.xs),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.dimension.wireName,
                  style: Theme.of(context).textTheme.labelMedium,
                ),
                Text(status, style: TextStyle(color: color)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
