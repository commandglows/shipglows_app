import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/domain/studio/studio_contracts.dart';
import 'package:shipglows_app/domain/studio/studio_session.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/studio_provider.dart';

void main() {
  group('Laboratory policy', () {
    test('activates for every hard trigger without a surface-count gate', () {
      final result = evaluateStudioLaboratoryPolicy(
        const StudioPolicyFacts(
          structuralEdit: true,
          meaningfulSurfaceCount: 1,
        ),
      );
      expect(result.level, StudioLaboratoryLevel.active);
      expect(result.reasons.single.hard, isTrue);
    });

    test('recommends only when at least two soft triggers are present', () {
      expect(
        evaluateStudioLaboratoryPolicy(
          const StudioPolicyFacts(meaningfulSurfaceCount: 4),
        ).level,
        StudioLaboratoryLevel.studio,
      );
      final result = evaluateStudioLaboratoryPolicy(
        const StudioPolicyFacts(
          meaningfulSurfaceCount: 4,
          expectedSourceFileCount: 2,
        ),
      );
      expect(result.level, StudioLaboratoryLevel.recommended);
      expect(result.reasons.every((reason) => !reason.hard), isTrue);
    });
  });

  group('Studio command journal', () {
    VisualCommand command(int revision, {String? compactionKey}) =>
        VisualCommand(
          commandId: 'command_$revision',
          sessionId: 'session_1',
          capability: StudioCapability.opacitySet,
          parameters: {'value': revision / 10},
          affectedRuntimeNodeIds: const ['hero.title'],
          affectedDimensions: const {StudioDimension.design},
          revision: revision,
          idempotencyKey: 'idempotency_$revision',
          compactionKey: compactionKey,
        );

    test('compacts, undoes, redoes, and branches deterministically', () {
      final compacted = const StudioCommandJournal()
          .apply(command(1, compactionKey: 'hero.title:opacity'))
          .apply(command(2, compactionKey: 'hero.title:opacity'));
      expect(compacted.commands, hasLength(1));
      expect(compacted.cursor, 1);
      final undone = compacted.undo();
      expect(undone.activeCommands, isEmpty);
      expect(undone.redo().activeCommands, hasLength(1));
      final branched = undone.apply(command(3));
      expect(branched.commands.single.commandId, 'command_3');
      expect(branched.canRedo, isFalse);
    });
  });

  group('Studio session provider state', () {
    test(
      'does not publish state again for the already selected surface',
      () async {
        final notifier = StudioSessionNotifier(
          projectId: 'shipglows_app',
          capability: _editableCapability(),
          transport: _FakeStudioTransport(
            const StudioCompileProjection(
              status: StudioCompileStatus.failed,
              message: 'Worker indisponible.',
            ),
          ),
        );
        addTearDown(notifier.dispose);
        await notifier.initialize();
        notifier.selectSurface('hero.title');
        final selected = notifier.state;
        notifier.selectSurface('hero.title');
        expect(identical(notifier.state, selected), isTrue);
      },
    );

    test('synchronizes edits, undo, redo, and eight variants', () async {
      final transport = _FakeStudioTransport(
        const StudioCompileProjection(
          status: StudioCompileStatus.failed,
          message: 'Worker indisponible.',
        ),
      );
      final notifier = StudioSessionNotifier(
        projectId: 'shipglows_app',
        capability: _editableCapability(),
        transport: transport,
      );
      addTearDown(notifier.dispose);
      await notifier.initialize();
      notifier.selectSurface('hero.title');
      await notifier.applySemanticEdit(
        capability: StudioCapability.opacitySet,
        parameters: const {'value': 0.8},
        dimensions: const {StudioDimension.design},
      );
      await notifier.undo();
      await notifier.redo();
      for (var index = 1; index < StudioLimits.maxVariants; index++) {
        await notifier.createVariant();
      }
      expect(notifier.state.variants, hasLength(StudioLimits.maxVariants));
      await notifier.createVariant();
      expect(notifier.state.variants, hasLength(StudioLimits.maxVariants));
      expect(notifier.state.safeMessage, contains('huit variantes'));
      expect(transport.appliedCommands, 1);
      expect(transport.undoCalls, 1);
      expect(transport.redoCalls, 1);
    });

    test(
      'projects an immutable compile conflict without claiming success',
      () async {
        final notifier = StudioSessionNotifier(
          projectId: 'shipglows_app',
          capability: _editableCapability(),
          transport: _FakeStudioTransport(
            const StudioCompileProjection(
              status: StudioCompileStatus.conflict,
              message: 'La révision source a changé. Aucun rebase automatique.',
            ),
          ),
        );
        addTearDown(notifier.dispose);
        await notifier.initialize();
        notifier.selectSurface('hero.title');
        await notifier.applySemanticEdit(
          capability: StudioCapability.opacitySet,
          parameters: const {'value': 0.9},
          dimensions: const {StudioDimension.design},
        );
        notifier.enterLaboratory();
        final intent = notifier.freezeCompileIntent();
        expect(intent, isNotNull);
        expect(intent!.frozenCommandRevision, 1);
        await notifier.compile(intent);
        expect(notifier.state.compile.status, StudioCompileStatus.conflict);
        expect(notifier.state.compile.message, contains('Aucun rebase'));
      },
    );

    test('projects a bounded compile failure', () async {
      final notifier = StudioSessionNotifier(
        projectId: 'shipglows_app',
        capability: _editableCapability(),
        transport: _FakeStudioTransport(
          const StudioCompileProjection(
            status: StudioCompileStatus.failed,
            message: 'Le worker a refusé le job avant exécution.',
          ),
        ),
      );
      addTearDown(notifier.dispose);
      await notifier.initialize();
      notifier.selectSurface('hero.title');
      await notifier.applySemanticEdit(
        capability: StudioCapability.opacitySet,
        parameters: const {'value': 0.8},
        dimensions: const {StudioDimension.design},
      );
      notifier.enterLaboratory();
      await notifier.compile(notifier.freezeCompileIntent()!);
      expect(notifier.state.compile.status, StudioCompileStatus.failed);
      expect(notifier.state.compile.message, contains('avant exécution'));
    });

    test('blocks and interrupts on an authority projection mismatch', () async {
      final transport = _FakeStudioTransport(
        const StudioCompileProjection(
          status: StudioCompileStatus.failed,
          message: 'Worker indisponible.',
        ),
      )..mismatchNextCommand = true;
      final notifier = StudioSessionNotifier(
        projectId: 'shipglows_app',
        capability: _editableCapability(),
        transport: transport,
      );
      addTearDown(notifier.dispose);
      await notifier.initialize();
      notifier.selectSurface('hero.title');
      await notifier.applySemanticEdit(
        capability: StudioCapability.opacitySet,
        parameters: const {'value': 0.7},
        dimensions: const {StudioDimension.design},
      );

      expect(notifier.state.journal.activeCommands, isEmpty);
      expect(notifier.state.authorityBlocked, isTrue);
      expect(transport.state, StudioState.interrupted);
    });
  });
}

