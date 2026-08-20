import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/domain/project_health/project_health_models.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/dashboard_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_cockpit_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_project_selection_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_projects_provider.dart';
import 'package:shipglows_app/shipglows/router.dart';

const _goldenSurfaceKey = Key('cockpit-golden-surface');

void main() {
  group('Cockpit visual contract', () {
    testWidgets('compact light managed state', (tester) async {
      await _pumpGolden(
        tester,
        size: const Size(390, 844),
        brightness: Brightness.light,
        dashboard: _dashboard(),
        managed: ManagedCockpitState.server(_snapshot()),
      );

      await expectLater(
        find.byKey(_goldenSurfaceKey),
        matchesGoldenFile('goldens/cockpit_compact_light.png'),
      );
    });

    testWidgets('medium dark stale and suspended state', (tester) async {
      await _pumpGolden(
        tester,
        size: const Size(768, 1024),
        brightness: Brightness.dark,
        dashboard: _dashboard(),
        managed: ManagedCockpitState.server(
          _snapshot(
            accessState: ProjectAccessState.installationSuspended,
            status: HealthStatus.stale,
            aiReadiness: _partialReadiness(),
          ),
        ),
      );

      await expectLater(
        find.byKey(_goldenSurfaceKey),
        matchesGoldenFile('goldens/cockpit_medium_dark.png'),
      );
    });

    testWidgets('expanded light local fallback state', (tester) async {
      await _pumpGolden(
        tester,
        size: const Size(1440, 900),
        brightness: Brightness.light,
        dashboard: _dashboard(localProject: _localProject()),
        managed: const ManagedCockpitState.failure(),
      );

      await expectLater(
        find.byKey(_goldenSurfaceKey),
        matchesGoldenFile('goldens/cockpit_expanded_fallback_light.png'),
      );
    });
  });
}

Future<void> _pumpGolden(
  WidgetTester tester, {
  required Size size,
  required Brightness brightness,
  required DashboardModel dashboard,
  required ManagedCockpitState managed,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        dashboardProvider.overrideWith(() => _DashboardFixture(dashboard)),
        managedCockpitSnapshotProvider.overrideWith((ref) async => managed),
        managedProjectsProvider.overrideWith(
          () => _ManagedProjectsFixture(
            managed.status == ManagedCockpitStatus.active
                ? const [_managedProject]
                : const [],
          ),
        ),
        managedProjectSelectionProvider.overrideWith(
          () => _ManagedSelectionFixture(
            managed.status == ManagedCockpitStatus.active
                ? _managedProject.id
                : null,
          ),
        ),
      ],
      child: RepaintBoundary(
        key: _goldenSurfaceKey,
        child: MediaQuery(
          data: MediaQueryData(size: size),
          child: MaterialApp.router(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.buildForTesting(Brightness.light),
            darkTheme: AppTheme.buildForTesting(Brightness.dark),
            themeMode: brightness == Brightness.dark
                ? ThemeMode.dark
                : ThemeMode.light,
            routerConfig: createShipGlowsRouter(),
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

class _DashboardFixture extends DashboardNotifier {
  _DashboardFixture(this.value);

  final DashboardModel value;

  @override
  Future<DashboardModel> build() async => value;
}

class _ManagedProjectsFixture extends ManagedProjectsController {
  _ManagedProjectsFixture(this.projects);

  final List<ManagedProjectRecord> projects;

  @override
  Future<List<ManagedProjectRecord>> build() async => projects;
}

class _ManagedSelectionFixture extends ManagedProjectSelectionController {
  _ManagedSelectionFixture(this.projectId);

  final String? projectId;

  @override
  ManagedProjectSelection build() => projectId == null
      ? const ManagedProjectSelection.automatic()
      : ManagedProjectSelection.selected(projectId!);
}

const _managedProject = ManagedProjectRecord(
  id: 'project-demo',
  name: 'Demo server project',
  repositoryFullName: 'shipglows/demo',
  isDefault: true,
  isArchived: false,
  builtin: false,
  studioAvailable: false,
  sourceKinds: ['github'],
);

DashboardModel _dashboard({ProjectHealth? localProject}) => DashboardModel(
  generatedAt: DateTime.utc(2026, 8, 11),
  projects: localProject == null ? const [] : [localProject],
  diagnostics: const [],
  allowlistedRoots: const [],
);

ProjectHealth _localProject() => ProjectHealth(
  project: 'Local fallback project',
  path: '/redacted',
  stack: 'Flutter',
  dependencyPosture: DependencyPosture.neverChecked,
  dependencyMessage: 'Local evidence only',
  nextCommand: 'none',
  openTasks: 0,
  inProgressTasks: 0,
  activeChantiers: 0,
  latestAuditDate: null,
  recentDependencyEvents: const [],
  diagnostics: const [],
  health: ProjectHealthMatrix.fromDimensions(const []),
);

CockpitSnapshot _snapshot({
  ProjectAccessState accessState = ProjectAccessState.available,
  HealthStatus status = HealthStatus.warning,
  ProjectAiReadiness aiReadiness = const ProjectAiReadiness.unavailable(),
}) => CockpitSnapshot(
  generatedAt: DateTime.utc(2026, 8, 11),
  projects: [
    CockpitProject(
      id: 'project-demo',
      name: 'Demo server project',
      repositoryFullName: 'shipglows/demo',
      accessState: accessState,
      health: ProjectHealthMatrix.fromDimensions([
        ProjectHealthDimension(
          dimension: HealthDimension.tech,
          status: status,
          summary: 'One warning',
          producer: 'shipglows',
          evidenceCount: 1,
          checkedAt: DateTime.utc(2026, 8, 11),
        ),
      ]),
      conversationCount: 2,
      activeRunCount: 1,
      aiReadiness: aiReadiness,
    ),
  ],
);

ProjectAiReadiness _partialReadiness() => ProjectAiReadiness(
  version: 'shipglows.ai-readiness.v1',
  status: AiReadinessStatus.partial,
  score: null,
  coverage: 1 / 3,
  evaluatedAt: DateTime.utc(2026, 8, 20),
  checks: const <AiReadinessCheck>[
    AiReadinessCheck(
      id: AiReadinessCheckId.structure,
      outcome: AiReadinessCheckOutcome.passed,
      earnedPoints: 20,
      maxPoints: 20,
      summary: 'Structure is discoverable.',
    ),
    AiReadinessCheck(
      id: AiReadinessCheckId.schemas,
      outcome: AiReadinessCheckOutcome.passed,
      earnedPoints: 15,
      maxPoints: 15,
      summary: 'Schemas are discoverable.',
    ),
  ],
  recommendations: const <String>[
    'Complete the bounded scan before using missing evidence.',
  ],
);
