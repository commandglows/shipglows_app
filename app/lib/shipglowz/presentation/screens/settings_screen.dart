import 'package:flutter/material.dart';

import '../widgets/settings_panel.dart';
import '../widgets/shipglowz_scaffold.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ShipGlowzScaffold(
      title: 'Settings',
      body: const ShipGlowzSettingsPanel(),
    );
  }
}
