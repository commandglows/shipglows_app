import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../presentation/theme/app_theme.dart';
import 'auth/shipglows_auth_gate.dart';
import 'providers/app_preferences_provider.dart';
import 'router.dart';

class ShipGlowsApp extends ConsumerStatefulWidget {
  const ShipGlowsApp({super.key});

  @override
  ConsumerState<ShipGlowsApp> createState() => _ShipGlowsAppState();
}

class _ShipGlowsAppState extends ConsumerState<ShipGlowsApp> {
  late final _router = createShipGlowsRouter();

  @override
  Widget build(BuildContext context) {
    final themePreference = ref.watch(shipGlowsThemePreferenceProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'ShipGlows Operations Dashboard',
      routerConfig: _router,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themePreference.themeMode,
      builder: (context, child) => ShipGlowsAuthGate(child: child!),
    );
  }
}
