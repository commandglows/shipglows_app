const studioContractVersion = 'shipglows.studio.v1';

abstract final class StudioLimits {
  static const maxNodes = 256;
  static const maxCommandsPerVariant = 128;
  static const maxVariants = 8;
  static const maxViewports = 3;
  static const maxCompileRuns = 1;
  static const maxRequestBytes = 16 * 1024;
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
      profile.profileId == 'shipglows.astro.hero.v1' &&
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

  void validate() {
    if (!previewOnly || revision < 0 || affectedRuntimeNodeIds.isEmpty) {
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
  }
}
