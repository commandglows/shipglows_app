import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart' as legacy;

import '../../domain/studio/studio_contracts.dart';
import '../../domain/studio/studio_compilation_routing.dart';
import '../../domain/studio/studio_session.dart';
import '../data/managed_runner_api.dart';
import 'managed_runner_provider.dart';

final managedStudioCapabilityProvider = FutureProvider.autoDispose
    .family<StudioPreviewCapability?, String>((ref, projectId) async {
      final client = ref.watch(managedRunnerApiProvider);
      if (client == null || client is! ManagedStudioTransport) return null;
      final studio = client as ManagedStudioTransport;
      return studio.studioCapability(projectId: projectId);
    });

class StudioSessionKey {
  const StudioSessionKey({required this.projectId, required this.capability});

  final String projectId;
  final StudioPreviewCapability capability;

  @override
  bool operator ==(Object other) =>
      other is StudioSessionKey &&
      other.projectId == projectId &&
      other.capability.profileId == capability.profileId &&
      other.capability.sourceRevision == capability.sourceRevision &&
      other.capability.repositoryDigest == capability.repositoryDigest;

  @override
  int get hashCode => Object.hash(
    projectId,
    capability.profileId,
    capability.sourceRevision,
    capability.repositoryDigest,
  );
}

class StudioSessionState {
  const StudioSessionState({
    required this.capability,
    required this.handshake,
    required this.selectedSurfaceId,
    required this.variants,
    required this.activeVariantId,
    required this.manualLaboratory,
    required this.compile,
    required this.routing,
    required this.selectedArtifactTarget,
    this.runnerSession,
    this.synchronizing = false,
    this.authorityBlocked = false,
    this.previewRetryRevision = 0,
    this.safeMessage,
  });

  factory StudioSessionState.initial(
    StudioPreviewCapability capability,
    StudioCompilationRoutingProjection routing,
  ) {
    const pendingVariant = StudioVariant(
      id: 'pending',
      name: 'Initialisation…',
      journal: StudioCommandJournal(),
    );
    return StudioSessionState(
      capability: capability,
      handshake: StudioPreviewHandshake.waiting,
      selectedSurfaceId: null,
      variants: const [pendingVariant],
      activeVariantId: pendingVariant.id,
      manualLaboratory: false,
      synchronizing: true,
      routing: routing,
      selectedArtifactTarget: routing.implicitTarget,
      compile: StudioCompileProjection(
        status: StudioCompileStatus.unavailable,
        message: capability.compileAdmission.message,
      ),
    );
  }

  final StudioPreviewCapability capability;
  final StudioPreviewHandshake handshake;
  final String? selectedSurfaceId;
  final List<StudioVariant> variants;
  final String activeVariantId;
  final bool manualLaboratory;
  final StudioCompileProjection compile;
  final StudioCompilationRoutingProjection routing;
  final StudioArtifactTarget? selectedArtifactTarget;
  final StudioRunnerSession? runnerSession;
  final bool synchronizing;
  final bool authorityBlocked;
  final int previewRetryRevision;
  final String? safeMessage;

  bool get sessionReady => runnerSession != null && !authorityBlocked;
  StudioVariant get activeVariant =>
      variants.firstWhere((variant) => variant.id == activeVariantId);
  StudioCommandJournal get journal => activeVariant.journal;
  StudioSurfaceSummary? get selectedSurface => capability.surfaces
      .where((surface) => surface.id == selectedSurfaceId)
      .firstOrNull;

  StudioState get phase {
    if (authorityBlocked || handshake == StudioPreviewHandshake.failed) {
      return StudioState.failed;
    }
    final remoteState = runnerSession?.state;
    if (remoteState == StudioState.conflict ||
        remoteState == StudioState.interrupted ||
        remoteState == StudioState.closed) {
      return remoteState!;
    }
    return switch (compile.status) {
      StudioCompileStatus.compiling => StudioState.compiling,
      StudioCompileStatus.conflict => StudioState.conflict,
      StudioCompileStatus.failed => StudioState.failed,
      StudioCompileStatus.verified => StudioState.verified,
      _ when laboratory.level == StudioLaboratoryLevel.active =>
        StudioState.laboratory,
      _ when handshake == StudioPreviewHandshake.ready && sessionReady =>
        StudioState.previewing,
      _ => StudioState.starting,
    };
  }

