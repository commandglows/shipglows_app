import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/domain/studio/studio_contracts.dart';
import 'package:shipglows_app/domain/studio/studio_session.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';

const _sourceRevision = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const _repositoryDigest =
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

void main() {
  test(
    'parses the exact semantic capability and surface restrictions',
    () async {
      final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
        ..httpClientAdapter = _JsonAdapter(_capability());
      final capability = await ManagedRunnerApi(
        baseUrl: 'https://runner.example',
        dio: dio,
      ).studioCapability(projectId: 'shipglows_app');

      expect(capability.profileId, 'shipglows.astro.hero.v1');
      expect(capability.previewOrigin.origin, 'http://127.0.0.1:3003');
      expect(capability.repositoryDigest, _repositoryDigest);
      expect(capability.capabilities, {
        StudioCapability.tokenSet,
        StudioCapability.spacingSet,
        StudioCapability.radiusSet,
        StudioCapability.opacitySet,
        StudioCapability.transformSet,
        StudioCapability.visibilitySet,
        StudioCapability.motionDuration,
        StudioCapability.motionEasing,
      });
      final title = capability.surfaces.singleWhere(
        (surface) => surface.id == 'hero.title',
      );
      expect(title.capabilities, {
        StudioCapability.opacitySet,
        StudioCapability.transformSet,
        StudioCapability.visibilitySet,
        StudioCapability.motionDuration,
        StudioCapability.motionEasing,
      });
      expect(title.protectedDimensions, {
        StudioDimension.copy,
        StudioDimension.structure,
        StudioDimension.accessibility,
        StudioDimension.performance,
      });
      expect(
        capability.compileAdmission.reason,
        StudioCompileAdmissionReason.workerIsolationUnavailable,
      );
    },
  );

  test('rejects additional or mismatched capability properties', () async {
    final body = {..._capability(), 'selector': '.hero'};
    final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
      ..httpClientAdapter = _JsonAdapter(body);
    final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);
    expect(
      () => api.studioCapability(projectId: 'shipglows_app'),
      throwsA(isA<ManagedRunnerException>()),
    );
  });

  test(
    'executes capability session journal variant and fail-closed compile routes',
    () async {
      final adapter = _StudioSequenceAdapter();
      final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
        ..httpClientAdapter = adapter;
      final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);

      final capability = await api.studioCapability(projectId: 'shipglows_app');
      final created = await api.createStudioSession(
        projectId: 'shipglows_app',
        idempotencyKey: 'session_1',
      );
      final command = VisualCommand(
        commandId: 'command_1',
        sessionId: created.sessionId,
        capability: StudioCapability.opacitySet,
        parameters: const {'value': 0.72},
        affectedRuntimeNodeIds: const ['hero.title'],
        affectedDimensions: const {StudioDimension.design},
        revision: 1,
        idempotencyKey: 'command_1',
        compactionKey: 'hero.title.opacity',
      );
      final applied = await api.applyStudioCommand(
        projectId: 'shipglows_app',
        command: command,
      );
      final undone = await api.moveStudioJournal(
        projectId: 'shipglows_app',
        sessionId: created.sessionId,
        redo: false,
        idempotencyKey: 'undo_1',
      );
      final redone = await api.moveStudioJournal(
        projectId: 'shipglows_app',
        sessionId: created.sessionId,
        redo: true,
        idempotencyKey: 'redo_1',
      );
      final variant = await api.mutateStudioVariant(
        projectId: 'shipglows_app',
        sessionId: created.sessionId,
        action: 'create',
        name: 'Variante 2',
        idempotencyKey: 'variant_1',
      );
      await api.mutateStudioVariant(
        projectId: 'shipglows_app',
        sessionId: created.sessionId,
        action: 'select',
        variantId: 'var_1',
        idempotencyKey: 'select_1',
      );
      await api.mutateStudioVariant(
        projectId: 'shipglows_app',
        sessionId: created.sessionId,
        action: 'delete',
        variantId: 'var_2',
        idempotencyKey: 'delete_1',
      );
      final compile = await api.compileStudioIntent(
        projectId: 'shipglows_app',
        intent: StudioCompileIntent(
          intentId: 'local_preflight_1',
          sessionId: created.sessionId,
          variantId: 'var_1',
          frozenCommandRevision: 5,
          baseRevision: capability.sourceRevision,
          adapterVersion: capability.adapterVersion,
          capabilityVersion: capability.capabilityVersion,
          affectedSurfaceIds: const ['hero.title'],
          affectedDimensions: const {StudioDimension.design},
          expectedPaths: capability.expectedPaths,
          idempotencyKey: 'compile_1',
        ),
      );

      expect(applied.commandCount, 1);
      expect(undone.undoCursor, 0);
      expect(redone.undoCursor, 1);
      expect(variant.activeVariantId, 'var_2');
      expect(compile.status, StudioCompileStatus.failed);
      expect(compile.intentId, 'intent_1');
      expect(adapter.requests, hasLength(9));
      expect(adapter.requests[1].headers['Idempotency-Key'], 'session_1');
      expect(adapter.requests[2].data, command.toJson());
      expect(adapter.requests[8].data, {'variantId': 'var_1'});
      expect(adapter.requests[8].headers['Idempotency-Key'], 'compile_1');
    },
  );

  test('rejects an extensible compile intent response', () async {
    final body = {..._compileIntent(), 'message': 'client-defined'};
    final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
      ..httpClientAdapter = _JsonAdapter(body);
    final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);
    await expectLater(
      api.compileStudioIntent(
        projectId: 'shipglows_app',
        intent: const StudioCompileIntent(
          intentId: 'local_1',
          sessionId: 'ses_1',
          variantId: 'var_1',
          frozenCommandRevision: 1,
          baseRevision: 'a234567',
          adapterVersion: '1.0.0',
          capabilityVersion: '1.0.0',
          affectedSurfaceIds: ['hero.title'],
          affectedDimensions: {StudioDimension.design},
          expectedPaths: ['site/src/components/Hero.astro'],
          idempotencyKey: 'compile_1',
        ),
      ),
      throwsA(isA<ManagedRunnerException>()),
    );
  });
}

