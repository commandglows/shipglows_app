enum ManagedActivityReviewStatus { ready, degraded }

enum ManagedActivityKind { approval, change, diagnostic, evidence, run }

enum ManagedReviewKind { approval }

enum ManagedReviewDestination { conversations, studio }

class ManagedActivityReviewProjection {
  const ManagedActivityReviewProjection({
    required this.projectId,
    required this.status,
    required this.reasons,
    required this.activity,
    required this.review,
  });

  final String projectId;
  final ManagedActivityReviewStatus status;
  final List<String> reasons;
  final List<ManagedActivityItem> activity;
  final List<ManagedReviewItem> review;

  factory ManagedActivityReviewProjection.fromJson(Map<String, dynamic> json) {
    final projectId = _boundedString(json['projectId'], 128);
    final status = switch (json['status']) {
      'ready' => ManagedActivityReviewStatus.ready,
      'degraded' => ManagedActivityReviewStatus.degraded,
      _ => null,
    };
    final rawReasons = json['reasons'];
    final rawActivity = json['activity'];
    final rawReview = json['review'];
    if (projectId == null ||
        status == null ||
        rawReasons is! List ||
        rawActivity is! List ||
        rawReview is! List ||
        rawReasons.length > 8 ||
        rawActivity.length > 20 ||
        rawReview.length > 20) {
      throw _invalidProjection();
    }
    final reasons = <String>[];
    for (final reason in rawReasons) {
      final value = _boundedString(reason, 64);
      if (value == null) throw _invalidProjection();
      reasons.add(value);
    }
    return ManagedActivityReviewProjection(
      projectId: projectId,
      status: status,
      reasons: List.unmodifiable(reasons),
      activity: List.unmodifiable(
        rawActivity.map((item) => ManagedActivityItem.fromJson(_map(item))),
      ),
      review: List.unmodifiable(
        rawReview.map((item) => ManagedReviewItem.fromJson(_map(item))),
      ),
    );
  }
}

class ManagedActivityItem {
  const ManagedActivityItem({
    required this.id,
    required this.conversationId,
    required this.conversationTitle,
    required this.kind,
    required this.label,
    required this.occurredAt,
    required this.destination,
  });

  final String id;
  final String conversationId;
  final String conversationTitle;
  final ManagedActivityKind kind;
  final String label;
  final DateTime occurredAt;
  final ManagedReviewDestination destination;

  factory ManagedActivityItem.fromJson(Map<String, dynamic> json) {
    final id = _boundedString(json['id'], 128);
    final conversationId = _boundedString(json['conversationId'], 128);
    final conversationTitle = _boundedString(json['conversationTitle'], 200);
    final kind = _activityKind(json['kind']);
    final label = _boundedString(json['label'], 96);
    final occurredAt = _timestamp(json['occurredAt']);
    final destination = _destination(json['destination']);
    if (id == null ||
        conversationId == null ||
        conversationTitle == null ||
        kind == null ||
        label == null ||
        occurredAt == null ||
        destination == null) {
      throw _invalidProjection();
    }
    return ManagedActivityItem(
      id: id,
      conversationId: conversationId,
      conversationTitle: conversationTitle,
      kind: kind,
      label: label,
      occurredAt: occurredAt,
      destination: destination,
    );
  }
}

class ManagedReviewItem {
  const ManagedReviewItem({
    required this.id,
    required this.conversationId,
    required this.conversationTitle,
    required this.kind,
    required this.label,
    required this.occurredAt,
    required this.destination,
  });

  final String id;
  final String conversationId;
  final String conversationTitle;
  final ManagedReviewKind kind;
  final String label;
  final DateTime occurredAt;
  final ManagedReviewDestination destination;

  factory ManagedReviewItem.fromJson(Map<String, dynamic> json) {
    final id = _boundedString(json['id'], 128);
    final conversationId = _boundedString(json['conversationId'], 128);
    final conversationTitle = _boundedString(json['conversationTitle'], 200);
    final kind = json['kind'] == 'approval' ? ManagedReviewKind.approval : null;
    final label = _boundedString(json['label'], 96);
    final occurredAt = _timestamp(json['occurredAt']);
    final destination = _destination(json['destination']);
    if (id == null ||
        conversationId == null ||
        conversationTitle == null ||
        kind == null ||
        label == null ||
        occurredAt == null ||
        destination == null) {
      throw _invalidProjection();
    }
    return ManagedReviewItem(
      id: id,
      conversationId: conversationId,
      conversationTitle: conversationTitle,
      kind: kind,
      label: label,
      occurredAt: occurredAt,
      destination: destination,
    );
  }
}

ManagedActivityKind? _activityKind(Object? value) => switch (value) {
  'approval' => ManagedActivityKind.approval,
  'change' => ManagedActivityKind.change,
  'diagnostic' => ManagedActivityKind.diagnostic,
  'evidence' => ManagedActivityKind.evidence,
  'run' => ManagedActivityKind.run,
  _ => null,
};

ManagedReviewDestination? _destination(Object? value) => switch (value) {
  'conversations' => ManagedReviewDestination.conversations,
  'studio' => ManagedReviewDestination.studio,
  _ => null,
};

String? _boundedString(Object? value, int maxLength) =>
    value is String && value.isNotEmpty && value.length <= maxLength
    ? value
    : null;

DateTime? _timestamp(Object? value) {
  final text = _boundedString(value, 64);
  return text == null ? null : DateTime.tryParse(text)?.toUtc();
}

Map<String, dynamic> _map(Object? value) {
  if (value is! Map) throw _invalidProjection();
  return Map<String, dynamic>.from(value);
}

FormatException _invalidProjection() =>
    const FormatException('Invalid managed activity summary.');