  StudioLaboratoryEvaluation get laboratory => evaluateStudioLaboratoryPolicy(
    StudioPolicyFacts(
      manual: manualLaboratory,
      ambiguousSource:
          selectedSurface != null &&
          selectedSurface!.sourceConfidence != 'exact',
      structuralEdit: journal.activeCommands.any(
        (command) =>
            command.affectedDimensions.contains(StudioDimension.structure),
      ),
      interactiveBehavior: journal.activeCommands.any(
        (command) =>
            command.affectedDimensions.contains(StudioDimension.motion),
      ),
      protectedDimension: journal.activeCommands.any(
        (command) => command.requiredUnprotectedDimensions.isNotEmpty,
      ),
      meaningfulSurfaceCount: journal.activeCommands
          .expand((command) => command.affectedRuntimeNodeIds)
          .toSet()
          .length,
      compactedCommandCount: journal.activeCommands.length,
      expectedSourceFileCount: capability.expectedPaths.length,
    ),
  );

  StudioSessionState copyWith({
    StudioPreviewHandshake? handshake,
    String? selectedSurfaceId,
    bool clearSelection = false,
    List<StudioVariant>? variants,
    String? activeVariantId,
    bool? manualLaboratory,
    StudioCompileProjection? compile,
    StudioCompilationRoutingProjection? routing,
    StudioArtifactTarget? selectedArtifactTarget,
    bool clearArtifactTarget = false,
    StudioRunnerSession? runnerSession,
    bool? synchronizing,
    bool? authorityBlocked,
    int? previewRetryRevision,
    String? safeMessage,
    bool clearMessage = false,
  }) => StudioSessionState(
    capability: capability,
    handshake: handshake ?? this.handshake,
    selectedSurfaceId: clearSelection
        ? null
        : selectedSurfaceId ?? this.selectedSurfaceId,
    variants: variants ?? this.variants,
    activeVariantId: activeVariantId ?? this.activeVariantId,
    manualLaboratory: manualLaboratory ?? this.manualLaboratory,
    compile: compile ?? this.compile,
    routing: routing ?? this.routing,
    selectedArtifactTarget: clearArtifactTarget
        ? null
        : selectedArtifactTarget ?? this.selectedArtifactTarget,
    runnerSession: runnerSession ?? this.runnerSession,
    synchronizing: synchronizing ?? this.synchronizing,
    authorityBlocked: authorityBlocked ?? this.authorityBlocked,
    previewRetryRevision: previewRetryRevision ?? this.previewRetryRevision,
    safeMessage: clearMessage ? null : safeMessage ?? this.safeMessage,
  );
}

final studioSessionProvider = legacy.StateNotifierProvider.autoDispose
    .family<StudioSessionNotifier, StudioSessionState, StudioSessionKey>((
      ref,
      key,
    ) {
      final client = ref.watch(managedRunnerApiProvider);
      final transport = client is ManagedStudioTransport
          ? client as ManagedStudioTransport
          : null;
      final notifier = StudioSessionNotifier(
        projectId: key.projectId,
        capability: key.capability,
        transport: transport,
      );
      unawaited(notifier.initialize());
      ref.onDispose(() => unawaited(notifier.release()));
      return notifier;
    });

class StudioSessionNotifier extends legacy.StateNotifier<StudioSessionState> {
  StudioSessionNotifier({
    required this.projectId,
    required StudioPreviewCapability capability,
    required this.transport,
    StudioCompilationRoutingProjection? routing,
  }) : super(
         StudioSessionState.initial(
           capability,
           routing ?? StudioCompilationRoutingProjection.astroBridgeOnly(),
         ),
       );

  final String projectId;
  final ManagedStudioTransport? transport;
  final String _nonce = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
  var _sequence = 0;
  var _compileAttempted = false;
  var _released = false;

  /// This changes the local route projection only. The current API has no
  /// artifact-target field, so it cannot start or alter a compile request.
  void selectArtifactTarget(StudioArtifactTarget? target) {
    if (target != null) state.routing.routeFor(target);
    if (state.selectedArtifactTarget == target) return;
    state = state.copyWith(
      selectedArtifactTarget: target,
      clearArtifactTarget: target == null,
    );
  }

