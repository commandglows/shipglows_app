import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/shipglows_sources/parsers/ledger_event_parser.dart';
import 'package:shipglows_app/data/shipglows_sources/source_models.dart';

void main() {
  group('LedgerEventParser', () {
    test('parses valid event blocks and reports duplicate ids', () {
      const markdown = '''
<!-- shipglows:event start -->
```yaml
schema_version: "1.0.0"
event_id: "evt_1"
event_type: "dependency_audit"
project: "demo"
status: "completed"
finished_at: "2026-04-27T23:01:00Z"
summary: "ok"
risk_level: "low"
next_step: "/sf-deps"
```
<!-- shipglows:event end -->
<!-- shipglows:event start -->
```yaml
schema_version: "1.0.0"
event_id: "evt_1"
event_type: "dependency_fix"
project: "demo"
status: "completed"
finished_at: "2026-04-27T23:02:00Z"
summary: "ok"
risk_level: "low"
next_step: "/sf-verify"
```
<!-- shipglows:event end -->
''';

      final parser = LedgerEventParser();
      final output = parser.parse(
        markdown: markdown,
        source: 'DEPENDENCY_LOG.md',
      );

      expect(output.records.length, 1);
      expect(
        output.diagnostics.any(
          (diag) => diag.code == DiagnosticCode.duplicateEvent,
        ),
        isTrue,
      );
      final duplicate = output.diagnostics.singleWhere(
        (diag) => diag.code == DiagnosticCode.duplicateEvent,
      );
      expect(duplicate.eventId, 'evt_1');
      expect(duplicate.line, isNotNull);
      expect(duplicate.excerpt, contains('event_id: "evt_1"'));
      expect(duplicate.details['eventType'], 'dependency_fix');
      expect(duplicate.suggestedCommand, isNotNull);
    });

    test('reports invalid YAML with line, cause and excerpt', () {
      const markdown = '''
<!-- shipglows:event start -->
```yaml
schema_version: "1.0.0"
event_id: "evt_bad"
event_type: [
```
<!-- shipglows:event end -->
''';

      final parser = LedgerEventParser();
      final output = parser.parse(
        markdown: markdown,
        source: 'DEPENDENCY_LOG.md',
      );

      final diagnostic = output.diagnostics.singleWhere(
        (diag) => diag.code == DiagnosticCode.parseError,
      );
      expect(diagnostic.line, 3);
      expect(diagnostic.cause, isNotEmpty);
      expect(diagnostic.excerpt, contains('event_type: ['));
      expect(diagnostic.details['yamlLength'], isNotNull);
    });
  });
}
