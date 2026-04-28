import 'package:flutter/material.dart';

import '../../../domain/project_health/project_health_models.dart';

class DependencyPostureChip extends StatelessWidget {
  const DependencyPostureChip({required this.posture, super.key});

  final DependencyPosture posture;

  @override
  Widget build(BuildContext context) {
    final (label, color) = _mapping(posture);
    return Chip(
      label: Text(label),
      backgroundColor: color.withValues(alpha: 0.16),
      side: BorderSide(color: color.withValues(alpha: 0.4)),
      labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
        color: color,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  (String, Color) _mapping(DependencyPosture posture) {
    switch (posture) {
      case DependencyPosture.neverChecked:
        return ('never_checked', Colors.blueGrey);
      case DependencyPosture.stale:
        return ('stale', Colors.orange);
      case DependencyPosture.riskOpen:
        return ('risk_open', Colors.deepOrange);
      case DependencyPosture.migrationRequired:
        return ('migration_required', Colors.red);
      case DependencyPosture.healthy:
        return ('healthy', Colors.green);
      case DependencyPosture.sourceGap:
        return ('source_gap', Colors.purple);
    }
  }
}
