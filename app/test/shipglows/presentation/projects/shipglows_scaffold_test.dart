import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shipglows_app/core/shared_preferences_provider.dart';
import 'package:shipglows_app/domain/project_health/project_health_models.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/shipglows_scaffold.dart';
import 'package:shipglows_app/shipglows/providers/managed_cockpit_provider.dart';

void main() {
  testWidgets('menu Studio opens the selected project Studio', (tester) async {
    await _pumpApp(tester, selectedProjectId: 'gocharbon');

    tester
        .widget<NavigationRail>(find.byType(NavigationRail))
        .onDestinationSelected!(2);
    await tester.pumpAndSettle();

    expect(find.text('studio=GoCharbon id=gocharbon'), findsOneWidget);
  });

  testWidgets('menu Studio opens Projects when no project is selected', (
    tester,
  ) async {
    await _pumpApp(tester);

    tester
        .widget<NavigationRail>(find.byType(NavigationRail))
        .onDestinationSelected!(2);
    await tester.pumpAndSettle();

    expect(find.text('projects'), findsOneWidget);
  });
}

Future<void> _pumpApp(WidgetTester tester, {String? selectedProjectId}) async {
  tester.view.physicalSize = const Size(1200, 800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  SharedPreferences.setMockInitialValues(<String, Object>{
    'shipglows.managed.activeProjectId': ?selectedProjectId,
  });
  final preferences = await SharedPreferences.getInstance();
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, _) =>
            const ShipGlowsScaffold(title: 'Cockpit', body: SizedBox.shrink()),
      ),
      GoRoute(
        path: '/projects',
        builder: (_, _) => const Scaffold(body: Text('projects')),
      ),
      GoRoute(
        path: '/settings',
        builder: (_, _) => const Scaffold(body: Text('settings')),
      ),
      GoRoute(
        path: '/project/:project/studio',
        builder: (_, state) => Scaffold(
          body: Text(
            'studio=${Uri.decodeComponent(state.pathParameters['project']!)} '
            'id=${state.uri.queryParameters['runnerProjectId']}',
          ),
        ),
      ),
    ],
  );
  addTearDown(router.dispose);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        sharedPrefsProvider.overrideWithValue(preferences),
        managedCockpitSnapshotProvider.overrideWith(
          (_) async => ManagedCockpitState.server(_snapshot()),
        ),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
}

CockpitSnapshot _snapshot() => CockpitSnapshot(
  generatedAt: DateTime.utc(2026, 8, 17),
  projects: [
    CockpitProject(
      id: 'gocharbon',
      name: 'GoCharbon',
      repositoryFullName: 'shipglows/gocharbon',
      accessState: ProjectAccessState.available,
      health: ProjectHealthMatrix.fromDimensions(const []),
      conversationCount: 0,
      activeRunCount: 0,
    ),
  ],
);
