import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/app_diagnostics.dart';
import 'core/app_theme_preference.dart';
import 'core/shared_preferences_provider.dart';
import 'l10n/app_localizations.dart';
import 'providers/providers.dart';
import 'presentation/theme/app_theme.dart';
import 'router.dart';
import 'shipglows/app.dart' as shipglows;
import 'shipglows/auth/auth_provider.dart';
import 'shipglows/auth/firebase_bootstrap.dart';
import 'shipglows/providers/auth_provider.dart';

const _appTarget = String.fromEnvironment(
  'APP_TARGET',
  defaultValue: 'shipglows',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final sharedPreferences = await SharedPreferences.getInstance();
  final authProvider = await bootstrapShipGlowsAuth(
    const FirebaseBootstrapConfiguration.fromEnvironment(),
  );

  runApp(
    buildRootApp(
      sharedPreferences: sharedPreferences,
      diagnostics: AppDiagnostics(),
      authProvider: authProvider,
    ),
  );
}

Widget buildRootApp({
  required SharedPreferences sharedPreferences,
  required AppDiagnostics diagnostics,
  String appTarget = _appTarget,
  ShipGlowsAuthProvider authProvider = const DisabledShipGlowsAuthProvider(),
}) {
  final normalizedTarget = appTarget.trim().toLowerCase();
  final app = switch (normalizedTarget) {
    'legacy' || 'contentflow' => const LegacyShipGlowsApp(),
    _ => const shipglows.ShipGlowsApp(),
  };

  return ProviderScope(
    overrides: [
      sharedPrefsProvider.overrideWithValue(sharedPreferences),
      appDiagnosticsProvider.overrideWithValue(diagnostics),
      shipGlowsAuthProvider.overrideWithValue(authProvider),
    ],
    child: app,
  );
}

class LegacyShipGlowsApp extends ConsumerWidget {
  const LegacyShipGlowsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themePreference = ref.watch(appThemePreferenceProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'ShipGlows Legacy',
      routerConfig: router,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeModeFromPreference(themePreference),
    );
  }
}
