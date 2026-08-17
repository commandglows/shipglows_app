import 'studio_contracts.dart';

enum StudioPreviewHandshake { waiting, ready, failed }

enum StudioLaboratoryLevel { studio, recommended, active }

enum StudioLaboratoryReasonCode {
  manual,
  ambiguousSource,
  structuralEdit,
  sharedComponent,
  multipleResponsiveStates,
  interactiveBehavior,
  protectedDimension,
  staleRevision,
  manySurfaces,
  manyCommands,
  multipleSourceFiles,
  largeVisualDelta,
  uncertainResponsivePropagation,
}

class StudioLaboratoryReason {
  const StudioLaboratoryReason({
    required this.code,
    required this.hard,
    required this.message,
  });

  final StudioLaboratoryReasonCode code;
  final bool hard;
  final String message;
}

class StudioPolicyFacts {
  const StudioPolicyFacts({
    this.manual = false,
    this.ambiguousSource = false,
    this.structuralEdit = false,
    this.sharedComponent = false,
    this.multipleResponsiveStates = false,
    this.interactiveBehavior = false,
    this.protectedDimension = false,
    this.staleRevision = false,
    this.meaningfulSurfaceCount = 0,
    this.compactedCommandCount = 0,
    this.expectedSourceFileCount = 0,
    this.largeVisualDelta = false,
    this.uncertainResponsivePropagation = false,
  });

  final bool manual;
  final bool ambiguousSource;
  final bool structuralEdit;
  final bool sharedComponent;
  final bool multipleResponsiveStates;
  final bool interactiveBehavior;
  final bool protectedDimension;
  final bool staleRevision;
  final int meaningfulSurfaceCount;
  final int compactedCommandCount;
  final int expectedSourceFileCount;
  final bool largeVisualDelta;
  final bool uncertainResponsivePropagation;
}

class StudioLaboratoryEvaluation {
  const StudioLaboratoryEvaluation({
    required this.level,
    required this.reasons,
  });

  final StudioLaboratoryLevel level;
  final List<StudioLaboratoryReason> reasons;
}

StudioLaboratoryEvaluation evaluateStudioLaboratoryPolicy(
  StudioPolicyFacts facts,
) {
  final reasons = <StudioLaboratoryReason>[
    if (facts.manual)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.manual,
        hard: true,
        message: 'Laboratoire activé manuellement.',
      ),
    if (facts.ambiguousSource)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.ambiguousSource,
        hard: true,
        message: 'La source de la surface est ambiguë.',
      ),
    if (facts.structuralEdit)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.structuralEdit,
        hard: true,
        message: 'Une modification structurelle est demandée.',
      ),
    if (facts.sharedComponent)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.sharedComponent,
        hard: true,
        message: 'Un composant partagé est affecté.',
      ),
    if (facts.multipleResponsiveStates)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.multipleResponsiveStates,
        hard: true,
        message: 'Plusieurs breakpoints ou états sont affectés.',
      ),
    if (facts.interactiveBehavior)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.interactiveBehavior,
        hard: true,
        message: 'Un comportement interactif ou animé est introduit.',
      ),
    if (facts.protectedDimension)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.protectedDimension,
        hard: true,
        message: 'Une dimension protégée nécessite une décision explicite.',
      ),
    if (facts.staleRevision)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.staleRevision,
        hard: true,
        message: 'La révision source ou les capacités ont changé.',
      ),
    if (facts.meaningfulSurfaceCount > 3)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.manySurfaces,
        hard: false,
        message: 'Plus de trois surfaces significatives sont affectées.',
      ),
    if (facts.compactedCommandCount > 5)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.manyCommands,
        hard: false,
        message: 'Plus de cinq ajustements dépendants restent actifs.',
      ),
    if (facts.expectedSourceFileCount > 1)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.multipleSourceFiles,
        hard: false,
        message: 'L’impact prévisible couvre plusieurs fichiers source.',
      ),
    if (facts.largeVisualDelta)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.largeVisualDelta,
        hard: false,
        message: 'Le delta visuel est important.',
      ),
    if (facts.uncertainResponsivePropagation)
      const StudioLaboratoryReason(
        code: StudioLaboratoryReasonCode.uncertainResponsivePropagation,
        hard: false,
        message: 'La propagation responsive reste incertaine.',
      ),
  ];
  final hard = reasons.any((reason) => reason.hard);
  final softCount = reasons.where((reason) => !reason.hard).length;
  return StudioLaboratoryEvaluation(
    level: hard
        ? StudioLaboratoryLevel.active
        : softCount >= 2
        ? StudioLaboratoryLevel.recommended
        : StudioLaboratoryLevel.studio,
    reasons: List.unmodifiable(reasons),
  );
}

class StudioCommandJournal {
  const StudioCommandJournal({this.commands = const [], this.cursor = 0});

  final List<VisualCommand> commands;
  final int cursor;

  bool get canUndo => cursor > 0;
  bool get canRedo => cursor < commands.length;
  List<VisualCommand> get activeCommands =>
      List.unmodifiable(commands.take(cursor));

