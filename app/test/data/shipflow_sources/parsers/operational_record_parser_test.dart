import 'package:flutter_test/flutter_test.dart';
import 'package:shipflow_app/data/shipflow_sources/parsers/operational_record_parser.dart';

void main() {
  group('OperationalRecordParser', () {
    test('parses valid records and normalizes legacy checkmark traffic', () {
      const markdown = '''
✅ [shipflow_app] task: Fix parser \\| escaping | status: in_progress | area: parser\\[core\\]
🟠 [ShipFlow] audit: dependencies | date: 2026-05-22 | overall: C | issues: 0/1/2
''';
      final output = OperationalRecordParser().parse(
        markdown: markdown,
        source: 'TASKS.md',
      );

      expect(output.records.length, 2);
      expect(output.records.first.traffic, '🟢');
      expect(output.records.first.title, 'Fix parser | escaping');
      expect(output.records.first.fields['area'], 'parser[core]');
      expect(output.diagnostics, isEmpty);
    });

    test('reports malformed record and keeps parsing neighbors', () {
      const markdown = '''
🔴 [shipflow_app] task Broken line without kind separator
🟢 [shipflow_app] task: valid | status: todo
''';
      final output = OperationalRecordParser().parse(
        markdown: markdown,
        source: 'TASKS.md',
      );

      expect(output.records.length, 1);
      expect(output.records.single.title, 'valid');
      expect(output.diagnostics, isNotEmpty);
      expect(
        output.diagnostics.single.message,
        contains('Malformed operational record'),
      );
    });
  });
}
