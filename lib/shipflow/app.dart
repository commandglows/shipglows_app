import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'router.dart';

class ShipFlowApp extends StatelessWidget {
  const ShipFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = createShipFlowRouter();
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF0D4A5A),
      brightness: Brightness.light,
    );

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'ShipFlow Operations Dashboard',
      routerConfig: router,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: colorScheme,
        textTheme: GoogleFonts.ibmPlexSansTextTheme(),
      ),
    );
  }
}
