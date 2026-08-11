import 'package:flutter/material.dart';

import '../../../../presentation/theme/app_theme.dart';

enum CockpitStatusTone { info, warning, error }

class CockpitStatusPanel extends StatelessWidget {
  const CockpitStatusPanel({
    required this.title,
    required this.message,
    required this.tone,
    this.action,
    super.key,
  });

  final String title;
  final String message;
  final CockpitStatusTone tone;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final palette = AppTheme.paletteOf(context);
    final color = switch (tone) {
      CockpitStatusTone.info => tokens.execution.running,
      CockpitStatusTone.warning => tokens.health.warning,
      CockpitStatusTone.error => tokens.health.critical,
    };
    return Semantics(
      liveRegion: true,
      container: true,
      label: '$title. $message',
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: palette.mutedSurface,
          borderRadius: BorderRadius.circular(tokens.radii.card),
          border: Border.all(color: color),
        ),
        child: Padding(
          padding: EdgeInsets.all(tokens.spacing.md),
          child: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: tokens.spacing.md,
            runSpacing: tokens.spacing.sm,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(_icon, color: color),
                  SizedBox(width: tokens.spacing.sm),
                  Flexible(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        Text(message),
                      ],
                    ),
                  ),
                ],
              ),
              ?action,
            ],
          ),
        ),
      ),
    );
  }

  IconData get _icon => switch (tone) {
    CockpitStatusTone.info => Icons.cloud_done_outlined,
    CockpitStatusTone.warning => Icons.warning_amber_rounded,
    CockpitStatusTone.error => Icons.error_outline_rounded,
  };
}
