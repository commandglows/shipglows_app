import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:contentflow_app/core/app_language.dart';

void main() {
  group('normalizeAppLanguagePreference', () {
    test('defaults blank values to system', () {
      expect(normalizeAppLanguagePreference(null), appLanguageSystem);
      expect(normalizeAppLanguagePreference('  '), appLanguageSystem);
    });

    test('normalizes regional locales to language preferences', () {
      expect(normalizeAppLanguagePreference('fr-FR'), appLanguageFrench);
      expect(normalizeAppLanguagePreference('en_US'), appLanguageEnglish);
    });
  });

  group('appLocaleFromPreference', () {
    test('returns null for system locale', () {
      expect(appLocaleFromPreference(appLanguageSystem), isNull);
    });

    test('returns explicit locales for supported languages', () {
      expect(appLocaleFromPreference(appLanguageFrench), const Locale('fr'));
      expect(appLocaleFromPreference(appLanguageEnglish), const Locale('en'));
    });
  });

  group('resolveSupportedAppLocale', () {
    test('prefers french when available', () {
      final locale = resolveSupportedAppLocale(const <Locale>[
        Locale('fr', 'FR'),
      ]);
      expect(locale, const Locale('fr'));
    });

    test('falls back to english for unsupported languages', () {
      final locale = resolveSupportedAppLocale(const <Locale>[
        Locale('de', 'DE'),
      ]);
      expect(locale, const Locale('en'));
    });
  });
}
