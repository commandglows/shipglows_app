import 'package:flutter_test/flutter_test.dart';
import 'package:shipflow_app/data/shipflow_sources/parsers/audit_log_parser.dart';
import 'package:shipflow_app/data/shipflow_sources/parsers/tasks_parser.dart';

void main() {
  group('TasksParser', () {
    test('prefers canonical task records and suppresses duplicates', () {
      const markdown = '''
🟠 [shipflow_app] task: Harden parser | status: in_progress | area: parser
🟢 [shipflow_app] task: Harden parser | status: todo | area: parser
''';
      final output = TasksParser().parse(markdown: markdown, source: 'TASKS.md');
      expect(output.records.length, 1);
      expect(output.records.single.project, 'shipflow_app');
      expect(output.records.single.inProgressCount, 1);
      expect(output.records.single.todoCount, 0);
      expect(
        output.diagnostics.any((d) => d.message.contains('Duplicate canonical task')),
        isTrue,
      );
    });

    test('falls back to legacy sections when no canonical records exist', () {
      const markdown = '''
## shipflow_app
**Top priority**: legacy priority
- 📋 todo
- 🔄 in progress
''';
      final output = TasksParser().parse(markdown: markdown, source: 'TASKS.md');
      expect(output.records.length, 1);
      expect(output.records.single.topPriority, 'legacy priority');
      expect(output.records.single.todoCount, 1);
      expect(output.records.single.inProgressCount, 1);
    });
  });

  group('AuditLogParser', () {
    test('prefers canonical audit records over duplicate legacy table rows', () {
      const markdown = '''
🟡 [shipflow_app] audit: dependencies | date: 2026-05-22 | overall: B | issues: 0/0/1

| Date | Scope | Deps | Overall | Issues | Project |
| --- | --- | --- | --- | --- | --- |
| 2026-05-22 | dependencies | — | B | 0/0/1 | shipflow_app |
''';
      final output = AuditLogParser().parse(
        markdown: markdown,
        source: 'AUDIT_LOG.md',
      );

      expect(output.records.length, 1);
      expect(output.records.single.project, 'shipflow_app');
      expect(output.records.single.overall, 'B');
      expect(
        output.diagnostics.any(
          (d) => d.message.contains('Legacy audit row suppressed'),
        ),
        isTrue,
      );
    });
  });
}
