import 'package:intl/intl.dart';

import '../../data/shipglowz_sources/parsers/parsed_models.dart';
import '../../data/shipglowz_sources/parsers/shipglowz_sources_parser.dart';
import '../../data/shipglowz_sources/source_models.dart';
import 'project_health_models.dart';

class ProjectHealthBuilder {
  DashboardModel build({
    required ParsedShipGlowzData parsedData,
    required List<String> allowlistedRoots,
    required DateTime generatedAt,
  }) {
    final taskByProject = <String, TaskProjectState>{};
    for (final task in parsedData.tasks) {
      taskByProject[_normalize(task.project)] = task;
    }

    final auditsByProject = <String, List<AuditLogEntry>>{};
    for (final entry in parsedData.auditLog) {
      final key = _normalize(entry.project);
      auditsByProject.putIfAbsent(key, () => []).add(entry);
    }

    final dependencyEventsByProject = <String, List<LedgerEvent>>{};
    for (final event in parsedData.dependencyEvents) {
      final key = _normalize(event.project);
      dependencyEventsByProject.putIfAbsent(key, () => []).add(event);
    }

    final models = <ProjectHealth>[];
    for (final project in parsedData.projects) {
      final key = _normalize(project.name);
      final tasks = taskByProject[key];
      final audits = auditsByProject[key] ?? const <AuditLogEntry>[];
      final dependencyEvents =
          [...(dependencyEventsByProject[key] ?? const <LedgerEvent>[])]
            ..sort((a, b) {
              final ad = a.finishedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
              final bd = b.finishedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
              return bd.compareTo(ad);
            });

      final latestAudit = audits
          .where((entry) => entry.date != null)
          .map((entry) => entry.date!)
          .fold<DateTime?>(null, (previous, next) {
            if (previous == null) return next;
            return next.isAfter(previous) ? next : previous;
          });

      final relatedDiagnostics = parsedData.diagnostics
          .where(
            (diag) =>
                diag.source.toLowerCase().contains(
                  project.name.toLowerCase(),
                ) ||
                diag.source.toLowerCase().contains('dependency_log'),
          )
          .toList();

      final posture = _resolveDependencyPosture(
        dependencyEvents: dependencyEvents,
        diagnostics: relatedDiagnostics,
      );
      final message = _buildPostureMessage(posture, dependencyEvents);
      final nextCommand = _nextCommand(posture);
      final activeChantiers = _countActiveChantiers(parsedData.specs, key);

      models.add(
        ProjectHealth(
          project: project.name,
          path: project.path,
          stack: project.stack,
          dependencyPosture: posture,
          dependencyMessage: message,
          nextCommand: nextCommand,
          openTasks: tasks?.todoCount ?? 0,
          inProgressTasks: tasks?.inProgressCount ?? 0,
          activeChantiers: activeChantiers,
          latestAuditDate: latestAudit,
          recentDependencyEvents: dependencyEvents.take(3).toList(),
          diagnostics: relatedDiagnostics,
          health: _buildHealthMatrix(
            posture: posture,
            message: message,
            dependencyEvents: dependencyEvents,
          ),
        ),
      );
    }

    models.sort((a, b) {
      final rankA = _postureRank(a.dependencyPosture);
      final rankB = _postureRank(b.dependencyPosture);
      if (rankA != rankB) {
        return rankB.compareTo(rankA);
      }
      return a.project.compareTo(b.project);
    });

    return DashboardModel(
      generatedAt: generatedAt,
      projects: models,
      diagnostics: parsedData.diagnostics,
      allowlistedRoots: allowlistedRoots,
    );
  }

  DependencyPosture _resolveDependencyPosture({
    required List<LedgerEvent> dependencyEvents,
    required List<SourceDiagnostic> diagnostics,
  }) {
    if (diagnostics.any(
      (diag) =>
          diag.code == DiagnosticCode.parseError ||
          diag.code == DiagnosticCode.partialEvent ||
          diag.code == DiagnosticCode.duplicateEvent ||
          diag.code == DiagnosticCode.sourceGap,
    )) {
      return DependencyPosture.sourceGap;
    }

    if (dependencyEvents.isEmpty) {
      return DependencyPosture.neverChecked;
    }

    final latest = dependencyEvents.first;
    final now = DateTime.now().toUtc();
    final lastDate = latest.finishedAt;
    if (lastDate == null || now.difference(lastDate).inDays > 30) {
      return DependencyPosture.stale;
    }

    if (dependencyEvents.any(
      (event) =>
          event.eventType.startsWith('migration_') &&
          event.status != 'completed' &&
          event.status != 'reverted',
    )) {
      return DependencyPosture.migrationRequired;
    }

    if (latest.riskLevel == 'high' ||
        latest.riskLevel == 'critical' ||
        latest.summary.toLowerCase().contains('residual') ||
        latest.summary.toLowerCase().contains('pending')) {
      return DependencyPosture.riskOpen;
    }

    return DependencyPosture.healthy;
  }

