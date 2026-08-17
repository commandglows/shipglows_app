import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/shipglows_sources/source_models.dart';
import '../../providers/dashboard_provider.dart';
import '../widgets/safe_error_view.dart';
import '../widgets/shipglows_scaffold.dart';

class DiagnosticsScreen extends ConsumerWidget {
  const DiagnosticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);
    return ShipGlowsScaffold(
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
        error: (_, _) => SafeErrorView(
          code: 'dashboard.load_failed',
          scope: 'diagnostics.screen',
          message: 'Diagnostics are temporarily unavailable.',
          onRetry: () => ref.invalidate(dashboardProvider),
        ),
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
                                Text(_controlledMessage(diag.code)),
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
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: OutlinedButton.icon(
                          onPressed: () =>
                              _copyDiagnostic(context, diag, data.generatedAt),
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
      diagnostic.severity.name,
      diagnostic.code.name,
      if (diagnostic.line != null) 'line ${diagnostic.line}',
    ];
    return parts.join(' · ');
  }

  IconData _iconForSeverity(DiagnosticSeverity severity) => switch (severity) {
    DiagnosticSeverity.error => Icons.cancel_outlined,
    DiagnosticSeverity.warning => Icons.warning_amber_outlined,
    DiagnosticSeverity.info => Icons.info_outline_rounded,
  };

  Future<void> _copyDiagnosticsReport(
    BuildContext context,
    List<SourceDiagnostic> diagnostics,
    DateTime generatedAt,
  ) async {
    await Clipboard.setData(
      ClipboardData(
        text: SafeDiagnosticReport.forSummary(
          diagnostics: diagnostics.map(_safeSummary),
          sourceGeneratedAt: generatedAt,
        ),
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
    DateTime generatedAt,
  ) async {
    await Clipboard.setData(
      ClipboardData(
        text: SafeDiagnosticReport.forSummary(
          diagnostics: [_safeSummary(diagnostic)],
          sourceGeneratedAt: generatedAt,
        ),
      ),
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Diagnostic copied to clipboard.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  SafeDiagnosticSummary _safeSummary(SourceDiagnostic diagnostic) {
    return SafeDiagnosticSummary(
      code: diagnostic.code.name,
      severity: switch (diagnostic.severity) {
        DiagnosticSeverity.info => SafeDiagnosticSeverity.info,
        DiagnosticSeverity.warning => SafeDiagnosticSeverity.warning,
        DiagnosticSeverity.error => SafeDiagnosticSeverity.error,
      },
    );
  }

  String _controlledMessage(DiagnosticCode code) {
    return switch (code) {
      DiagnosticCode.sourceGap => 'A required source is unavailable.',
      DiagnosticCode.permissionDenied => 'ShipGlows cannot read this source.',
      DiagnosticCode.pathDenied => 'This source is outside the allowed roots.',
      DiagnosticCode.parseError =>
        'ShipGlows could not read the source format.',
      DiagnosticCode.partialEvent => 'An incomplete event was ignored.',
      DiagnosticCode.duplicateEvent => 'A duplicate event was ignored.',
      DiagnosticCode.stale => 'This source may be out of date.',
      DiagnosticCode.neverChecked => 'This source has not been checked yet.',
      DiagnosticCode.needsMigration =>
        'This source requires migration before use.',
      DiagnosticCode.manualReview => 'This source needs manual review.',
      DiagnosticCode.unsupportedSource => 'This source type is not supported.',
      DiagnosticCode.sourceTooLarge =>
        'This source exceeds the safe read limit.',
    };
  }
}
