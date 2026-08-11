import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import 'cockpit/cockpit_dto_mapper.dart';
import 'cockpit/cockpit_models.dart';

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
        ManagedWorkspaceTransport {
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
