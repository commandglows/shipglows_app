enum DiagnosticSeverity { info, warning, error }

enum DiagnosticCode {
  sourceGap,
  permissionDenied,
  pathDenied,
  parseError,
  partialEvent,
  duplicateEvent,
  stale,
  neverChecked,
  needsMigration,
  manualReview,
  unsupportedSource,
  sourceTooLarge,
}

class SourceDiagnostic {
  const SourceDiagnostic({
    required this.code,
    required this.severity,
    required this.message,
    required this.source,
    this.suggestedCommand,
    this.eventId,
    this.line,
  });

  final DiagnosticCode code;
  final DiagnosticSeverity severity;
  final String message;
  final String source;
  final String? suggestedCommand;
  final String? eventId;
  final int? line;
}

class SourceDocument {
  const SourceDocument({
    required this.path,
    required this.redactedPath,
    required this.content,
  });

  final String path;
  final String redactedPath;
  final String content;
}

class SourceSnapshot {
  const SourceSnapshot({
    required this.documents,
    required this.diagnostics,
    required this.loadedAt,
  });

  final Map<String, SourceDocument> documents;
  final List<SourceDiagnostic> diagnostics;
  final DateTime loadedAt;
}
