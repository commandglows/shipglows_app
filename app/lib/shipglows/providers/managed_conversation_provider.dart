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
  ManagedConversationNotifier({
    required this.projectId,
    required this.client,
    this.maxReconnectAttempts = 3,
    this.reconnectDelay = const Duration(milliseconds: 500),
  }) : super(
         ManagedConversationState(
           phase: client == null
               ? ManagedConversationPhase.unavailable
               : ManagedConversationPhase.idle,
         ),
       );

  final String projectId;
  final ManagedRunnerClient? client;
  final int maxReconnectAttempts;
  final Duration reconnectDelay;
  StreamSubscription<ManagedConversationEvent>? _eventsSubscription;
  Timer? _reconnectTimer;
  var _reconnectAttempts = 0;
  var _disposed = false;
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
        title: 'ShipGlows · $projectId',
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

  void restoreConversation({
    required String conversationId,
    required String state,
  }) {
    if (this.state.conversationId != null) return;
    this.state = this.state.copyWith(
      phase: _phaseForRunnerState(state),
      conversationId: conversationId,
      clearError: true,
    );
    _listen();
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
          onError: _handleStreamFailure,
          onDone: _handleStreamDone,
          cancelOnError: true,
        );
  }

  void _acceptEvent(ManagedConversationEvent event) {
    if (state.events.any((item) => item.id == event.id)) return;
    _reconnectAttempts = 0;
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

  void _handleStreamFailure(Object error) {
    _eventsSubscription = null;
    if (error is ManagedRunnerException &&
        (error.statusCode == 401 || error.code == 'unauthorized')) {
      _fail(error);
      return;
    }
    _scheduleReconnect(error);
  }

  void _handleStreamDone() {
    _eventsSubscription = null;
    if (_shouldKeepStreaming) {
      _scheduleReconnect(
        const ManagedRunnerException(
          code: 'streamDisconnected',
          message: 'The managed runner event stream disconnected.',
        ),
      );
    }
  }

  bool get _shouldKeepStreaming => switch (state.phase) {
    ManagedConversationPhase.ready ||
    ManagedConversationPhase.sending ||
    ManagedConversationPhase.streaming ||
    ManagedConversationPhase.waitingApproval => true,
    _ => false,
  };

  void _scheduleReconnect(Object error) {
    if (_disposed || !_shouldKeepStreaming || _reconnectTimer != null) return;
    if (_reconnectAttempts >= maxReconnectAttempts) {
      _fail(error);
      return;
    }
    _reconnectAttempts += 1;
    state = state.copyWith(
      phase: ManagedConversationPhase.streaming,
      errorMessage: 'Reconnecting to the managed runner…',
    );
    _reconnectTimer = Timer(reconnectDelay, () {
      _reconnectTimer = null;
      if (!_disposed) _listen();
    });
  }

  String _key(String prefix) =>
      '$prefix-${DateTime.now().microsecondsSinceEpoch}-${_keyCounter++}';

  @override
  void dispose() {
    _disposed = true;
    _reconnectTimer?.cancel();
    _eventsSubscription?.cancel();
    super.dispose();
  }
}

class ManagedConversationTab {
  ManagedConversationTab({required this.title, required this.notifier});

  String title;
  final ManagedConversationNotifier notifier;
}

class ManagedConversationWorkspaceState {
  const ManagedConversationWorkspaceState({
    required this.tabs,
    required this.activeIndex,
  });

  final List<ManagedConversationTab> tabs;
  final int activeIndex;

  ManagedConversationTab get active => tabs[activeIndex];

  ManagedConversationWorkspaceState copyWith({
    List<ManagedConversationTab>? tabs,
    int? activeIndex,
  }) => ManagedConversationWorkspaceState(
    tabs: tabs ?? this.tabs,
    activeIndex: activeIndex ?? this.activeIndex,
  );
}

final managedConversationWorkspaceProvider =
    StateNotifierProvider.family<
      ManagedConversationWorkspaceNotifier,
      ManagedConversationWorkspaceState,
      String
    >((ref, projectId) {
      final client = ref.watch(managedRunnerApiProvider);
      final notifier = ManagedConversationWorkspaceNotifier(
        projectId: projectId,
        client: client,
      );
      ref.onDispose(notifier.dispose);
      return notifier;
    });

class ManagedConversationWorkspaceNotifier
    extends StateNotifier<ManagedConversationWorkspaceState> {
  ManagedConversationWorkspaceNotifier({
    required this.projectId,
    required this.client,
  }) : super(
         const ManagedConversationWorkspaceState(tabs: [], activeIndex: 0),
       ) {
    addTab();
    unawaited(_restoreTabs());
  }

  final String projectId;
  final ManagedRunnerClient? client;
  final _tabSubscriptions =
      <ManagedConversationNotifier, void Function(ManagedConversationState)>{};

  ManagedConversationNotifier get activeNotifier => state.active.notifier;

  ManagedConversationState get activeState => state.active.notifier.state;

  void addTab() {
    final number = state.tabs.length + 1;
    final notifier = ManagedConversationNotifier(
      projectId: projectId,
      client: client,
    );
    final tab = ManagedConversationTab(
      title: 'Conversation $number',
      notifier: notifier,
    );
    void listener(ManagedConversationState value) => _refresh();
    notifier.addListener(listener);
    _tabSubscriptions[notifier] = listener;
    state = state.copyWith(
      tabs: [...state.tabs, tab],
      activeIndex: state.tabs.length,
    );
  }

  Future<void> _restoreTabs() async {
    if (client == null) return;
    try {
      final summaries = await client!.listConversations(projectId: projectId);
      if (summaries.isEmpty || state.tabs.length != 1) return;
      final first = state.tabs.first;
      if (first.notifier.state.conversationId != null) return;
      first.title = summaries.first.title;
      first.notifier.restoreConversation(
        conversationId: summaries.first.conversationId,
        state: summaries.first.state,
      );
      for (final summary in summaries.skip(1)) {
        addTab();
        final tab = state.tabs.last;
        tab.title = summary.title;
        tab.notifier.restoreConversation(
          conversationId: summary.conversationId,
          state: summary.state,
        );
      }
      selectTab(0);
      _refresh();
    } catch (error) {
      // The local tab remains usable; a later refresh can retry reconciliation.
    }
  }

  void selectTab(int index) {
    if (index < 0 || index >= state.tabs.length || index == state.activeIndex) {
      return;
    }
    state = state.copyWith(activeIndex: index);
  }

  Future<void> createConversation() => activeNotifier.createConversation();

  Future<void> sendMessage(String text) => activeNotifier.sendMessage(text);

  Future<void> interrupt() => activeNotifier.interrupt();

  Future<void> resume() => activeNotifier.resume();

  Future<void> resolveApproval(bool approved) =>
      activeNotifier.resolveApproval(approved);

  void _refresh() => state = state.copyWith(tabs: [...state.tabs]);

  @override
  void dispose() {
    for (final entry in _tabSubscriptions.entries) {
      entry.key.dispose();
    }
    super.dispose();
  }
}
