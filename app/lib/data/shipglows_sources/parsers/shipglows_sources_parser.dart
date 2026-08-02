import '../source_models.dart';
import 'audit_log_parser.dart';
import 'ledger_event_parser.dart';
import 'parsed_models.dart';
import 'projects_parser.dart';
import 'specs_parser.dart';
import 'tasks_parser.dart';

class ParsedShipGlowsData {
  const ParsedShipGlowsData({
    required this.projects,
    required this.auditLog,
    required this.tasks,
    required this.operationsEvents,
    required this.dependencyEvents,
    required this.specs,
    required this.diagnostics,
  });

  final List<ProjectRegistryEntry> projects;
  final List<AuditLogEntry> auditLog;
  final List<TaskProjectState> tasks;
  final List<LedgerEvent> operationsEvents;
  final List<LedgerEvent> dependencyEvents;
  final List<SpecChantier> specs;
  final List<SourceDiagnostic> diagnostics;
}

class ShipGlowsSourcesParser {
  ShipGlowsSourcesParser({
    ProjectsParser? projectsParser,
    AuditLogParser? auditLogParser,
    TasksParser? tasksParser,
    LedgerEventParser? ledgerEventParser,
    SpecsParser? specsParser,
  }) : _projectsParser = projectsParser ?? ProjectsParser(),
       _auditLogParser = auditLogParser ?? AuditLogParser(),
       _tasksParser = tasksParser ?? TasksParser(),
       _ledgerEventParser = ledgerEventParser ?? LedgerEventParser(),
       _specsParser = specsParser ?? SpecsParser();

  final ProjectsParser _projectsParser;
  final AuditLogParser _auditLogParser;
  final TasksParser _tasksParser;
  final LedgerEventParser _ledgerEventParser;
  final SpecsParser _specsParser;

  ParsedShipGlowsData parse(SourceSnapshot snapshot) {
    final diagnostics = <SourceDiagnostic>[...snapshot.diagnostics];
    final documents = snapshot.documents.values.toList();

    final projectsDoc = documents.firstWhere(
      (doc) => doc.path.endsWith('/PROJECTS.md'),
      orElse: () =>
          const SourceDocument(path: '', redactedPath: '', content: ''),
    );
    final auditDoc = documents.firstWhere(
      (doc) =>
          doc.path.endsWith('/AUDIT_LOG.md') &&
          doc.path.contains('/shipglows_data/'),
      orElse: () =>
          const SourceDocument(path: '', redactedPath: '', content: ''),
    );
    final tasksDoc = documents.firstWhere(
      (doc) =>
          doc.path.endsWith('/TASKS.md') &&
          doc.path.contains('/shipglows_data/'),
      orElse: () =>
          const SourceDocument(path: '', redactedPath: '', content: ''),
    );
    final operationsDoc = documents.firstWhere(
      (doc) => doc.path.endsWith('/OPERATIONS_LOG.md'),
      orElse: () =>
          const SourceDocument(path: '', redactedPath: '', content: ''),
    );
    final dependencyDoc = documents.firstWhere(
      (doc) => doc.path.endsWith('/DEPENDENCY_LOG.md'),
      orElse: () =>
          const SourceDocument(path: '', redactedPath: '', content: ''),
    );

    final projects = projectsDoc.path.isEmpty
        ? const ParserOutput<ProjectRegistryEntry>(records: [], diagnostics: [])
        : _projectsParser.parse(
            markdown: projectsDoc.content,
            source: projectsDoc.redactedPath,
          );
    final auditLog = auditDoc.path.isEmpty
        ? const ParserOutput<AuditLogEntry>(records: [], diagnostics: [])
        : _auditLogParser.parse(
            markdown: auditDoc.content,
            source: auditDoc.redactedPath,
          );
    final tasks = tasksDoc.path.isEmpty
        ? const ParserOutput<TaskProjectState>(records: [], diagnostics: [])
        : _tasksParser.parse(
            markdown: tasksDoc.content,
            source: tasksDoc.redactedPath,
          );
    final operations = operationsDoc.path.isEmpty
        ? const ParserOutput<LedgerEvent>(records: [], diagnostics: [])
        : _ledgerEventParser.parse(
            markdown: operationsDoc.content,
            source: operationsDoc.redactedPath,
          );
    final dependency = dependencyDoc.path.isEmpty
        ? const ParserOutput<LedgerEvent>(records: [], diagnostics: [])
        : _ledgerEventParser.parse(
            markdown: dependencyDoc.content,
            source: dependencyDoc.redactedPath,
          );

    final specDocs = <String, String>{};
    for (final doc in documents.where(
      (doc) => doc.path.contains('/shipglows_data/workflow/specs/'),
    )) {
      specDocs[doc.redactedPath] = doc.content;
    }
    final specs = _specsParser.parseMany(specFiles: specDocs);

    diagnostics
      ..addAll(projects.diagnostics)
      ..addAll(auditLog.diagnostics)
      ..addAll(tasks.diagnostics)
      ..addAll(operations.diagnostics)
      ..addAll(dependency.diagnostics)
      ..addAll(specs.diagnostics);

    return ParsedShipGlowsData(
      projects: projects.records,
      auditLog: auditLog.records,
      tasks: tasks.records,
      operationsEvents: operations.records,
      dependencyEvents: dependency.records,
      specs: specs.records,
      diagnostics: diagnostics,
    );
  }
}
