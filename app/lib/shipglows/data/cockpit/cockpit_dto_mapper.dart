import '../../../domain/project_health/project_health_models.dart';
import 'cockpit_models.dart';

class CockpitDtoMapper {
  const CockpitDtoMapper();

  CockpitSnapshot snapshotFromJson(Map<String, Object?> json) {
    final projectsJson = _requiredList(json, 'projects');
    return CockpitSnapshot(
      generatedAt: _requiredDateTime(json, 'generatedAt'),
      projects: List<CockpitProject>.unmodifiable(
        projectsJson.map((value) => projectFromJson(_asMap(value, 'projects'))),
      ),
    );
  }

  CockpitProject projectFromJson(Map<String, Object?> json) {
    final healthJson = _requiredMap(json, 'health');
    final dimensionValues = _requiredList(healthJson, 'dimensions');
    final dimensions = dimensionValues
        .map((value) => _dimensionFromJson(_asMap(value, 'dimensions')))
        .toList();
    final matrix = ProjectHealthMatrix.fromDimensions(dimensions);
    final declaredOverall = _healthStatus(
      _requiredString(healthJson, 'overallStatus'),
    );
    final declaredCoverage = _requiredDouble(healthJson, 'coverage');
    if (declaredOverall != matrix.overallStatus) {
      throw const FormatException(
        'The declared overall health does not match reported evidence.',
      );
    }
    if ((declaredCoverage - matrix.coverage).abs() > 0.0001) {
      throw const FormatException(
        'The declared health coverage does not match reported dimensions.',
      );
    }
    return CockpitProject(
      id: _requiredString(json, 'id'),
      name: _requiredString(json, 'name'),
      repositoryFullName: _requiredString(json, 'repositoryFullName'),
      accessState: _projectAccessState(_requiredString(json, 'accessState')),
      health: matrix,
      conversationCount: _requiredNonNegativeInt(json, 'conversationCount'),
      activeRunCount: _requiredNonNegativeInt(json, 'activeRunCount'),
      aiReadiness: json.containsKey('aiReadiness')
          ? _aiReadinessFromJson(_requiredMap(json, 'aiReadiness'))
          : const ProjectAiReadiness.unavailable(),
    );
  }

