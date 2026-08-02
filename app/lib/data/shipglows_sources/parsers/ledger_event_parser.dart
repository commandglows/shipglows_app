import 'package:yaml/yaml.dart';

import '../source_models.dart';
import '../source_diagnostic_helpers.dart';
import 'parsed_models.dart';

class LedgerEventParser {
  static const _requiredFields = [
    'schema_version',
    'event_id',
    'event_type',
    'project',
    'status',
    'finished_at',
    'summary',
    'risk_level',
    'next_step',
  ];

  ParserOutput<LedgerEvent> parse({
    required String markdown,
    required String source,
  }) {
    final diagnostics = <SourceDiagnostic>[];
    final events = <LedgerEvent>[];

    final starts = RegExp(
      r'<!--\s*shipglows:event start\s*-->',
    ).allMatches(markdown).length;
    final ends = RegExp(
      r'<!--\s*shipglows:event end\s*-->',
    ).allMatches(markdown).length;
    if (starts != ends) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.partialEvent,
          severity: DiagnosticSeverity.error,
          message: 'Event sentinel mismatch (start=$starts end=$ends).',
          source: source,
          details: diagnosticDetails({
            'startSentinels': starts,
            'endSentinels': ends,
            'expectedBlockFormat':
                '<!-- shipglows:event start --> + fenced yaml + <!-- shipglows:event end -->',
          }),
          suggestedCommand: '/sf-verify ShipGlows event log',
        ),
      );
    }

    final blocks = RegExp(
      r'<!--\s*shipglows:event start\s*-->\s*```yaml\s*([\s\S]*?)\s*```\s*<!--\s*shipglows:event end\s*-->',
      multiLine: true,
    ).allMatches(markdown);

    final ids = <String>{};
    for (final block in blocks) {
      final yamlText = block.group(1) ?? '';
      final blockText = block.group(0) ?? '';
      final yamlOffsetInBlock = blockText.indexOf(yamlText);
      final yamlOffset = yamlOffsetInBlock < 0
          ? block.start
          : block.start + yamlOffsetInBlock;
      final line = diagnosticLineForOffset(markdown, yamlOffset);
      final parsed = _parseYamlMap(yamlText);
      if (parsed.map == null) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.error,
            message: 'Invalid YAML event block.',
            source: source,
            line: line,
            cause: parsed.error,
            excerpt: diagnosticExcerptForLine(markdown, line, radius: 8),
            details: diagnosticDetails({'yamlLength': yamlText.length}),
            suggestedCommand: '/sf-verify ShipGlows event log',
          ),
        );
        continue;
      }
      final yaml = parsed.map!;

      final missing = _requiredFields
          .where((key) => !yaml.containsKey(key))
          .toList();
      if (missing.isNotEmpty) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.partialEvent,
            severity: DiagnosticSeverity.error,
            message: 'Event is missing required fields: ${missing.join(', ')}',
            source: source,
            line: line,
            eventId: yaml['event_id']?.toString(),
            excerpt: diagnosticExcerptForLine(markdown, line, radius: 8),
            details: diagnosticDetails({
              'missingFields': missing.join(', '),
              'presentFields': yaml.keys.join(', '),
            }),
            suggestedCommand: '/sf-verify ShipGlows event log',
          ),
        );
        continue;
      }

      final eventId = '${yaml['event_id']}';
      if (ids.contains(eventId)) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.duplicateEvent,
            severity: DiagnosticSeverity.error,
            message: 'Duplicate event_id found: $eventId',
            source: source,
            eventId: eventId,
            line: line,
            excerpt: diagnosticExcerptForLine(markdown, line, radius: 8),
            details: diagnosticDetails({
              'eventType': yaml['event_type'],
              'project': yaml['project'],
              'status': yaml['status'],
            }),
            suggestedCommand: '/sf-verify ShipGlows event log',
          ),
        );
        continue;
      }
      ids.add(eventId);

      events.add(
        LedgerEvent(
          eventId: eventId,
          eventType: '${yaml['event_type']}',
          project: '${yaml['project']}',
          status: '${yaml['status']}',
          riskLevel: '${yaml['risk_level']}',
          finishedAt: _parseUtcDate('${yaml['finished_at']}'),
          summary: '${yaml['summary']}',
          source: source,
          nextStep: '${yaml['next_step']}',
        ),
      );
    }

    return ParserOutput(records: events, diagnostics: diagnostics);
  }

  _YamlParseResult _parseYamlMap(String text) {
    try {
      final yaml = loadYaml(text);
      if (yaml is YamlMap) {
        return _YamlParseResult(map: Map<String, dynamic>.from(yaml));
      }
      return const _YamlParseResult(error: 'YAML event block is not a map.');
    } catch (error) {
      return _YamlParseResult(error: diagnosticCause(error));
    }
  }

  DateTime? _parseUtcDate(String value) {
    if (!value.endsWith('Z')) {
      return null;
    }
    try {
      return DateTime.parse(value).toUtc();
    } catch (_) {
      return null;
    }
  }
}

class _YamlParseResult {
  const _YamlParseResult({this.map, this.error});

  final Map<String, dynamic>? map;
  final String? error;
}