  Future<void> initialize() async {
    final remote = transport;
    if (remote == null) {
      state = state.copyWith(
        synchronizing: false,
        authorityBlocked: true,
        safeMessage:
            'Session Studio indisponible : le transport authentifié du runner est absent.',
      );
      return;
    }
    try {
      if (remote is ManagedCompilationRoutingTransport) {
        try {
          final routingTransport = remote as ManagedCompilationRoutingTransport;
          final routing = await routingTransport.studioCompilationRouting(
            projectId: projectId,
            sourceRevision: state.capability.sourceRevision,
            repositoryDigest: state.capability.repositoryDigest,
          );
          state = state.copyWith(
            routing: routing,
            selectedArtifactTarget: routing.implicitTarget,
            clearArtifactTarget: routing.implicitTarget == null,
          );
        } catch (_) {
          // Routing remains locally unavailable. The existing Astro preview
          // session can still initialize, but no compiler becomes available.
        }
      }
      final session = await remote.createStudioSession(
        projectId: projectId,
        idempotencyKey: _id('session'),
      );
      _validateSessionIdentity(session);
      if (session.variants.isEmpty || session.activeVariantId == null) {
        throw const StudioContractException(
          'Le runner n’a pas fourni de variante Studio active.',
        );
      }
      final variants = [
        for (final variant in session.variants)
          StudioVariant(
            id: variant.id,
            name: variant.name,
            journal: const StudioCommandJournal(),
          ),
      ];
      state = state.copyWith(
        runnerSession: session,
        variants: List.unmodifiable(variants),
        activeVariantId: session.activeVariantId,
        synchronizing: false,
        clearMessage: true,
      );
    } catch (error) {
      state = state.copyWith(
        synchronizing: false,
        authorityBlocked: true,
        safeMessage: _safeRunnerMessage(
          error,
          'La session Studio n’a pas été admise par le runner.',
        ),
      );
    }
  }

  void markHandshake(StudioPreviewHandshake handshake) {
    state = state.copyWith(handshake: handshake, clearMessage: true);
  }

  void retryPreview() {
    state = state.copyWith(
      handshake: StudioPreviewHandshake.waiting,
      previewRetryRevision: state.previewRetryRevision + 1,
      clearMessage: true,
    );
  }

  void selectSurface(String id) {
    if (!state.capability.surfaces.any((surface) => surface.id == id)) return;
    if (state.selectedSurfaceId == id) return;
    state = state.copyWith(selectedSurfaceId: id, clearMessage: true);
  }

  Future<void> applySemanticEdit({
    required StudioCapability capability,
    required Map<String, Object> parameters,
    required Set<StudioDimension> dimensions,
    String? compactionKey,
  }) async {
    final surface = state.selectedSurface;
    final session = state.runnerSession;
    if (!_canMutate(session)) return;
    if (surface == null) {
      state = state.copyWith(
        safeMessage: 'Sélectionnez une surface avant de l’ajuster.',
      );
      return;
    }
    if (!surface.capabilities.contains(capability)) {
      state = state.copyWith(
        safeMessage:
            'Cette surface reste en inspection : cet ajustement n’est pas admis.',
      );
      return;
    }
    final protected = surface.protectedDimensions.intersection(dimensions);
    if (protected.isNotEmpty) {
      state = state.copyWith(
        safeMessage:
            'Cet ajustement touche une dimension protégée et a été refusé.',
      );
      return;
    }
    final command = VisualCommand(
      commandId: _id('command'),
      sessionId: session!.sessionId,
      capability: capability,
      parameters: Map.unmodifiable(parameters),
      affectedRuntimeNodeIds: [surface.id],
      affectedDimensions: Set.unmodifiable(dimensions),
      revision: session.revision + 1,
      idempotencyKey: _id('idempotency'),
      compactionKey: compactionKey,
    );
    try {
      command.validate();
      final candidate = state.journal.apply(command);
      state = state.copyWith(synchronizing: true, clearMessage: true);
      final authority = await transport!.applyStudioCommand(
        projectId: projectId,
        command: command,
      );
      _validateMutationProjection(authority, candidate);
      _replaceActiveVariant(candidate, authority);
    } catch (error) {
      await _failClosed(
        error,
        'L’ajustement n’a pas été accepté par le runner.',
      );
    }
  }

  Future<void> undo() async {
    if (!state.journal.canUndo || !_canMutate(state.runnerSession)) return;
    final candidate = state.journal.undo();
    await _moveJournal(candidate, redo: false);
  }

