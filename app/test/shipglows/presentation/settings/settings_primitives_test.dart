import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/settings_primitives.dart';

void main() {
  testWidgets('settings row preserves selection semantics and target size', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.buildForTesting(Brightness.light),
        home: Scaffold(
          body: ShipGlowsSettingsGroup(
            title: 'Appearance',
            children: [
              ShipGlowsSettingsRow(
                key: const Key('dark-theme-row'),
                title: 'Dark theme',
                icon: Icons.dark_mode_outlined,
                selected: true,
                onTap: () {},
              ),
            ],
          ),
        ),
      ),
    );

    final row = find.byKey(const Key('dark-theme-row'));
    expect(tester.getSize(row).height, greaterThanOrEqualTo(48));
    expect(
      tester.getSemantics(row).getSemanticsData().flagsCollection.isSelected,
      Tristate.isTrue,
    );
  });
}
