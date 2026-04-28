import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/dashboard_provider.dart';
import '../widgets/shipflow_scaffold.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final policy = ref.watch(sourcePathPolicyProvider);
    return ShipFlowScaffold(
      title: 'Settings',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: const Text('Runtime target'),
              subtitle: Text(
                policy.isDesktopSupported
                    ? 'Desktop mode supported (local files enabled).'
                    : 'Unsupported target for direct local file reads.',
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Allowlisted roots',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  ...policy.allowedRoots.map((root) => SelectableText(root)),
                  const SizedBox(height: 12),
                  Text('Max file size: ${policy.maxFileBytes} bytes'),
                  Text('Max refresh size: ${policy.maxTotalBytes} bytes'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () => ref.read(dashboardProvider.notifier).refresh(),
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh dashboard'),
          ),
        ],
      ),
    );
  }
}