  Future<void> redo() async {
    if (!state.journal.canRedo || !_canMutate(state.runnerSession)) return;
    final candidate = state.journal.redo();
    await _moveJournal(candidate, redo: true);
  }

  Future<void> _moveJournal(
    StudioCommandJournal candidate, {
    required bool redo,
  }) async {
    final session = state.runnerSession!;
    state = state.copyWith(synchronizing: true, clearMessage: true);
    try {
      final authority = await transport!.moveStudioJournal(
        projectId: projectId,
        sessionId: session.sessionId,
        redo: redo,
        idempotencyKey: _id(redo ? 'redo' : 'undo'),
      );
      _validateMutationProjection(authority, candidate);
      _replaceActiveVariant(candidate, authority);
    } catch (error) {
      await _failClosed(
        error,
        redo
            ? 'Le rétablissement n’a pas été accepté par le runner.'
            : 'L’annulation n’a pas été acceptée par le runner.',
      );
    }
  }

  void enterLaboratory() {
    if (!state.sessionReady) return;
    state = state.copyWith(manualLaboratory: true, clearMessage: true);
  }

  Future<void> createVariant() async {
    final session = state.runnerSession;
    if (!_canMutate(session)) return;
    if (state.variants.length >= StudioLimits.maxVariants) {
      state = state.copyWith(
        safeMessage: 'Le Laboratoire accepte au maximum huit variantes.',
      );
      return;
    }
    final existingIds = state.variants.map((variant) => variant.id).toSet();
    final name = 'Variante ${state.variants.length + 1}';
    state = state.copyWith(synchronizing: true, clearMessage: true);
    try {
      final authority = await transport!.mutateStudioVariant(
        projectId: projectId,
        sessionId: session!.sessionId,
        action: 'create',
        name: name,
        idempotencyKey: _id('variant'),
      );
      final created = authority.variants
          .where((variant) => !existingIds.contains(variant.id))
          .singleOrNull;
      if (created == null || authority.activeVariantId != created.id) {
        throw const StudioContractException(
          'La variante créée par le runner est incohérente.',
        );
      }
      final variants = <StudioVariant>[
        ...state.variants,
        StudioVariant(
          id: created.id,
          name: created.name,
          journal: state.journal,
        ),
      ];
      _acceptVariantProjection(authority, variants);
      state = state.copyWith(manualLaboratory: true);
    } catch (error) {
      await _failClosed(error, 'La variante n’a pas été créée par le runner.');
    }
  }

  Future<void> selectVariant(String id) async {
    final session = state.runnerSession;
    final target = state.variants
        .where((variant) => variant.id == id)
        .firstOrNull;
    if (target == null || id == state.activeVariantId || !_canMutate(session)) {
      return;
    }
    state = state.copyWith(synchronizing: true, clearMessage: true);
    try {
      final authority = await transport!.mutateStudioVariant(
        projectId: projectId,
        sessionId: session!.sessionId,
        action: 'select',
        variantId: id,
        idempotencyKey: _id('select'),
      );
      if (authority.activeVariantId != id ||
          authority.commandCount != target.journal.commands.length ||
          authority.undoCursor != target.journal.cursor) {
        throw const StudioContractException(
          'La variante sélectionnée par le runner est incohérente.',
        );
      }
      _acceptVariantProjection(authority, state.variants);
    } catch (error) {
      await _failClosed(error, 'La variante n’a pas été sélectionnée.');
    }
  }

  Future<void> removeVariant(String id) async {
    final session = state.runnerSession;
    if (state.variants.length == 1 || !_canMutate(session)) {
      return;
    }
    if (!state.variants.any((variant) => variant.id == id)) return;
    state = state.copyWith(synchronizing: true, clearMessage: true);
    try {
      final authority = await transport!.mutateStudioVariant(
        projectId: projectId,
        sessionId: session!.sessionId,
        action: 'delete',
        variantId: id,
        idempotencyKey: _id('delete'),
      );
      final variants = state.variants
          .where((variant) => variant.id != id)
          .toList(growable: false);
      _acceptVariantProjection(authority, variants);
    } catch (error) {
      await _failClosed(error, 'La variante n’a pas été supprimée.');
    }
  }

