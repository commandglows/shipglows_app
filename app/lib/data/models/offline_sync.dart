enum OfflineQueueStatus {
  pending,
  retrying,
  blockedDependency,
  pausedAuth,
  failed,
  cancelled,
}

enum OfflineEntitySyncStatus {
  pending,
  retrying,
  blockedDependency,
  pausedAuth,
  failed,
}

class QueuedOfflineAction {
  const QueuedOfflineAction({
    required this.id,
    required this.userScope,
    required this.resourceType,
    required this.actionType,
    required this.label,
    required this.method,
    required this.path,
    required this.dedupeKey,
    required this.createdAt,
    required this.updatedAt,
    this.status = OfflineQueueStatus.pending,
    this.payload,
    this.queryParameters,
    this.meta = const <String, dynamic>{},
    this.attemptCount = 0,
    this.lastError,
  });

  final String id;
  final String userScope;
  final String resourceType;
  final String actionType;
  final String label;
  final String method;
  final String path;
  final String dedupeKey;
  final OfflineQueueStatus status;
  final Map<String, dynamic>? payload;
  final Map<String, dynamic>? queryParameters;
  final Map<String, dynamic> meta;
  final int attemptCount;
  final String? lastError;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get isTerminal =>
      status == OfflineQueueStatus.cancelled ||
      status == OfflineQueueStatus.failed;

  String? get entityType => meta['entityType']?.toString();
  String? get entityId => meta['entityId']?.toString();

  List<String> get dependsOnTempIds => _asStringList(meta['dependsOnTempIds']);

