import 'package:contentflow_app/core/app_diagnostics.dart';
import 'package:contentflow_app/core/shared_preferences_provider.dart';
import 'package:contentflow_app/data/models/app_settings.dart';
import 'package:contentflow_app/data/models/project.dart';
import 'package:contentflow_app/l10n/app_localizations.dart';
import 'package:contentflow_app/presentation/widgets/project_picker_action.dart';
import 'package:contentflow_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('no-selection command calls setActiveProject(null)', (
    tester,
  ) async {
    var called = false;
    String? selectedProjectId = 'sentinel';
    final alpha = _project(id: 'p-1', name: 'Alpha Project');
    final beta = _project(id: 'p-2', name: 'Beta Project');

    await _pumpPicker(
      tester,
      projects: [alpha, beta],
      activeProject: alpha,
      settings: const AppSettings(
        id: 'settings-1',
        userId: 'user-1',
        defaultProjectId: 'p-1',
        projectSelectionMode: projectSelectionModeSelected,
      ),
      onSetActiveProject: (projectId) {
        called = true;
        selectedProjectId = projectId;
      },
    );

    await tester.tap(find.byTooltip('Switch project'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('No project selected'));
    await tester.pumpAndSettle();

    expect(called, isTrue);
    expect(selectedProjectId, isNull);
  });

  testWidgets('create project command routes with project-manage intent', (
    tester,
  ) async {
    final alpha = _project(id: 'p-1', name: 'Alpha Project');

    await _pumpPicker(
      tester,
      projects: [alpha],
      activeProject: alpha,
      settings: const AppSettings(
        id: 'settings-1',
        userId: 'user-1',
        defaultProjectId: 'p-1',
        projectSelectionMode: projectSelectionModeSelected,
      ),
      onSetActiveProject: (_) {},
    );

    await tester.tap(find.byTooltip('Switch project'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Create project').first);
    await tester.pumpAndSettle();

    expect(
      find.text('onboarding mode=create intent=project-manage'),
      findsOneWidget,
    );
  });
}

Future<void> _pumpPicker(
  WidgetTester tester, {
  required List<Project> projects,
  required Project? activeProject,
  required AppSettings settings,
  required void Function(String?) onSetActiveProject,
}) async {
  SharedPreferences.setMockInitialValues(<String, Object>{});
  final sharedPreferences = await SharedPreferences.getInstance();

  final router = GoRouter(
    initialLocation: '/home',
    routes: [
      GoRoute(
        path: '/home',
        builder: (context, state) => Scaffold(
          appBar: AppBar(actions: const [ProjectPickerAction()]),
          body: SizedBox.shrink(),
        ),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => Scaffold(
          body: Center(
            child: Text(
              'onboarding mode=${state.uri.queryParameters['mode'] ?? ''} intent=${state.uri.queryParameters['intent'] ?? ''}',
            ),
          ),
        ),
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        appDiagnosticsProvider.overrideWithValue(AppDiagnostics()),
        sharedPrefsProvider.overrideWithValue(sharedPreferences),
        projectsStateProvider.overrideWith(
          (ref) async => ProjectsState(items: projects),
        ),
        activeProjectProvider.overrideWith((ref) => activeProject),
        currentUserSettingsProvider.overrideWith(
          () => _TestUserSettingsNotifier(settings),
        ),
        activeProjectControllerProvider.overrideWith(
          () => _TestActiveProjectController(onSetActiveProject),
        ),
      ],
      child: MaterialApp.router(
        routerConfig: router,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
      ),
    ),
  );

  await tester.pumpAndSettle();
}

Project _project({required String id, required String name}) {
  return Project(
    id: id,
    name: name,
    url: 'https://example.com/$id',
    createdAt: DateTime(2026, 4, 25),
  );
}

class _TestUserSettingsNotifier extends UserSettingsNotifier {
  _TestUserSettingsNotifier(this._settings);

  final AppSettings _settings;

  @override
  Future<AppSettings?> build() async => _settings;
}

class _TestActiveProjectController extends ActiveProjectController {
  _TestActiveProjectController(this._onSetActiveProject);

  final void Function(String?) _onSetActiveProject;

  @override
  Future<void> build() async {}

  @override
  Future<void> setActiveProject(String? projectId) async {
    _onSetActiveProject(projectId);
  }
}
