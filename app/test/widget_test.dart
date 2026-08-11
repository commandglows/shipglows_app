import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:shipglows_app/core/app_diagnostics.dart';
import 'package:shipglows_app/main.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';

void main() {
  testWidgets('ShipGlows app is the default root app', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      buildRootApp(sharedPreferences: prefs, diagnostics: AppDiagnostics()),
    );
    await tester.pump();

    final app = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(app.title, 'ShipGlows Operations Dashboard');
    expect(app.themeMode, ThemeMode.system);
    expect(app.theme?.brightness, Brightness.light);
    expect(app.darkTheme?.brightness, Brightness.dark);
    expect(app.theme?.extension<AppThemeTokens>(), isNotNull);
    expect(app.darkTheme?.extension<AppThemeTokens>(), isNotNull);
  });
}
