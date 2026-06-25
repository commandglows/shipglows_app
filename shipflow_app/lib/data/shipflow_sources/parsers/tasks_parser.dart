import '../source_models.dart';
import '../source_diagnostic_helpers.dart';
import 'operational_record_parser.dart';
import 'parsed_models.dart';

class TasksParser {
  TasksParser({OperationalRecordParser? operationalRecordParser})
    : _operationalRecordParser =
          operationalRecordParser ?? OperationalRecordParser();

  final OperationalRecordParser _operationalRecordParser;

  ParserOutput<TaskProjectState> parse({
    required String markdown,
    required String source,
  }) {
    final canonical = _operationalRecordParser.parse(
      markdown: markdown,
      source: source,
    );
    final diagnostics = <SourceDiagnostic>[...canonical.diagnostics];

    final canonicalByKey = <String, OperationalRecord>{};
    for (final record in canonical.records.where((record) => record.kind == 'task')) {
      final status = (record.fields['status'] ?? '').trim();
      if (status.isEmpty) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.warning,
            message: 'Missing required field "status" in task record.',
            source: source,
            line: record.line,
            excerpt: diagnosticExcerptForLine(markdown, record.line),
            suggestedCommand: '/sf-verify ShipFlow tasks',
          ),
        );
        continue;
      }
      final key = _taskDedupeKey(record.project, record.title, record.fields);
      if (canonicalByKey.containsKey(key)) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.parseError,
            severity: DiagnosticSeverity.warning,
            message: 'Duplicate canonical task record suppressed.',
            source: source,
            line: record.line,
            excerpt: diagnosticExcerptForLine(markdown, record.line),
            details: diagnosticDetails({'dedupeKey': key}),
            suggestedCommand: '/sf-verify ShipFlow tasks',
          ),
        );
        continue;
      }
      canonicalByKey[key] = record;
    }

    if (canonicalByKey.isNotEmpty) {
      return ParserOutput(
        records: _aggregateTaskStates(canonicalByKey.values.toList()),
        diagnostics: diagnostics,
      );
    }

    final states = <TaskProjectState>[];
    final lines = markdown.split('\n');
    String? currentProject;
    String? topPriority;
    var todoCount = 0;
    var inProgressCount = 0;

    void flushCurrent() {
      if (currentProject == null) return;
      states.add(
        TaskProjectState(
          project: currentProject,
          topPriority: topPriority,
          todoCount: todoCount,
          inProgressCount: inProgressCount,
        ),
      );
    }

    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        flushCurrent();
        currentProject = trimmed.substring(3).trim();
        topPriority = null;
        todoCount = 0;
        inProgressCount = 0;
        continue;
      }
      if (currentProject == null) {
        continue;
      }
      if (trimmed.startsWith('**Top priority**:')) {
        topPriority = trimmed.replaceFirst('**Top priority**:', '').trim();
      }
      if (trimmed.contains('📋 todo')) {
        todoCount += 1;
      }
      if (trimmed.contains('🔄 in progress')) {
        inProgressCount += 1;
      }
    }
    flushCurrent();

    if (states.isEmpty) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.parseError,
          severity: DiagnosticSeverity.error,
          message: 'No project section found in TASKS.md.',
          source: source,
          line: 1,
          excerpt: diagnosticExcerptForLine(markdown, 1),
          details: diagnosticDetails({
            'expectedHeading': '## <project name>',
            'lineCount': lines.length,
          }),
          suggestedCommand: '/sf-verify ShipFlow tasks',
        ),
      );
    }

    return ParserOutput(records: states, diagnostics: diagnostics);
  }

  String _taskDedupeKey(
    String project,
    String title,
    Map<String, String> fields,
  ) {
    final projectKey = project.trim().toLowerCase();
    final id = (fields['id'] ?? '').trim().toLowerCase();
    if (id.isNotEmpty) {
      return 'task|$projectKey|id|$id';
    }
    final area = (fields['area'] ?? '').trim().toLowerCase();
    final titleKey = title.trim().toLowerCase();
    return 'task|$projectKey|title|$titleKey|area|$area';
  }

  List<TaskProjectState> _aggregateTaskStates(List<OperationalRecord> records) {
    final grouped = <String, List<OperationalRecord>>{};
    for (final record in records) {
      grouped.putIfAbsent(record.project, () => <OperationalRecord>[]).add(record);
    }

    final states = <TaskProjectState>[];
    for (final entry in grouped.entries) {
      String? topPriority;
      var todoCount = 0;
      var inProgressCount = 0;
      for (final record in entry.value) {
        final status = (record.fields['status'] ?? '').trim().toLowerCase();
        if (topPriority == null && (record.traffic == '🔴' || record.traffic == '🟠')) {
          topPriority = record.title;
        }
        if (status == 'todo') {
          todoCount += 1;
        }
        if (status == 'in_progress' || status == 'in progress') {
          inProgressCount += 1;
        }
      }
      states.add(
        TaskProjectState(
          project: entry.key,
          topPriority: topPriority,
          todoCount: todoCount,
          inProgressCount: inProgressCount,
        ),
      );
    }
    return states;
  }
}
