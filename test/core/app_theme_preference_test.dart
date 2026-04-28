import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:contentflow_app/core/app_theme_preference.dart';
import 'package:contentflow_app/core/shared_preferences_provider.dart';
import 'package:contentflow_app/providers/providers.dart';

void main() {
  group('normalizeAppThemePreference', () {
    test('defaults blank and invalid values to system', () {
      expect(normalizeAppThemePreference(null), appThemeSystem);
      expect(normalizeAppThemePreference(''), appThemeSystem);
      expect(normalizeAppThemePreference('sepia'), appThemeSystem);
    });

    test('keeps supported values', () {
      expect(normalizeAppThemePreference(appThemeLight), appThemeLight);
      expect(normalizeAppThemePreference(appThemeDark), appThemeDark);
      expect(normalizeAppThemePreference(appThemeSystem), appThemeSystem);
    });
  });

  group('themeModeFromPreference', () {
    test('maps theme preferences to ThemeMode', () {
      expect(themeModeFromPreference(appThemeLight), ThemeMode.light);
      expect(themeModeFromPreference(appThemeDark), ThemeMode.dark);
      expect(themeModeFromPreference(appThemeSystem), ThemeMode.light);
    });
  });

  group('AppThemePreferenceNotifier', () {
    test('updates local state and shared preferences', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final container = ProviderContainer(
        overrides: [sharedPrefsProvider.overrideWithValue(prefs)],
      );
      addTearDown(container.dispose);

      await container
          .read(appThemePreferenceProvider.notifier)
          .update(appThemeDark);

      expect(container.read(appThemePreferenceProvider), appThemeDark);
      expect(prefs.getString('app_theme_preference'), appThemeDark);
    });
  });
}
