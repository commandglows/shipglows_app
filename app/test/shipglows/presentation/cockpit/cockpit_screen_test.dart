import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/domain/project_health/project_health_models.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/providers/dashboard_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_cockpit_provider.dart';
import 'package:shipglows_app/shipglows/router.dart';

void main() {
  group('CockpitScreen', () {
    testWidgets('shows server projects when the local projection is empty', (
      tester,
    ) async {
      await _pumpCockpit(
        tester,
        size: const Size(390, 844),
        dashboard: _dashboard(),
        managed: ManagedCockpitState.server(_snapshot()),
      );

      expect(find.text('Demo server project'), findsWidgets);
      expect(find.text('Managed Cockpit active'), findsOneWidget);
      expect(find.byType(NavigationBar), findsOneWidget);
    });

    testWidgets('keeps an empty server response authoritative', (tester) async {
      await _pumpCockpit(
        tester,
        size: const Size(768, 1024),
        dashboard: _dashboard(localProject: _localProject()),
        managed: ManagedCockpitState.server(
          CockpitSnapshot(
            generatedAt: DateTime.utc(2026, 8, 11),
            projects: const [],
          ),
        ),
      );

      expect(find.text('No managed projects yet'), findsOneWidget);
      expect(find.text('Local fallback project'), findsNothing);
      expect(find.byType(NavigationRail), findsOneWidget);
    });

    testWidgets('uses a labelled local fallback after a runner failure', (
      tester,
    ) async {
      await _pumpCockpit(
        tester,
        size: const Size(1440, 900),
        dashboard: _dashboard(localProject: _localProject()),
        managed: const ManagedCockpitState.failure(),
      );

      expect(find.text('Local fallback active'), findsOneWidget);
      expect(find.text('Local fallback project'), findsOneWidget);
      expect(find.byType(NavigationRail), findsOneWidget);
    });

    testWidgets('shows a retryable error when no fallback exists', (
      tester,
    ) async {
      await _pumpCockpit(
        tester,
        size: const Size(390, 844),
        dashboard: _dashboard(),
        managed: const ManagedCockpitState.failure(),
      );

      expect(find.text('Cockpit unavailable'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Retry'), findsOneWidget);
    });

    testWidgets('makes an expired session explicit', (tester) async {
      await _pumpCockpit(
        tester,
        size: const Size(390, 844),
        dashboard: _dashboard(localProject: _localProject()),
        managed: const ManagedCockpitState.sessionExpired(),
      );

      expect(find.text('Session expired'), findsOneWidget);
      expect(find.text('Local fallback project'), findsNothing);
      expect(find.widgetWithText(FilledButton, 'Retry'), findsOneWidget);
    });

    testWidgets('disables workspace actions when repository access is lost', (
      tester,
    ) async {
      await _pumpCockpit(
        tester,
        size: const Size(1440, 900),
        dashboard: _dashboard(),
        managed: ManagedCockpitState.server(
          _snapshot(accessState: ProjectAccessState.accessLost),
        ),
      );

      expect(find.text('Access lost'), findsOneWidget);
      final button = tester.widget<OutlinedButton>(
        find.widgetWithText(OutlinedButton, 'Open workspace'),
      );
      expect(button.onPressed, isNull);
    });

    testWidgets('reports stale evidence and suspended access', (tester) async {
      await _pumpCockpit(
        tester,
        size: const Size(768, 1024),
        dashboard: _dashboard(),
        managed: ManagedCockpitState.server(
          _snapshot(
            accessState: ProjectAccessState.installationSuspended,
            status: HealthStatus.stale,
          ),
        ),
      );

      expect(find.text('Access suspended'), findsOneWidget);
      expect(find.text('Evidence needs refresh'), findsOneWidget);
      final button = tester.widget<OutlinedButton>(
        find.widgetWithText(OutlinedButton, 'Open workspace'),
      );
      expect(button.onPressed, isNull);
    });

    testWidgets('exposes accessible project and health labels', (tester) async {
      await _pumpCockpit(
        tester,
        size: const Size(768, 1024),
        dashboard: _dashboard(),
        managed: ManagedCockpitState.server(_snapshot()),
        textScaleFactor: 2,
      );

      expect(
        find.bySemanticsLabel('Demo server project health: warning'),
        findsOneWidget,
      );
      expect(tester.takeException(), isNull);
    });

    testWidgets('reflows safely at 320dp with 2x text', (tester) async {
      await _pumpCockpit(
        tester,
        size: const Size(320, 568),
        dashboard: _dashboard(),
        managed: ManagedCockpitState.server(_snapshot()),
        textScaleFactor: 2,
      );

      expect(find.byType(NavigationBar), findsOneWidget);
      expect(tester.takeException(), isNull);

      await tester.dragUntilVisible(
        find.byType(OutlinedButton),
        find.byType(ListView),
        const Offset(0, -200),
      );
      final actionSize = tester.getSize(find.byType(OutlinedButton));
      expect(actionSize.height, greaterThanOrEqualTo(48));
      expect(tester.takeException(), isNull);
    });

    testWidgets('exposes each health dimension to assistive technology', (
      tester,
    ) async {
      await _pumpCockpit(
        tester,
        size: const Size(768, 1024),
        dashboard: _dashboard(),
        managed: ManagedCockpitState.server(_snapshot()),
      );

      expect(find.bySemanticsLabel('tech: warning'), findsOneWidget);
      expect(find.bySemanticsLabel('content: not reported'), findsOneWidget);
      expect(find.bySemanticsLabel('seo: not reported'), findsOneWidget);
      expect(
        find.bySemanticsLabel('performance: not reported'),
        findsOneWidget,
      );
      expect(find.bySemanticsLabel('security: not reported'), findsOneWidget);
    });
  });
}

Future<void> _pumpCockpit(
  WidgetTester tester, {
  required Size size,
  required DashboardModel dashboard,
  required ManagedCockpitState managed,
  double textScaleFactor = 1,
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
      ],
      child: MediaQuery(
        data: MediaQueryData(
          size: size,
          textScaler: TextScaler.linear(textScaleFactor),
        ),
        child: MaterialApp.router(
          theme: AppTheme.lightTheme,
          routerConfig: createShipGlowsRouter(),
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
    ),
  ],
);
