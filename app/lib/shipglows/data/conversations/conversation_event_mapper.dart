import '../managed_runner_api.dart';

const maxConversationBodyCharacters = 4000;
const maxConversationSummaryCharacters = 320;
const maxConversationTimelineItems = 250;
const maxConversationDeduplicationEntries = 500;
const maxConversationCapabilities = 12;

enum ConversationItemKind {
  userMessage,
  assistantMessage,
  plan,
  tool,
  progress,
  approval,
  result,
  error,
  state,
  unknown,
}

class ConversationPresentationItem {
  const ConversationPresentationItem({
    required this.id,
    required this.cursor,
    required this.kind,
    required this.title,
    required this.body,
    required this.occurredAt,
    this.runtimeId,
    this.capabilities = const [],
    this.isDelta = false,
  });

  final String id;
  final int cursor;
  final ConversationItemKind kind;
  final String title;
  final String body;
  final String occurredAt;
  final String? runtimeId;
  final List<String> capabilities;
  final bool isDelta;

  bool get isExecutable => false;

  ConversationPresentationItem appendDelta(ConversationPresentationItem next) =>
      ConversationPresentationItem(
        id: id,
        cursor: next.cursor,
        kind: kind,
        title: title,
        body: sanitizeConversationText(
          '$body${next.body}',
          maxCharacters: maxConversationBodyCharacters,
        ),
        occurredAt: next.occurredAt,
        runtimeId: runtimeId,
        capabilities: capabilities,
        isDelta: true,
      );
}

class ConversationEventMapper {
  const ConversationEventMapper();

  ConversationPresentationItem map(ManagedConversationEvent event) {
    final kind = _kindFor(event.type);
    final body = _bodyFor(event.payload, kind);
    final runtimeId =
        _safeString(event.payload['runtimeId']) ??
        _safeString(event.payload['runtime']);
    final rawCapabilities = event.payload['capabilities'];
    final capabilities = rawCapabilities is List
        ? rawCapabilities
              .whereType<String>()
              .map(
                (value) => sanitizeConversationText(
                  value,
                  maxCharacters: maxConversationSummaryCharacters,
                ),
              )
              .where((value) => value.isNotEmpty)
              .take(maxConversationCapabilities)
              .toList(growable: false)
        : const <String>[];

    return ConversationPresentationItem(
      id: event.id,
      cursor: event.cursor,
      kind: kind,
      title: _titleFor(kind),
      body: body,
      occurredAt: event.occurredAt,
      runtimeId: runtimeId,
      capabilities: capabilities,
      isDelta:
          event.type == 'message.assistant.delta' ||
          event.type == 'tool.output.delta',
    );
  }

  List<ConversationPresentationItem> project(
    Iterable<ManagedConversationEvent> events,
  ) {
    final items = <ConversationPresentationItem>[];
    for (final event in events) {
      final item = map(event);
      if (item.kind == ConversationItemKind.assistantMessage &&
          item.isDelta &&
          items.isNotEmpty &&
          items.last.kind == ConversationItemKind.assistantMessage &&
          items.last.isDelta &&
          items.last.runtimeId == item.runtimeId) {
        items[items.length - 1] = items.last.appendDelta(item);
      } else {
        items.add(item);
      }
    }
    if (items.length <= maxConversationTimelineItems) return items;
    return items.sublist(items.length - maxConversationTimelineItems);
  }

  ConversationItemKind _kindFor(String type) {
    if (type == 'message.user') return ConversationItemKind.userMessage;
    if (type == 'message.assistant.delta' ||
        type == 'message.assistant.completed') {
      return ConversationItemKind.assistantMessage;
    }
    if (type == 'plan.updated') return ConversationItemKind.plan;
    if (type.startsWith('tool.') || type.startsWith('file.')) {
      return ConversationItemKind.tool;
    }
    if (type == 'run.progress' || type == 'health.evidenceProduced') {
      return ConversationItemKind.progress;
    }
    if (type.startsWith('approval.')) return ConversationItemKind.approval;
    if (type == 'turn.failed' ||
        type == 'run.failed' ||
        type == 'diagnostic.error') {
      return ConversationItemKind.error;
    }
    if (type == 'turn.completed' || type == 'run.completed') {
      return ConversationItemKind.result;
    }
    if (type.startsWith('conversation.') ||
        type.startsWith('turn.') ||
        type.startsWith('run.') ||
        type == 'diagnostic.warning') {
      return ConversationItemKind.state;
    }
    return ConversationItemKind.unknown;
  }

  String _bodyFor(Map<String, dynamic> payload, ConversationItemKind kind) {
    const keys = [
      'text',
      'message',
      'summary',
      'output',
      'description',
      'state',
      'status',
      'kind',
    ];
    for (final key in keys) {
      final value = _safeString(payload[key]);
      if (value != null && value.isNotEmpty) {
        return sanitizeConversationText(
          value,
          maxCharacters: key == 'summary'
              ? maxConversationSummaryCharacters
              : maxConversationBodyCharacters,
        );
      }
    }
    return kind == ConversationItemKind.unknown
        ? 'Événement non pris en charge.'
        : 'Aucun détail fourni.';
  }

  String _titleFor(ConversationItemKind kind) => switch (kind) {
    ConversationItemKind.userMessage => 'Vous',
    ConversationItemKind.assistantMessage => 'Assistant',
    ConversationItemKind.plan => 'Plan',
    ConversationItemKind.tool => 'Outil',
    ConversationItemKind.progress => 'Progression',
    ConversationItemKind.approval => 'Approbation',
    ConversationItemKind.result => 'Résultat',
    ConversationItemKind.error => 'Erreur',
    ConversationItemKind.state => 'État',
    ConversationItemKind.unknown => 'Événement',
  };

  String? _safeString(Object? value) => value is String
      ? sanitizeConversationText(
          value,
          maxCharacters: maxConversationSummaryCharacters,
        )
      : null;
}

String sanitizeConversationText(String input, {required int maxCharacters}) {
  final withoutAnsi = input.replaceAll(
    RegExp(r'\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))'),
    '',
  );
  final withoutControls = withoutAnsi.replaceAll(
    RegExp(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'),
    '',
  );
  if (withoutControls.length <= maxCharacters) return withoutControls;
  return '${withoutControls.substring(0, maxCharacters - 1)}…';
}
