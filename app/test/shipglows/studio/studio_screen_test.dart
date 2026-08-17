import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shipglows_app/domain/studio/studio_contracts.dart';
import 'package:shipglows_app/domain/studio/studio_session.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/presentation/screens/studio_screen.dart';
import 'package:shipglows_app/shipglows/providers/studio_provider.dart';

void main() {
  final inspectOnlyCapability = StudioPreviewCapability(
    profileId: 'shipglows.astro.hero.v1',
    bridgeVersion: 'shipglows.studio.bridge.v1',
    previewOrigin: Uri(scheme: 'http', host: '127.0.0.1', port: 3003),
    surfaces: const [
      StudioSurfaceSummary(
        id: 'hero.root',
        label: 'Hero',
        sourceConfidence: 'exact',
        sourceSymbol: 'Hero',
      ),
      StudioSurfaceSummary(
        id: 'hero.title',
        label: 'Titre',
        sourceConfidence: 'exact',
        sourceSymbol: 'Hero.title',
      ),
    ],
  );

  testWidgets('shows fail-closed unavailable state with a retry action', (
    tester,
  ) async {
    await tester.pumpWidget(_app(capability: null));
    await tester.pumpAndSettle();
    expect(find.text('Studio indisponible'), findsOneWidget);
    expect(find.textContaining('Aucun aperçu'), findsOneWidget);
    expect(find.text('Vérifier à nouveau'), findsOneWidget);
  });

  testWidgets('distinguishes a runner failure and offers retry', (
    tester,
  ) async {
    await tester.pumpWidget(_app(capabilityError: StateError('offline')));
    await tester.pumpAndSettle();
    expect(find.text('Connexion au Studio interrompue'), findsOneWidget);
    expect(find.text('Réessayer'), findsOneWidget);
  });

  testWidgets('proves handshake readiness and bidirectional list selection', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      _app(capability: inspectOnlyCapability, previewBuilder: _previewHarness),
    );
    await tester.pumpAndSettle();
    expect(find.text('Aperçu en connexion'), findsOneWidget);
    await tester.tap(find.text('Confirmer le handshake'));
    await tester.pumpAndSettle();
    expect(find.text('Aperçu connecté'), findsOneWidget);

    await tester.tap(find.text('Titre').first);
    await tester.pumpAndSettle();
    expect(find.text('highlight:hero.title'), findsOneWidget);
    expect(find.text('Surface sélectionnée'), findsOneWidget);
  });

  testWidgets('allows manual Laboratory with fewer than four surfaces', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      _app(capability: inspectOnlyCapability, previewBuilder: _previewHarness),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Seuil cible'), findsNothing);
    await tester.tap(find.widgetWithText(OutlinedButton, 'Studio'));
    await tester.pumpAndSettle();
    expect(find.text('Laboratoire actif'), findsOneWidget);
    expect(find.bySemanticsLabel('Laboratoire actif'), findsWidgets);
    expect(find.text('Laboratoire activé manuellement.'), findsOneWidget);
  });

  testWidgets('shows precise isolation reason when compile is unavailable', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      _app(capability: inspectOnlyCapability, previewBuilder: _previewHarness),
    );
    await tester.pumpAndSettle();
    expect(
      find.textContaining('le runner n’a pas admis de worker OCI isolé'),
      findsWidgets,
    );
    final button = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Compiler en code'),
    );
    expect(button.onPressed, isNull);
  });

  testWidgets('journals semantic edits with accessible undo and redo', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final editable = StudioPreviewCapability(
      profileId: inspectOnlyCapability.profileId,
      bridgeVersion: inspectOnlyCapability.bridgeVersion,
      previewOrigin: inspectOnlyCapability.previewOrigin,
      capabilities: const {StudioCapability.opacitySet},
      surfaces: const [
        StudioSurfaceSummary(
          id: 'hero.title',
          label: 'Titre',
          sourceConfidence: 'exact',
          capabilities: {StudioCapability.opacitySet},
        ),
      ],
    );
    await tester.pumpWidget(
      _app(capability: editable, previewBuilder: _previewHarness),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Titre').first);
    await tester.pump();
    await tester.tap(find.text('Ajouter un ajustement sémantique'));
    await tester.pump();
    await tester.pumpAndSettle();
    expect(find.text('commands:1'), findsOneWidget);
    await tester.tap(
      find.byTooltip('Annuler le dernier ajustement de prévisualisation'),
    );
    await tester.pump();
    await tester.pumpAndSettle();
    expect(find.text('commands:0'), findsOneWidget);
    await tester.tap(
      find.byTooltip('Rétablir le dernier ajustement de prévisualisation'),
    );
    await tester.pump();
    await tester.pumpAndSettle();
    expect(find.text('commands:1'), findsOneWidget);
  });

  testWidgets('keeps compact mode read and review only', (tester) async {
    tester.view.physicalSize = const Size(700, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      _app(capability: inspectOnlyCapability, previewBuilder: _previewHarness),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Mode compact : lecture'), findsOneWidget);
    await tester.tap(find.text('Titre').first);
    await tester.pump();
    await tester.drag(find.byType(ListView), const Offset(0, -500));
    await tester.pumpAndSettle();
    final edit = tester.widget<FilledButton>(
      find.widgetWithText(
        FilledButton,
        'Ajouter un ajustement sémantique',
        skipOffstage: false,
      ),
    );
    expect(edit.onPressed, isNull);
    expect(find.textContaining('Mode compact : Astro Web'), findsOneWidget);
  });

  testWidgets(
    'projects an accessible expanded artifact route without compiling',
    (tester) async {
      tester.view.physicalSize = const Size(1440, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        _app(
          capability: inspectOnlyCapability,
          previewBuilder: _previewHarness,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Routage de l’artefact'), findsOneWidget);
      expect(find.text('Cible d’artefact'), findsOneWidget);
      expect(find.bySemanticsLabel('Routage de l’artefact'), findsWidgets);
      expect(
        find.textContaining('Aucun fournisseur ne peut être choisi'),
        findsOneWidget,
      );
      expect(find.text('Compiler en code'), findsOneWidget);
    },
  );
}

Widget _previewHarness(
  StudioPreviewCapability capability,
  ValueChanged<String> onSelected,
  ValueChanged<StudioPreviewHandshake> onHandshakeChanged,
  String? selectedSurfaceId,
  List<VisualCommand> commands,
) => Builder(
  builder: (context) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('highlight:${selectedSurfaceId ?? 'none'}'),
        Text('commands:${commands.length}'),
        FilledButton(
          onPressed: () => onHandshakeChanged(StudioPreviewHandshake.ready),
          child: const Text('Confirmer le handshake'),
        ),
      ],
    ),
  ),
);