StudioPreviewCapability _editableCapability() => StudioPreviewCapability(
  profileId: 'shipglows.astro.hero.v1',
  bridgeVersion: 'shipglows.studio.bridge.v1',
  previewOrigin: Uri.parse('http://127.0.0.1:3003'),
  sourceRevision: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  repositoryDigest:
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  adapterVersion: '1.0.0',
  capabilityVersion: '1.0.0',
  expectedPaths: const ['site/src/components/Hero.astro'],
  capabilities: const {StudioCapability.opacitySet},
  compileAdmission: const StudioCompileAdmission(
    reason: StudioCompileAdmissionReason.available,
    message: 'Worker OCI isolé admis.',
  ),
  surfaces: const [
    StudioSurfaceSummary(
      id: 'hero.title',
      label: 'Titre',
      sourceConfidence: 'exact',
      capabilities: {StudioCapability.opacitySet},
    ),
  ],
);

class _FakeStudioTransport implements ManagedStudioTransport {
  _FakeStudioTransport(this.projection);

  final StudioCompileProjection projection;
  var revision = 0;
  var commandCount = 0;
  var undoCursor = 0;
  var appliedCommands = 0;
  var undoCalls = 0;
  var redoCalls = 0;
  var mismatchNextCommand = false;
  var state = StudioState.ready;
  var activeVariantId = 'var_1';
  final variants = <StudioRunnerVariant>[
    const StudioRunnerVariant(
      id: 'var_1',
      name: 'Version 1',
      commandCount: 0,
      commandRevision: 0,
    ),
  ];

