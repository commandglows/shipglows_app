import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'router.dart';

class ShipGlowzApp extends StatelessWidget {
  const ShipGlowzApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = createShipGlowzRouter();

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'ShipGlowz Operations Dashboard',
      routerConfig: router,
      theme: _buildTheme(Brightness.light),
      darkTheme: _buildTheme(Brightness.dark),
      themeMode: ThemeMode.dark,
    );
  }

  ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: isDark ? const Color(0xFFF5F5F5) : const Color(0xFF111111),
      onPrimary: isDark ? const Color(0xFF0A0A0A) : Colors.white,
      secondary: const Color(0xFF0070F3),
      onSecondary: Colors.white,
      error: const Color(0xFFFF5D5D),
      onError: Colors.white,
      surface: isDark ? const Color(0xFF111111) : Colors.white,
      onSurface: isDark ? const Color(0xFFF5F5F5) : const Color(0xFF111111),
      surfaceContainerHighest: isDark
          ? const Color(0xFF1A1A1A)
          : const Color(0xFFF5F5F5),
      onSurfaceVariant: isDark
          ? const Color(0xFFA1A1AA)
          : const Color(0xFF52525B),
      outline: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFE4E4E7),
      outlineVariant: isDark
          ? const Color(0xFF1F1F1F)
          : const Color(0xFFF4F4F5),
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: isDark ? Colors.white : const Color(0xFF18181B),
      onInverseSurface: isDark ? const Color(0xFF18181B) : Colors.white,
      inversePrimary: isDark ? const Color(0xFF111111) : Colors.white,
    );
    final baseTextTheme = GoogleFonts.interTextTheme(
      isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
    ).apply(
      bodyColor: colorScheme.onSurface,
      displayColor: colorScheme.onSurface,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: isDark
          ? const Color(0xFF0A0A0A)
          : const Color(0xFFFAFAFA),
      textTheme: baseTextTheme.copyWith(
        headlineMedium: baseTextTheme.headlineMedium?.copyWith(
          fontWeight: FontWeight.w700,
          letterSpacing: 0,
        ),
        titleLarge: baseTextTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          letterSpacing: 0,
        ),
        titleMedium: baseTextTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
          letterSpacing: 0,
        ),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(height: 1.5),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleTextStyle: baseTextTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: colorScheme.onSurface,
        ),
        iconTheme: IconThemeData(color: colorScheme.onSurfaceVariant),
      ),
      cardTheme: CardThemeData(
        color: colorScheme.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: colorScheme.outline),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: colorScheme.outline,
        thickness: 1,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colorScheme.surfaceContainerHighest,
        selectedColor: colorScheme.secondary.withValues(alpha: 0.14),
        side: BorderSide(color: colorScheme.outline),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: baseTextTheme.labelMedium?.copyWith(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w600,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colorScheme.onSurface,
          side: BorderSide(color: colorScheme.outline),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colorScheme.onSurfaceVariant,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: colorScheme.onSurfaceVariant,
        tileColor: Colors.transparent,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colorScheme.secondary,
      ),
    );
  }
}