  StudioCompileIntent? freezeCompileIntent() {
    final admission = state.capability.compileAdmission;
    final session = state.runnerSession;
    if (state.laboratory.level != StudioLaboratoryLevel.active ||
        state.journal.activeCommands.isEmpty ||
        !admission.available ||
        session == null ||
        state.authorityBlocked ||
        state.synchronizing ||
        state.capability.expectedPaths.isEmpty) {
      state = state.copyWith(
        compile: StudioCompileProjection(
          status: StudioCompileStatus.unavailable,
          message: state.journal.activeCommands.isEmpty
              ? 'Compilation indisponible : aucun ajustement accepté n’est à compiler.'
              : state.laboratory.level != StudioLaboratoryLevel.active
              ? 'Compilation indisponible : activez le Laboratoire et acceptez une variante.'
              : !admission.available
              ? admission.message
              : 'Compilation indisponible : la session autoritaire du runner n’est pas prête.',
        ),
      );
      return null;
    }
    final commands = state.journal.activeCommands;
    final intent = StudioCompileIntent(
      intentId: _id('intent'),
      sessionId: session.sessionId,
      variantId: state.activeVariantId,
      frozenCommandRevision: session.revision,
      baseRevision: state.capability.sourceRevision,
      adapterVersion: state.capability.adapterVersion,
      capabilityVersion: state.capability.capabilityVersion,
      affectedSurfaceIds: List.unmodifiable(
        commands.expand((command) => command.affectedRuntimeNodeIds).toSet(),
      ),
      affectedDimensions: Set.unmodifiable(
        commands.expand((command) => command.affectedDimensions),
      ),
      expectedPaths: List.unmodifiable(state.capability.expectedPaths),
      idempotencyKey: _id('compile'),
    );
    state = state.copyWith(
      compile: const StudioCompileProjection(
        status: StudioCompileStatus.preflight,
        message: 'Intention figée pour vérification avant compilation.',
      ),
    );
    return intent;
  }

  Future<void> compile(StudioCompileIntent intent) async {
    if (_compileAttempted || transport == null || state.authorityBlocked) {
      return;
    }
    _compileAttempted = true;
    state = state.copyWith(
      synchronizing: true,
      compile: const StudioCompileProjection(
        status: StudioCompileStatus.compiling,
        message: 'Le runner vérifie l’admission du worker isolé.',
      ),
    );
    try {
      final projection = await transport!.compileStudioIntent(
        projectId: projectId,
        intent: intent,
      );
      state = state.copyWith(synchronizing: false, compile: projection);
    } catch (error) {
      state = state.copyWith(
        synchronizing: false,
        compile: StudioCompileProjection(
          status: StudioCompileStatus.failed,
          message: _safeRunnerMessage(
            error,
            'La compilation n’a pas démarré ou produit de résultat vérifiable. La source reste inchangée.',
          ),
        ),
      );
    }
  }

  Future<void> interrupt() async {
    final session = state.runnerSession;
    if (session == null || transport == null || _released) return;
    try {
      final authority = await transport!.interruptStudioSession(
        projectId: projectId,
        sessionId: session.sessionId,
        idempotencyKey: _id('interrupt'),
      );
      state = state.copyWith(runnerSession: authority, synchronizing: false);
    } catch (error) {
      state = state.copyWith(
        authorityBlocked: true,
        synchronizing: false,
        safeMessage: _safeRunnerMessage(
          error,
          'L’interruption de la session Studio n’a pas été confirmée.',
        ),
      );
    }
  }

  Future<void> close() async {
    final session = state.runnerSession;
    if (session == null || transport == null || _released) return;
    try {
      final authority = await transport!.closeStudioSession(
        projectId: projectId,
        sessionId: session.sessionId,
        idempotencyKey: _id('close'),
      );
      state = state.copyWith(runnerSession: authority, synchronizing: false);
    } catch (error) {
      state = state.copyWith(
        authorityBlocked: true,
        synchronizing: false,
        safeMessage: _safeRunnerMessage(
          error,
          'La fermeture de la session Studio n’a pas été confirmée.',
        ),
      );
    }
  }