Widget _app({
  StudioPreviewCapability? capability,
  Object? capabilityError,
  StudioPreviewBuilder? previewBuilder,
}) {
  final router = GoRouter(
    initialLocation: '/project/shipglows_app/studio',
    routes: [
      GoRoute(
        path: '/project/:project/studio',
        builder: (context, state) => StudioScreen(
          projectId: 'shipglows_app',
          projectName: 'ShipGlows',
          previewBuilder: previewBuilder,
        ),
      ),
    ],
  );
  return ProviderScope(
    overrides: [
      managedStudioCapabilityProvider('shipglows_app').overrideWith((
        ref,
      ) async {
        if (capabilityError != null) throw capabilityError;
        return capability;
      }),
      if (capability != null)
        studioSessionProvider(
          StudioSessionKey(projectId: 'shipglows_app', capability: capability),
        ).overrideWith((ref) {
          final notifier = StudioSessionNotifier(
            projectId: 'shipglows_app',
            capability: capability,
            transport: _ScreenStudioTransport(capability),
          );
          unawaited(notifier.initialize());
          return notifier;
        }),
    ],
    child: MaterialApp.router(
      theme: AppTheme.buildForTesting(Brightness.light),
      routerConfig: router,
    ),
  );
}

class _ScreenStudioTransport implements ManagedStudioTransport {
  _ScreenStudioTransport(this.capability);

  final StudioPreviewCapability capability;
  var revision = 0;
  var commandCount = 0;
  var undoCursor = 0;
  var activeVariantId = 'var_1';
  var state = StudioState.ready;
  final variants = <StudioRunnerVariant>[
    const StudioRunnerVariant(
      id: 'var_1',
      name: 'Version 1',
      commandCount: 0,
      commandRevision: 0,
    ),
  ];

  StudioRunnerSession get session => StudioRunnerSession(
    sessionId: 'ses_screen',
    projectId: 'shipglows_app',
    profileId: capability.profileId,
    sourceRevision: capability.sourceRevision,
    repositoryDigest: capability.repositoryDigest,
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
    revision = command.revision;
    commandCount = 1;
    undoCursor = 1;
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
    undoCursor += redo ? 1 : -1;
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
  }) async => const StudioCompileProjection(
    status: StudioCompileStatus.failed,
    message: 'Worker OCI indisponible.',
  );

  @override
  Future<StudioPreviewCapability> studioCapability({
    required String projectId,
  }) async => capability;

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