Map<String, Object?> _capability() => {
  'supported': true,
  'reason': 'trustedFirstPartyBase',
  'contractVersion': 'shipglows.studio.v1',
  'bridgeVersion': 'shipglows.studio.bridge.v1',
  'profileId': 'shipglows.astro.hero.v1',
  'previewOrigin': 'http://127.0.0.1:3003',
  'sourceRevision': _sourceRevision,
  'repositoryDigest': _repositoryDigest,
  'adapterVersion': '1.0.0',
  'capabilityVersion': '1.0.0',
  'capabilities': [
    'token.set',
    'spacing.set',
    'radius.set',
    'opacity.set',
    'transform.set',
    'visibility.set',
    'motion.duration',
    'motion.easing',
  ],
  'compileAdmission': {
    'available': false,
    'reason': 'workerIsolationUnavailable',
    'message':
        'Compilation indisponible : le runner n’a pas admis de worker OCI isolé.',
  },
  'expectedPaths': ['site/src/components/Hero.astro'],
  'surfaces': [
    _surface('hero.root', 'Hero', 'Hero', [
      'token.set',
      'spacing.set',
      'radius.set',
    ]),
    _surface('hero.copy', 'Hero copy', 'Hero.copy', [
      'spacing.set',
      'radius.set',
      'opacity.set',
      'transform.set',
      'visibility.set',
      'motion.duration',
      'motion.easing',
    ]),
    _surface('hero.eyebrow', 'Eyebrow', 'Hero.eyebrow', _leafCapabilities),
    _surface('hero.title', 'Title', 'Hero.title', _leafCapabilities),
    _surface('hero.body', 'Body', 'Hero.body', _leafCapabilities),
    _surface('hero.points', 'Proof points', 'Hero.points', [
      'spacing.set',
      ..._leafCapabilities,
    ]),
    _surface('hero.actions', 'Actions', 'Hero.actions', [
      'spacing.set',
      ..._leafCapabilities,
    ]),
    _surface('hero.panel', 'Product panel', 'Hero.panel', [
      'token.set',
      'spacing.set',
      'radius.set',
      ..._leafCapabilities,
    ]),
  ],
};

const _leafCapabilities = <String>[
  'opacity.set',
  'transform.set',
  'visibility.set',
  'motion.duration',
  'motion.easing',
];

Map<String, Object?> _surface(
  String id,
  String label,
  String sourceSymbol,
  List<String> capabilities,
) => {
  'id': id,
  'label': label,
  'sourceConfidence': 'exact',
  'sourceSymbol': sourceSymbol,
  'capabilities': capabilities,
  'protectedDimensions': ['copy', 'structure', 'accessibility', 'performance'],
};

