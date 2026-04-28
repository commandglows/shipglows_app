import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/offline_sync.dart';

class OfflineCacheRecord {
  const OfflineCacheRecord({
    required this.key,
    required this.updatedAt,
    required this.data,
  });

  final String key;
  final DateTime updatedAt;
  final Object? data;

  factory OfflineCacheRecord.fromJson(Map<String, dynamic> json) {
    return OfflineCacheRecord(
      key: (json['key'] ?? '').toString(),
      updatedAt:
          DateTime.tryParse((json['updatedAt'] ?? '').toString()) ??
          DateTime.fromMillisecondsSinceEpoch(0),
      data: json['data'],
    );
  }

  Map<String, dynamic> toJson() {
    return {'key': key, 'updatedAt': updatedAt.toIso8601String(), 'data': data};
  }
}

class OfflineCacheStore {
  OfflineCacheStore(this._prefs);

  static const _storageKey = 'offline_cache_v1';
  final SharedPreferences _prefs;

  Future<OfflineCacheRecord?> read(String scope, String key) async {
    final map = _readAll();
    final scopeEntries = map[scope];
    if (scopeEntries == null) {
      return null;
    }
    final raw = scopeEntries[key];
    if (raw is! Map<String, dynamic>) {
      return null;
    }
    return OfflineCacheRecord.fromJson(raw);
  }

  Future<void> write(String scope, String key, Object? data) async {
    final map = _readAll();
    final scopeEntries = Map<String, dynamic>.from(map[scope] ?? const {});
    scopeEntries[key] = OfflineCacheRecord(
      key: key,
      updatedAt: DateTime.now(),
      data: data,
    ).toJson();
    map[scope] = scopeEntries;
    await _prefs.setString(_storageKey, jsonEncode(map));
  }

  Future<void> remove(String scope, String key) async {
    final map = _readAll();
    final scopeEntries = Map<String, dynamic>.from(map[scope] ?? const {});
    scopeEntries.remove(key);
    if (scopeEntries.isEmpty) {
      map.remove(scope);
    } else {
      map[scope] = scopeEntries;
    }
    await _prefs.setString(_storageKey, jsonEncode(map));
  }

  Future<Map<String, OfflineCacheRecord>> loadScope(String scope) async {
    final map = _readAll();
    final scopeEntries = map[scope];
    if (scopeEntries is! Map) {
      return const <String, OfflineCacheRecord>{};
    }

    return scopeEntries.map((key, value) {
      final record = value is Map<String, dynamic>
          ? OfflineCacheRecord.fromJson(value)
          : value is Map
          ? OfflineCacheRecord.fromJson(Map<String, dynamic>.from(value))
          : OfflineCacheRecord(
              key: key.toString(),
              updatedAt: DateTime.fromMillisecondsSinceEpoch(0),
              data: null,
            );
      return MapEntry(key.toString(), record);
    });
  }

  Future<void> saveScope(
    String scope,
    Map<String, OfflineCacheRecord> records,
  ) async {
    final map = _readAll();
    if (records.isEmpty) {
      map.remove(scope);
    } else {
      map[scope] = records.map(
        (key, value) => MapEntry(key, value.toJson()),
      );
    }
    await _prefs.setString(_storageKey, jsonEncode(map));
  }

  Future<void> rewriteIds(String scope, Map<String, String> idMappings) async {
    if (idMappings.isEmpty) {
      return;
    }

    final current = await loadScope(scope);
    if (current.isEmpty) {
      return;
    }

    var changed = false;
    final now = DateTime.now();
    final rewritten = <String, OfflineCacheRecord>{};
    for (final entry in current.entries) {
      final nextKey = rewriteOfflineIdsInString(entry.key, idMappings);
      final nextData = rewriteOfflineIdsInValue(entry.value.data, idMappings);
      changed = changed ||
          nextKey != entry.key ||
          !identical(nextData, entry.value.data);
      rewritten[nextKey] = OfflineCacheRecord(
        key: nextKey,
        updatedAt: now,
        data: nextData,
      );
    }

    if (!changed) {
      return;
    }

    await saveScope(scope, rewritten);
  }

  Map<String, dynamic> _readAll() {
    final raw = _prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) {
      return <String, dynamic>{};
    }
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return <String, dynamic>{};
      }
      return decoded.map(
        (key, value) => MapEntry(
          key.toString(),
          value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{},
        ),
      );
    } catch (_) {
      return <String, dynamic>{};
    }
  }
}

class OfflineQueueStore {
  OfflineQueueStore(this._prefs);

  static const _storageKey = 'offline_queue_v1';
  final SharedPreferences _prefs;

  Future<List<QueuedOfflineAction>> load(String scope) async {
    final all = _readAll();
    final rawEntries = all[scope];
    if (rawEntries is! List) {
      return const <QueuedOfflineAction>[];
    }
    return rawEntries
        .whereType<Map>()
        .map(
          (entry) =>
              QueuedOfflineAction.fromJson(Map<String, dynamic>.from(entry)),
        )
        .toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
  }

  Future<void> save(String scope, List<QueuedOfflineAction> actions) async {
    final all = _readAll();
    if (actions.isEmpty) {
      all.remove(scope);
    } else {
      all[scope] = actions.map((entry) => entry.toJson()).toList();
    }
    await _prefs.setString(_storageKey, jsonEncode(all));
  }

  Map<String, dynamic> _readAll() {
    final raw = _prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) {
      return <String, dynamic>{};
    }
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return <String, dynamic>{};
      }
      return decoded.map((key, value) => MapEntry(key.toString(), value));
    } catch (_) {
      return <String, dynamic>{};
    }
  }
}

class OfflineIdMappingStore {
  OfflineIdMappingStore(this._prefs);

  static const _storageKey = 'offline_id_mappings_v1';
  final SharedPreferences _prefs;

  Future<Map<String, String>> load(String scope) async {
    final all = _readAll();
    final rawEntries = all[scope];
    if (rawEntries is! Map) {
      return const <String, String>{};
    }

    return rawEntries.map(
      (key, value) => MapEntry(key.toString(), value.toString()),
    );
  }

  Future<void> save(String scope, Map<String, String> mappings) async {
    final all = _readAll();
    if (mappings.isEmpty) {
      all.remove(scope);
    } else {
      all[scope] = mappings;
    }
    await _prefs.setString(_storageKey, jsonEncode(all));
  }

  Future<void> register(String scope, String tempId, String realId) async {
    final current = await load(scope);
    final next = {...current, tempId: realId};
    await save(scope, next);
  }

  Map<String, dynamic> _readAll() {
    final raw = _prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) {
      return <String, dynamic>{};
    }
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return <String, dynamic>{};
      }
      return decoded.map((key, value) => MapEntry(key.toString(), value));
    } catch (_) {
      return <String, dynamic>{};
    }
  }
}
