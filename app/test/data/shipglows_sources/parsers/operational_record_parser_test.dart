import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/shipglows_sources/parsers/operational_record_parser.dart';

void main() {
  group('OperationalRecordParser', () {
    test('parses valid records and normalizes legacy checkmark traffic', () {
      const markdown = '''
✅ [shipglows_app] task: Fix parser \\| escaping | status: in_progress | area: parser\\[core\\]
🟠 [ShipGlows] audit: dependencies | date: 2026-05-22 | overall: C | issues: 0/1/2
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

    test('parses web-reader fixture records with source metadata', () {
      final markdown = File(
        'test/data/shipglows_sources/fixtures/operational_records_web_reader.md',
      ).readAsStringSync();
      final output = OperationalRecordParser().parse(
        markdown: markdown,
        source: 'OPERATIONS_FIXTURE.md',
      );

      expect(output.records, isNotEmpty);
      final task = output.records
          .where((record) => record.kind == 'task')
          .toList();
      final audit = output.records
          .where((record) => record.kind == 'audit')
          .toList();
      final spec = output.records
          .where((record) => record.kind == 'spec')
          .toList();

      expect(task.length, 4);
      expect(audit.length, 1);
      expect(spec.length, 1);
      final escaped = task.firstWhere(
        (record) => record.title == 'Escaped |title',
      );
      expect(escaped.fields['area'], 'infra');
      expect(escaped.dedupeKey, contains('task|shipglows_app|title|escaped |title|area|infra'));

      final projected = task.firstWhere(
        (record) => record.title == 'Web reader task with filter and priority',
      );
      expect(projected.project, 'shipglows_app');
      expect(projected.traffic, '🟠');
      expect(projected.fields['status'], 'in_progress');
      expect(projected.fields['area'], 'reader');
      expect(projected.source, 'OPERATIONS_FIXTURE.md');
      expect(projected.line, greaterThan(0));
      expect(projected.rawLine, contains('task: Web reader task with filter and priority'));
      expect(projected.dedupeKey, contains('task|shipglows_app|title|web reader task with filter and priority|area|reader'));

      final projectScoped = task
          .where((record) => record.project == 'contentflow_app')
          .toList();
      expect(projectScoped, hasLength(1));

      final duplicated = task
          .where(
            (record) =>
                record.title == 'Web reader task with filter and priority' &&
                record.fields['area'] == 'reader',
          )
          .toList();
      expect(duplicated, hasLength(2));

      final malformed = output.diagnostics;
      expect(malformed.length, 1);
      expect(malformed.single.message, contains('Malformed field in operational record.'));
    });

    test('reports malformed record and keeps parsing neighbors', () {
      const markdown = '''
🔴 [shipglows_app] task Broken line without kind separator
🟢 [shipglows_app] task: valid | status: todo
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
