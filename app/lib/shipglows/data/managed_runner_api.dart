import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import 'cockpit/cockpit_dto_mapper.dart';
import 'cockpit/cockpit_models.dart';
import '../../domain/studio/studio_contracts.dart';
import '../../domain/studio/studio_compilation_routing.dart';
import '../../domain/studio/studio_session.dart';

typedef ManagedRunnerAccessTokenProvider =
    Future<String?> Function({bool forceRefresh});

class ManagedRunnerException implements Exception {
  const ManagedRunnerException({
    required this.code,
    required this.message,
    this.statusCode,
  });

  final String code;
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ManagedConversationResult {
  const ManagedConversationResult({
    required this.conversationId,
    required this.state,
    this.runId,
  });

  final String conversationId;
  final String state;
  final String? runId;

  factory ManagedConversationResult.fromJson(Map<String, dynamic> json) {
    final conversationId = json['conversationId'];
    final state = json['state'];
    if (conversationId is! String || state is! String) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid conversation result.',
      );
    }
    return ManagedConversationResult(
      conversationId: conversationId,
      state: state,
      runId: json['runId'] is String ? json['runId'] as String : null,
    );
  }
}

class ManagedConversationSummary {
  const ManagedConversationSummary({
    required this.conversationId,
    required this.projectId,
    required this.title,
    required this.state,
  });

  final String conversationId;
  final String projectId;
  final String title;
  final String state;

  factory ManagedConversationSummary.fromJson(Map<String, dynamic> json) {
    final conversationId = json['id'];
    final projectId = json['projectId'];
    final title = json['title'];
    final state = json['state'];
    if (conversationId is! String ||
        projectId is! String ||
        title is! String ||
        state is! String) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid conversation summary.',
      );
    }
    return ManagedConversationSummary(
      conversationId: conversationId,
      projectId: projectId,
      title: title,
      state: state,
    );
  }
}

class ManagedWorkspaceCapability {
  const ManagedWorkspaceCapability({
    required this.available,
    required this.reason,
  });

  final bool available;
  final String reason;

  factory ManagedWorkspaceCapability.fromJson(Map<String, dynamic> json) {
    final available = json['available'];
    final reason = json['reason'];
    if (available is! bool || reason is! String) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid Workspace capability.',
      );
    }
    return ManagedWorkspaceCapability(available: available, reason: reason);
  }
}

class ManagedOperatorSession {
  const ManagedOperatorSession({
    required this.sessionId,
    required this.token,
    required this.expiresAt,
  });
  final String sessionId;
  final String token;
  final DateTime expiresAt;

  factory ManagedOperatorSession.fromJson(Map<String, dynamic> json) {
    final sessionId = json['sessionId'];
    final token = json['token'];
    final expiresAt = DateTime.tryParse(json['expiresAt']?.toString() ?? '');
    if (sessionId is! String || token is! String || expiresAt == null) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid operator session.',
      );
    }
    return ManagedOperatorSession(
      sessionId: sessionId,
      token: token,
      expiresAt: expiresAt,
    );
  }
}

abstract interface class ManagedWorkspaceTransport {
  Future<ManagedOperatorSession> createOperatorSession({
    required String projectId,
    required String idempotencyKey,
  });
  WebSocketChannel connectOperatorSession(ManagedOperatorSession session);
  Future<void> closeOperatorSession({required String sessionId});
}

abstract interface class ManagedStudioTransport {
  Future<StudioPreviewCapability> studioCapability({required String projectId});
  Future<StudioRunnerSession> createStudioSession({
    required String projectId,
    required String idempotencyKey,
  });
  Future<StudioRunnerSession> applyStudioCommand({
    required String projectId,
    required VisualCommand command,
  });
  Future<StudioRunnerSession> moveStudioJournal({
    required String projectId,
    required String sessionId,
    required bool redo,
    required String idempotencyKey,
  });
  Future<StudioRunnerSession> mutateStudioVariant({
    required String projectId,
    required String sessionId,
    required String action,
    String? variantId,
    String? name,
    required String idempotencyKey,
  });
  Future<StudioRunnerSession> interruptStudioSession({
    required String projectId,
    required String sessionId,
    required String idempotencyKey,
  });
  Future<StudioRunnerSession> closeStudioSession({
    required String projectId,
    required String sessionId,
    required String idempotencyKey,
  });
  Future<StudioCompileProjection> compileStudioIntent({
    required String projectId,
    required StudioCompileIntent intent,
  });
}

abstract interface class ManagedCompilationRoutingTransport {
  Future<StudioCompilationRoutingProjection> studioCompilationRouting({
    required String projectId,
    required String sourceRevision,
    required String repositoryDigest,
  });
}

const _studioSurfaceContracts =
    <
      String,
      ({String label, String symbol, Set<StudioCapability> capabilities})
    >{
      'hero.root': (
        label: 'Hero',
        symbol: 'Hero',
        capabilities: {
          StudioCapability.tokenSet,
          StudioCapability.spacingSet,
          StudioCapability.radiusSet,
        },
      ),
      'hero.copy': (
        label: 'Hero copy',
        symbol: 'Hero.copy',
        capabilities: {
          StudioCapability.spacingSet,
          StudioCapability.radiusSet,
          StudioCapability.opacitySet,
          StudioCapability.transformSet,
          StudioCapability.visibilitySet,
          StudioCapability.motionDuration,
          StudioCapability.motionEasing,
        },
      ),
      'hero.eyebrow': (
        label: 'Eyebrow',
        symbol: 'Hero.eyebrow',
        capabilities: {
          StudioCapability.opacitySet,
          StudioCapability.transformSet,
          StudioCapability.visibilitySet,
          StudioCapability.motionDuration,
          StudioCapability.motionEasing,
        },
      ),
      'hero.title': (
        label: 'Title',
        symbol: 'Hero.title',
        capabilities: {
          StudioCapability.opacitySet,
          StudioCapability.transformSet,
          StudioCapability.visibilitySet,
          StudioCapability.motionDuration,
          StudioCapability.motionEasing,
        },
      ),
      'hero.body': (
        label: 'Body',
        symbol: 'Hero.body',
        capabilities: {
          StudioCapability.opacitySet,
          StudioCapability.transformSet,
          StudioCapability.visibilitySet,
          StudioCapability.motionDuration,
          StudioCapability.motionEasing,
        },
      ),
      'hero.points': (
        label: 'Proof points',
        symbol: 'Hero.points',
        capabilities: {
          StudioCapability.spacingSet,
          StudioCapability.opacitySet,
          StudioCapability.transformSet,
          StudioCapability.visibilitySet,
          StudioCapability.motionDuration,
          StudioCapability.motionEasing,
        },
      ),
      'hero.actions': (
        label: 'Actions',
        symbol: 'Hero.actions',
        capabilities: {
          StudioCapability.spacingSet,
          StudioCapability.opacitySet,
          StudioCapability.transformSet,
          StudioCapability.visibilitySet,
          StudioCapability.motionDuration,
          StudioCapability.motionEasing,
        },
      ),
      'hero.panel': (
        label: 'Product panel',
        symbol: 'Hero.panel',
        capabilities: {
          StudioCapability.tokenSet,
          StudioCapability.spacingSet,
          StudioCapability.radiusSet,
          StudioCapability.opacitySet,
          StudioCapability.transformSet,
          StudioCapability.visibilitySet,
          StudioCapability.motionDuration,
          StudioCapability.motionEasing,
        },
      ),
    };

