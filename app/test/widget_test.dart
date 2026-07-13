import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:shipglowz_app/core/app_diagnostics.dart';
import 'package:shipglowz_app/main.dart';

void main() {
  testWidgets('ShipGlowz app is the default root app', (tester) async {
    SharedPreferences.setMockInitialValues({'app_theme_preference': 'dark'});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      buildRootApp(sharedPreferences: prefs, diagnostics: AppDiagnostics()),
    );
    await tester.pump();

    final app = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(app.title, 'ShipGlowz Operations Dashboard');
    expect(app.themeMode, ThemeMode.dark);
  });
}
