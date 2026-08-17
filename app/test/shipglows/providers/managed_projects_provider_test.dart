import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shipglows_app/core/shared_preferences_provider.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/managed_project_selection_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_projects_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_runner_provider.dart';

void main() {
  test('automatic selection keeps its mode across build and refresh', () async {
    final harness = await _harness(mode: 'automatic');
    addTearDown(harness.container.dispose);

    await harness.container.read(managedProjectsProvider.future);
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );

    harness.container.invalidate(managedProjectsProvider);
    await harness.container.read(managedProjectsProvider.future);
    expect(harness.client.listCount, 2);
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );
    expect(
      harness.preferences.getString(
        'shipglows.managed.activeProjectSelectionMode',
      ),
      'automatic',
    );
  });

  test('none remains none across build and refresh', () async {
    final harness = await _harness(mode: 'none');
    addTearDown(harness.container.dispose);

    await harness.container.read(managedProjectsProvider.future);
    harness.container.invalidate(managedProjectsProvider);
    await harness.container.read(managedProjectsProvider.future);

    expect(harness.client.listCount, 2);
    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.none(),
    );
    expect(
      harness.preferences.getString('shipglows.managed.activeProjectId'),
      isNull,
    );
  });

  test('keeps an available explicit selection across refresh', () async {
    final harness = await _harness(mode: 'selected', projectId: 'gocharbon');
    addTearDown(harness.container.dispose);

    await harness.container.read(managedProjectsProvider.future);
    harness.container.invalidate(managedProjectsProvider);
    await harness.container.read(managedProjectsProvider.future);

    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.selected('gocharbon'),
    );
  });

  test('returns an unavailable explicit selection to automatic', () async {
    final harness = await _harness(mode: 'selected', projectId: 'missing');
    addTearDown(harness.container.dispose);

    await harness.container.read(managedProjectsProvider.future);

    expect(
      harness.container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );
    expect(
      harness.preferences.getString(
        'shipglows.managed.activeProjectSelectionMode',
      ),
      'automatic',
    );
    expect(
      harness.preferences.getString('shipglows.managed.activeProjectId'),
      isNull,
    );
  });

  test('resolves the effective project without changing selection mode', () {
    const availableIds = {'shipglows-app', 'gocharbon'};

    expect(
      resolveManagedProjectId(
        selection: const ManagedProjectSelection.automatic(),
        availableProjectIds: availableIds,
        defaultProjectId: 'shipglows-app',
      ),
      'shipglows-app',
    );
    expect(
      resolveManagedProjectId(
        selection: const ManagedProjectSelection.none(),
        availableProjectIds: availableIds,
        defaultProjectId: 'shipglows-app',
      ),
      isNull,
    );
    expect(
      resolveManagedProjectId(
        selection: const ManagedProjectSelection.selected('gocharbon'),
        availableProjectIds: availableIds,
        defaultProjectId: 'shipglows-app',
      ),
      'gocharbon',
    );
    expect(
      resolveManagedProjectId(
        selection: const ManagedProjectSelection.selected('missing'),
        availableProjectIds: availableIds,
        defaultProjectId: 'shipglows-app',
      ),
      isNull,
    );
  });
}

Future<_Harness> _harness({required String mode, String? projectId}) async {
  SharedPreferences.setMockInitialValues(<String, Object>{
    'shipglows.managed.activeProjectSelectionMode': mode,
    'shipglows.managed.activeProjectId': ?projectId,
  });
  final preferences = await SharedPreferences.getInstance();
  final client = _RegistryClient();
  final container = ProviderContainer(
    overrides: [
      sharedPrefsProvider.overrideWithValue(preferences),
      managedRunnerApiProvider.overrideWithValue(client),
    ],
  );
  return _Harness(container, preferences, client);
}

class _Harness {
  const _Harness(this.container, this.preferences, this.client);

  final ProviderContainer container;
  final SharedPreferences preferences;
  final _RegistryClient client;
}

class _RegistryClient
    implements ManagedRunnerClient, ManagedProjectRegistryClient {
  int listCount = 0;

  @override
  Future<List<ManagedProjectRecord>> listManagedProjects() async {
    listCount += 1;
    return _projects;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

const _projects = [
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
