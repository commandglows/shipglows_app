import 'dart:async';

import 'package:flutter_riverpod/legacy.dart';

import '../data/managed_runner_api.dart';
import 'managed_runner_provider.dart';

enum ManagedConversationPhase {
  unavailable,
  idle,
  creating,
  ready,
  sending,
  streaming,
  waitingApproval,
  interrupted,
  completed,
  failed,
}

class ManagedConversationState {
  const ManagedConversationState({
    required this.phase,
    this.conversationId,
    this.events = const <ManagedConversationEvent>[],
    this.pendingApprovalId,
    this.errorMessage,
  });

  final ManagedConversationPhase phase;
  final String? conversationId;
  final List<ManagedConversationEvent> events;
  final String? pendingApprovalId;
  final String? errorMessage;

  ManagedConversationState copyWith({
    ManagedConversationPhase? phase,
    String? conversationId,
    List<ManagedConversationEvent>? events,
    String? pendingApprovalId,
    bool clearApproval = false,
    String? errorMessage,
    bool clearError = false,
  }) => ManagedConversationState(
    phase: phase ?? this.phase,
    conversationId: conversationId ?? this.conversationId,
    events: events ?? this.events,
    pendingApprovalId: clearApproval
        ? null
        : pendingApprovalId ?? this.pendingApprovalId,
    errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
  );
}

final managedConversationProvider =
    StateNotifierProvider.family<
      ManagedConversationNotifier,
      ManagedConversationState,
      String
    >((ref, projectId) {
      final client = ref.watch(managedRunnerApiProvider);
      return ManagedConversationNotifier(projectId: projectId, client: client);
    });

class ManagedConversationNotifier
    extends StateNotifier<ManagedConversationState> {
  ManagedConversationNotifier({required this.projectId, required this.client})
    : super(
        ManagedConversationState(
          phase: client == null
              ? ManagedConversationPhase.unavailable
              : ManagedConversationPhase.idle,
        ),
      );

  final String projectId;
  final ManagedRunnerClient? client;
  StreamSubscription<ManagedConversationEvent>? _eventsSubscription;
  static int _keyCounter = 0;

  Future<void> createConversation() async {
    if (client == null || state.conversationId != null) return;
    state = state.copyWith(
      phase: ManagedConversationPhase.creating,
      clearError: true,
    );
    try {
      final result = await client!.createConversation(
        projectId: projectId,
        title: 'ShipGlowz · $projectId',
        idempotencyKey: _key('conversation'),
      );
      state = state.copyWith(
        phase: _phaseForRunnerState(result.state),
        conversationId: result.conversationId,
      );
      _listen();
    } catch (error) {
      _fail(error);
    }
  }

  Future<void> sendMessage(String text) async {
    final value = text.trim();
    if (client == null || value.isEmpty) return;
    if (state.conversationId == null) await createConversation();
    final conversationId = state.conversationId;
    if (conversationId == null) return;
    state = state.copyWith(
      phase: ManagedConversationPhase.sending,
      clearError: true,
    );
    try {
      await client!.sendMessage(
        projectId: projectId,
        conversationId: conversationId,
        text: value,
        idempotencyKey: _key('message'),
      );
      _listen();
    } catch (error) {
      _fail(error);
    }
  }

  Future<void> interrupt() async {
    final conversationId = state.conversationId;
    if (conversationId == null || client == null) return;
    try {
      await client!.interrupt(
        projectId: projectId,
        conversationId: conversationId,
        idempotencyKey: _key('interrupt'),
      );
      state = state.copyWith(phase: ManagedConversationPhase.interrupted);
    } catch (error) {
      _fail(error);
    }
  }

  Future<void> resume() async {
    final conversationId = state.conversationId;
    if (conversationId == null || client == null) return;
    try {
      await client!.resume(
        projectId: projectId,
        conversationId: conversationId,
        idempotencyKey: _key('resume'),
      );
      state = state.copyWith(phase: ManagedConversationPhase.streaming);
      _listen();
    } catch (error) {
      _fail(error);
    }
  }

  Future<void> resolveApproval(bool approved) async {
    final approvalId = state.pendingApprovalId;
    if (approvalId == null || client == null) return;
    try {
      await client!.resolveApproval(
        projectId: projectId,
        approvalId: approvalId,
        decision: approved ? 'approved' : 'denied',
        idempotencyKey: _key('approval'),
      );
      state = state.copyWith(
        phase: ManagedConversationPhase.streaming,
        clearApproval: true,
      );
      _listen();
    } catch (error) {
      _fail(error);
    }
  }

  void _listen() {
    final conversationId = state.conversationId;
    if (conversationId == null ||
        client == null ||
        _eventsSubscription != null) {
      return;
    }
    final cursor = state.events.isEmpty ? 0 : state.events.last.cursor;
    _eventsSubscription = client!
        .events(
          projectId: projectId,
          conversationId: conversationId,
          after: cursor,
          live: true,
        )
        .listen(
          _acceptEvent,
          onError: _fail,
          onDone: () => _eventsSubscription = null,
        );
  }

  void _acceptEvent(ManagedConversationEvent event) {
    if (state.events.any((item) => item.id == event.id)) return;
    final events = [...state.events, event];
    final approvalId = event.type == 'approval.requested'
        ? event.payload['approvalId']?.toString()
        : state.pendingApprovalId;
    state = state.copyWith(
      phase: _phaseForEvent(event.type),
      events: events,
      pendingApprovalId: approvalId,
      clearApproval: event.type == 'approval.resolved',
      clearError: true,
    );
  }

  ManagedConversationPhase _phaseForEvent(String type) => switch (type) {
    'approval.requested' => ManagedConversationPhase.waitingApproval,
    'turn.started' ||
    'run.started' ||
    'assistant.message.delta' => ManagedConversationPhase.streaming,
    'turn.completed' || 'run.completed' => ManagedConversationPhase.completed,
    'turn.interrupted' => ManagedConversationPhase.interrupted,
    'turn.failed' || 'run.failed' => ManagedConversationPhase.failed,
    _ => state.phase,
  };

  ManagedConversationPhase _phaseForRunnerState(String value) =>
      switch (value) {
        'running' || 'queued' => ManagedConversationPhase.streaming,
        'interrupted' => ManagedConversationPhase.interrupted,
        'completed' => ManagedConversationPhase.completed,
        'failed' => ManagedConversationPhase.failed,
        _ => ManagedConversationPhase.ready,
      };

  void _fail(Object error) {
    state = state.copyWith(
      phase: ManagedConversationPhase.failed,
      errorMessage: error.toString(),
    );
  }

  String _key(String prefix) =>
      '$prefix-${DateTime.now().microsecondsSinceEpoch}-${_keyCounter++}';

  @override
  void dispose() {
    _eventsSubscription?.cancel();
    super.dispose();
  }
}
