import '../source_models.dart';
import '../source_diagnostic_helpers.dart';
import 'operational_record_parser.dart';
import 'parsed_models.dart';

class AuditLogParser {
  AuditLogParser({OperationalRecordParser? operationalRecordParser})
    : _operationalRecordParser =
          operationalRecordParser ?? OperationalRecordParser();

  final OperationalRecordParser _operationalRecordParser;

  ParserOutput<AuditLogEntry> parse({
    required String markdown,
    required String source,
  }) {
    final canonical = _operationalRecordParser.parse(
      markdown: markdown,
      source: source,
    );
    final diagnostics = <SourceDiagnostic>[...canonical.diagnostics];
    final canonicalByKey = <String, AuditLogEntry>{};
    for (final record in canonical.records.where((record) => record.kind == 'audit')) {
      final dateRaw = (record.fields['date'] ?? '').trim();
      final overall = (record.fields['overall'] ?? '').trim();
      final issues = (record.fields['issues'] ?? '').trim();
      if (dateRaw.isEmpty || overall.isEmpty || issues.isEmpty) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.warning,
            message:
                'Missing required field in canonical audit record (date/overall/issues).',
            source: source,
            line: record.line,
            excerpt: diagnosticExcerptForLine(markdown, record.line),
            suggestedCommand: '/sf-verify ShipGlows audit log',
          ),
        );
        continue;
      }
      final parsedDate = _parseDate(dateRaw);
      if (parsedDate == null) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.warning,
            message: 'Invalid date in canonical audit record.',
            source: source,
            line: record.line,
            excerpt: diagnosticExcerptForLine(markdown, record.line),
            details: diagnosticDetails({'date': dateRaw}),
            suggestedCommand: '/sf-verify ShipGlows audit log',
          ),
        );
        continue;
      }
      final key = _dedupeKey(
        project: record.project,
        id: record.fields['id'],
        date: dateRaw,
        overall: overall,
        scope: record.fields['scope'],
        title: record.title,
      );
      if (canonicalByKey.containsKey(key)) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.warning,
            message: 'Duplicate canonical audit record suppressed.',
            source: source,
            line: record.line,
            excerpt: diagnosticExcerptForLine(markdown, record.line),
            details: diagnosticDetails({'dedupeKey': key}),
            suggestedCommand: '/sf-verify ShipGlows audit log',
          ),
        );
        continue;
      }
      canonicalByKey[key] = AuditLogEntry(
        date: parsedDate,
        project: record.project,
        scope: record.fields['scope']?.trim().isNotEmpty == true
            ? record.fields['scope']!.trim()
            : record.title,
        deps: '—',
        overall: overall,
        issues: issues,
      );
    }

    final entries = <AuditLogEntry>[];
    if (canonicalByKey.isNotEmpty) {
      entries.addAll(canonicalByKey.values);
    }

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
            suggestedCommand: '/sf-verify ShipGlows audit log',
          ),
        );
        continue;
      }

      final row = Map<String, String>.fromIterables(headers, cells);
      final legacyEntry = AuditLogEntry(
        date: _parseDate(row['Date'] ?? ''),
        project: row['Project'] ?? '',
        scope: row['Scope'] ?? '',
        deps: row['Deps'] ?? '',
        overall: row['Overall'] ?? '',
        issues: row['Issues'] ?? '',
      );
      if (canonicalByKey.isNotEmpty) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.info,
            message: 'Legacy audit row suppressed because canonical records exist.',
            source: source,
            line: index + 1,
            excerpt: diagnosticExcerptForLine(markdown, index + 1),
            suggestedCommand: '/sf-verify ShipGlows audit log',
          ),
        );
        continue;
      }
      entries.add(legacyEntry);
    }

    if (entries.isEmpty && !inTable && canonicalByKey.isEmpty) {
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
          suggestedCommand: '/sf-verify ShipGlows audit log',
        ),
      );
    }

    return ParserOutput(records: entries, diagnostics: diagnostics);
  }

  String _dedupeKey({
    required String project,
    required String? id,
    required String? date,
    required String overall,
    required String? scope,
    required String title,
  }) {
    final projectKey = project.trim().toLowerCase();
    final idKey = (id ?? '').trim().toLowerCase();
    if (idKey.isNotEmpty) {
      return 'audit|$projectKey|id|$idKey';
    }
    final dateKey = (date ?? '').trim().toLowerCase();
    final overallKey = overall.trim().toLowerCase();
    final scopeOrTitle = ((scope ?? '').trim().isNotEmpty ? scope! : title)
        .trim()
        .toLowerCase();
    return 'audit|$projectKey|date|$dateKey|overall|$overallKey|scope|$scopeOrTitle';
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
