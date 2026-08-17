import 'dart:convert';

const studioContractVersion = 'shipglows.studio.v1';
const supportedStudioProfiles = <String, String>{
  'shipglows_app': 'shipglows.astro.hero.v1',
  'gocharbon': 'gocharbon.astro.hero.v1',
};

bool isSupportedStudioProfile(String projectId, String profileId) =>
    supportedStudioProfiles[projectId] == profileId;

abstract final class StudioLimits {
  static const maxNodes = 256;
  static const maxCommandsPerVariant = 128;
  static const maxVariants = 8;
  static const maxViewports = 3;
  static const maxCompileRuns = 1;
  static const maxRequestBytes = 16 * 1024;
  static const maxBridgeMessageBytes = 256 * 1024;
  static const idleTimeout = Duration(minutes: 30);
  static const absoluteTimeout = Duration(hours: 4);
}

enum StudioState {
  unavailable,
  starting,
  ready,
  previewing,
  laboratory,
  compiling,
  verifying,
  verified,
  conflict,
  interrupted,
  failed,
  closed,
}

enum StudioCapability {
  tokenSet,
  typographySet,
  colorSet,
  spacingSet,
  radiusSet,
  opacitySet,
  layoutReorder,
  transformSet,
  visibilitySet,
  stateSet,
  motionDuration,
  motionEasing,
}

String studioCapabilityWireName(StudioCapability capability) =>
    switch (capability) {
      StudioCapability.tokenSet => 'token.set',
      StudioCapability.typographySet => 'typography.set',
      StudioCapability.colorSet => 'color.set',
      StudioCapability.spacingSet => 'spacing.set',
      StudioCapability.radiusSet => 'radius.set',
      StudioCapability.opacitySet => 'opacity.set',
      StudioCapability.layoutReorder => 'layout.reorder',
      StudioCapability.transformSet => 'transform.set',
      StudioCapability.visibilitySet => 'visibility.set',
      StudioCapability.stateSet => 'state.set',
      StudioCapability.motionDuration => 'motion.duration',
      StudioCapability.motionEasing => 'motion.easing',
    };

StudioCapability? studioCapabilityFromWireName(String value) {
  for (final capability in StudioCapability.values) {
    if (studioCapabilityWireName(capability) == value) return capability;
  }
  return null;
}

enum StudioDimension {
  copy,
  design,
  structure,
  function,
  motion,
  accessibility,
  performance,
}

class StudioContractException implements Exception {
  const StudioContractException(this.message);
  final String message;
  @override
  String toString() => 'StudioContractException: $message';
}

const _allowedTransitions = <StudioState, Set<StudioState>>{
  StudioState.unavailable: {StudioState.starting, StudioState.closed},
  StudioState.starting: {
    StudioState.ready,
    StudioState.failed,
    StudioState.closed,
  },
  StudioState.ready: {
    StudioState.previewing,
    StudioState.laboratory,
    StudioState.conflict,
    StudioState.interrupted,
    StudioState.failed,
    StudioState.closed,
  },
  StudioState.previewing: {
    StudioState.ready,
    StudioState.laboratory,
    StudioState.conflict,
    StudioState.interrupted,
    StudioState.failed,
    StudioState.closed,
  },
  StudioState.laboratory: {
    StudioState.previewing,
    StudioState.compiling,
    StudioState.conflict,
    StudioState.interrupted,
    StudioState.failed,
    StudioState.closed,
  },
  StudioState.compiling: {
    StudioState.verifying,
    StudioState.conflict,
    StudioState.interrupted,
    StudioState.failed,
  },
  StudioState.verifying: {
    StudioState.verified,
    StudioState.conflict,
    StudioState.interrupted,
    StudioState.failed,
  },
  StudioState.verified: {StudioState.closed},
  StudioState.conflict: {StudioState.laboratory, StudioState.closed},
  StudioState.interrupted: {StudioState.closed},
  StudioState.failed: {StudioState.laboratory, StudioState.closed},
  StudioState.closed: {},
};

StudioState transitionStudioState(StudioState from, StudioState to) {
  if (!_allowedTransitions[from]!.contains(to)) {
    throw StudioContractException(
      'Studio transition ${from.name} -> ${to.name} is not allowed.',
    );
  }
  return to;
}