  ProjectAiReadiness _aiReadinessFromJson(Map<String, Object?> json) {
    _requireOnlyKeys(json, const <String>{
      'version',
      'status',
      'score',
      'coverage',
      'evaluatedAt',
      'checks',
      'recommendations',
    }, 'aiReadiness');
    const version = 'shipglows.ai-readiness.v1';
    if (_requiredString(json, 'version') != version) {
      throw const FormatException('Unsupported AI readiness version.');
    }
    final status = switch (_requiredString(json, 'status')) {
      'ready' => AiReadinessStatus.ready,
      'needsWork' => AiReadinessStatus.needsWork,
      'partial' => AiReadinessStatus.partial,
      'unavailable' => AiReadinessStatus.unavailable,
      _ => throw const FormatException('Unsupported AI readiness status.'),
    };
    final rawScore = json['score'];
    final score = rawScore == null ? null : _asInt(rawScore, 'score');
    if (score != null && (score < 0 || score > 100)) {
      throw const FormatException('AI readiness score must be 0 through 100.');
    }
    if ((status == AiReadinessStatus.ready ||
            status == AiReadinessStatus.needsWork) !=
        (score != null)) {
      throw const FormatException('AI readiness score contradicts its status.');
    }
    final coverage = _requiredDouble(json, 'coverage');
    if (!coverage.isFinite || coverage < 0 || coverage > 1) {
      throw const FormatException('AI readiness coverage must be 0 through 1.');
    }
    final checks = _requiredList(json, 'checks')
        .map((value) => _aiReadinessCheckFromJson(_asMap(value, 'checks')))
        .toList(growable: false);
    if (checks.length > AiReadinessCheckId.values.length ||
        checks.map((check) => check.id).toSet().length != checks.length) {
      throw const FormatException('AI readiness checks must be unique.');
    }
    for (var index = 1; index < checks.length; index += 1) {
      if (checks[index - 1].id.index >= checks[index].id.index) {
        throw const FormatException(
          'AI readiness checks must use canonical order.',
        );
      }
    }
    if ((status == AiReadinessStatus.ready ||
            status == AiReadinessStatus.needsWork) &&
        checks.length != AiReadinessCheckId.values.length) {
      throw const FormatException(
        'Complete AI readiness results require all checks.',
      );
    }
    final complete =
        status == AiReadinessStatus.ready ||
        status == AiReadinessStatus.needsWork;
    if (complete && (coverage - 1).abs() > 0.0001) {
      throw const FormatException(
        'Complete AI readiness results require full coverage.',
      );
    }
    if (status == AiReadinessStatus.unavailable &&
        (coverage != 0 || checks.isNotEmpty)) {
      throw const FormatException(
        'Unavailable AI readiness cannot contain check evidence.',
      );
    }
    if (status == AiReadinessStatus.partial &&
        (checks.length == AiReadinessCheckId.values.length ||
            (coverage - checks.length / AiReadinessCheckId.values.length)
                    .abs() >
                0.0001)) {
      throw const FormatException(
        'Partial AI readiness coverage contradicts its checks.',
      );
    }
    final recommendations = _requiredList(json, 'recommendations')
        .map((value) {
          if (value is String &&
              value.trim().isNotEmpty &&
              value.length <= 256) {
            return value;
          }
          throw const FormatException(
            'AI readiness recommendations must be non-empty strings.',
          );
        })
        .toList(growable: false);
    if (recommendations.length > 3) {
      throw const FormatException(
        'AI readiness recommendations cannot exceed three.',
      );
    }
    if (complete) {
      final applicable = checks
          .where(
            (check) => check.outcome != AiReadinessCheckOutcome.notApplicable,
          )
          .toList(growable: false);
      final earned = applicable.fold<int>(
        0,
        (total, check) => total + check.earnedPoints,
      );
      final maximum = applicable.fold<int>(
        0,
        (total, check) => total + check.maxPoints,
      );
      final expectedScore = (earned / maximum * 100).round();
      final requiredPassed =
          <AiReadinessCheckId>{
            AiReadinessCheckId.structure,
            AiReadinessCheckId.agentGuidance,
            AiReadinessCheckId.fastFeedback,
          }.every(
            (id) => checks.any(
              (check) =>
                  check.id == id &&
                  check.outcome == AiReadinessCheckOutcome.passed,
            ),
          );
      final expectedStatus = expectedScore >= 80 && requiredPassed
          ? AiReadinessStatus.ready
          : AiReadinessStatus.needsWork;
      if (score != expectedScore || status != expectedStatus) {
        throw const FormatException(
          'AI readiness score or status contradicts its checks.',
        );
      }
    }
    return ProjectAiReadiness(
      version: version,
      status: status,
      score: score,
      coverage: coverage,
      evaluatedAt: _requiredDateTime(json, 'evaluatedAt'),
      checks: List.unmodifiable(checks),
      recommendations: List.unmodifiable(recommendations),
    );
  }

  AiReadinessCheck _aiReadinessCheckFromJson(Map<String, Object?> json) {
    _requireOnlyKeys(json, const <String>{
      'id',
      'outcome',
      'earnedPoints',
      'maxPoints',
      'summary',
    }, 'aiReadiness.check');
    final id = switch (_requiredString(json, 'id')) {
      'structure' => AiReadinessCheckId.structure,
      'schemas' => AiReadinessCheckId.schemas,
      'agentGuidance' => AiReadinessCheckId.agentGuidance,
      'llmsText' => AiReadinessCheckId.llmsText,
      'sitemap' => AiReadinessCheckId.sitemap,
      'fastFeedback' => AiReadinessCheckId.fastFeedback,
      _ => throw const FormatException('Unsupported AI readiness check.'),
    };
    final outcome = switch (_requiredString(json, 'outcome')) {
      'passed' => AiReadinessCheckOutcome.passed,
      'warning' => AiReadinessCheckOutcome.warning,
      'missing' => AiReadinessCheckOutcome.missing,
      'notApplicable' => AiReadinessCheckOutcome.notApplicable,
      _ => throw const FormatException(
        'Unsupported AI readiness check outcome.',
      ),
    };
    final earnedPoints = _requiredNonNegativeInt(json, 'earnedPoints');
    final maxPoints = _requiredNonNegativeInt(json, 'maxPoints');
    final expectedMaxPoints = switch (id) {
      AiReadinessCheckId.structure ||
      AiReadinessCheckId.agentGuidance ||
      AiReadinessCheckId.fastFeedback => 20,
      AiReadinessCheckId.schemas || AiReadinessCheckId.llmsText => 15,
      AiReadinessCheckId.sitemap => 10,
    };
    if (maxPoints != expectedMaxPoints || earnedPoints > maxPoints) {
      throw const FormatException('AI readiness check points are invalid.');
    }
    final outcomeMatchesPoints = switch (outcome) {
      AiReadinessCheckOutcome.passed => earnedPoints == maxPoints,
      AiReadinessCheckOutcome.warning =>
        earnedPoints > 0 && earnedPoints < maxPoints,
      AiReadinessCheckOutcome.missing => earnedPoints == 0,
      AiReadinessCheckOutcome.notApplicable =>
        id == AiReadinessCheckId.sitemap && earnedPoints == 0,
    };
    if (!outcomeMatchesPoints) {
      throw const FormatException(
        'AI readiness check outcome contradicts its points.',
      );
    }
    final summary = _requiredString(json, 'summary');
    if (summary.length > 256) {
      throw const FormatException('AI readiness check summary is too long.');
    }
    return AiReadinessCheck(
      id: id,
      outcome: outcome,
      earnedPoints: earnedPoints,
      maxPoints: maxPoints,
      summary: summary,
    );
  }

