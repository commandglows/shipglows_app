import 'package:flutter/widgets.dart';

const String appLanguageSystem = 'system';
const String appLanguageEnglish = 'en';
const String appLanguageFrench = 'fr';

String normalizeAppLanguagePreference(String? raw) {
  final value = raw?.trim().toLowerCase();
  if (value == null || value.isEmpty) {
    return appLanguageSystem;
  }
  if (value == appLanguageSystem) {
    return appLanguageSystem;
  }
  if (value.startsWith(appLanguageFrench)) {
    return appLanguageFrench;
  }
  if (value.startsWith(appLanguageEnglish)) {
    return appLanguageEnglish;
  }
  return appLanguageSystem;
}

Locale? appLocaleFromPreference(String? raw) {
  return switch (normalizeAppLanguagePreference(raw)) {
    appLanguageFrench => const Locale(appLanguageFrench),
    appLanguageEnglish => const Locale(appLanguageEnglish),
    _ => null,
  };
}

Locale resolveSupportedAppLocale(Iterable<Locale>? requestedLocales) {
  if (requestedLocales != null) {
    for (final locale in requestedLocales) {
      if (locale.languageCode.toLowerCase().startsWith(appLanguageFrench)) {
        return const Locale(appLanguageFrench);
      }
      if (locale.languageCode.toLowerCase().startsWith(appLanguageEnglish)) {
        return const Locale(appLanguageEnglish);
      }
    }
  }
  return const Locale(appLanguageEnglish);
}

String resolvedLocaleTagForPreference(String? raw, Locale systemLocale) {
  final preferredLocale = appLocaleFromPreference(raw);
  if (preferredLocale != null) {
    return preferredLocale.toLanguageTag();
  }
  return resolveSupportedAppLocale([systemLocale]).toLanguageTag();
}
