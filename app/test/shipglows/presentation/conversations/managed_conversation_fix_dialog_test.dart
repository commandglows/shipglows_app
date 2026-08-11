import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/managed_conversation_panel.dart';
import 'package:shipglows_app/shipglows/providers/managed_runner_provider.dart';

void main() {
  testWidgets('validates, submits and cancels the accessible fix proposal', (
    tester,
  ) async {
    final runner = _TaskRunner();
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [managedRunnerApiProvider.overrideWithValue(runner)],
        child: MaterialApp(
          theme: AppTheme.buildForTesting(Brightness.light),
          home: const Scaffold(
            body: SingleChildScrollView(
              child: ManagedConversationPanel(projectId: 'project-1'),
            ),
          ),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Proposer un correctif'), findsOneWidget);
    await tester.tap(find.text('Proposer un correctif'));
    await tester.pumpAndSettle();
    expect(
      find.bySemanticsLabel('Formulaire de proposition de correctif'),
      findsOneWidget,
    );

    await tester.tap(find.text('Annuler'));
    await tester.pumpAndSettle();
    expect(runner.fixes, isEmpty);

    await tester.tap(find.text('Proposer un correctif'));
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(FilledButton, 'Proposer'));
    await tester.pump();
    expect(find.text('Identifiant requis'), findsOneWidget);
    expect(find.text('Instruction requise'), findsOneWidget);

    await tester.enterText(
      find.bySemanticsLabel('Identifiant du problème'),
      'issue-42',
    );
    await tester.enterText(
      find.bySemanticsLabel('Instruction du correctif'),
      'Appliquer le correctif isolé.',
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Proposer'));
    await tester.pumpAndSettle();

    expect(runner.fixes, [
      const _FixCall('issue-42', 'Appliquer le correctif isolé.'),
    ]);
    semantics.dispose();
  });

  testWidgets('hides fix proposal for clients without task support', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [managedRunnerApiProvider.overrideWithValue(_PlainRunner())],
        child: MaterialApp(
          theme: AppTheme.buildForTesting(Brightness.light),
          home: const Scaffold(
            body: ManagedConversationPanel(projectId: 'project-1'),
          ),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('Proposer un correctif'), findsNothing);
  });
}

class _FixCall {
  const _FixCall(this.issueId, this.instruction);
  final String issueId;
  final String instruction;

  @override
  bool operator ==(Object other) =>
      other is _FixCall &&
      other.issueId == issueId &&
      other.instruction == instruction;

  @override
  int get hashCode => Object.hash(issueId, instruction);
}

class _TaskRunner extends _PlainRunner implements ManagedRunnerTaskClient {
  final fixes = <_FixCall>[];

  @override
  Future<ManagedConversationResult> runAudit({
    required String projectId,
    required String scope,
    required String idempotencyKey,
  }) async => const ManagedConversationResult(
    conversationId: 'audit-conversation',
    state: 'running',
  );

  @override
  Future<ManagedConversationResult> runFix({
    required String projectId,
    required String issueId,
    required String instruction,
    required String idempotencyKey,
  }) async {
    fixes.add(_FixCall(issueId, instruction));
    return const ManagedConversationResult(
      conversationId: 'fix-conversation',
      state: 'running',
    );
  }
}

class _PlainRunner implements ManagedRunnerClient {
  @override
  Stream<ManagedConversationEvent> events({
    required String projectId,
    required String conversationId,
    int after = 0,
    bool live = false,
  }) => const Stream.empty();
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
