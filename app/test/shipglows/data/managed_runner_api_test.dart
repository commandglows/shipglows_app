import 'dart:convert';

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
}
