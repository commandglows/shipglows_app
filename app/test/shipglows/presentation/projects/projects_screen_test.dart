import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shipglows_app/core/shared_preferences_provider.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/presentation/screens/projects_screen.dart';
import 'package:shipglows_app/shipglows/providers/managed_github_projects_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_projects_provider.dart';

void main() {
  testWidgets('connects a local project and makes it active', (tester) async {
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues(const <String, Object>{});
    final preferences = await SharedPreferences.getInstance();
    final controller = _ProjectsController();
    final router = GoRouter(
      initialLocation: '/projects',
      routes: [
        GoRoute(path: '/projects', builder: (_, _) => const ProjectsScreen()),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPrefsProvider.overrideWithValue(preferences),
          managedProjectsProvider.overrideWith(() => controller),
          managedGitHubSourceStatusProvider.overrideWith(
            (ref) async => const ManagedGitHubSourceStatus(
              state: ManagedGitHubConnectionState.disabled,
              message: 'GitHub non configuré.',
            ),
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('ShipGlows'), findsOneWidget);
    expect(find.text('Par défaut'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Choisir un dossier'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextField, 'Chemin absolu du dépôt'),
      r'C:\Users\Shadow\shipglows\third',
    );
    await tester.enterText(
      find.widgetWithText(TextField, 'Nom affiché (facultatif)'),
      'Third',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Connecter').last);
    await tester.pumpAndSettle();

    expect(controller.connectedPath, r'C:\Users\Shadow\shipglows\third');
    await tester.scrollUntilVisible(find.text('Third'), 300);
    expect(find.text('Third'), findsOneWidget);
    expect(
      preferences.getString('shipglows.managed.activeProjectId'),
      'local_third',
    );
  });

  testWidgets('connects one explicitly selected GitHub repository', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues(const <String, Object>{});
    final preferences = await SharedPreferences.getInstance();
    final controller = _ProjectsController();
    final router = GoRouter(
      initialLocation: '/projects',
      routes: [
        GoRoute(path: '/projects', builder: (_, _) => const ProjectsScreen()),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPrefsProvider.overrideWithValue(preferences),
          managedProjectsProvider.overrideWith(() => controller),
          managedGitHubSourceStatusProvider.overrideWith(
            (ref) async => const ManagedGitHubSourceStatus(
              state: ManagedGitHubConnectionState.ready,
              message: 'Repositories prêts.',
              accountLabel: 'ShipGlows',
            ),
          ),
          managedGitHubRepositoriesProvider.overrideWith(
            () => _RepositoriesController(
              initial: const ManagedGitHubRepositoriesState(
                repositories: [
                  ManagedGitHubRepositoryCandidate(
                    candidateId: 'candidate_gocharbon',
                    fullName: 'shipglows/gocharbon',
                    defaultBranch: 'main',
                    isPrivate: true,
                    archived: false,
                  ),
                ],
                nextCursor: null,
              ),
            ),
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(
      find.widgetWithText(FilledButton, 'Choisir un repository'),
    );
    await tester.pumpAndSettle();
    expect(find.text('shipglows/gocharbon'), findsOneWidget);
    await tester.tap(find.byType(RadioListTile<String>));
    await tester.pump();
    await tester.tap(
      find.widgetWithText(FilledButton, 'Ajouter le repository sélectionné'),
    );
    await tester.pumpAndSettle();

    expect(controller.connectedCandidate, 'candidate_gocharbon');
    await tester.scrollUntilVisible(find.text('GoCharbon'), 300);
    expect(find.text('GoCharbon'), findsOneWidget);
    expect(
      preferences.getString('shipglows.managed.activeProjectId'),
      'gocharbon',
    );
  });

  testWidgets(
    'loads another page without connecting until explicit selection',
    (tester) async {
      tester.view.physicalSize = const Size(1200, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      SharedPreferences.setMockInitialValues(const <String, Object>{});
      final preferences = await SharedPreferences.getInstance();
      final projects = _ProjectsController();
      final repositories = _RepositoriesController(
        initial: const ManagedGitHubRepositoriesState(
          repositories: [
            ManagedGitHubRepositoryCandidate(
              candidateId: 'candidate_alpha',
              fullName: 'shipglows/alpha',
              defaultBranch: 'main',
              isPrivate: true,
              archived: false,
            ),
          ],
          nextCursor: 'next',
        ),
        next: const ManagedGitHubRepositoriesState(
          repositories: [
            ManagedGitHubRepositoryCandidate(
              candidateId: 'candidate_alpha',
              fullName: 'shipglows/alpha',
              defaultBranch: 'main',
              isPrivate: true,
              archived: false,
            ),
            ManagedGitHubRepositoryCandidate(
              candidateId: 'candidate_beta',
              fullName: 'shipglows/beta',
              defaultBranch: 'main',
              isPrivate: false,
              archived: false,
            ),
          ],
          nextCursor: null,
        ),
      );
      final router = GoRouter(
        initialLocation: '/projects',
        routes: [
          GoRoute(path: '/projects', builder: (_, _) => const ProjectsScreen()),
        ],
      );
      addTearDown(router.dispose);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sharedPrefsProvider.overrideWithValue(preferences),
            managedProjectsProvider.overrideWith(() => projects),
            managedGitHubSourceStatusProvider.overrideWith(
              (ref) async => const ManagedGitHubSourceStatus(
                state: ManagedGitHubConnectionState.ready,
                message: 'Repositories prêts.',
                accountLabel: 'ShipGlows',
              ),
            ),
            managedGitHubRepositoriesProvider.overrideWith(() => repositories),
          ],
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(
        find.widgetWithText(FilledButton, 'Choisir un repository'),
      );
      await tester.pumpAndSettle();
      expect(find.text('shipglows/alpha'), findsOneWidget);
      expect(projects.connectedCandidate, isNull);

      await tester.tap(
        find.widgetWithText(OutlinedButton, 'Charger plus de repositories'),
      );
      await tester.pumpAndSettle();
      expect(repositories.loadCount, 1);
      expect(find.text('shipglows/beta'), findsOneWidget);
      expect(projects.connectedCandidate, isNull);

      await tester.tap(
        find.widgetWithText(RadioListTile<String>, 'shipglows/beta'),
      );
      await tester.pump();
      await tester.tap(
        find.widgetWithText(FilledButton, 'Ajouter le repository sélectionné'),
      );
      await tester.pumpAndSettle();
      expect(projects.connectedCandidate, 'candidate_beta');
    },
  );

  testWidgets('offers only GitHub disconnect for a GitHub-only project', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 1200);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues(const <String, Object>{});
    final preferences = await SharedPreferences.getInstance();
    const project = ManagedProjectRecord(
      id: 'cloud',
      name: 'Cloud',
      repositoryFullName: 'shipglows/cloud',
      isDefault: false,
      isArchived: false,
      builtin: false,
      studioAvailable: false,
      sourceKinds: ['github'],
    );
    final controller = _ProjectsController(initial: const [project]);
    final router = GoRouter(
      initialLocation: '/projects',
      routes: [
        GoRoute(path: '/projects', builder: (_, _) => const ProjectsScreen()),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPrefsProvider.overrideWithValue(preferences),
          managedProjectsProvider.overrideWith(() => controller),
          managedGitHubSourceStatusProvider.overrideWith(
            (ref) async => const ManagedGitHubSourceStatus(
              state: ManagedGitHubConnectionState.disabled,
              message: 'GitHub non configur\u00e9.',
            ),
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('D\u00e9connecter le dossier local'), findsNothing);
    await tester.tap(find.text('D\u00e9connecter GitHub'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Confirmer'));
    await tester.pumpAndSettle();
    expect(controller.githubDisconnected, 'cloud');
    expect(controller.localDisconnected, isNull);
  });

  testWidgets('offers both source disconnects for a reconciled project', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1200, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues(const <String, Object>{});
    final preferences = await SharedPreferences.getInstance();
    const project = ManagedProjectRecord(
      id: 'reconciled',
      name: 'Reconciled',
      repositoryFullName: 'shipglows/reconciled',
      isDefault: false,
      isArchived: false,
      builtin: false,
      studioAvailable: false,
      sourceKinds: ['local', 'github'],
    );
    final controller = _ProjectsController(initial: const [project]);
    final router = GoRouter(
      initialLocation: '/projects',
      routes: [
        GoRoute(path: '/projects', builder: (_, _) => const ProjectsScreen()),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPrefsProvider.overrideWithValue(preferences),
          managedProjectsProvider.overrideWith(() => controller),
          managedGitHubSourceStatusProvider.overrideWith(
            (ref) async => const ManagedGitHubSourceStatus(
              state: ManagedGitHubConnectionState.disabled,
              message: 'GitHub non configur\u00e9.',
            ),
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('D\u00e9connecter le dossier local'), findsOneWidget);
    expect(find.text('D\u00e9connecter GitHub'), findsOneWidget);
  });
}

class _ProjectsController extends ManagedProjectsController {
  _ProjectsController({List<ManagedProjectRecord>? initial})
    : _initial = initial ?? const [_shipglows];

  final List<ManagedProjectRecord> _initial;
  String? connectedPath;
  String? connectedCandidate;
  String? localDisconnected;
  String? githubDisconnected;

  @override
  Future<List<ManagedProjectRecord>> build() async => _initial;

  @override
  Future<ManagedProjectRecord> connect({
    required String repositoryPath,
    String? name,
  }) async {
    connectedPath = repositoryPath;
    final project = ManagedProjectRecord(
      id: 'local_third',
      name: name ?? 'third',
      repositoryFullName: 'shipglows/third',
      isDefault: false,
      isArchived: false,
      builtin: false,
      studioAvailable: false,
    );
    state = AsyncData([_shipglows, project]);
    return project;
  }

  @override
  Future<ManagedProjectRecord> connectGitHub({
    required String candidateId,
  }) async {
    connectedCandidate = candidateId;
    const project = ManagedProjectRecord(
      id: 'gocharbon',
      name: 'GoCharbon',
      repositoryFullName: 'shipglows/gocharbon',
      isDefault: false,
      isArchived: false,
      builtin: false,
      studioAvailable: false,
      sourceKinds: ['github'],
    );
    state = const AsyncData([_shipglows, project]);
    return project;
  }

  @override
  Future<void> disconnect(String projectId) async {
    localDisconnected = projectId;
  }

  @override
  Future<void> disconnectGitHub(String projectId) async {
    githubDisconnected = projectId;
  }
}

class _RepositoriesController extends ManagedGitHubRepositoriesController {
  _RepositoriesController({required this.initial, this.next});

  final ManagedGitHubRepositoriesState initial;
  final ManagedGitHubRepositoriesState? next;
  var loadCount = 0;

  @override
  Future<ManagedGitHubRepositoriesState> build() async => initial;

  @override
  Future<void> loadNextPage() async {
    loadCount += 1;
    final nextState = next;
    if (nextState != null) state = AsyncData(nextState);
  }
}

const _shipglows = ManagedProjectRecord(
  id: 'shipglows_app',
  name: 'ShipGlows',
  repositoryFullName: 'shipglows/shipglows_app',
  isDefault: true,
  isArchived: false,
  builtin: true,
  studioAvailable: true,
);