  Future<void> release() async {
    if (_released) return;
    _released = true;
    final session = state.runnerSession;
    final remote = transport;
    if (session == null ||
        remote == null ||
        session.state == StudioState.closed) {
      return;
    }
    try {
      if (session.state == StudioState.compiling ||
          session.state == StudioState.verifying) {
        await remote.interruptStudioSession(
          projectId: projectId,
          sessionId: session.sessionId,
          idempotencyKey: _id('release_interrupt'),
        );
      }
      await remote.closeStudioSession(
        projectId: projectId,
        sessionId: session.sessionId,
        idempotencyKey: _id('release_close'),
      );
    } catch (_) {
      // Disposal cannot project UI state; the runner expiry remains fail-closed.
    }
  }

  bool _canMutate(StudioRunnerSession? session) {
    if (session != null &&
        transport != null &&
        !state.synchronizing &&
        !state.authorityBlocked) {
      return true;
    }
    if (!state.synchronizing && !state.authorityBlocked) {
      state = state.copyWith(
        safeMessage: 'La session autoritaire du runner n’est pas prête.',
      );
    }
    return false;
  }

  void _validateSessionIdentity(StudioRunnerSession session) {
    if (session.projectId != projectId ||
        session.profileId != state.capability.profileId ||
        session.sourceRevision != state.capability.sourceRevision ||
        session.repositoryDigest != state.capability.repositoryDigest) {
      throw const StudioContractException(
        'La session du runner ne correspond pas à la capability admise.',
      );
    }
  }

  void _validateMutationProjection(
    StudioRunnerSession authority,
    StudioCommandJournal candidate,
  ) {
    _validateSessionIdentity(authority);
    if (authority.sessionId != state.runnerSession?.sessionId ||
        authority.activeVariantId != state.activeVariantId ||
        authority.commandCount != candidate.commands.length ||
        authority.undoCursor != candidate.cursor ||
        authority.canUndo != candidate.canUndo ||
        authority.canRedo != candidate.canRedo) {
      throw const StudioContractException(
        'Le journal du runner ne correspond pas à la projection locale.',
      );
    }
  }

  void _replaceActiveVariant(
    StudioCommandJournal journal,
    StudioRunnerSession authority,
  ) {
    final variants = [
      for (final variant in state.variants)
        variant.id == state.activeVariantId
            ? variant.copyWith(journal: journal)
            : variant,
    ];
    state = state.copyWith(
      variants: List.unmodifiable(variants),
      runnerSession: authority,
      synchronizing: false,
      clearMessage: true,
    );
  }

  void _acceptVariantProjection(
    StudioRunnerSession authority,
    List<StudioVariant> localVariants,
  ) {
    _validateSessionIdentity(authority);
    if (authority.sessionId != state.runnerSession?.sessionId ||
        authority.activeVariantId == null ||
        authority.variants.length != localVariants.length ||
        authority.variants.any(
          (remote) => !localVariants.any(
            (local) =>
                local.id == remote.id &&
                local.name == remote.name &&
                local.journal.commands.length == remote.commandCount,
          ),
        )) {
      throw const StudioContractException(
        'La projection des variantes du runner est incohérente.',
      );
    }
    state = state.copyWith(
      variants: List.unmodifiable(localVariants),
      activeVariantId: authority.activeVariantId,
      runnerSession: authority,
      synchronizing: false,
      clearMessage: true,
    );
  }

  Future<void> _failClosed(Object error, String fallback) async {
    final session = state.runnerSession;
    state = state.copyWith(
      synchronizing: false,
      authorityBlocked: true,
      safeMessage: _safeRunnerMessage(error, fallback),
    );
    if (session != null && transport != null) {
      try {
        await transport!.interruptStudioSession(
          projectId: projectId,
          sessionId: session.sessionId,
          idempotencyKey: _id('reconcile_interrupt'),
        );
      } catch (_) {
        // The local projection remains blocked even if interruption is unknown.
      }
    }
  }

  String _safeRunnerMessage(Object error, String fallback) {
    if (error is StudioContractException) return error.message;
    if (error is ManagedRunnerException) {
      return switch (error.code) {
        'studioConflict' =>
          'Conflit Studio : la session ou la révision autoritaire a changé.',
        'studioSessionExpired' =>
          'La session Studio a expiré. Rechargez le Studio pour repartir de la capability admise.',
        'studioLimitExceeded' => 'La limite fermée du Studio a été atteinte.',
        'studioInvalidCommand' =>
          'Le runner a refusé cet ajustement sémantique.',
        _ => fallback,
      };
    }
    return fallback;
  }

  String _id(String prefix) => '${prefix}_${_nonce}_${++_sequence}';
}