  ConversationSummary conversationFromJson(Map<String, Object?> json) {
    return ConversationSummary(
      id: _requiredString(json, 'id'),
      projectId: _requiredString(json, 'projectId'),
      title: _requiredString(json, 'title'),
      state: _conversationState(_requiredString(json, 'state')),
      updatedAt: _requiredDateTime(json, 'updatedAt'),
      unreadCount: _requiredNonNegativeInt(json, 'unreadCount'),
      activeRunId: _optionalString(json, 'activeRunId'),
    );
  }

  ConversationEvent eventFromJson(Map<String, Object?> json) {
    return ConversationEvent(
      id: _requiredString(json, 'id'),
      cursor: _requiredNonNegativeInt(json, 'cursor'),
      conversationId: _requiredString(json, 'conversationId'),
      type: _eventType(_requiredString(json, 'type')),
      occurredAt: _requiredDateTime(json, 'occurredAt'),
      summary: _summaryString(json['summary']),
      body: _optionalString(json, 'body'),
      runId: _optionalString(json, 'runId'),
      approvalId: _optionalString(json, 'approvalId'),
    );
  }

  ProjectHealthDimension _dimensionFromJson(Map<String, Object?> json) {
    final dimensionName = _requiredString(json, 'dimension');
    final dimension = HealthDimensionWireName.tryParse(dimensionName);
    if (dimension == null) {
      throw FormatException('Unsupported health dimension: $dimensionName');
    }
    final scoreValue = json['score'];
    final score = scoreValue == null ? null : _asInt(scoreValue, 'score');
    if (score != null && (score < 0 || score > 100)) {
      throw const FormatException('Health score must be between 0 and 100.');
    }
    return ProjectHealthDimension(
      dimension: dimension,
      status: _healthStatus(_requiredString(json, 'status')),
      summary: _summaryString(json['summary']),
      producer: _requiredString(json, 'producer'),
      evidenceCount: _requiredNonNegativeInt(json, 'evidenceCount'),
      score: score,
      checkedAt: _optionalDateTime(json, 'checkedAt'),
      sourceCommit: _optionalString(json, 'sourceCommit'),
      runId: _optionalString(json, 'runId'),
    );
  }

  ProjectAccessState _projectAccessState(String value) => switch (value) {
    'available' => ProjectAccessState.available,
    'needsGitHubApp' => ProjectAccessState.needsGitHubApp,
    'accessLost' => ProjectAccessState.accessLost,
    'installationSuspended' => ProjectAccessState.installationSuspended,
    'unavailable' => ProjectAccessState.unavailable,
    _ => throw FormatException('Unsupported project access state: $value'),
  };

  ConversationState _conversationState(String value) => switch (value) {
    'idle' => ConversationState.idle,
    'queued' => ConversationState.queued,
    'running' => ConversationState.running,
    'waitingApproval' => ConversationState.waitingApproval,
    'interrupted' => ConversationState.interrupted,
    'completed' => ConversationState.completed,
    'failed' => ConversationState.failed,
    _ => throw FormatException('Unsupported conversation state: $value'),
  };

  HealthStatus _healthStatus(String value) {
    final status = HealthStatusWireName.tryParse(value);
    if (status == null) {
      throw FormatException('Unsupported health status: $value');
    }
    return status;
  }

