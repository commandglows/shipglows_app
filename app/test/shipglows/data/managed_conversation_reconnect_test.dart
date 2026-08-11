import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/managed_conversation_provider.dart';

void main() {
  test(
    'reconnects from the last accepted cursor without duplicating events',
    () async {
      final runner = _ReconnectRunner();
      final notifier = ManagedConversationNotifier(
        projectId: 'project-1',
        client: runner,
        reconnectDelay: Duration.zero,
      );

      await notifier.createConversation();
      runner.streams.first.add(_event(cursor: 4, id: 'event-4'));
      await Future<void>.delayed(Duration.zero);
      runner.streams.first.addError(
        const ManagedRunnerException(code: 'offline', message: 'Offline'),
      );
      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(runner.afterCursors, [0, 4]);
      expect(notifier.state.phase, ManagedConversationPhase.streaming);
      expect(notifier.state.errorMessage, contains('Reconnecting'));

      runner.streams[1]
        ..add(_event(cursor: 4, id: 'event-4'))
        ..add(_event(cursor: 5, id: 'event-5', type: 'turn.completed'));
      await Future<void>.delayed(Duration.zero);

      expect(notifier.state.events.map((event) => event.id), [
        'event-4',
        'event-5',
      ]);
      expect(notifier.state.phase, ManagedConversationPhase.completed);
      notifier.dispose();
      await runner.dispose();
    },
  );

  test(
    'fails closed on an unauthorized stream instead of reconnecting',
    () async {
      final runner = _ReconnectRunner();
      final notifier = ManagedConversationNotifier(
        projectId: 'project-1',
        client: runner,
        reconnectDelay: Duration.zero,
      );

      await notifier.createConversation();
      runner.streams.first.addError(
        const ManagedRunnerException(
          code: 'invalidToken',
          message: 'Sign in again.',
          statusCode: 401,
        ),
      );
      await Future<void>.delayed(const Duration(milliseconds: 10));

      expect(runner.afterCursors, [0]);
      expect(notifier.state.phase, ManagedConversationPhase.failed);
      expect(notifier.state.errorMessage, 'Sign in again.');
      notifier.dispose();
      await runner.dispose();
    },
  );
}

ManagedConversationEvent _event({
  required int cursor,
  required String id,
  String type = 'assistant.message.delta',
}) => ManagedConversationEvent(
  cursor: cursor,
  id: id,
  type: type,
  payload: const <String, dynamic>{},
  occurredAt: '2026-08-11T00:00:00Z',
);

class _ReconnectRunner implements ManagedRunnerClient {
  final streams = <StreamController<ManagedConversationEvent>>[];
  final afterCursors = <int>[];

  @override
  Stream<ManagedConversationEvent> events({
    required String projectId,
    required String conversationId,
    int after = 0,
    bool live = false,
  }) {
    afterCursors.add(after);
    final controller = StreamController<ManagedConversationEvent>();
    streams.add(controller);
    return controller.stream;
  }

  @override
  Future<ManagedConversationResult> createConversation({
    required String projectId,
    required String title,
    required String idempotencyKey,
  }) async => const ManagedConversationResult(
    conversationId: 'conversation-1',
    state: 'ready',
  );

  @override
  Future<List<ManagedConversationSummary>> listConversations({
    required String projectId,
  }) async => const <ManagedConversationSummary>[];

  @override
  Future<CockpitSnapshot> loadCockpit() async => CockpitSnapshot(
    generatedAt: DateTime.utc(2026, 8, 11),
    projects: const <CockpitProject>[],
  );

  @override
  Future<ManagedWorkspaceCapability> workspaceCapability({
    required String projectId,
  }) async =>
      const ManagedWorkspaceCapability(available: false, reason: 'Unavailable');

  @override
  Future<ManagedProjectIdentityResult> resolveProjectIdentity({
    required String sourceSystem,
    required String sourceProjectId,
  }) async => ManagedProjectIdentityResult(
    sourceSystem: sourceSystem,
    sourceProjectId: sourceProjectId,
    projectId: 'project-1',
  );

  @override
  Future<ManagedConversationResult> sendMessage({
    required String projectId,
    required String conversationId,
    required String text,
    required String idempotencyKey,
  }) async => const ManagedConversationResult(
    conversationId: 'conversation-1',
    state: 'running',
  );

  @override
  Future<ManagedConversationResult> interrupt({
    required String projectId,
    required String conversationId,
    required String idempotencyKey,
  }) async => const ManagedConversationResult(
    conversationId: 'conversation-1',
    state: 'interrupted',
  );

  @override
  Future<ManagedConversationResult> resume({
    required String projectId,
    required String conversationId,
    required String idempotencyKey,
  }) async => const ManagedConversationResult(
    conversationId: 'conversation-1',
    state: 'running',
  );

  @override
  Future<ManagedApprovalResult> resolveApproval({
    required String projectId,
    required String approvalId,
    required String decision,
    required String idempotencyKey,
  }) async => ManagedApprovalResult(approvalId: approvalId, state: decision);

  Future<void> dispose() async {
    for (final stream in streams) {
      await stream.close();
    }
  }
}
