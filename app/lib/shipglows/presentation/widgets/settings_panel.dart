import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../providers/app_preferences_provider.dart';
import '../../providers/dashboard_provider.dart';
import 'managed_projects_settings_panel.dart';
import 'profile_settings_group.dart';
import 'settings_primitives.dart';

class ShipGlowsSettingsPanel extends ConsumerWidget {
  const ShipGlowsSettingsPanel({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final policy = ref.watch(sourcePathPolicyProvider);
    final themePreference = ref.watch(shipGlowsThemePreferenceProvider);
    final colorScheme = Theme.of(context).colorScheme;
    final tokens = AppTheme.tokensOf(context);

    return ListView(
      shrinkWrap: compact,
      padding: EdgeInsets.all(tokens.spacing.lg),
      children: [
        const ShipGlowsProfileSettingsGroup(),
        SizedBox(height: tokens.spacing.sm),
        const ManagedProjectsSettingsPanel(),
        SizedBox(height: tokens.spacing.sm),
        ShipGlowsSettingsGroup(
          title: 'Appearance',
          children: [
            for (final preference in ShipGlowsThemePreference.values)
              ShipGlowsSettingsRow(
                key: ValueKey('theme-${preference.name}'),
                title: _themeTitle(preference),
                subtitle: _themeSubtitle(preference),
                icon: _themeIcon(preference),
                selected: themePreference == preference,
                onTap: () => ref
                    .read(shipGlowsThemePreferenceProvider.notifier)
                    .select(preference),
              ),
          ],
        ),
        SizedBox(height: tokens.spacing.sm),
        Card(
          child: Padding(
            padding: EdgeInsets.all(tokens.spacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Runtime target',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                SizedBox(height: tokens.spacing.xs),
                Text(
                  policy.isDesktopSupported
                      ? 'Desktop mode supported. Local file reads are enabled.'
                      : 'Web mode detected. Local file reads stay hidden until you open the desktop runtime.',
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: tokens.spacing.sm),
        Card(
          child: Padding(
            padding: EdgeInsets.all(tokens.spacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Allowlisted roots',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                SizedBox(height: tokens.spacing.xs),
                ...policy.allowedRoots.map(
                  (root) => Padding(
                    padding: EdgeInsets.only(bottom: tokens.spacing.sm),
                    child: Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(tokens.spacing.sm),
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(
                          tokens.radii.control,
                        ),
                        border: Border.all(color: colorScheme.outline),
                      ),
                      child: SelectableText(root),
                    ),
                  ),
                ),
                SizedBox(height: tokens.spacing.sm),
                Text('Max file size: ${policy.maxFileBytes} bytes'),
                Text('Max refresh size: ${policy.maxTotalBytes} bytes'),
              ],
            ),
          ),
        ),
        SizedBox(height: tokens.spacing.sm),
        FilledButton.icon(
          onPressed: () => ref.read(dashboardProvider.notifier).refresh(),
          icon: const Icon(Icons.refresh),
          label: const Text('Refresh dashboard'),
        ),
      ],
    );
  }

  String _themeTitle(ShipGlowsThemePreference preference) =>
      switch (preference) {
        ShipGlowsThemePreference.system => 'System theme',
        ShipGlowsThemePreference.light => 'Light theme',
        ShipGlowsThemePreference.dark => 'Dark theme',
      };

  String _themeSubtitle(ShipGlowsThemePreference preference) =>
      switch (preference) {
        ShipGlowsThemePreference.system => 'Follow the operating system',
        ShipGlowsThemePreference.light => 'Always use the light theme',
        ShipGlowsThemePreference.dark => 'Always use the dark theme',
      };

  IconData _themeIcon(ShipGlowsThemePreference preference) =>
      switch (preference) {
        ShipGlowsThemePreference.system => Icons.brightness_auto_outlined,
        ShipGlowsThemePreference.light => Icons.light_mode_outlined,
        ShipGlowsThemePreference.dark => Icons.dark_mode_outlined,
      };
}