Map<String, Object?> _session({
  required int revision,
  required int commandCount,
  required int undoCursor,
  String activeVariantId = 'var_1',
  List<Map<String, Object?>>? variants,
}) => {
  'contractVersion': 'shipglows.studio.v1',
  'sessionId': 'ses_1',
  'projectId': 'shipglows_app',
  'profileId': 'shipglows.astro.hero.v1',
  'sourceRevision': _sourceRevision,
  'repositoryDigest': _repositoryDigest,
  'state': commandCount == 0 ? 'ready' : 'previewing',
  'revision': revision,
  'commandCount': commandCount,
  'undoCursor': undoCursor,
  'canUndo': undoCursor > 0,
  'canRedo': undoCursor < commandCount,
  'variants':
      variants ??
      [
        {
          'variantId': 'var_1',
          'name': 'Version 1',
          'commandCount': commandCount,
          'commandRevision': revision,
        },
      ],
  'activeVariantId': activeVariantId,
  'laboratory': {'mode': 'studio', 'reasons': <String>[]},
  'idleExpiresAt': '2026-08-16T08:30:00.000Z',
  'absoluteExpiresAt': '2026-08-16T12:00:00.000Z',
  'cleanupState': 'active',
  'compileIntent': null,
};

Map<String, Object?> _compileIntent() => {
  'schemaVersion': 'shipglows.studio.v1',
  'intentId': 'intent_1',
  'sessionId': 'ses_1',
  'variantId': 'var_1',
  'frozenCommandRevision': 5,
  'sourceCommit': _sourceRevision,
  'repositoryDigest': _repositoryDigest,
  'adapterVersion': '1.0.0',
  'capabilityVersion': '1.0.0',
  'affectedSurfaceIds': ['hero.title'],
  'affectedDimensions': ['design'],
  'predictedImpactPaths': ['site/src/components/Hero.astro'],
  'requiredEvidence': ['astro.test'],
  'actorId': 'usr_1',
  'idempotencyKey': 'compile_1',
  'createdAt': '2026-08-16T08:00:00.000Z',
  'status': 'failed',
};

class _StudioSequenceAdapter implements HttpClientAdapter {
  final requests = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final path = options.path;
    final body = switch ((options.method, path)) {
      ('GET', '/v1/projects/shipglows_app/studio/capability') => _capability(),
      ('POST', '/v1/projects/shipglows_app/studio-sessions') => _session(
        revision: 0,
        commandCount: 0,
        undoCursor: 0,
      ),
      ('POST', '/v1/projects/shipglows_app/studio-sessions/ses_1/commands') =>
        _session(revision: 1, commandCount: 1, undoCursor: 1),
      (
        'POST',
        '/v1/projects/shipglows_app/studio-sessions/ses_1/commands/undo',
      ) =>
        _session(revision: 2, commandCount: 1, undoCursor: 0),
      (
        'POST',
        '/v1/projects/shipglows_app/studio-sessions/ses_1/commands/redo',
      ) =>
        _session(revision: 3, commandCount: 1, undoCursor: 1),
      ('POST', '/v1/projects/shipglows_app/studio-sessions/ses_1/variants')
          when (options.data as Map)['action'] == 'create' =>
        _session(
          revision: 4,
          commandCount: 1,
          undoCursor: 1,
          activeVariantId: 'var_2',
          variants: [
            {
              'variantId': 'var_1',
              'name': 'Version 1',
              'commandCount': 1,
              'commandRevision': 3,
            },
            {
              'variantId': 'var_2',
              'name': 'Variante 2',
              'commandCount': 1,
              'commandRevision': 4,
            },
          ],
        ),
      ('POST', '/v1/projects/shipglows_app/studio-sessions/ses_1/variants')
          when (options.data as Map)['action'] == 'select' =>
        _session(
          revision: 5,
          commandCount: 1,
          undoCursor: 1,
          variants: [
            {
              'variantId': 'var_1',
              'name': 'Version 1',
              'commandCount': 1,
              'commandRevision': 3,
            },
            {
              'variantId': 'var_2',
              'name': 'Variante 2',
              'commandCount': 1,
              'commandRevision': 4,
            },
          ],
        ),
      ('POST', '/v1/projects/shipglows_app/studio-sessions/ses_1/variants') =>
        _session(revision: 6, commandCount: 1, undoCursor: 1),
      (
        'POST',
        '/v1/projects/shipglows_app/studio-sessions/ses_1/compile-intents',
      ) =>
        _compileIntent(),
      _ => throw StateError('Unexpected request ${options.method} $path'),
    };
    return ResponseBody.fromString(
      jsonEncode(body),
      200,
      headers: {
        Headers.contentTypeHeader: ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

class _JsonAdapter implements HttpClientAdapter {
  _JsonAdapter(this.body);
  final Map<String, Object?> body;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async => ResponseBody.fromString(
    jsonEncode(body),
    200,
    headers: {
      Headers.contentTypeHeader: ['application/json'],
    },
  );

  @override
  void close({bool force = false}) {}
}
