import 'package:contentflow_app/core/app_diagnostics.dart';
import 'package:contentflow_app/core/shared_preferences_provider.dart';
import 'package:contentflow_app/data/models/app_settings.dart';
import 'package:contentflow_app/data/models/project.dart';
import 'package:contentflow_app/l10n/app_localizations.dart';
import 'package:contentflow_app/presentation/screens/projects/projects_screen.dart';
import 'package:contentflow_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('shows active summary and keeps active project card single', (
    tester,
  ) async {
    final alpha = _project(id: 'p-1', name: 'Alpha Project');
    final beta = _project(id: 'p-2', name: 'Beta Project');

    await _pumpProjectsScreen(
      tester,
      projects: [alpha, beta],
      activeProject: alpha,
    );

    expect(find.text('Active project'), findsAtLeastNWidgets(1));
    expect(find.text('Alpha Project'), findsAtLeastNWidgets(2));
    expect(find.text('Beta Project'), findsOneWidget);
    expect(find.widgetWithText(TextButton, 'Archive project'), findsNWidgets(2));
  });

  testWidgets('shows archived section when archived projects exist', (
    tester,
  ) async {
    final alpha = _project(id: 'p-1', name: 'Alpha Project');
    final archived = _project(
      id: 'p-2',
      name: 'Archived Project',
      isArchived: true,
    );

    await _pumpProjectsScreen(
      tester,
      projects: [alpha, archived],
      activeProject: alpha,
    );

    expect(find.text('Archived projects'), findsOneWidget);
    expect(find.text('Archived Project'), findsOneWidget);
    expect(find.widgetWithText(OutlinedButton, 'Unarchive project'), findsOneWidget);
  });
}

Future<void> _pumpProjectsScreen(
  WidgetTester tester, {
  required List<Project> projects,
  required Project? activeProject,
}) async {
  SharedPreferences.setMockInitialValues(<String, Object>{});
  final sharedPreferences = await SharedPreferences.getInstance();

  final router = GoRouter(
    initialLocation: '/projects',
    routes: [
      GoRoute(
        path: '/projects',
        builder: (context, state) => const ProjectsScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const Scaffold(body: SizedBox.shrink()),
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
          () => _TestUserSettingsNotifier(
            const AppSettings(
              id: 'settings-1',
              userId: 'user-1',
              projectSelectionMode: projectSelectionModeSelected,
            ),
          ),
        ),
        projectMutationControllerProvider.overrideWith(
          () => _IdleProjectMutationController(),
        ),
        activeProjectControllerProvider.overrideWith(
          () => _IdleActiveProjectController(),
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

Project _project({
  required String id,
  required String name,
  bool isArchived = false,
}) {
  return Project(
    id: id,
    name: name,
    url: 'https://example.com/$id',
    isArchived: isArchived,
    createdAt: DateTime(2026, 4, 25),
  );
}

class _TestUserSettingsNotifier extends UserSettingsNotifier {
  _TestUserSettingsNotifier(this._settings);

  final AppSettings _settings;

  @override
  Future<AppSettings?> build() async => _settings;
}

class _IdleProjectMutationController extends ProjectMutationController {
  @override
  Future<void> build() async {}
}

class _IdleActiveProjectController extends ActiveProjectController {
  @override
  Future<void> build() async {}
}