const _studioProtectedDimensions = <StudioDimension>{
  StudioDimension.copy,
  StudioDimension.structure,
  StudioDimension.accessibility,
  StudioDimension.performance,
};

bool _sameSet<T>(Set<T> left, Set<T> right) =>
    left.length == right.length && left.containsAll(right);

Set<StudioCapability> _parseStudioCapabilities(
  Object? raw, {
  Set<StudioCapability> fallback = const <StudioCapability>{},
}) {
  if (raw == null) return Set.unmodifiable(fallback);
  if (raw is! List) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The Studio surface capabilities are invalid.',
    );
  }
  final result = <StudioCapability>{};
  for (final value in raw) {
    final capability = value is String
        ? studioCapabilityFromWireName(value)
        : null;
    if (capability == null || !result.add(capability)) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The Studio surface capabilities are invalid.',
      );
    }
  }
  return Set.unmodifiable(result);
}

Set<StudioDimension> _parseStudioDimensions(Object? raw) {
  if (raw == null) return const <StudioDimension>{};
  if (raw is! List) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The Studio protected dimensions are invalid.',
    );
  }
  final result = <StudioDimension>{};
  for (final value in raw) {
    final dimension = value is String
        ? StudioDimension.values.where((item) => item.name == value).firstOrNull
        : null;
    if (dimension == null || !result.add(dimension)) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The Studio protected dimensions are invalid.',
      );
    }
  }
  return Set.unmodifiable(result);
}

StudioCompileAdmission _parseCompileAdmission(Object? raw) {
  if (raw == null) {
    return const StudioCompileAdmission.workerIsolationUnavailable();
  }
  if (raw is! Map) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The Studio compile admission is invalid.',
    );
  }
  final value = Map<String, dynamic>.from(raw);
  const allowedKeys = {'available', 'reason', 'message'};
  if (value.length != allowedKeys.length ||
      value.keys.any((key) => !allowedKeys.contains(key)) ||
      value['available'] is! bool ||
      value['reason'] is! String ||
      value['message'] is! String) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The Studio compile admission is invalid.',
    );
  }
  final reason = switch (value['reason']) {
    'available' => StudioCompileAdmissionReason.available,
    'workerIsolationUnavailable' =>
      StudioCompileAdmissionReason.workerIsolationUnavailable,
    'profileReadOnly' => StudioCompileAdmissionReason.profileReadOnly,
    'protectionRequired' => StudioCompileAdmissionReason.protectionRequired,
    'staleRevision' => StudioCompileAdmissionReason.staleRevision,
    _ => null,
  };
  if (reason == null ||
      (value['available'] as bool) !=
          (reason == StudioCompileAdmissionReason.available)) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The Studio compile admission is inconsistent.',
    );
  }
  return StudioCompileAdmission(
    reason: reason,
    message: value['message'] as String,
  );
}

String _optionalStudioString(
  Map<String, dynamic> json,
  String key,
  String fallback,
) {
  final value = json[key];
  if (value == null) return fallback;
  if (value is! String || value.isEmpty || value.length > 256) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The Studio capability metadata is invalid.',
    );
  }
  return value;
}

List<String> _parseExpectedPaths(Object? raw) {
  if (raw == null) return const <String>[];
  if (raw is! List || raw.length > 16) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The Studio expected path projection is invalid.',
    );
  }
  final paths = <String>[];
  for (final value in raw) {
    if (value is! String ||
        value.isEmpty ||
        value.length > 256 ||
        value.startsWith('/') ||
        value.contains('\\') ||
        value.split('/').contains('..') ||
        value.contains(':')) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The Studio expected path projection is invalid.',
      );
    }
    paths.add(value);
  }
  return List.unmodifiable(paths);
}

String _requiredStudioString(
  Map<String, dynamic> json,
  String key, {
  int maximumLength = 256,
}) {
  final value = json[key];
  if (value is! String || value.isEmpty || value.length > maximumLength) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned an invalid Studio response.',
    );
  }
  return value;
}

List<String> _parseStudioStringList(Object? raw, {required int maximumItems}) {
  if (raw is! List || raw.length > maximumItems) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned an invalid Studio list.',
    );
  }
  final values = <String>[];
  for (final item in raw) {
    if (item is! String || item.isEmpty || item.length > 256) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid Studio list.',
      );
    }
    values.add(item);
  }
  if (values.toSet().length != values.length) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned a duplicate Studio list.',
    );
  }
  return List.unmodifiable(values);
}

StudioCompileProjection _parseStudioCompileIntent(Object? raw) {
  if (raw is! Map) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned an invalid Studio compile intent.',
    );
  }
  final json = Map<String, dynamic>.from(raw);
  const keys = {
    'schemaVersion',
    'intentId',
    'sessionId',
    'variantId',
    'frozenCommandRevision',
    'sourceCommit',
    'repositoryDigest',
    'adapterVersion',
    'capabilityVersion',
    'affectedSurfaceIds',
    'affectedDimensions',
    'predictedImpactPaths',
    'requiredEvidence',
    'actorId',
    'idempotencyKey',
    'createdAt',
    'status',
  };
  if (json.length != keys.length ||
      json.keys.any((key) => !keys.contains(key)) ||
      json['schemaVersion'] != studioContractVersion ||
      json['frozenCommandRevision'] is! int ||
      (json['frozenCommandRevision'] as int) < 0) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message:
          'The managed runner returned an extensible Studio compile intent.',
    );
  }
  final status = switch (json['status']) {
    'preflight' => StudioCompileStatus.preflight,
    'accepted' || 'running' => StudioCompileStatus.compiling,
    'verified' => StudioCompileStatus.verified,
    'failed' => StudioCompileStatus.failed,
    'conflict' => StudioCompileStatus.conflict,
    _ => null,
  };
  final createdAt = DateTime.tryParse(json['createdAt']?.toString() ?? '');
  final affectedDimensions = _parseStudioDimensions(json['affectedDimensions']);
  if (status == null || createdAt == null || affectedDimensions.isEmpty) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message:
          'The managed runner returned an unsupported Studio compile intent.',
    );
  }
  final message = switch (status) {
    StudioCompileStatus.preflight =>
      'Le runner a figé l’intention de compilation avant admission.',
    StudioCompileStatus.compiling =>
      'Le worker isolé a admis l’intention de compilation.',
    StudioCompileStatus.verified =>
      'La compilation et ses preuves ont été vérifiées.',
    StudioCompileStatus.failed =>
      'Compilation indisponible : le runner n’a pas admis de worker OCI isolé. La source reste inchangée.',
    StudioCompileStatus.conflict =>
      'La compilation est en conflit avec la révision ou la variante admise.',
    StudioCompileStatus.unavailable => 'Compilation indisponible.',
  };
  return StudioCompileProjection(
    status: status,
    message: message,
    intentId: _requiredStudioString(json, 'intentId'),
    compileRunId: _requiredStudioString(json, 'intentId'),
    sessionId: _requiredStudioString(json, 'sessionId'),
    variantId: _requiredStudioString(json, 'variantId'),
    frozenCommandRevision: json['frozenCommandRevision'] as int,
    baseRevision: _requiredStudioString(json, 'sourceCommit'),
    repositoryDigest: _requiredStudioString(json, 'repositoryDigest'),
    adapterVersion: _requiredStudioString(json, 'adapterVersion'),
    capabilityVersion: _requiredStudioString(json, 'capabilityVersion'),
    affectedSurfaceIds: _parseStudioStringList(
      json['affectedSurfaceIds'],
      maximumItems: StudioLimits.maxNodes,
    ),
    affectedDimensions: affectedDimensions,
    predictedImpactPaths: _parseExpectedPaths(json['predictedImpactPaths']),
    requiredEvidence: _parseStudioStringList(
      json['requiredEvidence'],
      maximumItems: 32,
    ),
    actorId: _requiredStudioString(json, 'actorId'),
    idempotencyKey: _requiredStudioString(json, 'idempotencyKey'),
    createdAt: createdAt.toUtc(),
  );
}

