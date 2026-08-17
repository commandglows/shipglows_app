import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../presentation/theme/app_theme.dart';

enum SafeDiagnosticSeverity { info, warning, error }

class SafeDiagnosticSummary {
  const SafeDiagnosticSummary({required this.code, required this.severity});

  final String code;
  final SafeDiagnosticSeverity severity;
}

class SafeDiagnosticReport {
  const SafeDiagnosticReport._();

  static const int _maxEntries = 50;
  static const int _maxIdentifierLength = 64;
  static final RegExp _identifierPattern = RegExp(r'^[a-z][a-z0-9_.-]*$');

  static String forError({
    required String code,
    required String scope,
    DateTime? generatedAt,
  }) {
    return <String>[
      'ShipGlows diagnostic',
      'Generated at: ${(generatedAt ?? DateTime.now()).toUtc().toIso8601String()}',
      'Code: ${_safeIdentifier(code)}',
      'Scope: ${_safeIdentifier(scope)}',
    ].join('\n');
  }

  static String forSummary({
    required Iterable<SafeDiagnosticSummary> diagnostics,
    required DateTime sourceGeneratedAt,
    DateTime? generatedAt,
  }) {
    final bounded = diagnostics.take(_maxEntries).toList(growable: false);
    final errorCount = bounded
        .where((item) => item.severity == SafeDiagnosticSeverity.error)
        .length;
    final warningCount = bounded
        .where((item) => item.severity == SafeDiagnosticSeverity.warning)
        .length;
    final infoCount = bounded
        .where((item) => item.severity == SafeDiagnosticSeverity.info)
        .length;
    return <String>[
      'ShipGlows diagnostics summary',
      'Generated at: ${(generatedAt ?? DateTime.now()).toUtc().toIso8601String()}',
      'Source generated at: ${sourceGeneratedAt.toUtc().toIso8601String()}',
      'Included diagnostics: ${bounded.length}',
      'Errors: $errorCount',
      'Warnings: $warningCount',
      'Info: $infoCount',
      for (final item in bounded)
        '${item.severity.name}: ${_safeIdentifier(item.code)}',
    ].join('\n');
  }

  static String _safeIdentifier(String value) {
    final normalized = value.trim().toLowerCase();
    if (normalized.isEmpty ||
        normalized.length > _maxIdentifierLength ||
        !_identifierPattern.hasMatch(normalized)) {
      return 'unknown';
    }
    return normalized;
  }
}

class SafeErrorView extends StatelessWidget {
  const SafeErrorView({
    required this.code,
    required this.scope,
    required this.message,
    required this.onRetry,
    super.key,
  });

  final String code;
  final String scope;
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Semantics(
        liveRegion: true,
        container: true,
        label: message,
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(tokens.spacing.lg),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: tokens.minimumTarget,
                maxWidth: tokens.conversation.messageMaxWidth,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline_rounded, color: colorScheme.error),
                  SizedBox(height: tokens.spacing.sm),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  SizedBox(height: tokens.spacing.md),
                  Wrap(
                    spacing: tokens.spacing.sm,
                    runSpacing: tokens.spacing.sm,
                    alignment: WrapAlignment.center,
                    children: [
                      FilledButton.icon(
                        onPressed: onRetry,
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Retry'),
                      ),
                      OutlinedButton.icon(
                        onPressed: () => _copyDiagnostic(context),
                        icon: const Icon(Icons.copy_all_rounded),
                        label: const Text('Copy diagnostic'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _copyDiagnostic(BuildContext context) async {
    await Clipboard.setData(
      ClipboardData(
        text: SafeDiagnosticReport.forError(code: code, scope: scope),
      ),
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Diagnostic copied to clipboard.')),
    );
  }
}
