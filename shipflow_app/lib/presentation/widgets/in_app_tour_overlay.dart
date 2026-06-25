import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/in_app_tour/in_app_tour_controller.dart';
import '../../l10n/app_localizations.dart';
import '../theme/app_theme.dart';

class InAppTourOverlay extends ConsumerStatefulWidget {
  const InAppTourOverlay({super.key});

  @override
  ConsumerState<InAppTourOverlay> createState() => _InAppTourOverlayState();
}

class _InAppTourOverlayState extends ConsumerState<InAppTourOverlay> {
  Offset _position = Offset.zero;
  bool _positioned = false;

  void _initializePosition(
    BuildContext context,
    Size screenSize,
    Offset cardSize,
  ) {
    if (_positioned && _position != Offset.zero) return;
    final constrainedWidth = (screenSize.width - 24).clamp(0.0, 420.0);
    final estimatedCardWidth = constrainedWidth.isFinite ? constrainedWidth : 420.0;
    final estimatedCardHeight = 220.0;
    final safeBottom = MediaQuery.of(context).padding.bottom;
    const bottomBarClearance = 100.0;
    _position = Offset(
      (screenSize.width - estimatedCardWidth) / 2,
      screenSize.height - estimatedCardHeight - safeBottom - bottomBarClearance,
    );
    _position = Offset(
      _position.dx.clamp(12, (screenSize.width - 12).clamp(12, double.infinity)),
      _position.dy.clamp(
        12,
        (screenSize.height - 12 - cardSize.dy).clamp(12, double.infinity),
      ),
    );
    _positioned = true;
  }

  @override
  Widget build(BuildContext context) {
    final tour = ref.watch(inAppTourProvider);
    if (!tour.active) return const SizedBox.shrink();

    final step = tour.currentStep;
    final controller = ref.read(inAppTourProvider.notifier);
    final palette = AppTheme.paletteOf(context);
    final colorScheme = Theme.of(context).colorScheme;
    final media = MediaQuery.sizeOf(context);

    final stepCardKey = GlobalKey();
    final stepCard = Material(
      key: stepCardKey,
      color: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        decoration: BoxDecoration(
          color: palette.elevatedSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.approveColor.withAlpha(80)),
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.22),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHeader(context, tour, controller),
            const SizedBox(height: 10),
            _buildProgressBar(context, tour),
            const SizedBox(height: 14),
            Text(
              context.tr(step.title),
              style: TextStyle(
                color: colorScheme.onSurface,
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr(step.description),
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                fontSize: 13.5,
                height: 1.45,
              ),
            ),
            if (step.hint != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.approveColor.withAlpha(20),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: AppTheme.approveColor.withAlpha(60),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.lightbulb_outline,
                      size: 16,
                      color: AppTheme.approveColor,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        context.tr(step.hint!),
                        style: TextStyle(
                          color: AppTheme.approveColor,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 16),
            _buildActions(context, tour, controller),
          ],
        ),
      ),
    );

    _initializePosition(context, media, const Offset(420, 250));

    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;
        final screenHeight = constraints.maxHeight;
        final cardWidth = (screenWidth - 24).clamp(0.0, 420.0);
        final cardHeightEstimate = 250.0;
        _position = Offset(
          _position.dx.clamp(
            12,
            (screenWidth - cardWidth - 12).clamp(12, double.infinity),
          ),
          _position.dy.clamp(
            12,
            (screenHeight - cardHeightEstimate - 12).clamp(12, double.infinity),
          ),
        );

        return Stack(
          children: [
            Positioned(
              left: _position.dx,
              top: _position.dy,
              width: cardWidth,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onPanUpdate: (details) {
                  setState(() {
                    _position += details.delta;
                    _position = Offset(
                      _position.dx.clamp(
                        12,
                        (screenWidth - cardWidth - 12).clamp(
                          12,
                          double.infinity,
                        ),
                      ),
                      _position.dy.clamp(
                        12,
                        (screenHeight - cardHeightEstimate - 12).clamp(
                          12,
                          double.infinity,
                        ),
                      ),
                    );
                  });
                },
                child: SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(0, 0, 12, 12),
                    child: stepCard,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  void didUpdateWidget(covariant InAppTourOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    final tour = ref.read(inAppTourProvider);
    if (!tour.active) {
      _positioned = false;
      _position = Offset.zero;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final tour = ref.watch(inAppTourProvider);
    if (!tour.active) {
      _positioned = false;
      _position = Offset.zero;
    }
  }

  @override
  void dispose() {
    super.dispose();
  }

  Widget _buildHeader(
    BuildContext context,
    InAppTourState tour,
    InAppTourController controller,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(Icons.tour_rounded, size: 18, color: AppTheme.approveColor),
        const SizedBox(width: 8),
        Text(
          context.tr(
            'Guided tour · {current}/{total}',
            {
              'current': tour.stepIndex + 1,
              'total': tour.totalSteps,
            },
          ),
          style: TextStyle(
            color: colorScheme.onSurfaceVariant,
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.4,
          ),
        ),
        const Spacer(),
        IconButton(
          tooltip: context.tr('Pause tour'),
          onPressed: controller.pause,
          icon: Icon(
            Icons.close_rounded,
            size: 18,
            color: colorScheme.onSurfaceVariant,
          ),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
        ),
      ],
    );
  }

  Widget _buildProgressBar(BuildContext context, InAppTourState tour) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      children: List.generate(tour.totalSteps, (i) {
        final isActive = i <= tour.stepIndex;
        return Expanded(
          child: Container(
            height: 3,
            margin: const EdgeInsets.symmetric(horizontal: 1.5),
            decoration: BoxDecoration(
              color: isActive
                  ? AppTheme.approveColor
                  : colorScheme.outlineVariant.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildActions(
    BuildContext context,
    InAppTourState tour,
    InAppTourController controller,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    final currentRoute = GoRouterState.of(context).uri.path;
    final route = tour.currentStep.routePath;
    final hasNavigationShortcut = route != null && route != currentRoute;
    return Row(
      children: [
        if (!tour.isFirst)
          TextButton.icon(
            onPressed: () => controller.previous(context),
            icon: const Icon(Icons.arrow_back_rounded, size: 16),
            label: Text(context.tr('Previous')),
            style: TextButton.styleFrom(
              foregroundColor: colorScheme.onSurface,
              padding: const EdgeInsets.symmetric(horizontal: 10),
            ),
          ),
        TextButton(
          onPressed: controller.skip,
          style: TextButton.styleFrom(
            foregroundColor: colorScheme.onSurfaceVariant,
            padding: const EdgeInsets.symmetric(horizontal: 10),
          ),
          child: Text(context.tr('Skip tour')),
        ),
        if (hasNavigationShortcut) ...[
          const SizedBox(width: 6),
          TextButton(
            onPressed: () => context.go(route),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.approveColor,
              padding: const EdgeInsets.symmetric(horizontal: 10),
            ),
            child: Text(
              context.tr(
                'Open {screen}',
                {'screen': context.tr(tour.currentStep.title)},
              ),
            ),
          ),
        ],
        const Spacer(),
        FilledButton.icon(
          onPressed: () => controller.next(context),
          icon: Icon(
            tour.isLast ? Icons.check_rounded : Icons.arrow_forward_rounded,
            size: 16,
          ),
          label: Text(context.tr(tour.isLast ? 'Finish' : 'Next')),
          style: FilledButton.styleFrom(
            backgroundColor: AppTheme.approveColor,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          ),
        ),
      ],
    );
  }
}
