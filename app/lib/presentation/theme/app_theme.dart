import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum AppWindowClass { compact, medium, expanded }

class AppTheme {
  static const _brandBlue = Color(0xFF0070F3);
  static const _success = Color(0xFF08783E);
  static const _warning = Color(0xFF8A4B08);
  static const _critical = Color(0xFFB42318);
  static const _info = Color(0xFF005FCC);

  static Color get approveColor => _success;
  static Color get rejectColor => _critical;
  static Color get editColor => _info;
  static Color get warningColor => _warning;
  static Color get infoColor => _info;

  static ThemeData get lightTheme => _buildTheme(Brightness.light);

  static ThemeData get darkTheme => _buildTheme(Brightness.dark);

  @visibleForTesting
  static ThemeData buildForTesting(Brightness brightness) {
    return _buildTheme(
      brightness,
      typographyBuilder: (base) => base.apply(fontFamily: 'Inter'),
    );
  }

  static AppThemePalette paletteOf(BuildContext context) {
    final theme = Theme.of(context);
    return theme.extension<AppThemePalette>() ??
        AppThemePalette.fallback(theme.colorScheme);
  }

  static AppThemeTokens tokensOf(BuildContext context) {
    final theme = Theme.of(context);
    return theme.extension<AppThemeTokens>() ??
        AppThemeTokens.forBrightness(theme.brightness);
  }

