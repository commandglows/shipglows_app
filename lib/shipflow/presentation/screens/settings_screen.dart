import 'package:flutter/material.dart';

import '../widgets/settings_panel.dart';
import '../widgets/shipflow_scaffold.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ShipFlowScaffold(
      title: 'Settings',
      body: const ShipFlowSettingsPanel(),
    );
  }
}
