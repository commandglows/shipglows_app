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
      backgroundColor: color.withValues(alpha: 0.12),
      side: BorderSide(color: color.withValues(alpha: 0.28)),
      labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
        color: color,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  (String, Color) _mapping(DependencyPosture posture) {
    switch (posture) {
      case DependencyPosture.neverChecked:
        return ('never_checked', const Color(0xFF94A3B8));
      case DependencyPosture.stale:
        return ('stale', const Color(0xFFF59E0B));
      case DependencyPosture.riskOpen:
        return ('risk_open', const Color(0xFFF97316));
      case DependencyPosture.migrationRequired:
        return ('migration_required', const Color(0xFFEF4444));
      case DependencyPosture.healthy:
        return ('healthy', const Color(0xFF10B981));
      case DependencyPosture.sourceGap:
        return ('source_gap', const Color(0xFF0070F3));
    }
  }
}