  StudioRunnerSession get session => StudioRunnerSession(
    sessionId: 'ses_1',
    projectId: 'shipglows_app',
    profileId: 'shipglows.astro.hero.v1',
    sourceRevision: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    repositoryDigest:
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    state: state,
    revision: revision,
    commandCount: commandCount,
    undoCursor: undoCursor,
    canUndo: undoCursor > 0,
    canRedo: undoCursor < commandCount,
    variants: List.unmodifiable(variants),
    activeVariantId: activeVariantId,
    laboratoryLevel: StudioLaboratoryLevel.studio,
    laboratoryReasons: const [],
    idleExpiresAt: DateTime.utc(2026, 8, 16, 8, 30),
    absoluteExpiresAt: DateTime.utc(2026, 8, 16, 12),
    cleanupState: state == StudioState.closed
        ? StudioCleanupState.cleaned
        : StudioCleanupState.active,
  );

  @override
  Future<StudioRunnerSession> createStudioSession({
    required String projectId,
    required String idempotencyKey,
  }) async => session;

  @override
  Future<StudioRunnerSession> applyStudioCommand({
    required String projectId,
    required VisualCommand command,
  }) async {
    expect(command.revision, revision + 1);
    appliedCommands += 1;
    revision = command.revision;
    commandCount = mismatchNextCommand ? 2 : 1;
    undoCursor = commandCount;
    state = StudioState.previewing;
    _updateActive();
    return session;
  }

  @override
  Future<StudioRunnerSession> moveStudioJournal({
    required String projectId,
    required String sessionId,
    required bool redo,
    required String idempotencyKey,
  }) async {
    revision += 1;
    if (redo) {
      redoCalls += 1;
      undoCursor += 1;
    } else {
      undoCalls += 1;
      undoCursor -= 1;
    }
    _updateActive();
    return session;
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
    revision += 1;
    if (action == 'create') {
      final id = 'var_${variants.length + 1}';
      variants.add(
        StudioRunnerVariant(
          id: id,
          name: name!,
          commandCount: commandCount,
          commandRevision: revision,
        ),
      );
      activeVariantId = id;
    } else if (action == 'select') {
      activeVariantId = variantId!;
      final selected = variants.singleWhere(
        (variant) => variant.id == variantId,
      );
      commandCount = selected.commandCount;
      undoCursor = selected.commandCount;
    } else {
      variants.removeWhere((variant) => variant.id == variantId);
      if (activeVariantId == variantId) activeVariantId = variants.last.id;
    }
    return session;
  }

  @override
  Future<StudioRunnerSession> interruptStudioSession({
    required String projectId,
    required String sessionId,
    required String idempotencyKey,
  }) async {
    state = StudioState.interrupted;
    return session;
  }

  @override
  Future<StudioRunnerSession> closeStudioSession({
    required String projectId,
    required String sessionId,
    required String idempotencyKey,
  }) async {
    state = StudioState.closed;
    return session;
  }

  @override
  Future<StudioCompileProjection> compileStudioIntent({
    required String projectId,
    required StudioCompileIntent intent,
  }) async => projection;

  @override
  Future<StudioPreviewCapability> studioCapability({
    required String projectId,
  }) => throw UnimplementedError();

  void _updateActive() {
    final index = variants.indexWhere(
      (variant) => variant.id == activeVariantId,
    );
    variants[index] = StudioRunnerVariant(
      id: variants[index].id,
      name: variants[index].name,
      commandCount: commandCount,
      commandRevision: revision,
    );
  }
}
