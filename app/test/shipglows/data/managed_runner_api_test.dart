import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';

void main() {
  test(
    'parses authenticated-runner SSE frames across chunk boundaries',
    () async {
      final source = Stream<List<int>>.fromIterable([
        utf8.encode(
          'id: 1\nevent: message.user\ndata: {"cursor":1,"id":"evt_1",',
        ),
        utf8.encode(
          '"type":"message.user","payload":{"text":"hello"},"occurredAt":"2026-08-02T00:00:00Z"}\n\n',
        ),
      ]);

      final events = await ManagedRunnerSseParser.parse(source).toList();

      expect(events, hasLength(1));
      expect(events.single.cursor, 1);
      expect(events.single.type, 'message.user');
      expect(events.single.payload['text'], 'hello');
    },
  );

  test('maps approval responses independently from conversation responses', () {
    final result = ManagedApprovalResult.fromJson({
      'approvalId': 'approval_1',
      'state': 'approved',
    });

    expect(result.approvalId, 'approval_1');
    expect(result.state, 'approved');
  });

  test('maps canonical project identity responses', () {
    final result = ManagedProjectIdentityResult.fromJson({
      'sourceSystem': 'shipglows-app',
      'sourceProjectId': 'api_proj_1',
      'projectId': 'runner_proj_1',
    });

    expect(result.sourceSystem, 'shipglows-app');
    expect(result.sourceProjectId, 'api_proj_1');
    expect(result.projectId, 'runner_proj_1');
  });

  test('loads a bounded read-only activity and review projection', () async {
    final adapter = _RecordingAdapter(
      (request, attempt) => _jsonResponse(200, {
        'projectId': 'project-1',
        'status': 'degraded',
        'reasons': ['studioReviewUnavailable'],
        'activity': [
          {
            'id': 'event-1',
            'conversationId': 'conversation-1',
            'conversationTitle': 'Release check',
            'kind': 'run',
            'label': 'Run completed',
            'occurredAt': '2026-08-17T11:00:00.000Z',
            'destination': 'conversations',
          },
        ],
        'review': const [],
      }),
    );
    final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
      ..httpClientAdapter = adapter;
    final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);

    final projection = await api.loadActivityReview(projectId: 'project-1');

    expect(projection.projectId, 'project-1');
    expect(projection.activity.single.label, 'Run completed');
    expect(
      adapter.requests.single.path,
      '/v1/projects/project-1/activity-review',
    );
    expect(adapter.requests.single.method, 'GET');
  });

  test('refreshes project context with a stable idempotency key', () async {
    final adapter = _RecordingAdapter(
      (request, attempt) => _jsonResponse(200, {
        'projectId': 'project-1',
        'status': 'ready',
        'observedAt': '2026-08-17T10:00:00.000Z',
        'sourceCommit': 'abc123',
        'repositorySnapshotCount': 2,
        'shipglowsArtifactCount': 3,
        'redactionCount': 0,
      }),
    );
    final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
      ..httpClientAdapter = adapter;
    final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);

    final projection = await api.refreshProjectContext(
      projectId: 'project-1',
      idempotencyKey: 'context-refresh-1',
    );

    expect(projection.status, ManagedProjectContextStatus.ready);
    expect(
      adapter.requests.single.path,
      '/v1/projects/project-1/context/refresh',
    );
    expect(adapter.requests.single.method, 'POST');
    expect(adapter.requests.single.data, <String, Object?>{});
    expect(
      adapter.requests.single.headers['Idempotency-Key'],
      'context-refresh-1',
    );
  });

  test('rejects malformed runner events', () {
    expect(
      () => ManagedConversationEvent.fromJson({'cursor': 1}),
      throwsA(isA<ManagedRunnerException>()),
    );
  });

  test('maps an opaque expiring operator session without host details', () {
    final session = ManagedOperatorSession.fromJson({
      'sessionId': 'ops_123',
      'token': 'opaque-capability',
      'expiresAt': '2026-08-03T15:00:00Z',
    });

    expect(session.sessionId, 'ops_123');
    expect(session.token, 'opaque-capability');
    expect(session.expiresAt.isUtc, isTrue);
  });

  test('sends valid empty JSON bodies for operator session commands', () async {
    final adapter = _RecordingAdapter((request, attempt) {
      if (request.path.endsWith('/close')) {
        return _jsonResponse(200, {'state': 'closed'});
      }
      return _jsonResponse(201, {
        'sessionId': 'ops_123',
        'token': 'opaque-capability',
        'projectId': 'project-1',
        'expiresAt': '2026-08-03T15:00:00Z',
      });
    });
    final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
      ..httpClientAdapter = adapter;
    final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);

    final session = await api.createOperatorSession(
      projectId: 'project-1',
      idempotencyKey: 'workspace-stable-key',
    );
    await api.closeOperatorSession(sessionId: session.sessionId);

    expect(adapter.requests, hasLength(2));
    expect(adapter.requests.first.method, 'POST');
    expect(adapter.requests.first.data, <String, Object?>{});
    expect(
      adapter.requests.first.headers['Idempotency-Key'],
      'workspace-stable-key',
    );
    expect(adapter.requests.last.method, 'POST');
    expect(adapter.requests.last.data, <String, Object?>{});
  });

  test(
    'refreshes Firebase auth once after 401 and replays the same command',
    () async {
      final adapter = _RecordingAdapter((request, attempt) {
        if (attempt == 1) {
          return _jsonResponse(401, {
            'error': {'code': 'invalidToken', 'message': 'Expired'},
          });
        }
        return _jsonResponse(200, {
          'conversationId': 'conversation-1',
          'state': 'ready',
        });
      });
      final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
        ..httpClientAdapter = adapter;
      final refreshes = <bool>[];
      final api = ManagedRunnerApi(
        baseUrl: 'https://runner.example',
        dio: dio,
        accessTokenProvider: ({forceRefresh = false}) async {
          refreshes.add(forceRefresh);
          return forceRefresh ? 'fresh-token' : 'expired-token';
        },
      );

      final result = await api.createConversation(
        projectId: 'project-1',
        title: 'Demo',
        idempotencyKey: 'conversation-stable-key',
      );

      expect(result.conversationId, 'conversation-1');
      expect(refreshes, [false, true]);
      expect(adapter.requests, hasLength(2));
      expect(
        adapter.requests.map((request) => request.headers['Authorization']),
        ['Bearer expired-token', 'Bearer fresh-token'],
      );
      expect(
        adapter.requests.map((request) => request.headers['Idempotency-Key']),
        everyElement('conversation-stable-key'),
      );
    },
  );

  test(
    'retries one transient command with its original idempotency key',
    () async {
      final adapter = _RecordingAdapter((request, attempt) {
        if (attempt == 1) {
          throw DioException(
            requestOptions: request,
            type: DioExceptionType.connectionError,
            message: 'offline',
          );
        }
        return _jsonResponse(200, {
          'conversationId': 'conversation-1',
          'state': 'running',
        });
      });
      final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
        ..httpClientAdapter = adapter;
      final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);

      await api.sendMessage(
        projectId: 'project-1',
        conversationId: 'conversation-1',
        text: 'Continue',
        idempotencyKey: 'message-stable-key',
      );

      expect(adapter.requests, hasLength(2));
      expect(
        adapter.requests.map((request) => request.headers['Idempotency-Key']),
        everyElement('message-stable-key'),
      );
    },
  );

  test(
    'resumes authenticated SSE with query cursor and Last-Event-ID',
    () async {
      final adapter = _RecordingAdapter((request, attempt) {
        return ResponseBody.fromString(
          'id: 8\nevent: turn.completed\n'
          'data: {"cursor":8,"id":"evt_8","type":"turn.completed",'
          '"payload":{},"occurredAt":"2026-08-02T00:00:00Z"}\n\n',
          200,
          headers: {
            Headers.contentTypeHeader: ['text/event-stream'],
          },
        );
      });
      final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
        ..httpClientAdapter = adapter;
      final api = ManagedRunnerApi(
        baseUrl: 'https://runner.example',
        dio: dio,
        accessTokenProvider: ({forceRefresh = false}) async => 'token',
      );

      final events = await api
          .events(
            projectId: 'project-1',
            conversationId: 'conversation-1',
            after: 7,
            live: true,
          )
          .toList();

      expect(events.single.cursor, 8);
      expect(adapter.requests.single.queryParameters['after'], 7);
      expect(adapter.requests.single.queryParameters['live'], 'true');
      expect(adapter.requests.single.headers['Last-Event-ID'], '7');
      expect(adapter.requests.single.headers['Authorization'], 'Bearer token');
    },
  );

  test(
    'uses verified audit and fix schemas with stable idempotency keys',
    () async {
      final adapter = _RecordingAdapter(
        (request, attempt) => _jsonResponse(202, {
          'conversationId': 'conversation-1',
          'runId': 'run-1',
          'state': 'running',
        }),
      );
      final dio = Dio(BaseOptions(baseUrl: 'https://runner.example'))
        ..httpClientAdapter = adapter;
      final api = ManagedRunnerApi(baseUrl: 'https://runner.example', dio: dio);

      await api.runAudit(
        projectId: 'project-1',
        scope: 'project-health',
        idempotencyKey: 'audit-stable',
      );
      await api.runFix(
        projectId: 'project-1',
        issueId: 'issue-42',
        instruction: 'Apply the approved isolated fix.',
        idempotencyKey: 'fix-stable',
      );

      expect(adapter.requests.first.path, '/v1/projects/project-1/audits');
      expect(adapter.requests.first.data, {'scope': 'project-health'});
      expect(adapter.requests.first.headers['Idempotency-Key'], 'audit-stable');
      expect(adapter.requests.last.path, '/v1/projects/project-1/fixes');
      expect(adapter.requests.last.data, {
        'issueId': 'issue-42',
        'instruction': 'Apply the approved isolated fix.',
      });
      expect(adapter.requests.last.headers['Idempotency-Key'], 'fix-stable');
    },
  );
}

ResponseBody _jsonResponse(int status, Map<String, Object?> body) =>
    ResponseBody.fromString(
      jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: ['application/json'],
      },
    );

typedef _AdapterHandler =
    FutureOr<ResponseBody> Function(RequestOptions request, int attempt);

class _RecordingAdapter implements HttpClientAdapter {
  _RecordingAdapter(this._handler);

  final _AdapterHandler _handler;
  final requests = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return _handler(options, requests.length);
  }

  @override
  void close({bool force = false}) {}
}