class StudioTargetProfile {
  const StudioTargetProfile({
    required this.profileId,
    required this.projectId,
    required this.sourceRevision,
    required this.repositoryDigest,
    required this.adapterVersion,
    required this.capabilityVersion,
    required this.capabilities,
    required this.trustedFirstPartyBaseOnly,
    required this.productionExcluded,
  });

  final String profileId;
  final String projectId;
  final String sourceRevision;
  final String repositoryDigest;
  final String adapterVersion;
  final String capabilityVersion;
  final Set<StudioCapability> capabilities;
  final bool trustedFirstPartyBaseOnly;
  final bool productionExcluded;
}

class StudioTargetRequest {
  const StudioTargetRequest({
    required this.projectId,
    required this.sourceRevision,
    required this.repositoryDigest,
    required this.adapterVersion,
    required this.capabilityVersion,
    required this.capabilities,
    required this.trustedFirstPartyBase,
  });

  final String projectId;
  final String sourceRevision;
  final String repositoryDigest;
  final String adapterVersion;
  final String capabilityVersion;
  final Set<StudioCapability> capabilities;
  final bool trustedFirstPartyBase;
}

sealed class StudioTargetNegotiation {
  const StudioTargetNegotiation();
}

final class StudioTargetSupported extends StudioTargetNegotiation {
  const StudioTargetSupported(this.capabilities);
  final Set<StudioCapability> capabilities;
}

final class StudioTargetUnsupported extends StudioTargetNegotiation {
  const StudioTargetUnsupported(this.reason);
  final String reason;
}

StudioTargetNegotiation negotiateStudioTarget(
  StudioTargetProfile profile,
  StudioTargetRequest request,
) {
  final exactProfile =
      isSupportedStudioProfile(profile.projectId, profile.profileId) &&
      profile.projectId == request.projectId &&
      profile.sourceRevision == request.sourceRevision &&
      profile.repositoryDigest == request.repositoryDigest &&
      profile.adapterVersion == request.adapterVersion &&
      profile.capabilityVersion == request.capabilityVersion &&
      profile.trustedFirstPartyBaseOnly &&
      profile.productionExcluded &&
      request.trustedFirstPartyBase;
  if (!exactProfile) {
    return const StudioTargetUnsupported('profileMismatch');
  }
  if (!profile.capabilities.containsAll(request.capabilities)) {
    return const StudioTargetUnsupported('unsupportedCapability');
  }
  return StudioTargetSupported(Set.unmodifiable(request.capabilities));
}

class VisualCommand {
  const VisualCommand({
    required this.commandId,
    required this.sessionId,
    required this.capability,
    required this.parameters,
    required this.affectedRuntimeNodeIds,
    required this.affectedDimensions,
    required this.revision,
    required this.idempotencyKey,
    this.previewOnly = true,
    this.actorId = 'operator',
    this.requiredUnprotectedDimensions = const <StudioDimension>{},
    this.compactionKey,
  });

  final String commandId;
  final String sessionId;
  final StudioCapability capability;
  final Map<String, Object> parameters;
  final List<String> affectedRuntimeNodeIds;
  final Set<StudioDimension> affectedDimensions;
  final int revision;
  final String idempotencyKey;
  final bool previewOnly;
  final String actorId;
  final Set<StudioDimension> requiredUnprotectedDimensions;
  final String? compactionKey;

  void validate() {
    if (!previewOnly || revision < 1 || affectedRuntimeNodeIds.length != 1) {
      throw const StudioContractException('Visual command is invalid.');
    }
    const forbidden = {
      'css',
      'javascript',
      'shell',
      'path',
      'selector',
      'prompt',
      'source',
      'command',
    };
    if (parameters.keys.any((key) => forbidden.contains(key.toLowerCase()))) {
      throw const StudioContractException(
        'Visual command parameters must remain semantic.',
      );
    }
    if (affectedRuntimeNodeIds.length > StudioLimits.maxNodes) {
      throw const StudioContractException('Visual command exceeds node limit.');
    }
    if (studioBridgeMessageBytes(toJson()) > StudioLimits.maxRequestBytes) {
      throw const StudioContractException(
        'Visual command exceeds the request limit.',
      );
    }
  }

