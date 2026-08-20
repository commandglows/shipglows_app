import 'package:flutter/material.dart';

import '../../../../presentation/theme/app_theme.dart';
import '../../../data/cockpit/cockpit_models.dart';

class AiReadinessSummary extends StatelessWidget {
  const AiReadinessSummary({required this.readiness, super.key});

  final ProjectAiReadiness readiness;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final score = readiness.score;
    final statusLabel = switch (readiness.status) {
      AiReadinessStatus.ready => 'Ready',
      AiReadinessStatus.needsWork => 'Needs work',
      AiReadinessStatus.partial => 'Partial scan',
      AiReadinessStatus.unavailable => 'Not evaluated',
    };
    final semanticScore = score == null ? statusLabel : '$score out of 100';
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: 'AI readiness: $semanticScore',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: tokens.spacing.sm,
            runSpacing: tokens.spacing.xs,
            children: [
              Text(
                'AI readiness',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              Text(
                score == null ? statusLabel : '$score/100 · $statusLabel',
                style: Theme.of(context).textTheme.labelLarge,
              ),
            ],
          ),
          SizedBox(height: tokens.spacing.xs),
          LinearProgressIndicator(value: score == null ? 0 : score / 100),
          if (readiness.checks.isNotEmpty) ...[
            SizedBox(height: tokens.spacing.sm),
            Wrap(
              spacing: tokens.spacing.xs,
              runSpacing: tokens.spacing.xs,
              children: [
                for (final check in readiness.checks)
                  _ReadinessCheckChip(check: check),
              ],
            ),
          ],
          if (readiness.recommendations.isNotEmpty) ...[
            SizedBox(height: tokens.spacing.sm),
            for (final recommendation in readiness.recommendations)
              Padding(
                padding: EdgeInsets.only(bottom: tokens.spacing.xs),
                child: Text('• $recommendation'),
              ),
          ],
        ],
      ),
    );
  }
}

class _ReadinessCheckChip extends StatelessWidget {
  const _ReadinessCheckChip({required this.check});

  final AiReadinessCheck check;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final (label, color, icon) = switch (check.outcome) {
      AiReadinessCheckOutcome.passed => (
        _checkLabel(check.id),
        tokens.health.healthy,
        Icons.check_circle_outline,
      ),
      AiReadinessCheckOutcome.warning => (
        _checkLabel(check.id),
        tokens.health.warning,
        Icons.warning_amber_rounded,
      ),
      AiReadinessCheckOutcome.missing => (
        _checkLabel(check.id),
        tokens.health.critical,
        Icons.error_outline,
      ),
      AiReadinessCheckOutcome.notApplicable => (
        _checkLabel(check.id),
        tokens.health.unknown,
        Icons.remove_circle_outline,
      ),
    };
    return Tooltip(
      message: check.summary,
      child: Chip(
        avatar: Icon(icon, color: color),
        label: Text(label),
        side: BorderSide(color: color),
      ),
    );
  }

  static String _checkLabel(AiReadinessCheckId id) => switch (id) {
    AiReadinessCheckId.structure => 'Structure',
    AiReadinessCheckId.schemas => 'Schemas',
    AiReadinessCheckId.agentGuidance => 'Agent guide',
    AiReadinessCheckId.llmsText => 'llms.txt',
    AiReadinessCheckId.sitemap => 'Sitemap',
    AiReadinessCheckId.fastFeedback => 'Fast checks',
  };
}