StudioRunnerSession _parseStudioSession(Object? raw) {
  if (raw is! Map) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned an invalid Studio session.',
    );
  }
  final json = Map<String, dynamic>.from(raw);
  const keys = {
    'contractVersion',
    'sessionId',
    'projectId',
    'profileId',
    'sourceRevision',
    'repositoryDigest',
    'state',
    'revision',
    'commandCount',
    'undoCursor',
    'canUndo',
    'canRedo',
    'variants',
    'activeVariantId',
    'laboratory',
    'idleExpiresAt',
    'absoluteExpiresAt',
    'cleanupState',
    'compileIntent',
  };
  if (json.length != keys.length ||
      json.keys.any((key) => !keys.contains(key)) ||
      json['contractVersion'] != studioContractVersion ||
      json['revision'] is! int ||
      json['commandCount'] is! int ||
      json['undoCursor'] is! int ||
      json['canUndo'] is! bool ||
      json['canRedo'] is! bool ||
      json['variants'] is! List ||
      (json['variants'] as List).length > StudioLimits.maxVariants ||
      json['laboratory'] is! Map) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned an extensible Studio session.',
    );
  }
  final state = StudioState.values
      .where((item) => item.name == json['state'])
      .firstOrNull;
  final cleanupState = StudioCleanupState.values
      .where((item) => item.name == json['cleanupState'])
      .firstOrNull;
  final laboratory = Map<String, dynamic>.from(json['laboratory'] as Map);
  const laboratoryKeys = {'mode', 'reasons'};
  final laboratoryLevel = switch (laboratory['mode']) {
    'studio' => StudioLaboratoryLevel.studio,
    'recommended' => StudioLaboratoryLevel.recommended,
    'active' => StudioLaboratoryLevel.active,
    _ => null,
  };
  final laboratoryReasons = _parseStudioStringList(
    laboratory['reasons'],
    maximumItems: 8,
  );
  const reasonCodes = {
    'structuralChange',
    'motionChange',
    'interactionState',
    'manySurfaces',
    'manyCommands',
    'manualVariant',
  };
  final idleExpiresAt = DateTime.tryParse(
    json['idleExpiresAt']?.toString() ?? '',
  );
  final absoluteExpiresAt = DateTime.tryParse(
    json['absoluteExpiresAt']?.toString() ?? '',
  );
  if (state == null ||
      cleanupState == null ||
      laboratory.length != laboratoryKeys.length ||
      laboratory.keys.any((key) => !laboratoryKeys.contains(key)) ||
      laboratoryLevel == null ||
      laboratoryReasons.any((reason) => !reasonCodes.contains(reason)) ||
      idleExpiresAt == null ||
      absoluteExpiresAt == null) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned an invalid Studio session state.',
    );
  }
  final variants = <StudioRunnerVariant>[];
  for (final rawVariant in json['variants'] as List) {
    if (rawVariant is! Map) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid Studio variant.',
      );
    }
    final variant = Map<String, dynamic>.from(rawVariant);
    const variantKeys = {
      'variantId',
      'name',
      'commandCount',
      'commandRevision',
    };
    if (variant.length != variantKeys.length ||
        variant.keys.any((key) => !variantKeys.contains(key)) ||
        variant['commandCount'] is! int ||
        variant['commandRevision'] is! int ||
        (variant['commandCount'] as int) < 0 ||
        (variant['commandRevision'] as int) < 0) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an extensible Studio variant.',
      );
    }
    variants.add(
      StudioRunnerVariant(
        id: _requiredStudioString(variant, 'variantId'),
        name: _requiredStudioString(variant, 'name', maximumLength: 64),
        commandCount: variant['commandCount'] as int,
        commandRevision: variant['commandRevision'] as int,
      ),
    );
  }
  final activeVariantId = json['activeVariantId'];
  final revision = json['revision'] as int;
  final commandCount = json['commandCount'] as int;
  final undoCursor = json['undoCursor'] as int;
  if (revision < 0 ||
      commandCount < 0 ||
      undoCursor < 0 ||
      undoCursor > commandCount ||
      variants.map((variant) => variant.id).toSet().length != variants.length ||
      (activeVariantId != null && activeVariantId is! String) ||
      (activeVariantId is String &&
          !variants.any((variant) => variant.id == activeVariantId)) ||
      (json['canUndo'] as bool) != (undoCursor > 0) ||
      (json['canRedo'] as bool) != (undoCursor < commandCount)) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned an inconsistent Studio session.',
    );
  }
  return StudioRunnerSession(
    sessionId: _requiredStudioString(json, 'sessionId'),
    projectId: _requiredStudioString(json, 'projectId'),
    profileId: _requiredStudioString(json, 'profileId'),
    sourceRevision: _requiredStudioString(json, 'sourceRevision'),
    repositoryDigest: _requiredStudioString(json, 'repositoryDigest'),
    state: state,
    revision: revision,
    commandCount: commandCount,
    undoCursor: undoCursor,
    canUndo: json['canUndo'] as bool,
    canRedo: json['canRedo'] as bool,
    variants: List.unmodifiable(variants),
    activeVariantId: activeVariantId as String?,
    laboratoryLevel: laboratoryLevel,
    laboratoryReasons: laboratoryReasons,
    idleExpiresAt: idleExpiresAt.toUtc(),
    absoluteExpiresAt: absoluteExpiresAt.toUtc(),
    cleanupState: cleanupState,
    compileIntent: json['compileIntent'] == null
        ? null
        : _parseStudioCompileIntent(json['compileIntent']),
  );
}

StudioRunnerSession _requireStudioSessionIdentity(
  StudioRunnerSession session, {
  required String projectId,
  String? sessionId,
}) {
  if (session.projectId != projectId ||
      (sessionId != null && session.sessionId != sessionId)) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The Studio session identity is inconsistent.',
    );
  }
  return session;
}

