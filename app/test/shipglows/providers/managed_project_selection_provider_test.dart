import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shipglows_app/core/shared_preferences_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_project_selection_provider.dart';

void main() {
  test('persists and restores the selected managed project', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final preferences = await SharedPreferences.getInstance();
    final first = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(first.dispose);

    await first
        .read(managedProjectSelectionProvider.notifier)
        .select('gocharbon');
    expect(
      first.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.selected('gocharbon'),
    );
    expect(
      preferences.getString('shipglows.managed.activeProjectSelectionMode'),
      'selected',
    );
    expect(
      preferences.getString('shipglows.managed.activeProjectId'),
      'gocharbon',
    );

    final restored = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(restored.dispose);
    expect(
      restored.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.selected('gocharbon'),
    );
  });

  test('migrates a legacy project identifier to selected mode', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      'shipglows.managed.activeProjectId': 'gocharbon',
    });
    final preferences = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(container.dispose);

    expect(
      container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.selected('gocharbon'),
    );
  });

  test('restores automatic mode when no legacy selection exists', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final preferences = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(container.dispose);

    expect(
      container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );
  });

  test('persists none without a project identifier', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      'shipglows.managed.activeProjectId': 'gocharbon',
      'shipglows.managed.activeProjectSelectionMode': 'selected',
    });
    final preferences = await SharedPreferences.getInstance();
    final first = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(first.dispose);

    await first.read(managedProjectSelectionProvider.notifier).selectNone();

    expect(
      first.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.none(),
    );
    expect(
      preferences.getString('shipglows.managed.activeProjectSelectionMode'),
      'none',
    );
    expect(preferences.getString('shipglows.managed.activeProjectId'), isNull);

    final restored = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(restored.dispose);
    expect(
      restored.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.none(),
    );
  });

  test('persists automatic mode and removes an explicit selection', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      'shipglows.managed.activeProjectId': 'gocharbon',
      'shipglows.managed.activeProjectSelectionMode': 'selected',
    });
    final preferences = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(container.dispose);

    await container
        .read(managedProjectSelectionProvider.notifier)
        .useAutomaticSelection();

    expect(
      container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );
    expect(
      preferences.getString('shipglows.managed.activeProjectSelectionMode'),
      'automatic',
    );
    expect(preferences.getString('shipglows.managed.activeProjectId'), isNull);
  });

  test('repairs selected mode without an identifier to automatic', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      'shipglows.managed.activeProjectSelectionMode': 'selected',
    });
    final preferences = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(container.dispose);

    expect(
      container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );
  });

  test('migrates an identifier when the stored mode is invalid', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      'shipglows.managed.activeProjectId': 'gocharbon',
      'shipglows.managed.activeProjectSelectionMode': 'unexpected',
    });
    final preferences = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(container.dispose);

    expect(
      container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.selected('gocharbon'),
    );
  });

  test('ignores an empty project identity', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final preferences = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(container.dispose);

    await container
        .read(managedProjectSelectionProvider.notifier)
        .select('   ');
    expect(
      container.read(managedProjectSelectionProvider),
      const ManagedProjectSelection.automatic(),
    );
  });
}