  Map<String, Object> toJson() {
    final result = <String, Object>{
      'schemaVersion': studioContractVersion,
      'commandId': commandId,
      'sessionId': sessionId,
      'kind': studioCapabilityWireName(capability),
      'parameters': parameters,
      'affectedRuntimeNodeIds': affectedRuntimeNodeIds,
      'affectedDimensions': affectedDimensions
          .map((value) => value.name)
          .toList(),
      'provenance': {'actorType': 'operator', 'actorId': actorId},
      'revision': revision,
      'idempotencyKey': idempotencyKey,
      'previewOnly': previewOnly,
      'requiredCapability': studioCapabilityWireName(capability),
      'requiredUnprotectedDimensions': requiredUnprotectedDimensions
          .map((value) => value.name)
          .toList(),
    };
    final key = compactionKey;
    if (key != null) result['compactionKey'] = key;
    return result;
  }
}

class StudioSurfaceSummary {
  const StudioSurfaceSummary({
    required this.id,
    required this.label,
    required this.sourceConfidence,
    this.sourceSymbol,
    this.capabilities = const <StudioCapability>{},
    this.protectedDimensions = const <StudioDimension>{},
  });

  final String id;
  final String label;
  final String sourceConfidence;
  final String? sourceSymbol;
  final Set<StudioCapability> capabilities;
  final Set<StudioDimension> protectedDimensions;
}

class StudioBridgeBounds {
  const StudioBridgeBounds({
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });

  final double x;
  final double y;
  final double width;
  final double height;
}

class StudioBridgeReadyAnchor {
  const StudioBridgeReadyAnchor({
    required this.id,
    required this.label,
    required this.sourceSymbol,
    required this.capabilities,
  });

  final String id;
  final String label;
  final String sourceSymbol;
  final Set<StudioCapability> capabilities;
}

class StudioBridgeSelectedAnchor extends StudioBridgeReadyAnchor {
  const StudioBridgeSelectedAnchor({
    required super.id,
    required super.label,
    required super.sourceSymbol,
    required super.capabilities,
    required this.bounds,
  });

  final StudioBridgeBounds bounds;
}

List<StudioBridgeReadyAnchor> parseStudioReadyAnchors(
  Object? raw,
  List<StudioSurfaceSummary> expected,
) {
  if (raw is! List || raw.length != expected.length) {
    throw const StudioContractException('Studio ready anchors are invalid.');
  }
  final anchors = <StudioBridgeReadyAnchor>[];
  for (var index = 0; index < raw.length; index += 1) {
    final anchor = _parseStudioBridgeAnchor(raw[index]);
    final surface = expected[index];
    if (anchor.id != surface.id ||
        anchor.label != surface.label ||
        anchor.sourceSymbol != surface.sourceSymbol ||
        !_sameStudioSet(anchor.capabilities, surface.capabilities)) {
      throw const StudioContractException(
        'Studio ready anchor does not match the admitted surface.',
      );
    }
    anchors.add(anchor);
  }
  return List.unmodifiable(anchors);
}

StudioBridgeSelectedAnchor parseStudioSelectedAnchor(
  Object? raw,
  List<StudioSurfaceSummary> expected,
) {
  if (raw is! Map) {
    throw const StudioContractException('Studio selected anchor is invalid.');
  }
  final map = Map<Object?, Object?>.from(raw);
  const keys = {'id', 'label', 'sourceSymbol', 'capabilities', 'bounds'};
  if (map.length != keys.length || map.keys.any((key) => !keys.contains(key))) {
    throw const StudioContractException(
      'Studio selected anchor is extensible.',
    );
  }
  final ready = _parseStudioBridgeAnchor({
    'id': map['id'],
    'label': map['label'],
    'sourceSymbol': map['sourceSymbol'],
    'capabilities': map['capabilities'],
  });
  final matching = expected.where((surface) => surface.id == ready.id).toList();
  if (matching.length != 1 ||
      ready.label != matching.single.label ||
      ready.sourceSymbol != matching.single.sourceSymbol ||
      !_sameStudioSet(ready.capabilities, matching.single.capabilities)) {
    throw const StudioContractException(
      'Studio selected anchor does not match the admitted surface.',
    );
  }
  final boundsRaw = map['bounds'];
  if (boundsRaw is! Map) {
    throw const StudioContractException('Studio selected bounds are invalid.');
  }
  final bounds = Map<Object?, Object?>.from(boundsRaw);
  const boundKeys = {'x', 'y', 'width', 'height'};
  if (bounds.length != boundKeys.length ||
      bounds.keys.any((key) => !boundKeys.contains(key)) ||
      bounds.values.any((value) => value is! num || !value.isFinite) ||
      (bounds['width'] as num) < 0 ||
      (bounds['height'] as num) < 0) {
    throw const StudioContractException('Studio selected bounds are invalid.');
  }
  return StudioBridgeSelectedAnchor(
    id: ready.id,
    label: ready.label,
    sourceSymbol: ready.sourceSymbol,
    capabilities: ready.capabilities,
    bounds: StudioBridgeBounds(
      x: (bounds['x'] as num).toDouble(),
      y: (bounds['y'] as num).toDouble(),
      width: (bounds['width'] as num).toDouble(),
      height: (bounds['height'] as num).toDouble(),
    ),
  );
}

