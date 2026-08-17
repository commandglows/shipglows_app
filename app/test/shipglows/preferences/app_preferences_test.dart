import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shipglows_app/core/shared_preferences_provider.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/providers/app_preferences_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('invalid persisted theme falls back to system', () async {
    SharedPreferences.setMockInitialValues({
      'shipglows.preferences.theme': 'sepia',
    });
    final preferences = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(container.dispose);

    expect(
      container.read(shipGlowsThemePreferenceProvider),
      ShipGlowsThemePreference.system,
    );
  });

  testWidgets('theme selection applies immediately and persists', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPrefsProvider.overrideWithValue(preferences)],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const _ThemeHarness(),
      ),
    );
    expect(
      tester.widget<MaterialApp>(find.byType(MaterialApp)).themeMode,
      ThemeMode.system,
    );

    await container
        .read(shipGlowsThemePreferenceProvider.notifier)
        .select(ShipGlowsThemePreference.dark);
    await tester.pump();

    expect(
      tester.widget<MaterialApp>(find.byType(MaterialApp)).themeMode,
      ThemeMode.dark,
    );
    expect(
      preferences.getString('shipglows.preferences.theme'),
      ShipGlowsThemePreference.dark.name,
    );
  });
}

class _ThemeHarness extends ConsumerWidget {
  const _ThemeHarness();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final preference = ref.watch(shipGlowsThemePreferenceProvider);
    return MaterialApp(
      theme: AppTheme.buildForTesting(Brightness.light),
      darkTheme: AppTheme.buildForTesting(Brightness.dark),
      themeMode: preference.themeMode,
      home: const SizedBox.shrink(),
    );
  }
}
