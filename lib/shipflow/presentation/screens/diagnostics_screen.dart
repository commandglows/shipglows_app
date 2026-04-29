import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/dashboard_provider.dart';
import '../widgets/shipflow_scaffold.dart';

class DiagnosticsScreen extends ConsumerWidget {
  const DiagnosticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    return ShipFlowScaffold(
      title: 'Diagnostics',
      body: dashboard.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) =>
            Center(child: Text('Failed to load diagnostics: $error')),
        data: (data) {
          if (data.diagnostics.isEmpty) {
            return const Center(child: Text('No diagnostics.'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: data.diagnostics.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final diag = data.diagnostics[index];
              final colorScheme = Theme.of(context).colorScheme;
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(_iconForSeverity(diag.severity)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(diag.message),
                            const SizedBox(height: 6),
                            Text(
                              '${diag.code.name} · ${diag.source}',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                            ),
                            if (diag.suggestedCommand != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: colorScheme.surfaceContainerHighest,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: colorScheme.outline),
                                ),
                                child: SelectableText(
                                  diag.suggestedCommand!,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(fontFamily: 'monospace'),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  IconData _iconForSeverity(dynamic severity) {
    final name = severity.toString();
    if (name.contains('error')) {
      return Icons.cancel_outlined;
    }
    if (name.contains('warning')) {
      return Icons.warning_amber_outlined;
    }
    return Icons.info_outline_rounded;
  }
}
