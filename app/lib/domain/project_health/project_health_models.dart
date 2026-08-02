import '../../data/shipglows_sources/source_models.dart';
import '../../data/shipglows_sources/parsers/parsed_models.dart';

enum DependencyPosture {
  neverChecked,
  stale,
  riskOpen,
  migrationRequired,
  healthy,
  sourceGap,
}

enum HealthDimension { tech, content, seo, performance, security }

extension HealthDimensionWireName on HealthDimension {
  String get wireName => switch (this) {
    HealthDimension.tech => 'tech',
    HealthDimension.content => 'content',
    HealthDimension.seo => 'seo',
    HealthDimension.performance => 'performance',
    HealthDimension.security => 'security',
  };

  static HealthDimension? tryParse(String value) {
    for (final dimension in HealthDimension.values) {
      if (dimension.wireName == value) return dimension;
    }
    return null;
  }
}

enum HealthStatus { healthy, warning, critical, unknown, notReported, stale }

extension HealthStatusWireName on HealthStatus {
  String get wireName => switch (this) {
    HealthStatus.healthy => 'healthy',
    HealthStatus.warning => 'warning',
    HealthStatus.critical => 'critical',
    HealthStatus.unknown => 'unknown',
    HealthStatus.notReported => 'notReported',
    HealthStatus.stale => 'stale',
  };

  bool get isReported => switch (this) {
    HealthStatus.unknown || HealthStatus.notReported => false,
    _ => true,
  };

  static HealthStatus? tryParse(String value) {
    for (final status in HealthStatus.values) {
      if (status.wireName == value) return status;
    }
    return null;
  }
}

class ProjectHealthDimension {
  const ProjectHealthDimension({
    required this.dimension,
    required this.status,
    required this.summary,
    required this.producer,
    required this.evidenceCount,
    this.score,
    this.checkedAt,
    this.sourceCommit,
    this.runId,
  }) : assert(score == null || (score >= 0 && score <= 100)),
       assert(evidenceCount >= 0);

  final HealthDimension dimension;
  final HealthStatus status;
  final String summary;
  final String producer;
  final int evidenceCount;
  final int? score;
  final DateTime? checkedAt;
  final String? sourceCommit;
  final String? runId;
}

class ProjectHealthMatrix {
  ProjectHealthMatrix._(this._dimensions)
    : reportedDimensions = _dimensions.values
          .where((dimension) => dimension.status.isReported)
          .length,
      overallStatus = _overallStatus(_dimensions.values);

  factory ProjectHealthMatrix.fromDimensions(
    Iterable<ProjectHealthDimension> dimensions,
  ) {
    final byDimension = <HealthDimension, ProjectHealthDimension>{};
    for (final value in dimensions) {
      if (byDimension.containsKey(value.dimension)) {
        throw ArgumentError.value(
          value.dimension.wireName,
          'dimensions',
          'Each health dimension may be supplied only once.',
        );
      }
      byDimension[value.dimension] = value;
    }
    for (final dimension in HealthDimension.values) {
      byDimension.putIfAbsent(
        dimension,
        () => ProjectHealthDimension(
          dimension: dimension,
          status: HealthStatus.notReported,
          summary: 'No evidence reported.',
          producer: 'none',
          evidenceCount: 0,
        ),
      );
    }
    return ProjectHealthMatrix._(Map.unmodifiable(byDimension));
  }

  final Map<HealthDimension, ProjectHealthDimension> _dimensions;
  final int reportedDimensions;
  final HealthStatus overallStatus;

  double get coverage => reportedDimensions / HealthDimension.values.length;

  Iterable<ProjectHealthDimension> get dimensions => _dimensions.values;

  ProjectHealthDimension dimension(HealthDimension dimension) =>
      _dimensions[dimension]!;

  static HealthStatus _overallStatus(
    Iterable<ProjectHealthDimension> dimensions,
  ) {
    final reported = dimensions
        .where((dimension) => dimension.status.isReported)
        .toList();
    if (reported.isEmpty) return HealthStatus.unknown;
    reported.sort(
      (a, b) => _statusRank(b.status).compareTo(_statusRank(a.status)),
    );
    return reported.first.status;
  }

  static int _statusRank(HealthStatus status) => switch (status) {
    HealthStatus.critical => 4,
    HealthStatus.warning => 3,
    HealthStatus.stale => 2,
    HealthStatus.healthy => 1,
    HealthStatus.unknown || HealthStatus.notReported => 0,
  };
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
    required this.health,
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
  final ProjectHealthMatrix health;
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
