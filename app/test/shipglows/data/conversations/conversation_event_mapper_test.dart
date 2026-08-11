import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/conversations/conversation_event_mapper.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';

void main() {
  const mapper = ConversationEventMapper();

  test('maps every normalized family and keeps unknown events inert', () {
    final cases = <String, ConversationItemKind>{
      'message.user': ConversationItemKind.userMessage,
      'message.assistant.completed': ConversationItemKind.assistantMessage,
      'plan.updated': ConversationItemKind.plan,
      'tool.started': ConversationItemKind.tool,
      'run.progress': ConversationItemKind.progress,
      'approval.requested': ConversationItemKind.approval,
      'run.completed': ConversationItemKind.result,
      'diagnostic.error': ConversationItemKind.error,
      'conversation.stateChanged': ConversationItemKind.state,
      'future.event': ConversationItemKind.unknown,
    };

    for (final entry in cases.entries) {
      final item = mapper.map(_event(type: entry.key));
      expect(item.kind, entry.value, reason: entry.key);
      expect(item.isExecutable, isFalse);
    }
  });

  test('coalesces compatible assistant deltas', () {
    final items = mapper.project([
      _event(cursor: 1, id: 'a', type: 'message.assistant.delta', text: 'Bon'),
      _event(cursor: 2, id: 'b', type: 'message.assistant.delta', text: 'jour'),
      _event(cursor: 3, id: 'c', type: 'message.user', text: 'Merci'),
    ]);

    expect(items, hasLength(2));
    expect(items.first.body, 'Bonjour');
    expect(items.first.cursor, 2);
  });

  test('removes ANSI and controls and bounds untrusted output', () {
    final item = mapper.map(
      _event(text: '\u001b[31msecret\u001b[0m\u0000${'x' * 8000}'),
    );

    expect(item.body, isNot(contains('\u001b')));
    expect(item.body, isNot(contains('\u0000')));
    expect(item.body.length, lessThanOrEqualTo(maxConversationBodyCharacters));
  });

  test('exposes runtime and capabilities only from safe typed values', () {
    final safe = mapper.map(
      _event(
        payload: const {
          'text': 'ok',
          'runtimeId': 'codex',
          'capabilities': ['tools', 'approvals'],
        },
      ),
    );
    final unsafe = mapper.map(
      _event(
        payload: const {
          'text': 'ok',
          'runtimeId': {'raw': 'no'},
        },
      ),
    );

    expect(safe.runtimeId, 'codex');
    expect(safe.capabilities, ['tools', 'approvals']);
    expect(unsafe.runtimeId, isNull);
    expect(unsafe.capabilities, isEmpty);
  });
}

ManagedConversationEvent _event({
  int cursor = 1,
  String id = 'event-1',
  String type = 'message.assistant.completed',
  String text = 'Hello',
  Map<String, dynamic>? payload,
}) => ManagedConversationEvent(
  cursor: cursor,
  id: id,
  type: type,
  payload: payload ?? {'text': text},
  occurredAt: '2026-08-11T00:00:00Z',
);
