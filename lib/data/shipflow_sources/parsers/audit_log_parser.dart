import '../source_models.dart';
import '../source_diagnostic_helpers.dart';
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
    for (var index = 0; index < lines.length; index += 1) {
      final line = lines[index];
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
            line: index + 1,
            excerpt: diagnosticExcerptForLine(markdown, index + 1),
            details: diagnosticDetails({
              'expectedColumns': headers.length,
              'actualColumns': cells.length,
              'headers': headers.join(', '),
            }),
            suggestedCommand: '/sf-verify ShipFlow audit log',
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
          line: 1,
          excerpt: diagnosticExcerptForLine(markdown, 1),
          details: diagnosticDetails({
            'expectedHeader': '| Date | ... | Project | ... |',
          }),
          suggestedCommand: '/sf-verify ShipFlow audit log',
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