StudioCompilationRoutingProjection _parseCompilationRoutingProjection(
  dynamic raw, {
  required String projectId,
  required String sourceRevision,
  required String repositoryDigest,
}) {
  if (raw is! Map) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The managed runner returned invalid compilation routing.',
    );
  }
  final json = Map<String, dynamic>.from(raw);
  const rootKeys = {
    'contractVersion',
    'projectId',
    'projectKind',
    'sourceRevision',
    'repositoryDigest',
    'projectEvidenceDigest',
    'artifactDigests',
    'observedAt',
    'expiresAt',
    'routes',
  };
  final observedAt = DateTime.tryParse(
    json['observedAt']?.toString() ?? '',
  )?.toUtc();
  final expiresAt = DateTime.tryParse(
    json['expiresAt']?.toString() ?? '',
  )?.toUtc();
  final now = DateTime.now().toUtc();
  if (json.length != rootKeys.length ||
      json.keys.any((key) => !rootKeys.contains(key)) ||
      json['contractVersion'] != 'shipglows.compilation-routing.v1' ||
      json['projectId'] != projectId ||
      json['sourceRevision'] != sourceRevision ||
      json['repositoryDigest'] != repositoryDigest ||
      json['projectEvidenceDigest'] is! String ||
      !RegExp(
        r'^[a-fA-F0-9]{64}$',
      ).hasMatch(json['projectEvidenceDigest'] as String) ||
      observedAt == null ||
      expiresAt == null ||
      observedAt.isAfter(now) ||
      !expiresAt.isAfter(now) ||
      !expiresAt.isAfter(observedAt) ||
      expiresAt.difference(observedAt) > const Duration(minutes: 15) ||
      json['artifactDigests'] is! List ||
      json['routes'] is! List) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message:
          'The compilation routing identity or validity window is invalid.',
    );
  }
  final projectKind = switch (json['projectKind']) {
    'astro' => StudioProjectKind.astro,
    'flutter' => StudioProjectKind.flutter,
    _ => null,
  };
  if (projectKind == null) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The compilation routing project kind is invalid.',
    );
  }
  final artifactDigests = <StudioProjectArtifactDigest>[];
  final artifactPaths = <String>{};
  final rawArtifacts = json['artifactDigests'] as List;
  if (rawArtifacts.length > 16) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The project artifact digest set exceeds its closed limit.',
    );
  }
  for (final rawArtifact in rawArtifacts) {
    if (rawArtifact is! Map) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'A project artifact digest is invalid.',
      );
    }
    final artifact = Map<String, dynamic>.from(rawArtifact);
    final path = artifact['path'];
    final digest = artifact['digest'];
    if (artifact.length != 2 ||
        artifact.keys.any((key) => key != 'path' && key != 'digest') ||
        path is! String ||
        digest is! String ||
        !RegExp(r'^(?:site|app)/[A-Za-z0-9._/-]{1,192}$').hasMatch(path) ||
        path.split('/').contains('..') ||
        !RegExp(r'^[a-fA-F0-9]{64}$').hasMatch(digest) ||
        !artifactPaths.add(path)) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'A project artifact digest violates the closed schema.',
      );
    }
    artifactDigests.add(
      StudioProjectArtifactDigest(path: path, digest: digest),
    );
  }
  if (artifactDigests.length < 2 ||
      !List.generate(
        artifactDigests.length - 1,
        (index) =>
            artifactDigests[index].path.compareTo(
              artifactDigests[index + 1].path,
            ) <
            0,
      ).every((ordered) => ordered)) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'Project artifact digests are incomplete or unordered.',
    );
  }
  final rawRoutes = json['routes'] as List;
  if (rawRoutes.length != StudioArtifactTarget.values.length) {
    throw const ManagedRunnerException(
      code: 'invalidResponse',
      message: 'The compilation routing target matrix is incomplete.',
    );
  }
  const expected =
      <
        String,
        ({
          StudioArtifactTarget target,
          StudioExecutionEnvironment environment,
          String executionClass,
          String toolchain,
        })
      >{
        'astroWeb': (
          target: StudioArtifactTarget.astroWeb,
          environment: StudioExecutionEnvironment.web,
          executionClass: 'linuxSandbox',
          toolchain: 'astroNodePnpm',
        ),
        'flutterWeb': (
          target: StudioArtifactTarget.flutterWeb,
          environment: StudioExecutionEnvironment.web,
          executionClass: 'linuxSandbox',
          toolchain: 'flutterWeb',
        ),
        'flutterAndroid': (
          target: StudioArtifactTarget.android,
          environment: StudioExecutionEnvironment.android,
          executionClass: 'linuxSandbox',
          toolchain: 'flutterAndroidGradle',
        ),
        'flutterWindows': (
          target: StudioArtifactTarget.windows,
          environment: StudioExecutionEnvironment.windows,
          executionClass: 'windowsVm',
          toolchain: 'flutterWindowsMsvc',
        ),
        'flutterIos': (
          target: StudioArtifactTarget.ios,
          environment: StudioExecutionEnvironment.apple,
          executionClass: 'macosXcode',
          toolchain: 'flutterIosXcode',
        ),
      };
  const environmentCodes = {
    'astroWeb': 'linuxNode',
    'flutterWeb': 'linuxFlutter',
    'flutterAndroid': 'linuxAndroid',
    'flutterWindows': 'windowsFlutter',
    'flutterIos': 'macosFlutter',
  };
  const routeKeys = {
    'target',
    'projectSupported',
    'compilerAvailability',
    'environment',
    'executionClass',
    'toolchain',
    'reason',
  };
  const unavailableReasons = {
    'targetNotDeclared',
    'workerUnconfigured',
    'workerUnproved',
    'toolchainUnproved',
    'incompatibleWorker',
  };
  final routes = <StudioArtifactRoute>[];
  final seen = <StudioArtifactTarget>{};
  for (final rawRoute in rawRoutes) {
    if (rawRoute is! Map) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'A compilation route is invalid.',
      );
    }
    final route = Map<String, dynamic>.from(rawRoute);
    final targetCode = route['target'];
    final contract = targetCode is String ? expected[targetCode] : null;
    final supported = route['projectSupported'];
    final availability = route['compilerAvailability'];
    final reason = route['reason'];
    if (route.length != routeKeys.length ||
        route.keys.any((key) => !routeKeys.contains(key)) ||
        contract == null ||
        !seen.add(contract.target) ||
        supported is! bool ||
        (availability != 'available' && availability != 'unavailable') ||
        route['environment'] != environmentCodes[targetCode] ||
        route['executionClass'] != contract.executionClass ||
        route['toolchain'] != contract.toolchain ||
        (availability == 'available' && (!supported || reason != null)) ||
        (availability == 'unavailable' &&
            (reason is! String || !unavailableReasons.contains(reason))) ||
        (!supported && reason != 'targetNotDeclared')) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'A compilation route violates the closed target matrix.',
      );
    }
    routes.add(
      StudioArtifactRoute(
        target: contract.target,
        projectSupport: supported
            ? StudioProjectSupport.supported
            : StudioProjectSupport.unavailable,
        compilerAvailability: availability == 'available'
            ? StudioCompilerAvailability.available
            : StudioCompilerAvailability.unavailable,
        environment: contract.environment,
        message: availability == 'available'
            ? 'Le compilateur compatible est attesté pour cette cible.'
            : 'Le projet ou le compilateur compatible reste indisponible.',
      ),
    );
  }
  final supportedTargets = routes
      .where((route) => route.projectSupported)
      .map((route) => route.target)
      .toSet();
  bool exactArtifacts(Set<String> expectedPaths) =>
      artifactPaths.length == expectedPaths.length &&
      artifactPaths.containsAll(expectedPaths);
  if (projectKind == StudioProjectKind.astro) {
    if (supportedTargets.length != 1 ||
        !supportedTargets.contains(StudioArtifactTarget.astroWeb) ||
        !exactArtifacts({'site/package.json', 'site/pnpm-lock.yaml'})) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'Astro project evidence is inconsistent with its routes.',
      );
    }
  } else {
    if (supportedTargets.isEmpty ||
        supportedTargets.contains(StudioArtifactTarget.astroWeb)) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'Flutter project routes are inconsistent.',
      );
    }
    final androidMarkers = {
      'app/android/settings.gradle',
      'app/android/settings.gradle.kts',
    }.intersection(artifactPaths);
    final androidSupported = supportedTargets.contains(
      StudioArtifactTarget.android,
    );
    if ((androidSupported && androidMarkers.length != 1) ||
        (!androidSupported && androidMarkers.isNotEmpty)) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'Flutter Android evidence is inconsistent with its route.',
      );
    }
    final expectedPaths = <String>{'app/pubspec.lock', 'app/pubspec.yaml'};
    if (supportedTargets.contains(StudioArtifactTarget.flutterWeb)) {
      expectedPaths.add('app/web/index.html');
    }
    if (androidSupported) expectedPaths.add(androidMarkers.single);
    if (supportedTargets.contains(StudioArtifactTarget.windows)) {
      expectedPaths.add('app/windows/CMakeLists.txt');
    }
    if (supportedTargets.contains(StudioArtifactTarget.ios)) {
      expectedPaths.add('app/ios/Runner.xcodeproj/project.pbxproj');
    }
    if (!exactArtifacts(expectedPaths)) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'Flutter artifact evidence is inconsistent with its routes.',
      );
    }
  }
  return StudioCompilationRoutingProjection(
    routes: routes,
    contractVersion: json['contractVersion'] as String,
    projectId: json['projectId'] as String,
    projectKind: projectKind,
    sourceRevision: json['sourceRevision'] as String,
    repositoryDigest: json['repositoryDigest'] as String,
    projectEvidenceDigest: json['projectEvidenceDigest'] as String,
    artifactDigests: List.unmodifiable(artifactDigests),
    observedAt: observedAt,
    expiresAt: expiresAt,
  );
}

