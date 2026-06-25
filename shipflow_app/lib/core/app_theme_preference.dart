import 'package:flutter/material.dart';

const String appThemeSystem = 'system';
const String appThemeLight = 'light';
const String appThemeDark = 'dark';

String normalizeAppThemePreference(String? raw) {
  final value = raw?.trim().toLowerCase();
  return switch (value) {
    appThemeLight => appThemeLight,
    appThemeDark => appThemeDark,
    _ => appThemeSystem,
  };
}

ThemeMode themeModeFromPreference(String? raw) {
  return switch (normalizeAppThemePreference(raw)) {
    appThemeLight => ThemeMode.light,
    appThemeDark => ThemeMode.dark,
    // Keep "system" as a persisted preference label, but render light mode by
    // default to avoid unreadable light-surface screens on dark OS profiles.
    _ => ThemeMode.light,
  };
}
