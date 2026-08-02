import 'package:flutter/material.dart';

import '../widgets/settings_panel.dart';
import '../widgets/shipglows_scaffold.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ShipGlowsScaffold(
      title: 'Settings',
      body: const ShipGlowsSettingsPanel(),
    );
  }
}
