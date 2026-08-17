import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shipglows_app/core/shared_preferences_provider.dart';
import 'package:shipglows_app/domain/project_health/project_health_models.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/managed_project_selector.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/managed_projects_settings_panel.dart';
import 'package:shipglows_app/shipglows/providers/managed_cockpit_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_project_selection_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_projects_provider.dart';

void main() {
  testWidgets('selects a runner project and opens its project surface', (
    tester,
  ) async {
    final harness = await _pump(
      tester,
      childBuilder: (router) => MaterialApp.router(routerConfig: router),
    );

    await tester.tap(find.byTooltip('Changer de projet'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('GoCharbon'));
    await tester.pumpAndSettle();

    expect(find.text('project=GoCharbon id=gocharbon'), findsOneWidget);
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.selected('gocharbon'),
    );
  });

  testWidgets('switches explicitly between none and automatic selection', (
    tester,
  ) async {
    final harness = await _pump(
      tester,
      initialSelection: 'gocharbon',
      childBuilder: (router) => MaterialApp.router(routerConfig: router),
    );

    await tester.tap(find.byTooltip('Changer de projet'));
    await tester.pumpAndSettle();
    await tester.tap(
      find.byKey(const ValueKey('managed-project-selection-none')),
    );
    await tester.pumpAndSettle();
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.none(),
    );
    expect(find.text('Aucun projet'), findsOneWidget);

    await tester.tap(find.byTooltip('Changer de projet'));
    await tester.pumpAndSettle();
    await tester.tap(
      find.byKey(const ValueKey('managed-project-selection-auto')),
    );
    await tester.pumpAndSettle();
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );
  });

  testWidgets('links Settings to the unified project management page', (
    tester,
  ) async {
    final harness = await _pump(
      tester,
      initialSelection: 'shipglows-app',
      childBuilder: (_) => const MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(child: ManagedProjectsSettingsPanel()),
        ),
      ),
    );

    expect(find.text('ShipGlows'), findsOneWidget);
    expect(find.text('GoCharbon'), findsOneWidget);
    expect(find.text('Actif'), findsOneWidget);
    final manage = tester.widget<OutlinedButton>(
      find.widgetWithText(OutlinedButton, 'Gérer les projets'),
    );
    expect(manage.onPressed, isNotNull);
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.selected('shipglows-app'),
    );
  });

  testWidgets('exposes none and automatic commands in Settings', (
    tester,
  ) async {
    final harness = await _pump(
      tester,
      initialSelection: 'shipglows-app',
      childBuilder: (_) => const MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(child: ManagedProjectsSettingsPanel()),
        ),
      ),
    );

    await tester.tap(
      find.byKey(const ValueKey('managed-project-selection-none')),
    );
    await tester.pump();
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.none(),
    );
    expect(
      find.text('Cockpit, Studio et Workspace restent sans projet actif.'),
      findsOneWidget,
    );

    await tester.tap(
      find.byKey(const ValueKey('managed-project-selection-auto')),
    );
    await tester.pump();
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );
  });

  testWidgets('makes an expired session explicit in the selector', (
    tester,
  ) async {
    await _pump(
      tester,
      managed: const ManagedCockpitState.sessionExpired(),
      childBuilder: (_) => MaterialApp(
        home: Scaffold(
          appBar: AppBar(actions: const [ManagedProjectSelector()]),
        ),
      ),
    );

    expect(find.byTooltip('Session expirée · réessayer'), findsOneWidget);
  });
}

class _Harness {
  const _Harness(this.container);

  final ProviderContainer container;
}

Future<_Harness> _pump(
  WidgetTester tester, {
  ManagedCockpitState? managed,
  String? initialSelection,
  required Widget Function(GoRouter router) childBuilder,
}) async {
  SharedPreferences.setMockInitialValues(<String, Object>{
    'shipglows.managed.activeProjectId': ?initialSelection,
  });
  final preferences = await SharedPreferences.getInstance();
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) =>
            Scaffold(appBar: AppBar(actions: const [ManagedProjectSelector()])),
      ),
      GoRoute(
        path: '/project/:project',
        builder: (context, state) => Scaffold(
          body: Text(
            'project=${Uri.decodeComponent(state.pathParameters['project']!)} '
            'id=${state.uri.queryParameters['runnerProjectId']}',
          ),
        ),
      ),
      GoRoute(
        path: '/projects',
        builder: (context, state) => const Scaffold(body: Text('projects')),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const Scaffold(body: Text('settings')),
      ),
    ],
  );
  addTearDown(router.dispose);

  late ProviderContainer container;
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        sharedPrefsProvider.overrideWithValue(preferences),
        managedCockpitSnapshotProvider.overrideWith(
          (ref) async => managed ?? ManagedCockpitState.server(_snapshot()),
        ),
        managedProjectsProvider.overrideWith(_ProjectsController.new),
      ],
      child: Builder(
        builder: (context) {
          container = ProviderScope.containerOf(context);
          return childBuilder(router);
        },
      ),
    ),
  );
  await tester.pumpAndSettle();
  return _Harness(container);
}

class _ProjectsController extends ManagedProjectsController {
  @override
  Future<List<ManagedProjectRecord>> build() async => const [
    ManagedProjectRecord(
      id: 'shipglows-app',
      name: 'ShipGlows',
      repositoryFullName: 'shipglows/shipglows_app',
      isDefault: true,
      isArchived: false,
      builtin: true,
      studioAvailable: true,
    ),
    ManagedProjectRecord(
      id: 'gocharbon',
      name: 'GoCharbon',
      repositoryFullName: 'shipglows/gocharbon',
      isDefault: false,
      isArchived: false,
      builtin: false,
      studioAvailable: true,
    ),
  ];
}

CockpitSnapshot _snapshot() => CockpitSnapshot(
  generatedAt: DateTime.utc(2026, 8, 17),
  projects: [
    _project('shipglows-app', 'ShipGlows', 'shipglows/shipglows_app'),
    _project('gocharbon', 'GoCharbon', 'shipglows/gocharbon'),
  ],
);

CockpitProject _project(String id, String name, String repository) =>
    CockpitProject(
      id: id,
      name: name,
      repositoryFullName: repository,
      accessState: ProjectAccessState.available,
      health: ProjectHealthMatrix.fromDimensions(const []),
      conversationCount: 0,
      activeRunCount: 0,
    );
