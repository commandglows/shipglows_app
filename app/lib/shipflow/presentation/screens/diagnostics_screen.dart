import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/shipflow_sources/source_models.dart';
import '../../../core/app_config.dart';
import '../../providers/dashboard_provider.dart';
import '../widgets/shipflow_scaffold.dart';

class DiagnosticsScreen extends ConsumerWidget {
  const DiagnosticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    return ShipFlowScaffold(
      title: 'Diagnostics',
      actions: dashboard.maybeWhen(
        data: (data) => data.diagnostics.isEmpty
            ? const <Widget>[]
            : <Widget>[
                IconButton(
                  tooltip: 'Copy diagnostics report',
                  onPressed: () => _copyDiagnosticsReport(
                    context,
                    data.diagnostics,
                    data.generatedAt,
                  ),
                  icon: const Icon(Icons.copy_all_rounded),
                ),
              ],
        orElse: () => const <Widget>[],
      ),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
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
                                  _metadataLine(diag),
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(
                                        color: colorScheme.onSurfaceVariant,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (diag.suggestedCommand != null) ...[
                        const SizedBox(height: 12),
                        _DiagnosticBlock(
                          title: 'Suggested command',
                          value: diag.suggestedCommand!,
                          monospace: true,
                        ),
                      ],
                      if (diag.cause != null &&
                          diag.cause!.trim().isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _DiagnosticBlock(title: 'Cause', value: diag.cause!),
                      ],
                      if (diag.excerpt != null &&
                          diag.excerpt!.trim().isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _DiagnosticBlock(
                          title: 'Source excerpt',
                          value: diag.excerpt!,
                          monospace: true,
                        ),
                      ],
                      if (diag.details.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _DiagnosticBlock(
                          title: 'Details',
                          value: _formatDetails(diag.details),
                          monospace: true,
                        ),
                      ],
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: OutlinedButton.icon(
                          onPressed: () => _copyDiagnostic(context, diag),
                          icon: const Icon(Icons.copy_all_rounded, size: 18),
                          label: const Text('Copy error'),
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

  String _metadataLine(SourceDiagnostic diagnostic) {
    final parts = <String>[
      diagnostic.code.name,
      diagnostic.source,
      if (diagnostic.line != null) 'line ${diagnostic.line}',
      if (diagnostic.eventId != null && diagnostic.eventId!.trim().isNotEmpty)
        diagnostic.eventId!,
    ];
    return parts.join(' · ');
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

  Future<void> _copyDiagnosticsReport(
    BuildContext context,
    List<SourceDiagnostic> diagnostics,
    DateTime generatedAt,
  ) async {
    final errorCount = diagnostics
        .where((diagnostic) => diagnostic.severity == DiagnosticSeverity.error)
        .length;
    final warningCount = diagnostics
        .where(
          (diagnostic) => diagnostic.severity == DiagnosticSeverity.warning,
        )
        .length;
    final infoCount = diagnostics
        .where((diagnostic) => diagnostic.severity == DiagnosticSeverity.info)
        .length;
    await Clipboard.setData(
      ClipboardData(
        text: [
          ...AppConfig.buildIdentityHeader(),
          'ShipFlow diagnostics report',
          'Generated at: ${DateTime.now().toUtc().toIso8601String()}',
          'Dashboard data generated at: ${generatedAt.toUtc().toIso8601String()}',
          'Diagnostic count: ${diagnostics.length}',
          'Errors: $errorCount',
          'Warnings: $warningCount',
          'Info: $infoCount',
          '',
          for (var index = 0; index < diagnostics.length; index += 1) ...[
            '--- Diagnostic ${index + 1}/${diagnostics.length} ---',
            _formatDiagnostic(diagnostics[index]),
            '',
          ],
        ].join('\n'),
      ),
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Diagnostics report copied to clipboard.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _copyDiagnostic(
    BuildContext context,
    SourceDiagnostic diagnostic,
  ) async {
    await Clipboard.setData(ClipboardData(text: _formatDiagnostic(diagnostic)));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Diagnostic copied to clipboard.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String _formatDiagnostic(SourceDiagnostic diagnostic) {
    final lines = <String>[
      ...AppConfig.buildIdentityHeader(),
      'ShipFlow diagnostic',
      'Severity: ${diagnostic.severity.name}',
      'Code: ${diagnostic.code.name}',
      'Source: ${diagnostic.source}',
      'Message: ${diagnostic.message}',
    ];

    if (diagnostic.eventId != null && diagnostic.eventId!.trim().isNotEmpty) {
      lines.add('Event ID: ${diagnostic.eventId}');
    }
    if (diagnostic.line != null) {
      lines.add('Line: ${diagnostic.line}');
    }
    if (diagnostic.cause != null && diagnostic.cause!.trim().isNotEmpty) {
      lines.add('Cause: ${diagnostic.cause}');
    }
    if (diagnostic.suggestedCommand != null &&
        diagnostic.suggestedCommand!.trim().isNotEmpty) {
      lines.add('Suggested command: ${diagnostic.suggestedCommand}');
    }
    if (diagnostic.details.isNotEmpty) {
      lines
        ..add('Details:')
        ..add(_formatDetails(diagnostic.details, indent: '  '));
    }
    if (diagnostic.excerpt != null && diagnostic.excerpt!.trim().isNotEmpty) {
      lines
        ..add('Source excerpt:')
        ..add(diagnostic.excerpt!);
    }

    return lines.join('\n');
  }

  String _formatDetails(Map<String, String> details, {String indent = ''}) {
    return details.entries
        .map((entry) => '$indent${entry.key}: ${entry.value}')
        .join('\n');
  }
}

class _DiagnosticBlock extends StatelessWidget {
  const _DiagnosticBlock({
    required this.title,
    required this.value,
    this.monospace = false,
  });

  final String title;
  final String value;
  final bool monospace;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          SelectableText(
            value,
            style: textTheme.bodySmall?.copyWith(
              fontFamily: monospace ? 'monospace' : null,
            ),
          ),
        ],
      ),
    );
  }
}
