import '../../../domain/project_health/project_health_models.dart';

enum ProjectAccessState {
  available,
  needsGitHubApp,
  accessLost,
  installationSuspended,
  unavailable,
}

enum ConversationState {
  idle,
  queued,
  running,
  waitingApproval,
  interrupted,
  completed,
  failed,
}

enum AiReadinessStatus { ready, needsWork, partial, unavailable }

enum AiReadinessCheckId {
  structure,
  schemas,
  agentGuidance,
  llmsText,
  sitemap,
  fastFeedback,
}

enum AiReadinessCheckOutcome { passed, warning, missing, notApplicable }

class AiReadinessCheck {
  const AiReadinessCheck({
    required this.id,
    required this.outcome,
    required this.earnedPoints,
    required this.maxPoints,
    required this.summary,
  });

  final AiReadinessCheckId id;
  final AiReadinessCheckOutcome outcome;
  final int earnedPoints;
  final int maxPoints;
  final String summary;
}

class ProjectAiReadiness {
  const ProjectAiReadiness({
    required this.version,
    required this.status,
    required this.score,
    required this.coverage,
    required this.evaluatedAt,
    required this.checks,
    required this.recommendations,
  });

  const ProjectAiReadiness.unavailable()
    : version = 'shipglows.ai-readiness.v1',
      status = AiReadinessStatus.unavailable,
      score = null,
      coverage = 0,
      evaluatedAt = null,
      checks = const [],
      recommendations = const [];

  final String version;
  final AiReadinessStatus status;
  final int? score;
  final double coverage;
  final DateTime? evaluatedAt;
  final List<AiReadinessCheck> checks;
  final List<String> recommendations;
}

enum ConversationEventType {
  conversationCreated,
  conversationTitleChanged,
  conversationStateChanged,
  turnStarted,
  turnInterrupted,
  turnCompleted,
  turnFailed,
  userMessage,
  assistantMessageDelta,
  assistantMessageCompleted,
  planUpdated,
  toolStarted,
  toolOutputDelta,
  toolCompleted,
  toolFailed,
  fileChangeProposed,
  fileChanged,
  approvalRequested,
  approvalResolved,
  approvalExpired,
  runQueued,
  runStarted,
  runProgress,
  runCompleted,
  runFailed,
  healthEvidenceProduced,
  trackerChangeProposed,
  diagnosticWarning,
  diagnosticError,
  streamHeartbeat,
  unknown,
}

class CockpitSnapshot {
  const CockpitSnapshot({required this.generatedAt, required this.projects});

  final DateTime generatedAt;
  final List<CockpitProject> projects;
}

class CockpitProject {
  const CockpitProject({
    required this.id,
    required this.name,
    required this.repositoryFullName,
    required this.accessState,
    required this.health,
    required this.conversationCount,
    required this.activeRunCount,
    this.aiReadiness = const ProjectAiReadiness.unavailable(),
  });

  final String id;
  final String name;
  final String repositoryFullName;
  final ProjectAccessState accessState;
  final ProjectHealthMatrix health;
  final int conversationCount;
  final int activeRunCount;
  final ProjectAiReadiness aiReadiness;

  bool get actionsEnabled => accessState == ProjectAccessState.available;
}

class ConversationSummary {
  const ConversationSummary({
    required this.id,
    required this.projectId,
    required this.title,
    required this.state,
    required this.updatedAt,
    required this.unreadCount,
    this.activeRunId,
  });

  final String id;
  final String projectId;
  final String title;
  final ConversationState state;
  final DateTime updatedAt;
  final int unreadCount;
  final String? activeRunId;
}

class ConversationEvent {
  const ConversationEvent({
    required this.id,
    required this.cursor,
    required this.conversationId,
    required this.type,
    required this.occurredAt,
    required this.summary,
    this.body,
    this.runId,
    this.approvalId,
  });

  final String id;
  final int cursor;
  final String conversationId;
  final ConversationEventType type;
  final DateTime occurredAt;
  final String summary;
  final String? body;
  final String? runId;
  final String? approvalId;

  bool get isUnknown => type == ConversationEventType.unknown;
}

class CommandReceipt {
  const CommandReceipt({
    required this.id,
    required this.state,
    required this.createdAt,
  });

  final String id;
  final String state;
  final DateTime createdAt;
}

abstract interface class CockpitRepository {
  Future<CockpitSnapshot> loadCockpit();

  Future<List<ConversationSummary>> listConversations(String projectId);

  Future<List<ConversationEvent>> loadConversation(
    String conversationId, {
    int afterCursor = 0,
  });

  Stream<ConversationEvent> watchConversation(
    String conversationId, {
    int afterCursor = 0,
  });

  Future<ConversationSummary> createConversation({
    required String projectId,
    required String idempotencyKey,
  });

  Future<CommandReceipt> sendMessage({
    required String conversationId,
    required String message,
    required String idempotencyKey,
  });

  Future<CommandReceipt> launchAudit({
    required String projectId,
    required String auditType,
    required String idempotencyKey,
  });

  Future<CommandReceipt> proposeFix({
    required String projectId,
    required String findingId,
    required String idempotencyKey,
  });

  Future<CommandReceipt> interrupt({
    required String conversationId,
    required String idempotencyKey,
  });

  Future<CommandReceipt> resolveApproval({
    required String conversationId,
    required String approvalId,
    required bool approved,
    required String idempotencyKey,
  });
}