class ManagedApprovalResult {
  const ManagedApprovalResult({required this.approvalId, required this.state});

  final String approvalId;
  final String state;

  factory ManagedApprovalResult.fromJson(Map<String, dynamic> json) {
    final approvalId = json['approvalId'];
    final state = json['state'];
    if (approvalId is! String || state is! String) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid approval result.',
      );
    }
    return ManagedApprovalResult(approvalId: approvalId, state: state);
  }
}

class ManagedProjectIdentityResult {
  const ManagedProjectIdentityResult({
    required this.sourceSystem,
    required this.sourceProjectId,
    required this.projectId,
  });

  final String sourceSystem;
  final String sourceProjectId;
  final String projectId;

  factory ManagedProjectIdentityResult.fromJson(Map<String, dynamic> json) {
    final sourceSystem = json['sourceSystem'];
    final sourceProjectId = json['sourceProjectId'];
    final projectId = json['projectId'];
    if (sourceSystem is! String ||
        sourceProjectId is! String ||
        projectId is! String) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid project identity.',
      );
    }
    return ManagedProjectIdentityResult(
      sourceSystem: sourceSystem,
      sourceProjectId: sourceProjectId,
      projectId: projectId,
    );
  }
}

class ManagedConversationEvent {
  const ManagedConversationEvent({
    required this.cursor,
    required this.id,
    required this.type,
    required this.payload,
    required this.occurredAt,
  });

  final int cursor;
  final String id;
  final String type;
  final Map<String, dynamic> payload;
  final String occurredAt;

  factory ManagedConversationEvent.fromJson(Map<String, dynamic> json) {
    final cursor = json['cursor'];
    final id = json['id'];
    final type = json['type'];
    final payload = json['payload'];
    final occurredAt = json['occurredAt'];
    if (cursor is! int ||
        id is! String ||
        type is! String ||
        payload is! Map ||
        occurredAt is! String) {
      throw const ManagedRunnerException(
        code: 'invalidResponse',
        message: 'The managed runner returned an invalid event.',
      );
    }
    return ManagedConversationEvent(
      cursor: cursor,
      id: id,
      type: type,
      payload: Map<String, dynamic>.from(payload),
      occurredAt: occurredAt,
    );
  }
}

class ManagedRunnerSseParser {
  const ManagedRunnerSseParser();

  static Stream<ManagedConversationEvent> parse(
    Stream<List<int>> chunks,
  ) async* {
    var buffer = '';
    String? eventId;
    String? eventName;
    final dataLines = <String>[];
    void reset() {
      eventId = null;
      eventName = null;
      dataLines.clear();
    }

    Future<ManagedConversationEvent?> frame() async {
      if (dataLines.isEmpty) {
        return null;
      }
      final decoded = jsonDecode(dataLines.join('\n'));
      if (decoded is! Map) {
        return null;
      }
      final frameJson = Map<String, dynamic>.from(decoded);
      if (eventId != null) {
        frameJson['cursor'] = int.tryParse(eventId!) ?? decoded['cursor'];
      }
      if (eventName != null) {
        frameJson['type'] = eventName;
      }
      final event = ManagedConversationEvent.fromJson(frameJson);
      reset();
      return event;
    }

    await for (final chunk in chunks) {
      buffer += utf8.decode(chunk, allowMalformed: true);
      var newline = buffer.indexOf('\n');
      while (newline >= 0) {
        var line = buffer.substring(0, newline);
        buffer = buffer.substring(newline + 1);
        if (line.endsWith('\r')) line = line.substring(0, line.length - 1);
        if (line.isEmpty) {
          final event = await frame();
          if (event != null) yield event;
        } else if (line.startsWith('id:')) {
          eventId = line.substring(3).trim();
        } else if (line.startsWith('event:')) {
          eventName = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.add(line.substring(5).trimLeft());
        }
        newline = buffer.indexOf('\n');
      }
    }
    if (dataLines.isNotEmpty) {
      final event = await frame();
      if (event != null) yield event;
    }
  }
}

abstract interface class ManagedRunnerClient {
  Future<ManagedWorkspaceCapability> workspaceCapability({
    required String projectId,
  });

  Future<CockpitSnapshot> loadCockpit();

  Future<ManagedProjectIdentityResult> resolveProjectIdentity({
    required String sourceSystem,
    required String sourceProjectId,
  });

  Future<ManagedConversationResult> createConversation({
    required String projectId,
    required String title,
    required String idempotencyKey,
  });

  Future<List<ManagedConversationSummary>> listConversations({
    required String projectId,
  });

  Future<ManagedConversationResult> sendMessage({
    required String projectId,
    required String conversationId,
    required String text,
    required String idempotencyKey,
  });

  Future<ManagedConversationResult> interrupt({
    required String projectId,
    required String conversationId,
    required String idempotencyKey,
  });

  Future<ManagedConversationResult> resume({
    required String projectId,
    required String conversationId,
    required String idempotencyKey,
  });

  Future<ManagedApprovalResult> resolveApproval({
    required String projectId,
    required String approvalId,
    required String decision,
    required String idempotencyKey,
  });

  Stream<ManagedConversationEvent> events({
    required String projectId,
    required String conversationId,
    int after,
    bool live,
  });
}

abstract interface class ManagedRunnerTaskClient {
  Future<ManagedConversationResult> runAudit({
    required String projectId,
    required String scope,
    required String idempotencyKey,
  });

  Future<ManagedConversationResult> runFix({
    required String projectId,
    required String issueId,
    required String instruction,
    required String idempotencyKey,
  });
}

