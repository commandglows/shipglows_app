import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';

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
  Future<ManagedProjectIdentityResult> resolveProjectIdentity({
    required String sourceSystem,
    required String sourceProjectId,
  });

  Future<ManagedConversationResult> createConversation({
    required String projectId,
    required String title,
    required String idempotencyKey,
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

class ManagedRunnerApi implements ManagedRunnerClient {
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
           );

  final Dio _dio;
  final Future<String?> Function()? accessTokenProvider;

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
          headers: await _headers(),
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
      throw _mapError(error);
    }
  }

  Future<Map<String, String>> _headers() async {
    final token = await accessTokenProvider?.call();
    return {
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  ManagedRunnerException _mapError(DioException error) {
    final statusCode = error.response?.statusCode;
    final payload = error.response?.data;
    final errorBody = payload is Map ? payload['error'] : null;
    final code = errorBody is Map && errorBody['code'] is String
        ? errorBody['code'] as String
        : 'requestFailed';
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