  String _buildPostureMessage(
    DependencyPosture posture,
    List<LedgerEvent> events,
  ) {
    final latest = events.isEmpty ? null : events.first;
    switch (posture) {
      case DependencyPosture.neverChecked:
        return 'No dependency event found yet.';
      case DependencyPosture.stale:
        return 'Last dependency evidence is stale (>30 days).';
      case DependencyPosture.riskOpen:
        return latest == null
            ? 'Risk remains open.'
            : 'Open risk: ${latest.summary}';
      case DependencyPosture.migrationRequired:
        return 'Migration event is open and still requires action.';
      case DependencyPosture.healthy:
        if (latest?.finishedAt == null) {
          return 'Dependency event exists and status is healthy.';
        }
        final date = DateFormat('yyyy-MM-dd').format(latest!.finishedAt!);
        return 'Latest dependency event is healthy ($date).';
      case DependencyPosture.sourceGap:
        return 'Dependency source is incomplete or unreliable.';
    }
  }

  String _nextCommand(DependencyPosture posture) {
    switch (posture) {
      case DependencyPosture.neverChecked:
      case DependencyPosture.stale:
      case DependencyPosture.riskOpen:
        return '/sf-deps';
      case DependencyPosture.migrationRequired:
        return '/sf-migrate package@version';
      case DependencyPosture.sourceGap:
        return '/sf-verify ShipGlowz Operations Dashboard App';
      case DependencyPosture.healthy:
        return '/sf-verify ShipGlowz Operations Dashboard App';
    }
  }

  ProjectHealthMatrix _buildHealthMatrix({
    required DependencyPosture posture,
    required String message,
    required List<LedgerEvent> dependencyEvents,
  }) {
    final latest = dependencyEvents.isEmpty ? null : dependencyEvents.first;
    final status = switch (posture) {
      DependencyPosture.neverChecked => HealthStatus.notReported,
      DependencyPosture.stale => HealthStatus.stale,
      DependencyPosture.riskOpen => HealthStatus.warning,
      DependencyPosture.migrationRequired => HealthStatus.critical,
      DependencyPosture.healthy => HealthStatus.healthy,
      DependencyPosture.sourceGap => HealthStatus.unknown,
    };
    return ProjectHealthMatrix.fromDimensions(<ProjectHealthDimension>[
      ProjectHealthDimension(
        dimension: HealthDimension.tech,
        status: status,
        summary: message,
        producer: 'shipglowz.dependency-ledger',
        evidenceCount: dependencyEvents.length,
        checkedAt: latest?.finishedAt,
      ),
    ]);
  }

  int _countActiveChantiers(List<SpecChantier> specs, String projectKey) {
    return specs.where((spec) {
      if (spec.status != 'ready') {
        return false;
      }
      final sfStart = spec.sfStartStatus.toLowerCase();
      final sfVerify = spec.sfVerifyStatus.toLowerCase();
      final matchesProject =
          spec.title.toLowerCase().contains(projectKey) ||
          spec.path.toLowerCase().contains(projectKey) ||
          spec.title.toLowerCase().contains('shipglowz');
      if (!matchesProject) {
        return false;
      }
      return !sfStart.contains('implemented') ||
          sfVerify.contains('not launched');
    }).length;
  }

  int _postureRank(DependencyPosture posture) {
    switch (posture) {
      case DependencyPosture.sourceGap:
        return 6;
      case DependencyPosture.migrationRequired:
        return 5;
      case DependencyPosture.riskOpen:
        return 4;
      case DependencyPosture.stale:
        return 3;
      case DependencyPosture.neverChecked:
        return 2;
      case DependencyPosture.healthy:
        return 1;
    }
  }

  String _normalize(String name) =>
      name.trim().toLowerCase().replaceAll('_', '-');
}
