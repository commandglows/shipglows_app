import 'package:flutter_test/flutter_test.dart';
import 'package:shipflow_app/data/shipflow_sources/parsers/ledger_event_parser.dart';
import 'package:shipflow_app/data/shipflow_sources/source_models.dart';

void main() {
  group('LedgerEventParser', () {
    test('parses valid event blocks and reports duplicate ids', () {
      const markdown = '''
<!-- shipflow:event start -->
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
<!-- shipflow:event end -->
<!-- shipflow:event start -->
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
<!-- shipflow:event end -->
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
    });
  });
}
