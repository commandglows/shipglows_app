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
            padding: const EdgeInsets.all(16),
            itemCount: data.diagnostics.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final diag = data.diagnostics[index];
              return ListTile(
                leading: Icon(_iconForSeverity(diag.severity)),
                title: Text(diag.message),
                subtitle: Text(
                  '${diag.code.name} · ${diag.source}'
                  '${diag.suggestedCommand == null ? '' : '\n${diag.suggestedCommand}'}',
                ),
                isThreeLine: diag.suggestedCommand != null,
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
      return Icons.error_outline;
    }
    if (name.contains('warning')) {
      return Icons.warning_amber_outlined;
    }
    return Icons.info_outline;
  }
}