  static ThemeData _buildTheme(
    Brightness brightness, {
    TextTheme Function(TextTheme base)? typographyBuilder,
  }) {
    final isDark = brightness == Brightness.dark;
    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: isDark ? const Color(0xFFF5F5F5) : const Color(0xFF111111),
      onPrimary: isDark ? const Color(0xFF0A0A0A) : Colors.white,
      secondary: _brandBlue,
      onSecondary: Colors.white,
      error: isDark ? const Color(0xFFFF8080) : _critical,
      onError: isDark ? const Color(0xFF2B0000) : Colors.white,
      surface: isDark ? const Color(0xFF111111) : Colors.white,
      onSurface: isDark ? const Color(0xFFF5F5F5) : const Color(0xFF111111),
      surfaceContainerHighest: isDark
          ? const Color(0xFF1A1A1A)
          : const Color(0xFFF5F5F5),
      onSurfaceVariant: isDark
          ? const Color(0xFFA1A1AA)
          : const Color(0xFF52525B),
      outline: isDark ? const Color(0xFF3F3F46) : const Color(0xFFD4D4D8),
      outlineVariant: isDark
          ? const Color(0xFF27272A)
          : const Color(0xFFE4E4E7),
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: isDark ? Colors.white : const Color(0xFF18181B),
      onInverseSurface: isDark ? const Color(0xFF18181B) : Colors.white,
      inversePrimary: isDark ? const Color(0xFF111111) : Colors.white,
    );
    final tokens = AppThemeTokens.forBrightness(brightness);
    final palette = AppThemePalette.forBrightness(brightness, colorScheme);
    final materialTextTheme = isDark
        ? ThemeData.dark().textTheme
        : ThemeData.light().textTheme;
    final baseTextTheme =
        (typographyBuilder ?? GoogleFonts.interTextTheme)(
          materialTextTheme,
        ).apply(
          bodyColor: colorScheme.onSurface,
          displayColor: colorScheme.onSurface,
        );
    final textTheme = baseTextTheme.copyWith(
      headlineMedium: baseTextTheme.headlineMedium?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: 0.0,
      ),
      titleLarge: baseTextTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: 0.0,
      ),
      titleMedium: baseTextTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: 0.0,
      ),
      bodyMedium: baseTextTheme.bodyMedium?.copyWith(height: 1.5),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: palette.canvas,
      textTheme: textTheme,
      extensions: [palette, tokens],
      focusColor: tokens.focus.ring,
      hoverColor: colorScheme.secondary.withValues(alpha: 0.08),
      splashColor: colorScheme.secondary.withValues(alpha: 0.12),
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleTextStyle: textTheme.titleLarge?.copyWith(
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
          borderRadius: BorderRadius.circular(tokens.radii.card),
          side: BorderSide(color: colorScheme.outline),
        ),
      ),
      dividerTheme: DividerThemeData(color: colorScheme.outline, thickness: 1),
      navigationBarTheme: NavigationBarThemeData(
        height: tokens.navigation.mobileBarHeight,
        backgroundColor: colorScheme.surface,
        indicatorColor: colorScheme.secondary.withValues(alpha: 0.14),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: colorScheme.surface,
        indicatorColor: colorScheme.secondary.withValues(alpha: 0.14),
        minWidth: tokens.navigation.railWidth,
        minExtendedWidth: tokens.navigation.expandedRailWidth,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colorScheme.surfaceContainerHighest,
        selectedColor: colorScheme.secondary.withValues(alpha: 0.14),
        side: WidgetStateBorderSide.resolveWith(
          (states) => states.contains(WidgetState.focused)
              ? BorderSide(color: tokens.focus.ring, width: tokens.focus.width)
              : BorderSide(color: colorScheme.outline),
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(tokens.radii.pill),
        ),
        labelStyle: textTheme.labelMedium?.copyWith(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w600,
        ),
        padding: EdgeInsets.symmetric(
          horizontal: tokens.spacing.sm,
          vertical: tokens.spacing.xxs,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: palette.inputFill,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(tokens.radii.control),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(tokens.radii.control),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(tokens.radii.control),
          borderSide: BorderSide(
            color: tokens.focus.ring,
            width: tokens.focus.width,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style:
            FilledButton.styleFrom(
              backgroundColor: colorScheme.primary,
              foregroundColor: colorScheme.onPrimary,
              minimumSize: Size(0, tokens.minimumTarget),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(tokens.radii.control),
              ),
              padding: EdgeInsets.symmetric(horizontal: tokens.spacing.md),
            ).copyWith(
              side: WidgetStateProperty.resolveWith(
                (states) => states.contains(WidgetState.focused)
                    ? BorderSide(
                        color: tokens.focus.ring,
                        width: tokens.focus.width,
                      )
                    : BorderSide.none,
              ),
            ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style:
            OutlinedButton.styleFrom(
              foregroundColor: colorScheme.onSurface,
              minimumSize: Size(0, tokens.minimumTarget),
              side: BorderSide(color: colorScheme.outline),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(tokens.radii.control),
              ),
              padding: EdgeInsets.symmetric(horizontal: tokens.spacing.md),
            ).copyWith(
              side: WidgetStateProperty.resolveWith(
                (states) => states.contains(WidgetState.focused)
                    ? BorderSide(
                        color: tokens.focus.ring,
                        width: tokens.focus.width,
                      )
                    : BorderSide(color: colorScheme.outline),
              ),
            ),
      ),
      textButtonTheme: TextButtonThemeData(
        style:
            TextButton.styleFrom(
              foregroundColor: colorScheme.onSurfaceVariant,
              minimumSize: Size(0, tokens.minimumTarget),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(tokens.radii.control),
              ),
            ).copyWith(
              side: WidgetStateProperty.resolveWith(
                (states) => states.contains(WidgetState.focused)
                    ? BorderSide(
                        color: tokens.focus.ring,
                        width: tokens.focus.width,
                      )
                    : BorderSide.none,
              ),
            ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: ButtonStyle(
          minimumSize: WidgetStatePropertyAll(
            Size.square(tokens.minimumTarget),
          ),
          side: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.focused)
                ? BorderSide(
                    color: tokens.focus.ring,
                    width: tokens.focus.width,
                  )
                : BorderSide.none,
          ),
          shape: const WidgetStatePropertyAll(CircleBorder()),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: colorScheme.onSurfaceVariant,
        tileColor: Colors.transparent,
        minTileHeight: tokens.minimumTarget,
        contentPadding: EdgeInsets.symmetric(horizontal: tokens.spacing.md),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: palette.elevatedSurface,
        contentTextStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurface,
        ),
        behavior: SnackBarBehavior.floating,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colorScheme.secondary,
      ),
    );
  }

  static Color colorForContentType(String type) {
    return switch (type) {
      'Article' => const Color(0xFF6C5CE7),
      'Social' => _info,
      'Newsletter' => const Color(0xFFFDAA5E),
      'Video' => _critical,
      'Reel' => const Color(0xFFE84393),
      'Short' => const Color(0xFFFF6B6B),
      _ => _brandBlue,
    };
  }
}