  ConversationEventType _eventType(String value) => switch (value) {
    'conversation.created' => ConversationEventType.conversationCreated,
    'conversation.titleChanged' =>
      ConversationEventType.conversationTitleChanged,
    'conversation.stateChanged' =>
      ConversationEventType.conversationStateChanged,
    'turn.started' => ConversationEventType.turnStarted,
    'turn.interrupted' => ConversationEventType.turnInterrupted,
    'turn.completed' => ConversationEventType.turnCompleted,
    'turn.failed' => ConversationEventType.turnFailed,
    'message.user' => ConversationEventType.userMessage,
    'message.assistant.delta' => ConversationEventType.assistantMessageDelta,
    'message.assistant.completed' =>
      ConversationEventType.assistantMessageCompleted,
    'plan.updated' => ConversationEventType.planUpdated,
    'tool.started' => ConversationEventType.toolStarted,
    'tool.output.delta' => ConversationEventType.toolOutputDelta,
    'tool.completed' => ConversationEventType.toolCompleted,
    'tool.failed' => ConversationEventType.toolFailed,
    'file.changeProposed' => ConversationEventType.fileChangeProposed,
    'file.changed' => ConversationEventType.fileChanged,
    'approval.requested' => ConversationEventType.approvalRequested,
    'approval.resolved' => ConversationEventType.approvalResolved,
    'approval.expired' => ConversationEventType.approvalExpired,
    'run.queued' => ConversationEventType.runQueued,
    'run.started' => ConversationEventType.runStarted,
    'run.progress' => ConversationEventType.runProgress,
    'run.completed' => ConversationEventType.runCompleted,
    'run.failed' => ConversationEventType.runFailed,
    'health.evidenceProduced' => ConversationEventType.healthEvidenceProduced,
    'tracker.changeProposed' => ConversationEventType.trackerChangeProposed,
    'diagnostic.warning' => ConversationEventType.diagnosticWarning,
    'diagnostic.error' => ConversationEventType.diagnosticError,
    'stream.heartbeat' => ConversationEventType.streamHeartbeat,
    _ => ConversationEventType.unknown,
  };

  static Map<String, Object?> _requiredMap(
    Map<String, Object?> json,
    String key,
  ) => _asMap(json[key], key);

  static void _requireOnlyKeys(
    Map<String, Object?> json,
    Set<String> allowed,
    String context,
  ) {
    if (!json.keys.every(allowed.contains) ||
        !allowed.every(json.containsKey)) {
      throw FormatException('$context has an unsupported shape.');
    }
  }

  static Map<String, Object?> _asMap(Object? value, String key) {
    if (value case final Map<Object?, Object?> raw) {
      final result = <String, Object?>{};
      for (final entry in raw.entries) {
        if (entry.key is! String) {
          throw FormatException('$key must use string keys.');
        }
        result[entry.key! as String] = entry.value;
      }
      return result;
    }
    throw FormatException('$key must be an object.');
  }

  static List<Object?> _requiredList(Map<String, Object?> json, String key) {
    final value = json[key];
    if (value is List<Object?>) return value;
    throw FormatException('$key must be a list.');
  }

  static String _requiredString(Map<String, Object?> json, String key) {
    final value = json[key];
    if (value is String && value.trim().isNotEmpty) return value;
    throw FormatException('$key must be a non-empty string.');
  }

  static String _summaryString(Object? value) {
    if (value is String && value.trim().isNotEmpty) return value;
    if (value is Map &&
        value['text'] is String &&
        (value['text'] as String).trim().isNotEmpty) {
      return value['text'] as String;
    }
    throw const FormatException(
      'summary must be a non-empty string or text object.',
    );
  }

  static String? _optionalString(Map<String, Object?> json, String key) {
    final value = json[key];
    if (value == null) return null;
    if (value is String && value.trim().isNotEmpty) return value;
    throw FormatException('$key must be null or a non-empty string.');
  }

  static int _requiredNonNegativeInt(Map<String, Object?> json, String key) {
    final value = _asInt(json[key], key);
    if (value < 0) throw FormatException('$key cannot be negative.');
    return value;
  }

  static int _asInt(Object? value, String key) {
    if (value is int) return value;
    throw FormatException('$key must be an integer.');
  }

  static double _requiredDouble(Map<String, Object?> json, String key) {
    final value = json[key];
    if (value is num) return value.toDouble();
    throw FormatException('$key must be a number.');
  }

  static DateTime _requiredDateTime(Map<String, Object?> json, String key) {
    final value = _requiredString(json, key);
    final parsed = DateTime.tryParse(value);
    if (parsed == null) throw FormatException('$key must be an ISO timestamp.');
    return parsed.toUtc();
  }

  static DateTime? _optionalDateTime(Map<String, Object?> json, String key) {
    final value = json[key];
    if (value == null) return null;
    if (value is! String) {
      throw FormatException('$key must be null or an ISO timestamp.');
    }
    final parsed = DateTime.tryParse(value);
    if (parsed == null) throw FormatException('$key must be an ISO timestamp.');
    return parsed.toUtc();
  }
}
