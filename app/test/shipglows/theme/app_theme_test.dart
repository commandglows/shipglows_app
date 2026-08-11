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

    test('key semantic and focus colors keep non-text contrast', () {
      for (final theme in [lightTheme(), darkTheme()]) {
        final tokens = theme.extension<AppThemeTokens>()!;
        final background = theme.scaffoldBackgroundColor;
        final colors = <Color>[
          tokens.focus.ring,
          tokens.health.healthy,
          tokens.health.warning,
          tokens.health.critical,
          tokens.execution.running,
          tokens.access.lost,
        ];

        for (final color in colors) {
          expect(
            _contrastRatio(color, background),
            greaterThanOrEqualTo(3),
            reason: '$color lacks 3:1 contrast against $background',
          );
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
