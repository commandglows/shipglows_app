import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/app_diagnostics.dart';
import 'core/shared_preferences_provider.dart';
import 'shipglows/app.dart' as shipglows;
import 'shipglows/auth/auth_provider.dart';
import 'shipglows/auth/firebase_bootstrap.dart';
import 'shipglows/providers/auth_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final sharedPreferences = await SharedPreferences.getInstance();
  final authProvider = await bootstrapShipGlowsAuth(
    const FirebaseBootstrapConfiguration.fromEnvironment(),
  );

  runApp(
    buildRootApp(
      sharedPreferences: sharedPreferences,
      diagnostics: AppDiagnostics(),
      authProvider: authProvider,
    ),
  );
}

Widget buildRootApp({
  required SharedPreferences sharedPreferences,
  required AppDiagnostics diagnostics,
  ShipGlowsAuthProvider authProvider = const DisabledShipGlowsAuthProvider(),
}) {
  return ProviderScope(
    overrides: [
      sharedPrefsProvider.overrideWithValue(sharedPreferences),
      appDiagnosticsProvider.overrideWithValue(diagnostics),
      shipGlowsAuthProvider.overrideWithValue(authProvider),
    ],
    child: const shipglows.ShipGlowsApp(),
  );
}