StudioBridgeReadyAnchor _parseStudioBridgeAnchor(Object? raw) {
  if (raw is! Map) {
    throw const StudioContractException('Studio anchor is invalid.');
  }
  final map = Map<Object?, Object?>.from(raw);
  const keys = {'id', 'label', 'sourceSymbol', 'capabilities'};
  if (map.length != keys.length || map.keys.any((key) => !keys.contains(key))) {
    throw const StudioContractException('Studio anchor is extensible.');
  }
  final capabilitiesRaw = map['capabilities'];
  if (map['id'] is! String ||
      map['label'] is! String ||
      map['sourceSymbol'] is! String ||
      capabilitiesRaw is! List) {
    throw const StudioContractException('Studio anchor fields are invalid.');
  }
  final capabilities = <StudioCapability>{};
  for (final rawCapability in capabilitiesRaw) {
    final capability = rawCapability is String
        ? studioCapabilityFromWireName(rawCapability)
        : null;
    if (capability == null || !capabilities.add(capability)) {
      throw const StudioContractException(
        'Studio anchor capabilities are invalid.',
      );
    }
  }
  return StudioBridgeReadyAnchor(
    id: map['id'] as String,
    label: map['label'] as String,
    sourceSymbol: map['sourceSymbol'] as String,
    capabilities: Set.unmodifiable(capabilities),
  );
}

bool _sameStudioSet<T>(Set<T> left, Set<T> right) =>
    left.length == right.length && left.containsAll(right);

int studioBridgeMessageBytes(Object? message) =>
    utf8.encode(jsonEncode(message)).length;

bool isWithinStudioBridgeMessageLimit(Object? message) {
  try {
    return studioBridgeMessageBytes(message) <=
        StudioLimits.maxBridgeMessageBytes;
  } on Object {
    return false;
  }
}

bool isWithinStudioCommandLimit(Object? command) {
  try {
    return studioBridgeMessageBytes(command) <= StudioLimits.maxRequestBytes;
  } on Object {
    return false;
  }
}

enum StudioCompileAdmissionReason {
  available,
  workerIsolationUnavailable,
  profileReadOnly,
  protectionRequired,
  staleRevision,
}

class StudioCompileAdmission {
  const StudioCompileAdmission({required this.reason, required this.message});

  const StudioCompileAdmission.workerIsolationUnavailable()
    : reason = StudioCompileAdmissionReason.workerIsolationUnavailable,
      message =
          'Compilation indisponible : le runner n’a pas admis de worker OCI isolé.';

  final StudioCompileAdmissionReason reason;
  final String message;

  bool get available => reason == StudioCompileAdmissionReason.available;
}

class StudioPreviewCapability {
  const StudioPreviewCapability({
    required this.profileId,
    required this.bridgeVersion,
    required this.previewOrigin,
    required this.surfaces,
    this.sourceRevision = 'révision admise par le runner',
    this.repositoryDigest = '',
    this.adapterVersion = 'astro.hero.v1',
    this.capabilityVersion = studioContractVersion,
    this.capabilities = const <StudioCapability>{},
    this.compileAdmission =
        const StudioCompileAdmission.workerIsolationUnavailable(),
    this.expectedPaths = const <String>[],
  });

  final String profileId;
  final String bridgeVersion;
  final Uri previewOrigin;
  final List<StudioSurfaceSummary> surfaces;
  final String sourceRevision;
  final String repositoryDigest;
  final String adapterVersion;
  final String capabilityVersion;
  final Set<StudioCapability> capabilities;
  final StudioCompileAdmission compileAdmission;
  final List<String> expectedPaths;
}
