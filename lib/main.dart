import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/app_theme_preference.dart';
import 'providers/providers.dart';
import 'presentation/theme/app_theme.dart';
import 'router.dart';
import 'shipflow/app.dart' as shipflow;

const _appTarget = String.fromEnvironment(
  'APP_TARGET',
  defaultValue: 'contentflow',
);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final app = _appTarget == 'shipflow'
      ? const shipflow.ShipFlowApp()
      : const ContentFlowApp();
  runApp(ProviderScope(child: app));
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
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeModeFromPreference(themePreference),
    );
  }
}
