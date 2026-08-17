import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/shared_preferences_provider.dart';

const _managedProjectSelectionKey = 'shipglows.managed.activeProjectId';
const _managedProjectSelectionModeKey =
    'shipglows.managed.activeProjectSelectionMode';

enum ManagedProjectSelectionMode { automatic, selected, none }

class ManagedProjectSelection {
  const ManagedProjectSelection.automatic()
    : this._(mode: ManagedProjectSelectionMode.automatic);

  const ManagedProjectSelection.none()
    : this._(mode: ManagedProjectSelectionMode.none);

  const ManagedProjectSelection.selected(String projectId)
    : this._(mode: ManagedProjectSelectionMode.selected, projectId: projectId);

  const ManagedProjectSelection._({required this.mode, this.projectId});

  final ManagedProjectSelectionMode mode;
  final String? projectId;

  bool get isAutomatic => mode == ManagedProjectSelectionMode.automatic;

  bool get hasNoProject => mode == ManagedProjectSelectionMode.none;

  bool get hasSelectedProject => mode == ManagedProjectSelectionMode.selected;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is ManagedProjectSelection &&
            other.mode == mode &&
            other.projectId == projectId;
  }

  @override
  int get hashCode => Object.hash(mode, projectId);
}

String? resolveManagedProjectId({
  required ManagedProjectSelection selection,
  required Iterable<String> availableProjectIds,
  String? defaultProjectId,
}) {
  if (selection.hasNoProject) return null;

  final availableIds = availableProjectIds.toSet();
  if (selection.hasSelectedProject) {
    final selectedId = selection.projectId;
    return selectedId != null && availableIds.contains(selectedId)
        ? selectedId
        : null;
  }

  final normalizedDefaultId = _normalizedProjectId(defaultProjectId);
  return normalizedDefaultId != null &&
          availableIds.contains(normalizedDefaultId)
      ? normalizedDefaultId
      : null;
}

final managedProjectSelectionProvider =
    NotifierProvider<
      ManagedProjectSelectionController,
      ManagedProjectSelection
    >(ManagedProjectSelectionController.new);

class ManagedProjectSelectionController
    extends Notifier<ManagedProjectSelection> {
  SharedPreferences? _preferences;

  @override
  ManagedProjectSelection build() {
    try {
      _preferences = ref.read(sharedPrefsProvider);
    } catch (_) {
      // Small widget tests may intentionally omit the application bootstrap.
      // Production always supplies SharedPreferences from main.dart.
    }

    final projectId = _normalizedProjectId(
      _preferences?.getString(_managedProjectSelectionKey),
    );
    final storedMode = _preferences?.getString(_managedProjectSelectionModeKey);

    return switch (storedMode) {
      'automatic' => const ManagedProjectSelection.automatic(),
      'none' => const ManagedProjectSelection.none(),
      'selected' when projectId != null => ManagedProjectSelection.selected(
        projectId,
      ),
      // Existing installations only stored the selected project identifier.
      // Reading it when no valid mode exists provides a lossless migration.
      _ when projectId != null => ManagedProjectSelection.selected(projectId),
      _ => const ManagedProjectSelection.automatic(),
    };
  }

  Future<void> select(String projectId) async {
    final normalized = _normalizedProjectId(projectId);
    if (normalized == null ||
        (state.hasSelectedProject && state.projectId == normalized)) {
      return;
    }

    state = ManagedProjectSelection.selected(normalized);
    // Store the identifier first so a process interrupted between writes never
    // leaves a `selected` mode without its required project identifier.
    await _preferences?.setString(_managedProjectSelectionKey, normalized);
    await _preferences?.setString(_managedProjectSelectionModeKey, 'selected');
  }

  Future<void> selectNone() async {
    if (state.hasNoProject) return;
    state = const ManagedProjectSelection.none();
    await _preferences?.setString(_managedProjectSelectionModeKey, 'none');
    await _preferences?.remove(_managedProjectSelectionKey);
  }

  Future<void> useAutomaticSelection() async {
    if (state.isAutomatic) return;
    state = const ManagedProjectSelection.automatic();
    await _preferences?.setString(_managedProjectSelectionModeKey, 'automatic');
    await _preferences?.remove(_managedProjectSelectionKey);
  }

  /// Backwards-compatible alias for callers that previously cleared the
  /// stored project to restore automatic selection.
  Future<void> clear() async {
    await useAutomaticSelection();
  }
}

String? _normalizedProjectId(String? projectId) {
  final normalized = projectId?.trim();
  return normalized == null || normalized.isEmpty ? null : normalized;
}
