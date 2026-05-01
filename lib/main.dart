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
import 'shipflow/app.dart' as shipflow;

const _appTarget = String.fromEnvironment(
  'APP_TARGET',
  defaultValue: 'contentflow',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final sharedPreferences = await SharedPreferences.getInstance();

  runApp(
    buildRootApp(
      sharedPreferences: sharedPreferences,
      diagnostics: AppDiagnostics(),
    ),
  );
}

Widget buildRootApp({
  required SharedPreferences sharedPreferences,
  required AppDiagnostics diagnostics,
  String appTarget = _appTarget,
}) {
  final app = appTarget == 'shipflow'
      ? const shipflow.ShipFlowApp()
      : const ContentFlowApp();

  return ProviderScope(
    overrides: [
      sharedPrefsProvider.overrideWithValue(sharedPreferences),
      appDiagnosticsProvider.overrideWithValue(diagnostics),
    ],
    child: app,
  );
}

class ContentFlowApp extends ConsumerWidget {
  const ContentFlowApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themePreference = ref.watch(appThemePreferenceProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'ContentFlow',
      routerConfig: router,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeModeFromPreference(themePreference),
    );
  }
}
