import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/managed_runner_api.dart';
import 'managed_cockpit_provider.dart';
import 'managed_project_selection_provider.dart';
import 'managed_runner_provider.dart';

final managedProjectsProvider =
    AsyncNotifierProvider<
      ManagedProjectsController,
      List<ManagedProjectRecord>
    >(ManagedProjectsController.new);

class ManagedProjectsController
    extends AsyncNotifier<List<ManagedProjectRecord>> {
  ManagedProjectRegistryClient get _client {
    final client = ref.read(managedRunnerApiProvider);
    if (client case final ManagedProjectRegistryClient registry) {
      return registry;
    }
    throw const ManagedRunnerException(
      code: 'projectManagementUnavailable',
      message: 'La gestion locale des projets est indisponible.',
    );
  }

  @override
  Future<List<ManagedProjectRecord>> build() async {
    final projects = await _client.listManagedProjects();
    await _synchronizeSelection(projects);
    return projects;
  }

  Future<void> _synchronizeSelection(
    List<ManagedProjectRecord> projects,
  ) async {
    final selection = ref.read(managedProjectSelectionProvider);
    if (!selection.hasSelectedProject) return;

    final selectionIsAvailable = projects.any(
      (project) => project.id == selection.projectId && !project.isArchived,
    );
    if (!selectionIsAvailable) {
      await ref
          .read(managedProjectSelectionProvider.notifier)
          .useAutomaticSelection();
    }
  }

  Future<ManagedProjectRecord> connect({
    required String repositoryPath,
    String? name,
  }) => _mutate(
    () => _client.connectManagedProject(
      repositoryPath: repositoryPath,
      name: name,
    ),
  );

  Future<ManagedProjectRecord> connectGitHub({required String candidateId}) =>
      _mutate(() => _client.connectGitHubProject(candidateId: candidateId));

  Future<ManagedProjectRecord> updateProject({
    required String projectId,
    String? name,
    bool? isDefault,
    bool? isArchived,
  }) => _mutate(
    () => _client.updateManagedProject(
      projectId: projectId,
      name: name,
      isDefault: isDefault,
      isArchived: isArchived,
    ),
  );

  Future<void> disconnect(String projectId) async {
    await _client.disconnectManagedProject(projectId: projectId);
    await _refresh();
  }

  Future<void> disconnectGitHub(String projectId) async {
    await _client.disconnectGitHubProject(projectId: projectId);
    await _refresh();
  }

  Future<ManagedProjectRecord> _mutate(
    Future<ManagedProjectRecord> Function() action,
  ) async {
    final result = await action();
    await _refresh();
    return result;
  }

  Future<void> _refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final projects = await _client.listManagedProjects();
      await _synchronizeSelection(projects);
      return projects;
    });
    ref.invalidate(managedCockpitSnapshotProvider);
  }
}
