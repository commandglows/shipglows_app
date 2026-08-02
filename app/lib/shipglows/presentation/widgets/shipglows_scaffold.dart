import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'settings_panel.dart';

class _ShipGlowsNavItem {
  const _ShipGlowsNavItem({
    required this.label,
    required this.path,
    required this.icon,
  });

  final String label;
  final String path;
  final IconData icon;
}

const _navItems = [
  _ShipGlowsNavItem(
    label: 'Overview',
    path: '/',
    icon: Icons.grid_view_rounded,
  ),
  _ShipGlowsNavItem(
    label: 'Diagnostics',
    path: '/diagnostics',
    icon: Icons.monitor_heart_outlined,
  ),
  _ShipGlowsNavItem(
    label: 'Settings',
    path: '/settings',
    icon: Icons.tune_rounded,
  ),
];

class ShipGlowsScaffold extends StatelessWidget {
  const ShipGlowsScaffold({
    required this.title,
    required this.body,
    this.actions = const [],
    super.key,
  });

  final String title;
  final Widget body;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final currentPath = GoRouterState.of(context).uri.path;
    final isDesktop = MediaQuery.sizeOf(context).width >= 980;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.scaffoldBackgroundColor,
              colorScheme.surface.withValues(alpha: 0.4),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1400),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: isDesktop
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _DesktopNav(currentPath: currentPath),
                          const SizedBox(width: 20),
                          Expanded(
                            child: _ContentFrame(
                              title: title,
                              body: body,
                              actions: actions,
                            ),
                          ),
                        ],
                      )
                    : Column(
                        children: [
                          _TopBar(title: title, actions: actions),
                          const SizedBox(height: 16),
                          _MobileNav(currentPath: currentPath),
                          const SizedBox(height: 16),
                          Expanded(child: _SurfaceFrame(child: body)),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ContentFrame extends StatelessWidget {
  const _ContentFrame({
    required this.title,
    required this.body,
    required this.actions,
  });

  final String title;
  final Widget body;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _TopBar(title: title, actions: actions),
        const SizedBox(height: 16),
        Expanded(child: _SurfaceFrame(child: body)),
      ],
    );
  }
}

class _SurfaceFrame extends StatelessWidget {
  const _SurfaceFrame({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colorScheme.outline),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: child,
      ),
    );
  }
}

class _DesktopNav extends StatelessWidget {
  const _DesktopNav({required this.currentPath});

  final String currentPath;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return SizedBox(
      width: 240,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colorScheme.outline),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: colorScheme.outline),
                  color: colorScheme.surfaceContainerHighest,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: colorScheme.primary,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Icon(
                        Icons.terminal_rounded,
                        size: 16,
                        color: colorScheme.onPrimary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'ShipGlows',
                            style: theme.textTheme.titleMedium,
                          ),
                          Text(
                            'Infrastructure Console',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              for (final item in _navItems)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: _NavButton(
                    item: item,
                    selected: currentPath == item.path,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MobileNav extends StatelessWidget {
  const _MobileNav({required this.currentPath});

  final String currentPath;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final item in _navItems) ...[
            _NavButton(item: item, selected: currentPath == item.path),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({required this.item, required this.selected});

  final _ShipGlowsNavItem item;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final opensInlineSettings = item.path == '/settings';
    return Material(
      color: selected
          ? colorScheme.surfaceContainerHighest
          : Colors.transparent,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () {
          if (opensInlineSettings) {
            _openSettingsPanel(context);
            return;
          }
          context.go(item.path);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: selected ? colorScheme.outline : Colors.transparent,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                item.icon,
                size: 18,
                color: selected
                    ? colorScheme.onSurface
                    : colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 10),
              Text(
                item.label,
                style: TextStyle(
                  color: selected
                      ? colorScheme.onSurface
                      : colorScheme.onSurfaceVariant,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openSettingsPanel(BuildContext context) async {
    final isDesktop = MediaQuery.sizeOf(context).width >= 980;
    if (isDesktop) {
      await showDialog<void>(
        context: context,
        builder: (context) => Dialog(
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 32,
            vertical: 24,
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760, maxHeight: 720),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 12, 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Settings',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                      IconButton(
                        tooltip: 'Close',
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                const Expanded(child: ShipGlowsSettingsPanel(compact: true)),
              ],
            ),
          ),
        ),
      );
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.8,
          child: const ShipGlowsSettingsPanel(compact: true),
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.title, required this.actions});

  final String title;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colorScheme.outline),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          runSpacing: 12,
          spacing: 12,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text(
                  'Local project health, diagnostics, and release posture',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            Wrap(spacing: 8, runSpacing: 8, children: actions),
          ],
        ),
      ),
    );
  }
}
