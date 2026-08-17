import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../data/cockpit/cockpit_models.dart';
import '../../data/managed_runner_api.dart';
import '../../providers/managed_cockpit_provider.dart';
import '../../providers/managed_project_selection_provider.dart';
import '../../providers/managed_projects_provider.dart';
import 'managed_project_selector.dart';

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
    label: 'Projets',
    path: '/projects',
    icon: Icons.folder_copy_outlined,
  ),
  _ShipGlowsDestination(
    label: 'Studio',
    path: '/studio',
    icon: Icons.design_services_outlined,
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

class ShipGlowsScaffold extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = AppTheme.tokensOf(context);
    final media = MediaQuery.of(context);
    final windowClass = tokens.breakpoints.classify(media.size.width);
    final path = GoRouterState.of(context).uri.path;
    final selectedIndex = _selectedIndex(path);
    final selectedProject = _selectedProject(ref);
    final content = _Content(title: title, actions: actions, body: body);

    if (windowClass == AppWindowClass.compact) {
      return Scaffold(
        body: SafeArea(child: content),
        bottomNavigationBar: NavigationBar(
          selectedIndex: selectedIndex,
          labelBehavior: tokens.navigation.compactLabelBehaviorFor(
            availableWidth: media.size.width,
            textScaleFactor: media.textScaler.scale(1),
            destinationCount: _destinations.length,
          ),
          onDestinationSelected: (index) =>
              context.go(_destinationPath(index, selectedProject, ref)),
          destinations: [
            for (final destination in _destinations)
              NavigationDestination(
                icon: Semantics(
                  label: destination.label,
                  button: true,
                  child: ExcludeSemantics(child: Icon(destination.icon)),
                ),
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
                  context.go(_destinationPath(index, selectedProject, ref)),
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
      (destination) => switch (destination.path) {
        '/' => path == '/',
        '/studio' => path.endsWith('/studio'),
        _ => path.startsWith(destination.path),
      },
    );
    return index < 0 ? 0 : index;
  }

  CockpitProject? _selectedProject(WidgetRef ref) {
    final selection = ref.watch(managedProjectSelectionProvider);
    final cockpit = ref.watch(managedCockpitSnapshotProvider);
    final registry = ref.watch(managedProjectsProvider);
    final state = switch (cockpit) {
      AsyncData(:final value) => value,
      _ => null,
    };
    final records = switch (registry) {
      AsyncData(:final value) => value,
      _ => const <ManagedProjectRecord>[],
    };
    final availableIds = state?.snapshot?.projects.map((project) => project.id);
    final defaults = records.where(
      (project) => project.isDefault && !project.isArchived,
    );
    final selectedId = resolveManagedProjectId(
      selection: selection,
      availableProjectIds: availableIds ?? const <String>[],
      defaultProjectId: defaults.isEmpty ? null : defaults.first.id,
    );
    if (selectedId == null || state?.snapshot == null) return null;
    for (final project in state!.snapshot!.projects) {
      if (project.id == selectedId) return project;
    }
    return null;
  }

  String _destinationPath(
    int index,
    CockpitProject? selectedProject,
    WidgetRef ref,
  ) {
    final destination = _destinations[index];
    if (destination.path != '/studio') return destination.path;
    final registry = ref.watch(managedProjectsProvider);
    final studioAvailable = switch (registry) {
      AsyncData(:final value) => value.any(
        (project) =>
            project.id == selectedProject?.id && project.studioAvailable,
      ),
      _ => true,
    };
    return selectedProject == null || !studioAvailable
        ? '/projects'
        : managedProjectSurfaceLocation(selectedProject, 'studio');
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
              _PageHeader(
                title: title,
                actions: [const ManagedProjectSelector(), ...actions],
              ),
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
