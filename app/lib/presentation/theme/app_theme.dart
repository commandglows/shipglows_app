import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const _primaryColor = Color(0xFF6C5CE7);
  static const _secondaryColor = Color(0xFF00B894);
  static const _errorColor = Color(0xFFE17055);
  static const _approveColor = Color(0xFF00B894);
  static const _rejectColor = Color(0xFFE17055);
  static const _editColor = Color(0xFF0984E3);
  static const _warningColor = Color(0xFFF39C4A);
  static const _infoColor = Color(0xFF3C82F6);

  static Color get approveColor => _approveColor;
  static Color get rejectColor => _rejectColor;
  static Color get editColor => _editColor;
  static Color get warningColor => _warningColor;
  static Color get infoColor => _infoColor;

  static ThemeData get lightTheme => _buildTheme(Brightness.light);

  static ThemeData get darkTheme => _buildTheme(Brightness.dark);

  static AppThemePalette paletteOf(BuildContext context) {
    final theme = Theme.of(context);
    final extension = theme.extension<AppThemePalette>();
    return extension ?? AppThemePalette.fallback(theme.colorScheme);
  }

  static ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final scheme = ColorScheme.fromSeed(
      seedColor: _primaryColor,
      brightness: brightness,
    ).copyWith(
      primary: _primaryColor,
      secondary: _secondaryColor,
      error: _errorColor,
      surface: isDark ? const Color(0xFF161B2B) : const Color(0xFFF7F4EF),
      surfaceContainerHighest: isDark
          ? const Color(0xFF23293B)
          : const Color(0xFFEAE4DA),
      onSurface: isDark ? const Color(0xFFF7F5F2) : const Color(0xFF19161F),
      onSurfaceVariant: isDark
          ? const Color(0xFFB1B8CA)
          : const Color(0xFF645D6F),
      outline: isDark ? const Color(0xFF50586E) : const Color(0xFFC8BFCD),
      outlineVariant: isDark
          ? const Color(0xFF394157)
          : const Color(0xFFDAD1DE),
    );
    final textTheme = GoogleFonts.interTextTheme(
      isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
    ).apply(
      bodyColor: scheme.onSurface,
      displayColor: scheme.onSurface,
    );
    final palette = isDark
        ? AppThemePalette.dark(scheme)
        : AppThemePalette.light(scheme);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: palette.canvas,
      textTheme: textTheme,
      extensions: [palette],
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
        ),
        iconTheme: IconThemeData(color: scheme.onSurface),
      ),
      cardTheme: CardThemeData(
        color: palette.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        margin: EdgeInsets.zero,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: palette.surface,
        indicatorColor: scheme.primary.withValues(alpha: 0.14),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => textTheme.labelSmall?.copyWith(
            color: states.contains(WidgetState.selected)
                ? scheme.primary
                : scheme.onSurfaceVariant,
          ),
        ),
      ),
      drawerTheme: DrawerThemeData(
        backgroundColor: palette.surface,
        surfaceTintColor: Colors.transparent,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: scheme.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: palette.elevatedSurface,
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: scheme.onSurface,
        ),
        behavior: SnackBarBehavior.floating,
      ),
      dividerTheme: DividerThemeData(
        color: scheme.outlineVariant.withValues(alpha: 0.55),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: palette.inputFill,
        labelStyle: TextStyle(color: scheme.onSurfaceVariant),
        hintStyle: TextStyle(color: scheme.onSurfaceVariant),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: scheme.primary, width: 1.5),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          foregroundColor: Colors.white,
          backgroundColor: scheme.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: scheme.onSurface,
          side: BorderSide(color: scheme.outlineVariant),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: palette.mutedSurface,
        selectedColor: scheme.primary.withValues(alpha: 0.12),
        side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.7)),
        labelStyle: textTheme.bodySmall?.copyWith(color: scheme.onSurface),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: scheme.primary),
    );
  }

  static Color colorForContentType(String type) {
    return switch (type) {
      'Article' => const Color(0xFF6C5CE7),
      'Social' => const Color(0xFF0984E3),
      'Newsletter' => const Color(0xFFFDAA5E),
      'Video' => const Color(0xFFE17055),
      'Reel' => const Color(0xFFE84393),
      'Short' => const Color(0xFFFF6B6B),
      _ => _primaryColor,
    };
  }
}

class AppThemePalette extends ThemeExtension<AppThemePalette> {
  const AppThemePalette({
    required this.canvas,
    required this.surface,
    required this.elevatedSurface,
    required this.mutedSurface,
    required this.inputFill,
    required this.borderSubtle,
    required this.heroGradient,
  });

  final Color canvas;
  final Color surface;
  final Color elevatedSurface;
  final Color mutedSurface;
  final Color inputFill;
  final Color borderSubtle;
  final List<Color> heroGradient;

  factory AppThemePalette.dark(ColorScheme scheme) {
    return AppThemePalette(
      canvas: const Color(0xFF0D1020),
      surface: scheme.surface,
      elevatedSurface: const Color(0xFF1C2234),
      mutedSurface: const Color(0xFF151A2A),
      inputFill: const Color(0xFF131A2B),
      borderSubtle: Colors.white.withValues(alpha: 0.08),
      heroGradient: const [
        Color(0xFF0A1020),
        Color(0xFF12192C),
        Color(0xFF1E2235),
      ],
    );
  }

  factory AppThemePalette.light(ColorScheme scheme) {
    return AppThemePalette(
      canvas: const Color(0xFFFCF8F2),
      surface: scheme.surface,
      elevatedSurface: const Color(0xFFFFFFFF),
      mutedSurface: const Color(0xFFF2ECE2),
      inputFill: const Color(0xFFFBF6EE),
      borderSubtle: const Color(0x1419161F),
      heroGradient: const [
        Color(0xFFFFFCF8),
        Color(0xFFF8F1E6),
        Color(0xFFEFE7F6),
      ],
    );
  }

  factory AppThemePalette.fallback(ColorScheme scheme) {
    return scheme.brightness == Brightness.dark
        ? AppThemePalette.dark(scheme)
        : AppThemePalette.light(scheme);
  }

  @override
  ThemeExtension<AppThemePalette> copyWith({
    Color? canvas,
    Color? surface,
    Color? elevatedSurface,
    Color? mutedSurface,
    Color? inputFill,
    Color? borderSubtle,
    List<Color>? heroGradient,
  }) {
    return AppThemePalette(
      canvas: canvas ?? this.canvas,
      surface: surface ?? this.surface,
      elevatedSurface: elevatedSurface ?? this.elevatedSurface,
      mutedSurface: mutedSurface ?? this.mutedSurface,
      inputFill: inputFill ?? this.inputFill,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      heroGradient: heroGradient ?? this.heroGradient,
    );
  }

  @override
  ThemeExtension<AppThemePalette> lerp(
    covariant ThemeExtension<AppThemePalette>? other,
    double t,
  ) {
    if (other is! AppThemePalette) return this;
    return AppThemePalette(
      canvas: Color.lerp(canvas, other.canvas, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      elevatedSurface:
          Color.lerp(elevatedSurface, other.elevatedSurface, t)!,
      mutedSurface: Color.lerp(mutedSurface, other.mutedSurface, t)!,
      inputFill: Color.lerp(inputFill, other.inputFill, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
      heroGradient: List<Color>.generate(
        heroGradient.length,
        (index) => Color.lerp(
          heroGradient[index],
          other.heroGradient[index],
          t,
        )!,
      ),
    );
  }
}
