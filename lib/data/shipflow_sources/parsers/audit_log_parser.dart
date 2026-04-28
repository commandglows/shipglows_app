import '../source_models.dart';
import 'parsed_models.dart';

class AuditLogParser {
  ParserOutput<AuditLogEntry> parse({
    required String markdown,
    required String source,
  }) {
    final diagnostics = <SourceDiagnostic>[];
    final entries = <AuditLogEntry>[];

    final lines = markdown.split('\n');
    var inTable = false;
    List<String> headers = const [];
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.startsWith('| Date') && trimmed.contains('| Project')) {
        inTable = true;
        headers = _splitTableRow(trimmed);
        continue;
      }
      if (!inTable) {
        continue;
      }
      if (trimmed.isEmpty || !trimmed.startsWith('|')) {
        break;
      }
      if (trimmed.startsWith('|---')) {
        continue;
      }

      final cells = _splitTableRow(trimmed);
      if (cells.length != headers.length) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.warning,
            message: 'Invalid audit log row.',
            source: source,
          ),
        );
        continue;
      }

      final row = Map<String, String>.fromIterables(headers, cells);
      entries.add(
        AuditLogEntry(
          date: _parseDate(row['Date'] ?? ''),
          project: row['Project'] ?? '',
          scope: row['Scope'] ?? '',
          deps: row['Deps'] ?? '',
          overall: row['Overall'] ?? '',
          issues: row['Issues'] ?? '',
        ),
      );
    }

    if (!inTable) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.parseError,
          severity: DiagnosticSeverity.error,
          message: 'Audit log table not found.',
          source: source,
        ),
      );
    }

    return ParserOutput(records: entries, diagnostics: diagnostics);
  }

  DateTime? _parseDate(String rawDate) {
    final clean = rawDate.trim();
    if (clean.isEmpty || clean == '—') {
      return null;
    }
    try {
      return DateTime.parse(clean);
    } catch (_) {
      return null;
    }
  }

  List<String> _splitTableRow(String row) {
    return row
        .split('|')
        .map((cell) => cell.trim())
        .where((cell) => cell.isNotEmpty)
        .toList();
  }
}
