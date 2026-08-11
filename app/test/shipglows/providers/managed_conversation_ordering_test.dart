import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/managed_conversation_provider.dart';

void main() {
  test('accepts only unique strictly increasing cursors', () async {
    final runner = _OrderingRunner();
    final notifier = ManagedConversationNotifier(
      projectId: 'project-1',
      client: runner,
    );
    await notifier.createConversation();

    runner.controller
      ..add(_event(3, 'three'))
      ..add(_event(2, 'late'))
      ..add(_event(4, 'three'))
      ..add(_event(4, 'same-cursor'))
      ..add(_event(5, 'five'));
    await Future<void>.delayed(Duration.zero);

    expect(notifier.state.events.map((event) => event.cursor), [3, 4, 5]);
    expect(notifier.state.events.map((event) => event.id), [
      'three',
      'same-cursor',
      'five',
    ]);
    expect(notifier.state.lastCursor, 5);
    notifier.dispose();
    await runner.controller.close();
  });
}

ManagedConversationEvent _event(int cursor, String id) =>
    ManagedConversationEvent(
      cursor: cursor,
      id: id,
      type: 'message.assistant.delta',
      payload: {'text': '$cursor'},
      occurredAt: '2026-08-11T00:00:00Z',
    );

class _OrderingRunner implements ManagedRunnerClient {
  final controller = StreamController<ManagedConversationEvent>();

  @override
  Stream<ManagedConversationEvent> events({
    required String projectId,
    required String conversationId,
    int after = 0,
    bool live = false,
  }) => controller.stream;
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
  }) async => const [];
  @override
  Future<CockpitSnapshot> loadCockpit() async =>
      CockpitSnapshot(generatedAt: DateTime.utc(2026), projects: const []);
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
  }) async => ManagedConversationResult(
    conversationId: conversationId,
    state: 'running',
  );
  @override
  Future<ManagedConversationResult> interrupt({
    required String projectId,
    required String conversationId,
    required String idempotencyKey,
  }) async => ManagedConversationResult(
    conversationId: conversationId,
    state: 'interrupted',
  );
  @override
  Future<ManagedConversationResult> resume({
    required String projectId,
    required String conversationId,
    required String idempotencyKey,
  }) async => ManagedConversationResult(
    conversationId: conversationId,
    state: 'running',
  );
  @override
  Future<ManagedApprovalResult> resolveApproval({
    required String projectId,
    required String approvalId,
    required String decision,
    required String idempotencyKey,
  }) async => ManagedApprovalResult(approvalId: approvalId, state: decision);
}
