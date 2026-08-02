import '../source_models.dart';

class ProjectRegistryEntry {
  const ProjectRegistryEntry({
    required this.name,
    required this.path,
    required this.stack,
    required this.domains,
  });

  final String name;
  final String path;
  final String stack;
  final Set<String> domains;
}

class AuditLogEntry {
  const AuditLogEntry({
    required this.date,
    required this.project,
    required this.scope,
    required this.deps,
    required this.overall,
    required this.issues,
  });

  final DateTime? date;
  final String project;
  final String scope;
  final String deps;
  final String overall;
  final String issues;
}

class TaskProjectState {
  const TaskProjectState({
    required this.project,
    required this.topPriority,
    required this.todoCount,
    required this.inProgressCount,
  });

  final String project;
  final String? topPriority;
  final int todoCount;
  final int inProgressCount;
}

class LedgerEvent {
  const LedgerEvent({
    required this.eventId,
    required this.eventType,
    required this.project,
    required this.status,
    required this.riskLevel,
    required this.finishedAt,
    required this.summary,
    required this.source,
    required this.nextStep,
  });

  final String eventId;
  final String eventType;
  final String project;
  final String status;
  final String riskLevel;
  final DateTime? finishedAt;
  final String summary;
  final String source;
  final String nextStep;
}

class SpecChantier {
  const SpecChantier({
    required this.path,
    required this.title,
    required this.status,
    required this.sfStartStatus,
    required this.sfVerifyStatus,
  });

  final String path;
  final String title;
  final String status;
  final String sfStartStatus;
  final String sfVerifyStatus;
}

class ParserOutput<T> {
  const ParserOutput({required this.records, required this.diagnostics});

  final List<T> records;
  final List<SourceDiagnostic> diagnostics;
}

class OperationalRecord {
  const OperationalRecord({
    required this.traffic,
    required this.project,
    required this.kind,
    required this.title,
    required this.fields,
    required this.dedupeKey,
    required this.source,
    required this.line,
    required this.rawLine,
  });

  final String traffic;
  final String project;
  final String kind;
  final String title;
  final Map<String, String> fields;
  final String dedupeKey;
  final String source;
  final int line;
  final String rawLine;
}
