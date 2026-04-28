import 'package:yaml/yaml.dart';

import '../source_models.dart';
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
      r'<!--\s*shipflow:event start\s*-->',
    ).allMatches(markdown).length;
    final ends = RegExp(
      r'<!--\s*shipflow:event end\s*-->',
    ).allMatches(markdown).length;
    if (starts != ends) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.partialEvent,
          severity: DiagnosticSeverity.error,
          message: 'Event sentinel mismatch (start=$starts end=$ends).',
          source: source,
        ),
      );
    }

    final blocks = RegExp(
      r'<!--\s*shipflow:event start\s*-->\s*```yaml\s*([\s\S]*?)\s*```\s*<!--\s*shipflow:event end\s*-->',
      multiLine: true,
    ).allMatches(markdown);

    final ids = <String>{};
    for (final block in blocks) {
      final yamlText = block.group(1) ?? '';
      final parsed = _parseYamlMap(yamlText);
      if (parsed == null) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.error,
            message: 'Invalid YAML event block.',
            source: source,
          ),
        );
        continue;
      }

      final missing = _requiredFields
          .where((key) => !parsed.containsKey(key))
          .toList();
      if (missing.isNotEmpty) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.partialEvent,
            severity: DiagnosticSeverity.error,
            message: 'Event is missing required fields: ${missing.join(', ')}',
            source: source,
          ),
        );
        continue;
      }

      final eventId = '${parsed['event_id']}';
      if (ids.contains(eventId)) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.duplicateEvent,
            severity: DiagnosticSeverity.error,
            message: 'Duplicate event_id found: $eventId',
            source: source,
            eventId: eventId,
          ),
        );
        continue;
      }
      ids.add(eventId);

      events.add(
        LedgerEvent(
          eventId: eventId,
          eventType: '${parsed['event_type']}',
          project: '${parsed['project']}',
          status: '${parsed['status']}',
          riskLevel: '${parsed['risk_level']}',
          finishedAt: _parseUtcDate('${parsed['finished_at']}'),
          summary: '${parsed['summary']}',
          source: source,
          nextStep: '${parsed['next_step']}',
        ),
      );
    }

    return ParserOutput(records: events, diagnostics: diagnostics);
  }

  Map<String, dynamic>? _parseYamlMap(String text) {
    try {
      final yaml = loadYaml(text);
      if (yaml is YamlMap) {
        return Map<String, dynamic>.from(yaml);
      }
    } catch (_) {
      return null;
    }
    return null;
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