  StudioCommandJournal apply(VisualCommand command) {
    final next = [...commands.take(cursor)];
    if (next.isNotEmpty &&
        command.compactionKey != null &&
        next.last.compactionKey == command.compactionKey &&
        next.last.capability == command.capability) {
      next[next.length - 1] = command;
    } else {
      if (next.length >= StudioLimits.maxCommandsPerVariant) {
        throw const StudioContractException(
          'La variante a atteint sa limite de commandes.',
        );
      }
      next.add(command);
    }
    return StudioCommandJournal(
      commands: List.unmodifiable(next),
      cursor: next.length,
    );
  }

  StudioCommandJournal undo() => canUndo
      ? StudioCommandJournal(commands: commands, cursor: cursor - 1)
      : this;

  StudioCommandJournal redo() => canRedo
      ? StudioCommandJournal(commands: commands, cursor: cursor + 1)
      : this;
}

class StudioVariant {
  const StudioVariant({
    required this.id,
    required this.name,
    required this.journal,
  });

  final String id;
  final String name;
  final StudioCommandJournal journal;

  StudioVariant copyWith({String? name, StudioCommandJournal? journal}) =>
      StudioVariant(
        id: id,
        name: name ?? this.name,
        journal: journal ?? this.journal,
      );
}

enum StudioCleanupState { active, pending, cleaned, quarantined }

class StudioRunnerVariant {
  const StudioRunnerVariant({
    required this.id,
    required this.name,
    required this.commandCount,
    required this.commandRevision,
  });

  final String id;
  final String name;
  final int commandCount;
  final int commandRevision;
}

class StudioRunnerSession {
  const StudioRunnerSession({
    required this.sessionId,
    required this.projectId,
    required this.profileId,
    required this.sourceRevision,
    required this.repositoryDigest,
    required this.state,
    required this.revision,
    required this.commandCount,
    required this.undoCursor,
    required this.canUndo,
    required this.canRedo,
    required this.variants,
    required this.activeVariantId,
    required this.laboratoryLevel,
    required this.laboratoryReasons,
    required this.idleExpiresAt,
    required this.absoluteExpiresAt,
    required this.cleanupState,
    this.compileIntent,
  });

  final String sessionId;
  final String projectId;
  final String profileId;
  final String sourceRevision;
  final String repositoryDigest;
  final StudioState state;
  final int revision;
  final int commandCount;
  final int undoCursor;
  final bool canUndo;
  final bool canRedo;
  final List<StudioRunnerVariant> variants;
  final String? activeVariantId;
  final StudioLaboratoryLevel laboratoryLevel;
  final List<String> laboratoryReasons;
  final DateTime idleExpiresAt;
  final DateTime absoluteExpiresAt;
  final StudioCleanupState cleanupState;
  final StudioCompileProjection? compileIntent;
}

enum StudioCompileStatus {
  unavailable,
  preflight,
  compiling,
  conflict,
  failed,
  verified,
}

class StudioCompileProjection {
  const StudioCompileProjection({
    required this.status,
    required this.message,
    this.compileRunId,
    this.baseRevision,
    this.targetRevision,
    this.patchDigest,
    this.intentId,
    this.sessionId,
    this.variantId,
    this.frozenCommandRevision,
    this.repositoryDigest,
    this.adapterVersion,
    this.capabilityVersion,
    this.affectedSurfaceIds = const <String>[],
    this.affectedDimensions = const <StudioDimension>{},
    this.predictedImpactPaths = const <String>[],
    this.requiredEvidence = const <String>[],
    this.actorId,
    this.idempotencyKey,
    this.createdAt,
  });

  final StudioCompileStatus status;
  final String message;
  final String? compileRunId;
  final String? baseRevision;
  final String? targetRevision;
  final String? patchDigest;
  final String? intentId;
  final String? sessionId;
  final String? variantId;
  final int? frozenCommandRevision;
  final String? repositoryDigest;
  final String? adapterVersion;
  final String? capabilityVersion;
  final List<String> affectedSurfaceIds;
  final Set<StudioDimension> affectedDimensions;
  final List<String> predictedImpactPaths;
  final List<String> requiredEvidence;
  final String? actorId;
  final String? idempotencyKey;
  final DateTime? createdAt;
}

class StudioCompileIntent {
  const StudioCompileIntent({
    required this.intentId,
    required this.sessionId,
    required this.variantId,
    required this.frozenCommandRevision,
    required this.baseRevision,
    required this.adapterVersion,
    required this.capabilityVersion,
    required this.affectedSurfaceIds,
    required this.affectedDimensions,
    required this.expectedPaths,
    required this.idempotencyKey,
  });

  final String intentId;
  final String sessionId;
  final String variantId;
  final int frozenCommandRevision;
  final String baseRevision;
  final String adapterVersion;
  final String capabilityVersion;
  final List<String> affectedSurfaceIds;
  final Set<StudioDimension> affectedDimensions;
  final List<String> expectedPaths;
  final String idempotencyKey;

  Map<String, Object> toJson() => {
    'schemaVersion': studioContractVersion,
    'intentId': intentId,
    'sessionId': sessionId,
    'variantId': variantId,
    'frozenCommandRevision': frozenCommandRevision,
    'baseRevision': baseRevision,
    'adapterVersion': adapterVersion,
    'capabilityVersion': capabilityVersion,
    'affectedSurfaceIds': affectedSurfaceIds,
    'affectedDimensions': affectedDimensions
        .map((value) => value.name)
        .toList(),
    'expectedPaths': expectedPaths,
    'idempotencyKey': idempotencyKey,
  };
}
