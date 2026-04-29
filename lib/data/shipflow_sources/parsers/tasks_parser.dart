import '../source_models.dart';
import '../source_diagnostic_helpers.dart';
import 'parsed_models.dart';

class TasksParser {
  ParserOutput<TaskProjectState> parse({
    required String markdown,
    required String source,
  }) {
    final diagnostics = <SourceDiagnostic>[];
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
}
