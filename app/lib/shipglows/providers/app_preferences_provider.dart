import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/shared_preferences_provider.dart';

const _themePreferenceKey = 'shipglows.preferences.theme';

enum ShipGlowsThemePreference {
  system,
  light,
  dark;

  static ShipGlowsThemePreference fromStoredValue(String? value) {
    return switch (value?.trim().toLowerCase()) {
      'light' => ShipGlowsThemePreference.light,
      'dark' => ShipGlowsThemePreference.dark,
      _ => ShipGlowsThemePreference.system,
    };
  }

  ThemeMode get themeMode => switch (this) {
    ShipGlowsThemePreference.system => ThemeMode.system,
    ShipGlowsThemePreference.light => ThemeMode.light,
    ShipGlowsThemePreference.dark => ThemeMode.dark,
  };
}

final shipGlowsThemePreferenceProvider =
    NotifierProvider<
      ShipGlowsThemePreferenceController,
      ShipGlowsThemePreference
    >(ShipGlowsThemePreferenceController.new);

class ShipGlowsThemePreferenceController
    extends Notifier<ShipGlowsThemePreference> {
  SharedPreferences? _preferences;

  @override
  ShipGlowsThemePreference build() {
    try {
      _preferences = ref.read(sharedPrefsProvider);
    } catch (_) {
      // Small widget tests can omit the bootstrap override. Production supplies
      // SharedPreferences before ShipGlowsApp is mounted.
    }
    return ShipGlowsThemePreference.fromStoredValue(
      _preferences?.getString(_themePreferenceKey),
    );
  }

  Future<void> select(ShipGlowsThemePreference preference) async {
    if (preference == state) return;
    state = preference;
    await _preferences?.setString(_themePreferenceKey, preference.name);
  }
}
