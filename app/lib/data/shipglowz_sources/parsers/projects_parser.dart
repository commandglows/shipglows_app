import '../source_models.dart';
import '../source_diagnostic_helpers.dart';
import 'parsed_models.dart';

class ProjectsParser {
  ParserOutput<ProjectRegistryEntry> parse({
    required String markdown,
    required String source,
  }) {
    final diagnostics = <SourceDiagnostic>[];
    final baseEntries = <String, ProjectRegistryEntry>{};

    final lines = markdown.split('\n');
    var inRegistry = false;
    for (var index = 0; index < lines.length; index += 1) {
      final line = lines[index];
      final trimmed = line.trim();
      if (trimmed.startsWith('| Name | Path | Stack |')) {
        inRegistry = true;
        continue;
      }
      if (!inRegistry) {
        continue;
      }
      if (trimmed.isEmpty || !trimmed.startsWith('|')) {
        break;
      }
      if (trimmed.startsWith('|------')) {
        continue;
      }

      final cells = _splitTableRow(trimmed);
      if (cells.length < 3) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.warning,
            message: 'Invalid project registry row.',
            source: source,
            line: index + 1,
            excerpt: diagnosticExcerptForLine(markdown, index + 1),
            details: diagnosticDetails({
              'expectedColumns': 'Name, Path, Stack',
              'actualColumns': cells.length,
            }),
            suggestedCommand: '/sf-verify ShipGlowz project registry',
          ),
        );
        continue;
      }

      final entry = ProjectRegistryEntry(
        name: cells[0],
        path: cells[1],
        stack: cells[2],
        domains: <String>{},
      );
      baseEntries[_normalizeProjectKey(entry.name)] = entry;
    }

    if (baseEntries.isEmpty) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.parseError,
          severity: DiagnosticSeverity.error,
          message: 'Project registry table not found or empty.',
          source: source,
          line: 1,
          excerpt: diagnosticExcerptForLine(markdown, 1),
          details: diagnosticDetails({
            'expectedHeader': '| Name | Path | Stack |',
          }),
          suggestedCommand: '/sf-verify ShipGlowz project registry',
        ),
      );
      return ParserOutput(records: const [], diagnostics: diagnostics);
    }

    var inDomainTable = false;
    List<String> headers = const [];
    for (var index = 0; index < lines.length; index += 1) {
      final line = lines[index];
      final trimmed = line.trim();
      if (trimmed.startsWith('| Project |')) {
        inDomainTable = true;
        headers = _splitTableRow(trimmed);
        continue;
      }
      if (!inDomainTable) {
        continue;
      }
      if (trimmed.isEmpty || !trimmed.startsWith('|')) {
        break;
      }
      if (trimmed.startsWith('|---------')) {
        continue;
      }

      final cells = _splitTableRow(trimmed);
      if (cells.isEmpty || headers.length != cells.length) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.warning,
            message: 'Invalid project domain row.',
            source: source,
            line: index + 1,
            excerpt: diagnosticExcerptForLine(markdown, index + 1),
            details: diagnosticDetails({
              'expectedColumns': headers.length,
              'actualColumns': cells.length,
            }),
            suggestedCommand: '/sf-verify ShipGlowz project registry',
          ),
        );
        continue;
      }
      final key = _normalizeProjectKey(cells[0]);
      final existing = baseEntries[key];
      if (existing == null) {
        continue;
      }

      final domains = <String>{};
      for (var i = 1; i < cells.length; i++) {
        if (cells[i] == '✓') {
          domains.add(headers[i].toLowerCase());
        }
      }
      baseEntries[key] = ProjectRegistryEntry(
        name: existing.name,
        path: existing.path,
        stack: existing.stack,
        domains: domains,
      );
    }

    return ParserOutput(
      records: baseEntries.values.toList()
        ..sort((a, b) => a.name.compareTo(b.name)),
      diagnostics: diagnostics,
    );
  }

  List<String> _splitTableRow(String row) {
    return row
        .split('|')
        .map((cell) => cell.trim())
        .where((cell) => cell.isNotEmpty)
        .toList();
  }

  String _normalizeProjectKey(String name) =>
      name.trim().toLowerCase().replaceAll('_', '-');
}