class ManagedRunnerApi
    implements
        ManagedRunnerClient,
        ManagedRunnerTaskClient,
        ManagedWorkspaceTransport,
        ManagedStudioTransport,
        ManagedCompilationRoutingTransport {
  ManagedRunnerApi({
    required String baseUrl,
    this.accessTokenProvider,
    Dio? dio,
  }) : _dio =
           dio ??
           Dio(
             BaseOptions(
               baseUrl: baseUrl,
               headers: {'Content-Type': 'application/json'},
             ),
           ) {
    final tokenProvider = accessTokenProvider;
    if (tokenProvider != null) {
      _dio.interceptors.add(_ManagedRunnerAuthInterceptor(_dio, tokenProvider));
    }
  }

  final Dio _dio;
  final ManagedRunnerAccessTokenProvider? accessTokenProvider;

  @override
  Future<StudioCompilationRoutingProjection> studioCompilationRouting({
    required String projectId,
    required String sourceRevision,
    required String repositoryDigest,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        '/v1/projects/$projectId/studio/compilation-routing',
        options: Options(headers: await _headers()),
      );
      return _parseCompilationRoutingProjection(
        response.data,
        projectId: projectId,
        sourceRevision: sourceRevision,
        repositoryDigest: repositoryDigest,
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<StudioPreviewCapability> studioCapability({
    required String projectId,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        '/v1/projects/$projectId/studio/capability',
        options: Options(headers: await _headers()),
      );
      final data = response.data;
      if (data is! Map) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message: 'The managed runner returned an invalid Studio capability.',
        );
      }
      final json = Map<String, dynamic>.from(data);
      const allowedCapabilityKeys = {
        'supported',
        'reason',
        'contractVersion',
        'bridgeVersion',
        'profileId',
        'previewOrigin',
        'capabilities',
        'surfaces',
        'sourceRevision',
        'repositoryDigest',
        'adapterVersion',
        'capabilityVersion',
        'compileAdmission',
        'expectedPaths',
      };
      if (json.length != allowedCapabilityKeys.length ||
          json.keys.any((key) => !allowedCapabilityKeys.contains(key))) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message:
              'The managed runner returned an extensible Studio capability.',
        );
      }
      final origin = Uri.tryParse(json['previewOrigin']?.toString() ?? '');
      final rawSurfaces = json['surfaces'];
      final rawCapabilities = json['capabilities'];
      const expectedCapabilityNames = [
        'token.set',
        'spacing.set',
        'radius.set',
        'opacity.set',
        'transform.set',
        'visibility.set',
        'motion.duration',
        'motion.easing',
      ];
      final semanticCapabilities = <StudioCapability>{};
      final exactCapabilities =
          rawCapabilities is List &&
          rawCapabilities.length == expectedCapabilityNames.length &&
          List.generate(
            rawCapabilities.length,
            (index) => rawCapabilities[index] == expectedCapabilityNames[index],
          ).every((matches) => matches);
      if (exactCapabilities) {
        for (final rawCapability in rawCapabilities) {
          if (rawCapability is! String) {
            throw const ManagedRunnerException(
              code: 'invalidResponse',
              message: 'The Studio capability projection is invalid.',
            );
          }
          final capability = studioCapabilityFromWireName(rawCapability);
          if (capability == null || !semanticCapabilities.add(capability)) {
            throw const ManagedRunnerException(
              code: 'invalidResponse',
              message: 'The Studio capability projection is invalid.',
            );
          }
        }
      }
      final exactProfile =
          json['supported'] == true &&
          json['reason'] == 'trustedFirstPartyBase' &&
          json['contractVersion'] == studioContractVersion &&
          json['profileId'] == 'shipglows.astro.hero.v1' &&
          json['bridgeVersion'] == 'shipglows.studio.bridge.v1' &&
          exactCapabilities &&
          json['sourceRevision'] is String &&
          RegExp(
            r'^[a-fA-F0-9]{7,64}$',
          ).hasMatch(json['sourceRevision'] as String) &&
          json['repositoryDigest'] is String &&
          RegExp(
            r'^[a-fA-F0-9]{64}$',
          ).hasMatch(json['repositoryDigest'] as String) &&
          json['adapterVersion'] is String &&
          json['capabilityVersion'] is String;
      final exactOrigin =
          origin != null &&
          origin.scheme == 'http' &&
          origin.host == '127.0.0.1' &&
          origin.port == 3003 &&
          origin.path.isEmpty &&
          !origin.hasQuery &&
          !origin.hasFragment;
      if (!exactProfile ||
          !exactOrigin ||
          rawSurfaces is! List ||
          rawSurfaces.length != _studioSurfaceContracts.length) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message:
              'The managed runner returned an unsupported Studio capability.',
        );
      }
      final surfaces = rawSurfaces
          .map((raw) {
            if (raw is! Map) {
              throw const ManagedRunnerException(
                code: 'invalidResponse',
                message: 'The Studio surface projection is invalid.',
              );
            }
            final surface = Map<String, dynamic>.from(raw);
            const allowedSurfaceKeys = {
              'id',
              'label',
              'sourceConfidence',
              'sourceSymbol',
              'capabilities',
              'protectedDimensions',
            };
            if (surface.length != allowedSurfaceKeys.length ||
                surface.keys.any((key) => !allowedSurfaceKeys.contains(key))) {
              throw const ManagedRunnerException(
                code: 'invalidResponse',
                message: 'The Studio surface projection is extensible.',
              );
            }
            if (surface['id'] is! String ||
                surface['label'] is! String ||
                surface['sourceConfidence'] != 'exact' ||
                (surface['id'] as String).isEmpty ||
                (surface['id'] as String).length > 128 ||
                (surface['label'] as String).isEmpty ||
                (surface['label'] as String).length > 128) {
              throw const ManagedRunnerException(
                code: 'invalidResponse',
                message: 'The Studio surface projection is invalid.',
              );
            }
            final sourceSymbol = surface['sourceSymbol'];
            if (sourceSymbol is! String ||
                sourceSymbol.isEmpty ||
                sourceSymbol.length > 256) {
              throw const ManagedRunnerException(
                code: 'invalidResponse',
                message: 'The Studio source projection is invalid.',
              );
            }
            final surfaceCapabilities = _parseStudioCapabilities(
              surface['capabilities'],
            );
            if (!semanticCapabilities.containsAll(surfaceCapabilities) ||
                surfaceCapabilities.isEmpty) {
              throw const ManagedRunnerException(
                code: 'invalidResponse',
                message: 'The Studio surface capability is not admitted.',
              );
            }
            final protectedDimensions = _parseStudioDimensions(
              surface['protectedDimensions'],
            );
            final surfaceContract =
                _studioSurfaceContracts[surface['id'] as String];
            if (surfaceContract == null ||
                surface['label'] != surfaceContract.label ||
                sourceSymbol != surfaceContract.symbol ||
                !_sameSet(surfaceCapabilities, surfaceContract.capabilities) ||
                !_sameSet(protectedDimensions, _studioProtectedDimensions)) {
              throw const ManagedRunnerException(
                code: 'invalidResponse',
                message: 'The Studio surface contract is inconsistent.',
              );
            }
            return StudioSurfaceSummary(
              id: surface['id'] as String,
              label: surface['label'] as String,
              sourceConfidence: surface['sourceConfidence'] as String,
              sourceSymbol: sourceSymbol as String?,
              capabilities: surfaceCapabilities,
              protectedDimensions: protectedDimensions,
            );
          })
          .toList(growable: false);
      if (surfaces.map((surface) => surface.id).toSet().length !=
              surfaces.length ||
          !List.generate(
            surfaces.length,
            (index) =>
                surfaces[index].id ==
                _studioSurfaceContracts.keys.elementAt(index),
          ).every((matches) => matches)) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message: 'The Studio surface projection contains duplicate ids.',
        );
      }
      return StudioPreviewCapability(
        profileId: json['profileId'] as String,
        bridgeVersion: json['bridgeVersion'] as String,
        previewOrigin: origin,
        surfaces: surfaces,
        sourceRevision: _optionalStudioString(
          json,
          'sourceRevision',
          'révision admise par le runner',
        ),
        repositoryDigest: _requiredStudioString(json, 'repositoryDigest'),
        adapterVersion: _optionalStudioString(
          json,
          'adapterVersion',
          'astro.hero.v1',
        ),
        capabilityVersion: _optionalStudioString(
          json,
          'capabilityVersion',
          studioContractVersion,
        ),
        capabilities: Set.unmodifiable(semanticCapabilities),
        compileAdmission: _parseCompileAdmission(json['compileAdmission']),
        expectedPaths: _parseExpectedPaths(json['expectedPaths']),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<StudioRunnerSession> createStudioSession({
    required String projectId,
    required String idempotencyKey,
  }) async {
    final session = await _command(
      'POST',
      '/v1/projects/$projectId/studio-sessions',
      body: const <String, dynamic>{},
      idempotencyKey: idempotencyKey,
      parser: _parseStudioSession,
    );
    return _requireStudioSessionIdentity(session, projectId: projectId);
  }

  @override
  Future<StudioRunnerSession> applyStudioCommand({
    required String projectId,
    required VisualCommand command,
  }) async {
    final session = await _command(
      'POST',
      '/v1/projects/$projectId/studio-sessions/${command.sessionId}/commands',
      body: command.toJson(),
      idempotencyKey: command.idempotencyKey,
      parser: _parseStudioSession,
    );
    return _requireStudioSessionIdentity(
      session,
      projectId: projectId,
      sessionId: command.sessionId,
    );
  }

  @override
  Future<StudioRunnerSession> moveStudioJournal({
    required String projectId,
    required String sessionId,
    required bool redo,
    required String idempotencyKey,
  }) async {
    final session = await _command(
      'POST',
      '/v1/projects/$projectId/studio-sessions/$sessionId/commands/${redo ? 'redo' : 'undo'}',
      body: const <String, dynamic>{},
      idempotencyKey: idempotencyKey,
      parser: _parseStudioSession,
    );
    return _requireStudioSessionIdentity(
      session,
      projectId: projectId,
      sessionId: sessionId,
    );
  }

  @override
  Future<StudioRunnerSession> mutateStudioVariant({
    required String projectId,
    required String sessionId,
    required String action,
    String? variantId,
    String? name,
    required String idempotencyKey,
  }) async {
    final body = switch (action) {
      'create' when name != null => <String, dynamic>{
        'action': action,
        'name': name,
      },
      'select' || 'delete' when variantId != null => <String, dynamic>{
        'action': action,
        'variantId': variantId,
      },
      _ => throw const ManagedRunnerException(
        code: 'invalidStudioMutation',
        message: 'The Studio variant mutation is invalid.',
      ),
    };
    final session = await _command(
      'POST',
      '/v1/projects/$projectId/studio-sessions/$sessionId/variants',
      body: body,
      idempotencyKey: idempotencyKey,
      parser: _parseStudioSession,
    );
    return _requireStudioSessionIdentity(
      session,
      projectId: projectId,
      sessionId: sessionId,
    );
  }

  @override
  Future<StudioRunnerSession> interruptStudioSession({
    required String projectId,
    required String sessionId,
    required String idempotencyKey,
  }) async {
    final session = await _command(
      'POST',
      '/v1/projects/$projectId/studio-sessions/$sessionId/interrupt',
      body: const <String, dynamic>{},
      idempotencyKey: idempotencyKey,
      parser: _parseStudioSession,
    );
    return _requireStudioSessionIdentity(
      session,
      projectId: projectId,
      sessionId: sessionId,
    );
  }

  @override
  Future<StudioRunnerSession> closeStudioSession({
    required String projectId,
    required String sessionId,
    required String idempotencyKey,
  }) async {
    try {
      final response = await _dio.delete<dynamic>(
        '/v1/projects/$projectId/studio-sessions/$sessionId',
        options: Options(
          headers: {...await _headers(), 'Idempotency-Key': idempotencyKey},
        ),
      );
      final session = _parseStudioSession(response.data);
      return _requireStudioSessionIdentity(
        session,
        projectId: projectId,
        sessionId: sessionId,
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<StudioCompileProjection> compileStudioIntent({
    required String projectId,
    required StudioCompileIntent intent,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        '/v1/projects/$projectId/studio-sessions/${intent.sessionId}/compile-intents',
        data: {'variantId': intent.variantId},
        options: Options(
          headers: {
            ...await _headers(),
            'Idempotency-Key': intent.idempotencyKey,
          },
        ),
      );
      final projection = _parseStudioCompileIntent(response.data);
      if (projection.sessionId != intent.sessionId ||
          projection.variantId != intent.variantId) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message: 'The Studio compile intent identity is inconsistent.',
        );
      }
      return projection;
    } on DioException catch (error) {
      final mapped = _mapError(error);
      if (mapped.code == 'studioConflict') {
        return StudioCompileProjection(
          status: StudioCompileStatus.conflict,
          message: mapped.message,
        );
      }
      if (mapped.code == 'studioCompileUnavailable') {
        return const StudioCompileProjection(
          status: StudioCompileStatus.unavailable,
          message:
              'Compilation indisponible : le runner n’a pas admis de worker OCI isolé. La source reste inchangée.',
        );
      }
      throw mapped;
    }
  }

  @override
  Future<ManagedOperatorSession> createOperatorSession({
    required String projectId,
    required String idempotencyKey,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        '/v1/projects/$projectId/operator-sessions',
        options: Options(
          headers: {...await _headers(), 'Idempotency-Key': idempotencyKey},
        ),
      );
      if (response.data is! Map) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message: 'The managed runner returned an invalid operator session.',
        );
      }
      return ManagedOperatorSession.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  WebSocketChannel connectOperatorSession(ManagedOperatorSession session) {
    final base = Uri.parse(_dio.options.baseUrl);
    final scheme = base.scheme == 'https' ? 'wss' : 'ws';
    final uri = base.replace(
      scheme: scheme,
      path: '/v1/operator-sessions/${session.sessionId}/stream',
      query: null,
    );
    return WebSocketChannel.connect(
      uri,
      protocols: ['shipglows.workspace.${session.token}'],
    );
  }

  @override
  Future<void> closeOperatorSession({required String sessionId}) async {
    try {
      await _dio.post<dynamic>(
        '/v1/operator-sessions/$sessionId/close',
        options: Options(headers: await _headers()),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<ManagedWorkspaceCapability> workspaceCapability({
    required String projectId,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        '/v1/projects/$projectId/operator-workspace',
        options: Options(headers: await _headers()),
      );
      if (response.data is! Map) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message:
              'The managed runner returned an invalid Workspace capability.',
        );
      }
      return ManagedWorkspaceCapability.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<CockpitSnapshot> loadCockpit() async {
    try {
      final response = await _dio.get<dynamic>(
        '/v1/cockpit',
        options: Options(headers: await _headers()),
      );
      if (response.data is! Map) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message: 'The managed runner returned an invalid Cockpit projection.',
        );
      }
      return const CockpitDtoMapper().snapshotFromJson(
        // The mapper validates every project and aggregate before exposure.
        response.data as Map<String, Object?>,
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<ManagedProjectIdentityResult> resolveProjectIdentity({
    required String sourceSystem,
    required String sourceProjectId,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        '/v1/projects/resolve',
        queryParameters: {
          'sourceSystem': sourceSystem,
          'sourceProjectId': sourceProjectId,
        },
        options: Options(headers: await _headers()),
      );
      final data = response.data;
      if (data is! Map) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message: 'The managed runner returned an invalid project identity.',
        );
      }
      return ManagedProjectIdentityResult.fromJson(
        Map<String, dynamic>.from(data),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<List<ManagedConversationSummary>> listConversations({
    required String projectId,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        '/v1/projects/$projectId/conversations',
        options: Options(headers: await _headers()),
      );
      final data = response.data;
      final conversations = data is Map ? data['conversations'] : null;
      if (conversations is! List) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message: 'The managed runner returned an invalid conversation list.',
        );
      }
      return conversations
          .whereType<Map>()
          .map(
            (item) => ManagedConversationSummary.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList(growable: false);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  @override
  Future<ManagedConversationResult> createConversation({
    required String projectId,
    required String title,
    required String idempotencyKey,
  }) async {
    return _command(
      'POST',
      '/v1/projects/$projectId/conversations',
      body: {'title': title},
      idempotencyKey: idempotencyKey,
      parser: ManagedConversationResult.fromJson,
    );
  }

  @override
  Future<ManagedConversationResult> sendMessage({
    required String projectId,
    required String conversationId,
    required String text,
    required String idempotencyKey,
  }) async {
    return _command(
      'POST',
      '/v1/projects/$projectId/conversations/$conversationId/messages',
      body: {'text': text},
      idempotencyKey: idempotencyKey,
      parser: ManagedConversationResult.fromJson,
    );
  }

  @override
  Future<ManagedConversationResult> interrupt({
    required String projectId,
    required String conversationId,
    required String idempotencyKey,
  }) async {
    return _command(
      'POST',
      '/v1/projects/$projectId/conversations/$conversationId/interrupt',
      body: const <String, dynamic>{},
      idempotencyKey: idempotencyKey,
      parser: ManagedConversationResult.fromJson,
    );
  }

  @override
  Future<ManagedConversationResult> resume({
    required String projectId,
    required String conversationId,
    required String idempotencyKey,
  }) async {
    return _command(
      'POST',
      '/v1/projects/$projectId/conversations/$conversationId/resume',
      body: const <String, dynamic>{},
      idempotencyKey: idempotencyKey,
      parser: ManagedConversationResult.fromJson,
    );
  }

  @override
  Future<ManagedConversationResult> runAudit({
    required String projectId,
    required String scope,
    required String idempotencyKey,
  }) => _command(
    'POST',
    '/v1/projects/$projectId/audits',
    body: {'scope': scope},
    idempotencyKey: idempotencyKey,
    parser: ManagedConversationResult.fromJson,
  );

  @override
  Future<ManagedConversationResult> runFix({
    required String projectId,
    required String issueId,
    required String instruction,
    required String idempotencyKey,
  }) => _command(
    'POST',
    '/v1/projects/$projectId/fixes',
    body: {'issueId': issueId, 'instruction': instruction},
    idempotencyKey: idempotencyKey,
    parser: ManagedConversationResult.fromJson,
  );

  @override
  Future<ManagedApprovalResult> resolveApproval({
    required String projectId,
    required String approvalId,
    required String decision,
    required String idempotencyKey,
  }) async {
    return _command(
      'POST',
      '/v1/projects/$projectId/approvals/$approvalId',
      body: {'decision': decision},
      idempotencyKey: idempotencyKey,
      parser: ManagedApprovalResult.fromJson,
    );
  }

  @override
  Stream<ManagedConversationEvent> events({
    required String projectId,
    required String conversationId,
    int after = 0,
    bool live = false,
  }) async* {
    try {
      final response = await _dio.get<ResponseBody>(
        '/v1/projects/$projectId/conversations/$conversationId/events',
        queryParameters: {'after': after, if (live) 'live': 'true'},
        options: Options(
          responseType: ResponseType.stream,
          headers: {
            ...await _headers(),
            if (after > 0) 'Last-Event-ID': '$after',
          },
        ),
      );
      final body = response.data;
      if (body == null) {
        throw const ManagedRunnerException(
          code: 'invalidResponse',
          message: 'The event stream was empty.',
        );
      }
      yield* ManagedRunnerSseParser.parse(body.stream);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<T> _command<T>(
    String method,
    String path, {
    required Map<String, dynamic> body,
    required String idempotencyKey,
    required T Function(Map<String, dynamic>) parser,
  }) async {
    for (var attempt = 0; attempt < 2; attempt += 1) {
      try {
        final response = await _dio.request<dynamic>(
          path,
          data: body,
          options: Options(
            method: method,
            headers: {...await _headers(), 'Idempotency-Key': idempotencyKey},
          ),
        );
        final data = response.data;
        if (data is! Map) {
          throw const ManagedRunnerException(
            code: 'invalidResponse',
            message: 'The managed runner returned an invalid response.',
          );
        }
        return parser(Map<String, dynamic>.from(data));
      } on DioException catch (error) {
        if (attempt == 0 && _isTransient(error)) continue;
        throw _mapError(error);
      }
    }
    throw const ManagedRunnerException(
      code: 'requestFailed',
      message: 'The managed runner request failed.',
    );
  }

  Future<Map<String, String>> _headers({bool forceRefresh = false}) async {
    final token = await accessTokenProvider?.call(forceRefresh: forceRefresh);
    return {
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  bool _isTransient(DioException error) => switch (error.type) {
    DioExceptionType.connectionError ||
    DioExceptionType.connectionTimeout ||
    DioExceptionType.sendTimeout ||
    DioExceptionType.receiveTimeout => true,
    _ => false,
  };

  ManagedRunnerException _mapError(DioException error) {
    final statusCode = error.response?.statusCode;
    final payload = error.response?.data;
    final errorBody = payload is Map ? payload['error'] : null;
    final fallbackCode = switch (error.type) {
      DioExceptionType.connectionError => 'offline',
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout => 'timeout',
      DioExceptionType.cancel => 'cancelled',
      _ => 'requestFailed',
    };
    final code = errorBody is Map && errorBody['code'] is String
        ? errorBody['code'] as String
        : fallbackCode;
    final message = errorBody is Map && errorBody['message'] is String
        ? errorBody['message'] as String
        : 'The managed runner request failed.';
    return ManagedRunnerException(
      code: statusCode == 401 ? 'unauthorized' : code,
      message: message,
      statusCode: statusCode,
    );
  }
}

class _ManagedRunnerAuthInterceptor extends QueuedInterceptor {
  _ManagedRunnerAuthInterceptor(this._dio, this._tokenProvider);

  static const _retryMarker = 'shipglowsAuthRetried';

  final Dio _dio;
  final ManagedRunnerAccessTokenProvider _tokenProvider;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.headers['Authorization'] == null) {
      final token = await _tokenProvider(forceRefresh: false);
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  void onError(DioException error, ErrorInterceptorHandler handler) async {
    final request = error.requestOptions;
    if (error.response?.statusCode != 401 ||
        request.extra[_retryMarker] == true) {
      handler.next(error);
      return;
    }

    final token = await _tokenProvider(forceRefresh: true);
    if (token == null || token.isEmpty) {
      handler.next(error);
      return;
    }

    try {
      final response = await _dio.fetch<dynamic>(
        request.copyWith(
          headers: {...request.headers, 'Authorization': 'Bearer $token'},
          extra: {...request.extra, _retryMarker: true},
        ),
      );
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }
}
