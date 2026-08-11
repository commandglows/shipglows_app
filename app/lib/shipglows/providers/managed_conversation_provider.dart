import 'dart:async';

import 'package:flutter_riverpod/legacy.dart';

import '../data/conversations/conversation_event_mapper.dart';
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
    this.timeline = const <ConversationPresentationItem>[],
    this.pendingApprovalId,
    this.errorMessage,
    this.authRequired = false,
  });

  final ManagedConversationPhase phase;
  final String? conversationId;
  final List<ManagedConversationEvent> events;
  final List<ConversationPresentationItem> timeline;
  final String? pendingApprovalId;
  final String? errorMessage;
  final bool authRequired;

  int get lastCursor => events.isEmpty ? 0 : events.last.cursor;

  ManagedConversationState copyWith({
    ManagedConversationPhase? phase,
    String? conversationId,
    List<ManagedConversationEvent>? events,
    List<ConversationPresentationItem>? timeline,
    String? pendingApprovalId,
    bool clearApproval = false,
    String? errorMessage,
    bool clearError = false,
    bool? authRequired,
  }) => ManagedConversationState(
    phase: phase ?? this.phase,
    conversationId: conversationId ?? this.conversationId,
    events: events ?? this.events,
    timeline: timeline ?? this.timeline,
    pendingApprovalId: clearApproval
        ? null
        : pendingApprovalId ?? this.pendingApprovalId,
    errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    authRequired: authRequired ?? this.authRequired,
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
    this.eventMapper = const ConversationEventMapper(),
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
  final ConversationEventMapper eventMapper;
  StreamSubscription<ManagedConversationEvent>? _eventsSubscription;
  Timer? _reconnectTimer;
  var _reconnectAttempts = 0;
  var _disposed = false;
  var _lastAcceptedCursor = 0;
  final _acceptedEventIds = <String>{};
  final _acceptedEventIdOrder = <String>[];
  static int _keyCounter = 0;

  Future<void> createConversation() async {
    if (client == null || state.conversationId != null) return;
    state = state.copyWith(
      phase: ManagedConversationPhase.creating,
      clearError: true,
      authRequired: false,
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
      authRequired: false,
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
      authRequired: false,
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
        decision: approved ? 'approve' : 'deny',
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
    final cursor = state.lastCursor;
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
    if (event.cursor <= _lastAcceptedCursor ||
        _acceptedEventIds.contains(event.id)) {
      return;
    }
    _lastAcceptedCursor = event.cursor;
    _acceptedEventIds.add(event.id);
    _acceptedEventIdOrder.add(event.id);
    if (_acceptedEventIdOrder.length > maxConversationDeduplicationEntries) {
      _acceptedEventIds.remove(_acceptedEventIdOrder.removeAt(0));
    }
    _reconnectAttempts = 0;
    var events = [...state.events, event];
    if (events.length > maxConversationTimelineItems) {
      events = events.sublist(events.length - maxConversationTimelineItems);
    }
    final approvalId = event.type == 'approval.requested'
        ? event.payload['approvalId']?.toString()
        : state.pendingApprovalId;
    state = state.copyWith(
      phase: _phaseForEvent(event.type),
      events: events,
      timeline: eventMapper.project(events),
      pendingApprovalId: approvalId,
      clearApproval: event.type == 'approval.resolved',
      clearError: true,
      authRequired: false,
    );
  }

  ManagedConversationPhase _phaseForEvent(String type) => switch (type) {
    'approval.requested' => ManagedConversationPhase.waitingApproval,
    'turn.started' ||
    'run.started' ||
    'message.assistant.delta' => ManagedConversationPhase.streaming,
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
    final unauthorized =
        error is ManagedRunnerException &&
        (error.statusCode == 401 || error.code == 'unauthorized');
    state = state.copyWith(
      phase: ManagedConversationPhase.failed,
      errorMessage: unauthorized
          ? 'Votre session a expiré. Reconnectez-vous pour continuer.'
          : _safeErrorMessage(error),
      authRequired: unauthorized,
    );
  }

  String _safeErrorMessage(Object error) {
    if (error is ManagedRunnerException) {
      return switch (error.code) {
        'offline' => 'Le runner est hors ligne. Réessayez dans un instant.',
        'timeout' => 'Le runner met trop de temps à répondre. Réessayez.',
        'streamDisconnected' => 'La connexion au runner a été interrompue.',
        _ => 'La conversation ne peut pas continuer pour le moment.',
      };
    }
    return 'La conversation ne peut pas continuer pour le moment.';
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

  Future<void> pauseEvents() async {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    await _eventsSubscription?.cancel();
    _eventsSubscription = null;
  }

  void resumeEvents() => _listen();

  void reportCommandFailure(Object error) => _fail(error);

  @override
  void dispose() {
    _disposed = true;
    _reconnectTimer?.cancel();
    _eventsSubscription?.cancel();
    super.dispose();
  }
}

class ManagedConversationTab {
  ManagedConversationTab({
    required this.title,
    required this.notifier,
    this.unread = false,
  });

  String title;
  final ManagedConversationNotifier notifier;
  bool unread;
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
      return ManagedConversationWorkspaceNotifier(
        projectId: projectId,
        client: client,
      );
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
  final _tabSubscriptions = <ManagedConversationNotifier, void Function()>{};
  static int _taskKeyCounter = 0;

  ManagedConversationNotifier get activeNotifier => state.active.notifier;

  ManagedConversationState get activeState => state.active.notifier.state;

  bool get supportsManagedTasks => client is ManagedRunnerTaskClient;

  void addTab() {
    if (state.tabs.isNotEmpty) {
      unawaited(state.active.notifier.pauseEvents());
    }
    final tab = _createTab(number: state.tabs.length + 1);
    state = state.copyWith(
      tabs: [...state.tabs, tab],
      activeIndex: state.tabs.length,
    );
  }

  ManagedConversationTab _createTab({required int number}) {
    final notifier = ManagedConversationNotifier(
      projectId: projectId,
      client: client,
    );
    final tab = ManagedConversationTab(
      title: 'Conversation $number',
      notifier: notifier,
    );
    var knownEventCount = 0;
    void listener(ManagedConversationState value) {
      final index = state.tabs.indexOf(tab);
      if (index >= 0 &&
          index != state.activeIndex &&
          value.events.length > knownEventCount) {
        tab.unread = true;
      }
      knownEventCount = value.events.length;
      _refresh();
    }

    _tabSubscriptions[notifier] = notifier.addListener(listener);
    return tab;
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
    final previous = state.active;
    unawaited(previous.notifier.pauseEvents());
    state.tabs[index].unread = false;
    state = state.copyWith(tabs: [...state.tabs], activeIndex: index);
    state.active.notifier.resumeEvents();
  }

  void closeTab(int index) {
    if (index < 0 || index >= state.tabs.length) return;
    final removed = state.tabs[index];
    final tabs = [...state.tabs]..removeAt(index);
    if (tabs.isEmpty) {
      final replacement = _createTab(number: 1);
      state = ManagedConversationWorkspaceState(
        tabs: [replacement],
        activeIndex: 0,
      );
      _tabSubscriptions.remove(removed.notifier)?.call();
      removed.notifier.dispose();
      return;
    }
    _tabSubscriptions.remove(removed.notifier)?.call();
    removed.notifier.dispose();
    final activeIndex = state.activeIndex > index
        ? state.activeIndex - 1
        : state.activeIndex >= tabs.length
        ? tabs.length - 1
        : state.activeIndex;
    tabs[activeIndex].unread = false;
    state = ManagedConversationWorkspaceState(
      tabs: tabs,
      activeIndex: activeIndex,
    );
    state.active.notifier.resumeEvents();
  }

  Future<void> createConversation() => activeNotifier.createConversation();

  Future<void> sendMessage(String text) => activeNotifier.sendMessage(text);

  Future<void> interrupt() => activeNotifier.interrupt();

  Future<void> resume() => activeNotifier.resume();

  Future<void> resolveApproval(bool approved) =>
      activeNotifier.resolveApproval(approved);

  Future<void> runAudit({String scope = 'project-health'}) async {
    final taskClient = client;
    if (taskClient is! ManagedRunnerTaskClient) return;
    final commands = taskClient as ManagedRunnerTaskClient;
    if (activeState.conversationId != null) addTab();
    try {
      final result = await commands.runAudit(
        projectId: projectId,
        scope: scope,
        idempotencyKey: _taskKey('audit'),
      );
      activeNotifier.restoreConversation(
        conversationId: result.conversationId,
        state: result.state,
      );
    } catch (error) {
      activeNotifier.reportCommandFailure(error);
    }
  }

  Future<void> runFix({
    required String issueId,
    required String instruction,
  }) async {
    final taskClient = client;
    if (taskClient is! ManagedRunnerTaskClient) return;
    final commands = taskClient as ManagedRunnerTaskClient;
    if (activeState.conversationId != null) addTab();
    try {
      final result = await commands.runFix(
        projectId: projectId,
        issueId: issueId,
        instruction: instruction,
        idempotencyKey: _taskKey('fix'),
      );
      activeNotifier.restoreConversation(
        conversationId: result.conversationId,
        state: result.state,
      );
    } catch (error) {
      activeNotifier.reportCommandFailure(error);
    }
  }

  String _taskKey(String prefix) =>
      '$prefix-${DateTime.now().microsecondsSinceEpoch}-${_taskKeyCounter++}';

  void _refresh() => state = state.copyWith(tabs: [...state.tabs]);

  @override
  void dispose() {
    for (final entry in _tabSubscriptions.entries) {
      entry.value();
      entry.key.dispose();
    }
    super.dispose();
  }
}