class AppThemeTokens extends ThemeExtension<AppThemeTokens> {
  const AppThemeTokens({
    required this.spacing,
    required this.density,
    required this.radii,
    required this.breakpoints,
    required this.navigation,
    required this.minimumTarget,
    required this.cockpit,
    required this.conversation,
    required this.focus,
    required this.health,
    required this.access,
    required this.execution,
    required this.motion,
  });

  final AppSpacingTokens spacing;
  final AppDensityTokens density;
  final AppRadiiTokens radii;
  final AppBreakpointTokens breakpoints;
  final AppNavigationTokens navigation;
  final double minimumTarget;
  final AppCockpitTokens cockpit;
  final AppConversationTokens conversation;
  final AppFocusTokens focus;
  final AppHealthColors health;
  final AppAccessColors access;
  final AppExecutionColors execution;
  final AppMotionTokens motion;

  factory AppThemeTokens.forBrightness(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final healthy = isDark ? const Color(0xFF4ADE80) : const Color(0xFF08783E);
    final warning = isDark ? const Color(0xFFFDBA74) : const Color(0xFF8A4B08);
    final critical = isDark ? const Color(0xFFFF8080) : const Color(0xFFB42318);
    final info = isDark ? const Color(0xFF60A5FA) : const Color(0xFF005FCC);
    final muted = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF52525B);

    return AppThemeTokens(
      spacing: const AppSpacingTokens(),
      density: const AppDensityTokens(),
      radii: const AppRadiiTokens(),
      breakpoints: const AppBreakpointTokens(),
      navigation: const AppNavigationTokens(),
      minimumTarget: 48,
      cockpit: const AppCockpitTokens(),
      conversation: const AppConversationTokens(),
      focus: const AppFocusTokens(ring: Color(0xFF0070F3)),
      health: AppHealthColors(
        healthy: healthy,
        warning: warning,
        critical: critical,
        unknown: muted,
      ),
      access: AppAccessColors(
        granted: healthy,
        suspended: warning,
        lost: critical,
      ),
      execution: AppExecutionColors(
        queued: muted,
        running: info,
        awaitingApproval: warning,
        completed: healthy,
        failed: critical,
      ),
      motion: const AppMotionTokens(),
    );
  }

  @override
  AppThemeTokens copyWith({
    AppSpacingTokens? spacing,
    AppDensityTokens? density,
    AppRadiiTokens? radii,
    AppBreakpointTokens? breakpoints,
    AppNavigationTokens? navigation,
    double? minimumTarget,
    AppCockpitTokens? cockpit,
    AppConversationTokens? conversation,
    AppFocusTokens? focus,
    AppHealthColors? health,
    AppAccessColors? access,
    AppExecutionColors? execution,
    AppMotionTokens? motion,
  }) {
    return AppThemeTokens(
      spacing: spacing ?? this.spacing,
      density: density ?? this.density,
      radii: radii ?? this.radii,
      breakpoints: breakpoints ?? this.breakpoints,
      navigation: navigation ?? this.navigation,
      minimumTarget: minimumTarget ?? this.minimumTarget,
      cockpit: cockpit ?? this.cockpit,
      conversation: conversation ?? this.conversation,
      focus: focus ?? this.focus,
      health: health ?? this.health,
      access: access ?? this.access,
      execution: execution ?? this.execution,
      motion: motion ?? this.motion,
    );
  }

  @override
  AppThemeTokens lerp(covariant AppThemeTokens? other, double t) {
    if (other == null) return this;
    return t < 0.5 ? this : other;
  }
}

class AppSpacingTokens {
  const AppSpacingTokens();

  final double xxs = 4;
  final double xs = 8;
  final double sm = 12;
  final double md = 16;
  final double lg = 24;
  final double xl = 32;
  final double xxl = 48;
}

class AppDensityTokens {
  const AppDensityTokens();

  final double compact = -1;
  final double comfortable = 0;
  final double spacious = 1;
}

class AppRadiiTokens {
  const AppRadiiTokens();

  final double control = 8;
  final double card = 12;
  final double dialog = 16;
  final double pill = 999;
}

class AppBreakpointTokens {
  const AppBreakpointTokens();

