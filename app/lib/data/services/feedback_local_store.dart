import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/feedback_entry.dart';

class FeedbackLocalStore {
  FeedbackLocalStore(this._prefs);

  final SharedPreferences _prefs;

  static const _draftMessageKey = 'feedback_draft_message';
  static const _recentSubmissionsKey = 'feedback_recent_submissions';
  static const _recentLimit = 8;

  String loadDraftMessage() => _prefs.getString(_draftMessageKey) ?? '';

  Future<void> saveDraftMessage(String value) async {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      await _prefs.remove(_draftMessageKey);
      return;
    }
    await _prefs.setString(_draftMessageKey, value);
  }

  Future<void> clearDraftMessage() async {
    await _prefs.remove(_draftMessageKey);
  }

  List<LocalFeedbackSubmission> loadRecentSubmissions() {
    final raw = _prefs.getString(_recentSubmissionsKey);
    if (raw == null || raw.isEmpty) {
      return const <LocalFeedbackSubmission>[];
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        return const <LocalFeedbackSubmission>[];
      }
      return decoded
          .whereType<Map>()
          .map(
            (item) =>
                LocalFeedbackSubmission.fromJson(Map<String, dynamic>.from(item)),
          )
          .toList();
    } catch (_) {
      return const <LocalFeedbackSubmission>[];
    }
  }

  Future<List<LocalFeedbackSubmission>> addRecentSubmission(
    LocalFeedbackSubmission submission,
  ) async {
    final current = loadRecentSubmissions();
    final next = [submission, ...current]
        .take(_recentLimit)
        .toList(growable: false);
    await _prefs.setString(
      _recentSubmissionsKey,
      jsonEncode(next.map((entry) => entry.toJson()).toList()),
    );
    return next;
  }
}
