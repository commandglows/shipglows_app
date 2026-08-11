import 'package:flutter/material.dart';

import '../presentation/theme/app_theme.dart';
import 'router.dart';

class ShipGlowsApp extends StatelessWidget {
  const ShipGlowsApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = createShipGlowsRouter();

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'ShipGlows Operations Dashboard',
      routerConfig: router,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
    );
  }
}
