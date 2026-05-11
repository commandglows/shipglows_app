import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/dashboard_provider.dart';

class ShipFlowSettingsPanel extends ConsumerWidget {
  const ShipFlowSettingsPanel({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final policy = ref.watch(sourcePathPolicyProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return ListView(
      shrinkWrap: compact,
      padding: const EdgeInsets.all(20),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Runtime target',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  policy.isDesktopSupported
                      ? 'Desktop mode supported. Local file reads are enabled.'
                      : 'Web mode detected. Local file reads stay hidden until you open the desktop runtime.',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Allowlisted roots',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                ...policy.allowedRoots.map(
                  (root) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: colorScheme.outline),
                      ),
                      child: SelectableText(root),
                    ),
                  ),
                ),
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
    );
  }
}
