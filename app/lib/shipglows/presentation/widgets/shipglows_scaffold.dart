import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../presentation/theme/app_theme.dart';

class _ShipGlowsDestination {
  const _ShipGlowsDestination({
    required this.label,
    required this.path,
    required this.icon,
  });

  final String label;
  final String path;
  final IconData icon;
}

const _destinations = [
  _ShipGlowsDestination(
    label: 'Cockpit',
    path: '/',
    icon: Icons.grid_view_rounded,
  ),
  _ShipGlowsDestination(
    label: 'Diagnostics',
    path: '/diagnostics',
    icon: Icons.monitor_heart_outlined,
  ),
  _ShipGlowsDestination(
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
    final tokens = AppTheme.tokensOf(context);
    final windowClass = tokens.breakpoints.classify(
      MediaQuery.sizeOf(context).width,
    );
    final path = GoRouterState.of(context).uri.path;
    final selectedIndex = _selectedIndex(path);
    final content = _Content(title: title, actions: actions, body: body);

    if (windowClass == AppWindowClass.compact) {
      return Scaffold(
        body: SafeArea(child: content),
        bottomNavigationBar: NavigationBar(
          selectedIndex: selectedIndex,
          onDestinationSelected: (index) =>
              context.go(_destinations[index].path),
          destinations: [
            for (final destination in _destinations)
              NavigationDestination(
                icon: Icon(destination.icon),
                label: destination.label,
              ),
          ],
        ),
      );
    }

    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            NavigationRail(
              extended: windowClass == AppWindowClass.expanded,
              selectedIndex: selectedIndex,
              onDestinationSelected: (index) =>
                  context.go(_destinations[index].path),
              leading: Padding(
                padding: EdgeInsets.symmetric(vertical: tokens.spacing.md),
                child: const Icon(Icons.auto_awesome_mosaic_outlined),
              ),
              destinations: [
                for (final destination in _destinations)
                  NavigationRailDestination(
                    icon: Icon(destination.icon),
                    label: Text(destination.label),
                  ),
              ],
            ),
            VerticalDivider(width: tokens.spacing.xxs),
            Expanded(child: content),
          ],
        ),
      ),
    );
  }

  int _selectedIndex(String path) {
    final index = _destinations.indexWhere(
      (destination) => destination.path == '/'
          ? path == '/'
          : path.startsWith(destination.path),
    );
    return index < 0 ? 0 : index;
  }
}

class _Content extends StatelessWidget {
  const _Content({
    required this.title,
    required this.actions,
    required this.body,
  });

  final String title;
  final List<Widget> actions;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: tokens.cockpit.contentMaxWidth),
        child: Padding(
          padding: EdgeInsets.all(tokens.spacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _PageHeader(title: title, actions: actions),
              SizedBox(height: tokens.spacing.md),
              Expanded(child: body),
            ],
          ),
        ),
      ),
    );
  }
}

class _PageHeader extends StatelessWidget {
  const _PageHeader({required this.title, required this.actions});

  final String title;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: tokens.spacing.sm,
      runSpacing: tokens.spacing.sm,
      children: [
        Semantics(
          header: true,
          child: Text(title, style: Theme.of(context).textTheme.headlineSmall),
        ),
        Wrap(
          spacing: tokens.spacing.xs,
          runSpacing: tokens.spacing.xs,
          children: actions,
        ),
      ],
    );
  }
}
