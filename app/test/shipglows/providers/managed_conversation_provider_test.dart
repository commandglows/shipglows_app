import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/providers/managed_conversation_provider.dart';

void main() {
  test('connects commands, SSE events and approval state', () async {
    final runner = _FakeManagedRunner();
    final notifier = ManagedConversationNotifier(
      projectId: 'project-1',
      client: runner,
    );

    await notifier.createConversation();
    expect(notifier.state.conversationId, 'conversation-1');
    expect(runner.createdKeys, hasLength(1));

    await notifier.sendMessage('Run the audit');
    expect(runner.messages.single.text, 'Run the audit');
    expect(runner.messages.single.idempotencyKey, isNotEmpty);

    runner.eventsController.add(
      const ManagedConversationEvent(
        cursor: 1,
        id: 'event-1',
        type: 'approval.requested',
        payload: {'approvalId': 'approval-1', 'summary': 'Need confirmation'},
        occurredAt: '2026-08-02T00:00:00.000Z',
      ),
    );
    await Future<void>.delayed(Duration.zero);

    expect(notifier.state.pendingApprovalId, 'approval-1');
    expect(notifier.state.phase, ManagedConversationPhase.waitingApproval);

    await notifier.resolveApproval(true);
    expect(runner.approvals.single.decision, 'approved');
    expect(notifier.state.pendingApprovalId, isNull);
    notifier.dispose();
  });

  test('keeps independent conversation tabs for one project', () async {
    final runner = _FakeManagedRunner();
    final workspace = ManagedConversationWorkspaceNotifier(
      projectId: 'project-1',
      client: runner,
    );

    expect(workspace.state.tabs, hasLength(1));
    workspace.addTab();
    expect(workspace.state.tabs, hasLength(2));
    expect(workspace.state.activeIndex, 1);

    await workspace.createConversation();
    expect(workspace.activeNotifier.state.conversationId, 'conversation-1');
    workspace.selectTab(0);
    expect(workspace.activeNotifier.state.conversationId, isNull);
    workspace.dispose();
  });
}

class _FakeManagedRunner implements ManagedRunnerClient {
  final eventsController =
      StreamController<ManagedConversationEvent>.broadcast();
  final createdKeys = <String>[];
  final messages = <_MessageCall>[];
  final approvals = <_ApprovalCall>[];

  @override
  Future<ManagedWorkspaceCapability> workspaceCapability({
    required String projectId,
  }) async => const ManagedWorkspaceCapability(
    available: false,
    reason: 'Operator Workspace is not configured.',
  );

  @override
  Future<CockpitSnapshot> loadCockpit() async => CockpitSnapshot(
    generatedAt: DateTime.utc(2026, 8, 3),
    projects: const <CockpitProject>[],
  );

  @override
  Future<ManagedProjectIdentityResult> resolveProjectIdentity({
    required String sourceSystem,
    required String sourceProjectId,
  }) async => const ManagedProjectIdentityResult(
    sourceSystem: 'shipglows-app',
    sourceProjectId: 'api_proj_1',
    projectId: 'runner_proj_1',
  );

  @override
  Future<List<ManagedConversationSummary>> listConversations({
    required String projectId,
  }) async => const <ManagedConversationSummary>[];

  @override
  Future<ManagedConversationResult> createConversation({
    required String projectId,
    required String title,
    required String idempotencyKey,
  }) async {
    createdKeys.add(idempotencyKey);
    return const ManagedConversationResult(
      conversationId: 'conversation-1',
      state: 'ready',
    );
  }

  @override
  Future<ManagedConversationResult> sendMessage({
    required String projectId,
    required String conversationId,
    required String text,
    required String idempotencyKey,
  }) async {
    messages.add(_MessageCall(text, idempotencyKey));
    return const ManagedConversationResult(
      conversationId: 'conversation-1',
      state: 'running',
    );
  }

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
  }) async {
    approvals.add(_ApprovalCall(decision, idempotencyKey));
    return const ManagedApprovalResult(
      approvalId: 'approval-1',
      state: 'approved',
    );
  }

  @override
  Stream<ManagedConversationEvent> events({
    required String projectId,
    required String conversationId,
    int after = 0,
    bool live = false,
  }) => eventsController.stream;
}

class _MessageCall {
  const _MessageCall(this.text, this.idempotencyKey);
  final String text;
  final String idempotencyKey;
}

class _ApprovalCall {
  const _ApprovalCall(this.decision, this.idempotencyKey);
  final String decision;
  final String idempotencyKey;
}
