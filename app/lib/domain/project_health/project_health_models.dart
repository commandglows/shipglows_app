import '../../data/shipflow_sources/source_models.dart';
import '../../data/shipflow_sources/parsers/parsed_models.dart';

enum DependencyPosture {
  neverChecked,
  stale,
  riskOpen,
  migrationRequired,
  healthy,
  sourceGap,
}

class ProjectHealth {
  const ProjectHealth({
    required this.project,
    required this.path,
    required this.stack,
    required this.dependencyPosture,
    required this.dependencyMessage,
    required this.nextCommand,
    required this.openTasks,
    required this.inProgressTasks,
    required this.activeChantiers,
    required this.latestAuditDate,
    required this.recentDependencyEvents,
    required this.diagnostics,
  });

  final String project;
  final String path;
  final String stack;
  final DependencyPosture dependencyPosture;
  final String dependencyMessage;
  final String nextCommand;
  final int openTasks;
  final int inProgressTasks;
  final int activeChantiers;
  final DateTime? latestAuditDate;
  final List<LedgerEvent> recentDependencyEvents;
  final List<SourceDiagnostic> diagnostics;
}

class DashboardModel {
  const DashboardModel({
    required this.generatedAt,
    required this.projects,
    required this.diagnostics,
    required this.allowlistedRoots,
  });

  final DateTime generatedAt;
  final List<ProjectHealth> projects;
  final List<SourceDiagnostic> diagnostics;
  final List<String> allowlistedRoots;
}