  final double compact = 600;
  final double tablet = 1024;
  final double desktop = 1280;

  AppWindowClass classify(double width) {
    if (width < compact) return AppWindowClass.compact;
    if (width < desktop) return AppWindowClass.medium;
    return AppWindowClass.expanded;
  }
}

class AppNavigationTokens {
  const AppNavigationTokens();

  final double mobileBarHeight = 64;
  final double railWidth = 72;
  final double expandedRailWidth = 256;
}

class AppCockpitTokens {
  const AppCockpitTokens();

  final double cardMinWidth = 280;
  final double healthCellMinWidth = 104;
  final double contentMaxWidth = 1440;
}

class AppConversationTokens {
  const AppConversationTokens();

  final double panelMinHeight = 320;
  final double panelPreferredHeight = 560;
  final double messageMaxWidth = 760;
  final double composerMinHeight = 48;
}

class AppFocusTokens {
  const AppFocusTokens({required this.ring});

  final Color ring;
  final double width = 2;
  final double offset = 2;
}

class AppHealthColors {
  const AppHealthColors({
    required this.healthy,
    required this.warning,
    required this.critical,
    required this.unknown,
  });

  final Color healthy;
  final Color warning;
  final Color critical;
  final Color unknown;
}

class AppAccessColors {
  const AppAccessColors({
    required this.granted,
    required this.suspended,
    required this.lost,
  });

  final Color granted;
  final Color suspended;
  final Color lost;
}

class AppExecutionColors {
  const AppExecutionColors({
    required this.queued,
    required this.running,
    required this.awaitingApproval,
    required this.completed,
    required this.failed,
  });

  final Color queued;
  final Color running;
  final Color awaitingApproval;
  final Color completed;
  final Color failed;
}

class AppMotionTokens {
  const AppMotionTokens();

  final Duration fast = const Duration(milliseconds: 120);
  final Duration standard = const Duration(milliseconds: 200);
  final Duration deliberate = const Duration(milliseconds: 320);
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

  factory AppThemePalette.forBrightness(
    Brightness brightness,
    ColorScheme scheme,
  ) {
    return brightness == Brightness.dark
        ? AppThemePalette.dark(scheme)
        : AppThemePalette.light(scheme);
  }

  factory AppThemePalette.dark(ColorScheme scheme) {
    return AppThemePalette(
      canvas: const Color(0xFF0A0A0A),
      surface: scheme.surface,
      elevatedSurface: const Color(0xFF1A1A1A),
      mutedSurface: const Color(0xFF18181B),
      inputFill: const Color(0xFF18181B),
      borderSubtle: const Color(0xFF27272A),
      heroGradient: const [
        Color(0xFF0A0A0A),
        Color(0xFF111827),
        Color(0xFF172554),
      ],
    );
  }

  factory AppThemePalette.light(ColorScheme scheme) {
    return AppThemePalette(
      canvas: const Color(0xFFFAFAFA),
      surface: scheme.surface,
      elevatedSurface: const Color(0xFFF5F5F5),
      mutedSurface: const Color(0xFFF4F4F5),
      inputFill: const Color(0xFFF5F5F5),
      borderSubtle: const Color(0xFFE4E4E7),
      heroGradient: const [
        Color(0xFFFFFFFF),
        Color(0xFFF8FAFC),
        Color(0xFFEFF6FF),
      ],
    );
  }

  factory AppThemePalette.fallback(ColorScheme scheme) {
    return AppThemePalette.forBrightness(scheme.brightness, scheme);
  }

  @override
  AppThemePalette copyWith({
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
  AppThemePalette lerp(covariant AppThemePalette? other, double t) {
    if (other == null) return this;
    return AppThemePalette(
      canvas: Color.lerp(canvas, other.canvas, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      elevatedSurface: Color.lerp(elevatedSurface, other.elevatedSurface, t)!,
      mutedSurface: Color.lerp(mutedSurface, other.mutedSurface, t)!,
      inputFill: Color.lerp(inputFill, other.inputFill, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
      heroGradient: List<Color>.generate(
        heroGradient.length,
        (index) =>
            Color.lerp(heroGradient[index], other.heroGradient[index], t)!,
      ),
    );
  }
}
