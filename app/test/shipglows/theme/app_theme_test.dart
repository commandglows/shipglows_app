import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  ThemeData lightTheme() => AppTheme.buildForTesting(Brightness.light);
  ThemeData darkTheme() => AppTheme.buildForTesting(Brightness.dark);

  group('AppTheme', () {
    test('themes expose the canonical ShipGlows token extension', () {
      for (final theme in [lightTheme(), darkTheme()]) {
        final tokens = theme.extension<AppThemeTokens>();

        expect(tokens, isNotNull);
        expect(tokens!.spacing.md, greaterThan(tokens.spacing.sm));
        expect(tokens.radii.card, greaterThan(tokens.radii.control));
        expect(
          tokens.breakpoints.desktop,
          greaterThan(tokens.breakpoints.tablet),
        );
        expect(tokens.navigation.railWidth, greaterThan(tokens.minimumTarget));
        expect(tokens.cockpit.cardMinWidth, greaterThan(0));
        expect(tokens.conversation.panelMinHeight, greaterThan(0));
        expect(tokens.motion.standard, greaterThan(Duration.zero));
        expect(
          tokens.studio.inspectorWidth,
          greaterThan(tokens.studio.surfaceRailWidth),
        );
        expect(
          tokens.studio.previewMinHeight,
          greaterThan(tokens.minimumTarget),
        );
      }
    });

    test('supports light and dark system brightness', () {
      expect(lightTheme().brightness, Brightness.light);
      expect(darkTheme().brightness, Brightness.dark);
      expect(
        lightTheme().colorScheme.primary,
        isNot(darkTheme().colorScheme.primary),
      );
      expect(lightTheme().textTheme.bodyMedium?.fontFamily, 'Inter');
      expect(darkTheme().textTheme.bodyMedium?.fontFamily, 'Inter');
    });

    test('semantic and focus colors keep contrast on rendered surfaces', () {
      for (final theme in [lightTheme(), darkTheme()]) {
        final tokens = theme.extension<AppThemeTokens>()!;
        final palette = theme.extension<AppThemePalette>()!;
        final checks = <(Color, Color, String)>[
          (tokens.focus.ring, theme.colorScheme.surface, 'focus on surface'),
          (tokens.focus.ring, theme.colorScheme.primary, 'focus on primary'),
          (
            tokens.health.warning,
            palette.mutedSurface,
            'warning on status panel',
          ),
          (
            tokens.health.critical,
            palette.mutedSurface,
            'critical on status panel',
          ),
          (
            tokens.execution.running,
            palette.mutedSurface,
            'running on status panel',
          ),
          (
            tokens.studio.active,
            palette.mutedSurface,
            'Laboratory active on status panel',
          ),
          (
            tokens.access.granted,
            theme.colorScheme.surfaceContainerHighest,
            'access granted on chip',
          ),
          (
            tokens.access.suspended,
            theme.colorScheme.surfaceContainerHighest,
            'access suspended on chip',
          ),
          (
            tokens.access.lost,
            theme.colorScheme.surfaceContainerHighest,
            'access lost on chip',
          ),
        ];

        for (final (foreground, background, label) in checks) {
          expect(
            _contrastRatio(foreground, background),
            greaterThanOrEqualTo(3),
            reason: '$label lacks 3:1 contrast',
          );
        }
      }
    });

    test('interactive component themes expose the canonical focus ring', () {
      for (final theme in [lightTheme(), darkTheme()]) {
        final tokens = theme.extension<AppThemeTokens>()!;
        const focused = {WidgetState.focused};
        final chipSide = theme.chipTheme.side;
        final sides = [
          theme.filledButtonTheme.style?.side?.resolve(focused),
          theme.outlinedButtonTheme.style?.side?.resolve(focused),
          theme.textButtonTheme.style?.side?.resolve(focused),
          theme.iconButtonTheme.style?.side?.resolve(focused),
          chipSide is WidgetStateBorderSide
              ? chipSide.resolve(focused)
              : chipSide,
        ];

        for (final side in sides) {
          expect(side?.color, tokens.focus.ring);
          expect(side?.width, tokens.focus.width);
        }
      }
    });
  });

  test('ShipGlowsApp delegates theme construction to AppTheme', () {
    final source = File('lib/shipglows/app.dart').readAsStringSync();
    final carrier = File(
      'lib/presentation/theme/app_theme.dart',
    ).readAsStringSync();

    expect(source, contains('AppTheme.lightTheme'));
    expect(source, contains('AppTheme.darkTheme'));
    expect(source, contains('ThemeMode.system'));
    expect(source, isNot(contains('ThemeData(')));
    expect(source, isNot(contains('_buildTheme')));
    expect(carrier, contains('GoogleFonts.interTextTheme'));
  });
}

double _contrastRatio(Color foreground, Color background) {
  final lighter = foreground.computeLuminance() > background.computeLuminance()
      ? foreground
      : background;
  final darker = identical(lighter, foreground) ? background : foreground;
  return (lighter.computeLuminance() + 0.05) /
      (darker.computeLuminance() + 0.05);
}