  QueuedOfflineAction copyWith({
    String? id,
    String? userScope,
    String? resourceType,
    String? actionType,
    String? label,
    String? method,
    String? path,
    String? dedupeKey,
    OfflineQueueStatus? status,
    Map<String, dynamic>? payload,
    bool clearPayload = false,
    Map<String, dynamic>? queryParameters,
    bool clearQueryParameters = false,
    Map<String, dynamic>? meta,
    int? attemptCount,
    String? lastError,
    bool clearLastError = false,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return QueuedOfflineAction(
      id: id ?? this.id,
      userScope: userScope ?? this.userScope,
      resourceType: resourceType ?? this.resourceType,
      actionType: actionType ?? this.actionType,
      label: label ?? this.label,
      method: method ?? this.method,
      path: path ?? this.path,
      dedupeKey: dedupeKey ?? this.dedupeKey,
      status: status ?? this.status,
      payload: clearPayload ? null : (payload ?? this.payload),
      queryParameters: clearQueryParameters
          ? null
          : (queryParameters ?? this.queryParameters),
      meta: meta ?? this.meta,
      attemptCount: attemptCount ?? this.attemptCount,
      lastError: clearLastError ? null : (lastError ?? this.lastError),
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory QueuedOfflineAction.fromJson(Map<String, dynamic> json) {
    return QueuedOfflineAction(
      id: (json['id'] ?? '').toString(),
      userScope: (json['userScope'] ?? '').toString(),
      resourceType: (json['resourceType'] ?? 'resource').toString(),
      actionType: (json['actionType'] ?? 'action').toString(),
      label: (json['label'] ?? 'Queued action').toString(),
      method: (json['method'] ?? 'POST').toString().toUpperCase(),
      path: (json['path'] ?? '').toString(),
      dedupeKey: (json['dedupeKey'] ?? '').toString(),
      status: _offlineQueueStatusFromString(json['status']?.toString()),
      payload: _asMapOrNull(json['payload']),
      queryParameters: _asMapOrNull(json['queryParameters']),
      meta: _asMapOrNull(json['meta']) ?? const <String, dynamic>{},
      attemptCount: (json['attemptCount'] as num?)?.toInt() ?? 0,
      lastError: json['lastError']?.toString(),
      createdAt: _readDateTime(json['createdAt']),
      updatedAt: _readDateTime(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userScope': userScope,
      'resourceType': resourceType,
      'actionType': actionType,
      'label': label,
      'method': method,
      'path': path,
      'dedupeKey': dedupeKey,
      'status': status.name,
      'payload': payload,
      'queryParameters': queryParameters,
      'meta': meta,
      'attemptCount': attemptCount,
      'lastError': lastError,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  QueuedOfflineAction rewriteIds(Map<String, String> idMappings) {
    if (idMappings.isEmpty) {
      return this;
    }

    return copyWith(
      path: rewriteOfflineIdsInString(path, idMappings),
      dedupeKey: rewriteOfflineIdsInString(dedupeKey, idMappings),
      payload: _asMapOrNull(rewriteOfflineIdsInValue(payload, idMappings)),
      queryParameters: _asMapOrNull(
        rewriteOfflineIdsInValue(queryParameters, idMappings),
      ),
      meta:
          _asMapOrNull(rewriteOfflineIdsInValue(meta, idMappings)) ??
          const <String, dynamic>{},
    );
  }
}

class OfflineSyncState {
  const OfflineSyncState({
    this.scope = 'signed_out',
    this.staleKeys = const <String>{},
    this.pendingCount = 0,
    this.retryingCount = 0,
    this.blockedDependencyCount = 0,
    this.pausedAuthCount = 0,
    this.failedCount = 0,
    this.isReplaying = false,
    this.lastReplayAt,
    this.lastReplayError,
  });

  final String scope;
  final Set<String> staleKeys;
  final int pendingCount;
  final int retryingCount;
  final int blockedDependencyCount;
  final int pausedAuthCount;
  final int failedCount;
  final bool isReplaying;
  final DateTime? lastReplayAt;
  final String? lastReplayError;

  bool get hasStaleData => staleKeys.isNotEmpty;
  bool get hasQueuedActions =>
      pendingCount > 0 ||
      retryingCount > 0 ||
      blockedDependencyCount > 0 ||
      pausedAuthCount > 0;
  bool get requiresReauth => pausedAuthCount > 0;

  OfflineSyncState copyWith({
    String? scope,
    Set<String>? staleKeys,
    int? pendingCount,
    int? retryingCount,
    int? blockedDependencyCount,
    int? pausedAuthCount,
    int? failedCount,
    bool? isReplaying,
    DateTime? lastReplayAt,
    bool clearLastReplayAt = false,
    String? lastReplayError,
    bool clearLastReplayError = false,
  }) {
    return OfflineSyncState(
      scope: scope ?? this.scope,
      staleKeys: staleKeys ?? this.staleKeys,
      pendingCount: pendingCount ?? this.pendingCount,
      retryingCount: retryingCount ?? this.retryingCount,
      blockedDependencyCount:
          blockedDependencyCount ?? this.blockedDependencyCount,
      pausedAuthCount: pausedAuthCount ?? this.pausedAuthCount,
      failedCount: failedCount ?? this.failedCount,
      isReplaying: isReplaying ?? this.isReplaying,
      lastReplayAt: clearLastReplayAt
          ? null
          : (lastReplayAt ?? this.lastReplayAt),
      lastReplayError: clearLastReplayError
          ? null
          : (lastReplayError ?? this.lastReplayError),
    );
  }
}

class OfflineEntitySyncInfo {
  const OfflineEntitySyncInfo({
    required this.entityType,
    required this.entityId,
    required this.status,
    required this.actionCount,
    this.lastError,
  });

  final String entityType;
  final String entityId;
  final OfflineEntitySyncStatus status;
  final int actionCount;
  final String? lastError;

  bool get isPendingLike => status != OfflineEntitySyncStatus.failed;
}

Map<String, dynamic>? _asMapOrNull(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, entry) => MapEntry(key.toString(), entry));
  }
  return null;
}

DateTime _readDateTime(Object? value) {
  if (value is DateTime) {
    return value;
  }
  if (value is String) {
    return DateTime.tryParse(value) ?? DateTime.fromMillisecondsSinceEpoch(0);
  }
  if (value is int) {
    return DateTime.fromMillisecondsSinceEpoch(value);
  }
  return DateTime.fromMillisecondsSinceEpoch(0);
}

OfflineQueueStatus _offlineQueueStatusFromString(String? value) {
  return switch (value) {
    'retrying' => OfflineQueueStatus.retrying,
    'blockedDependency' || 'blocked_dependency' =>
      OfflineQueueStatus.blockedDependency,
    'pausedAuth' || 'paused_auth' => OfflineQueueStatus.pausedAuth,
    'failed' => OfflineQueueStatus.failed,
    'cancelled' => OfflineQueueStatus.cancelled,
    _ => OfflineQueueStatus.pending,
  };
}

List<String> _asStringList(Object? value) {
  if (value is List) {
    return value
        .map((entry) => entry.toString())
        .where((entry) => entry.isNotEmpty)
        .toList();
  }
  return const <String>[];
}

Object? rewriteOfflineIdsInValue(
  Object? value,
  Map<String, String> idMappings,
) {
  if (value == null || idMappings.isEmpty) {
    return value;
  }

  if (value is String) {
    return idMappings[value] ?? value;
  }

  if (value is List) {
    return value
        .map((entry) => rewriteOfflineIdsInValue(entry, idMappings))
        .toList();
  }

  if (value is Map) {
    return value.map(
      (key, entry) => MapEntry(
        key is String ? (idMappings[key] ?? key) : key.toString(),
        rewriteOfflineIdsInValue(entry, idMappings),
      ),
    );
  }

  return value;
}

String rewriteOfflineIdsInString(
  String value,
  Map<String, String> idMappings,
) {
  var rewritten = value;
  for (final entry in idMappings.entries) {
    rewritten = rewritten.replaceAll(entry.key, entry.value);
  }
  return rewritten;
}
