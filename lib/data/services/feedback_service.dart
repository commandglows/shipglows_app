import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../../core/app_language.dart';
import '../models/auth_session.dart';
import '../models/feedback_entry.dart';
import 'api_service.dart';
import 'feedback_local_store.dart';

class FeedbackService {
  FeedbackService({
    required ApiService Function() api,
    required FeedbackLocalStore Function() localStore,
    required AuthSession Function() authSession,
    required String? Function() language,
    required void Function() invalidateRecentSubmissions,
    required void Function() invalidateDefaultAdminEntries,
  }) : _api = api,
       _localStore = localStore,
       _authSession = authSession,
       _language = language,
       _invalidateRecentSubmissions = invalidateRecentSubmissions,
       _invalidateDefaultAdminEntries = invalidateDefaultAdminEntries;

  final ApiService Function() _api;
  final FeedbackLocalStore Function() _localStore;
  final AuthSession Function() _authSession;
  final String? Function() _language;
  final void Function() _invalidateRecentSubmissions;
  final void Function() _invalidateDefaultAdminEntries;

  String loadDraftMessage() {
    return _localStore().loadDraftMessage();
  }

  Future<void> saveDraftMessage(String value) async {
    await _localStore().saveDraftMessage(value);
  }

  Future<void> clearDraftMessage() async {
    await _localStore().clearDraftMessage();
  }

  Future<List<LocalFeedbackSubmission>> loadRecentSubmissions() async {
    return _localStore().loadRecentSubmissions();
  }

  Future<FeedbackEntry> submitText(String message) async {
    final entry = await _api().createTextFeedback(
      message: message.trim(),
      platform: _currentPlatform(),
      locale: _currentLocale(),
      userEmail: _authSession().email,
    );

    await _localStore().addRecentSubmission(
      LocalFeedbackSubmission(
        id: entry.id,
        type: entry.type,
        createdAt: entry.createdAt,
        messagePreview: _messagePreview(entry.message),
      ),
    );
    await clearDraftMessage();
    _invalidateRecentSubmissions();
    _invalidateDefaultAdminEntries();
    return entry;
  }

  Future<FeedbackEntry> submitAudio({
    required Uint8List wavBytes,
    required int durationMs,
  }) async {
    final api = _api();
    final uploadTarget = await api.getFeedbackUploadUrl(
      mimeType: 'audio/wav',
      fileName: 'feedback-${DateTime.now().millisecondsSinceEpoch}.wav',
    );
    final storageId = uploadTarget.storageId;
    if (storageId == null || storageId.isEmpty) {
      throw const FormatException(
        'Feedback upload target is missing storageId.',
      );
    }

    await api.uploadFeedbackAudio(
      uploadTarget,
      wavBytes,
      mimeType: 'audio/wav',
    );
    final entry = await api.createAudioFeedback(
      storageId: storageId,
      durationMs: durationMs,
      platform: _currentPlatform(),
      locale: _currentLocale(),
      userEmail: _authSession().email,
    );

    await _localStore().addRecentSubmission(
      LocalFeedbackSubmission(
        id: entry.id,
        type: entry.type,
        createdAt: entry.createdAt,
        durationMs: entry.durationMs,
      ),
    );
    _invalidateRecentSubmissions();
    _invalidateDefaultAdminEntries();
    return entry;
  }

  Future<List<FeedbackEntry>> listAdmin({
    FeedbackAdminQuery query = const FeedbackAdminQuery(),
  }) async {
    return _api().listAdminFeedback(
      status: query.statusParam,
      type: query.typeParam,
    );
  }

  Future<bool> fetchAdminCapability() async {
    return _api().fetchFeedbackAdminCapability();
  }

  Future<void> markReviewed(String feedbackId) async {
    await _api().markFeedbackReviewed(feedbackId);
  }

  String _currentLocale() {
    return resolvedLocaleTagForPreference(
      _language(),
      WidgetsBinding.instance.platformDispatcher.locale,
    );
  }

  String _currentPlatform() {
    if (kIsWeb) {
      return 'web';
    }
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => 'android',
      TargetPlatform.iOS => 'ios',
      TargetPlatform.macOS => 'macos',
      TargetPlatform.windows => 'windows',
      TargetPlatform.linux => 'linux',
      TargetPlatform.fuchsia => 'fuchsia',
    };
  }

  String? _messagePreview(String? message) {
    final value = message?.trim();
    if (value == null || value.isEmpty) {
      return null;
    }
    if (value.length <= 80) {
      return value;
    }
    return '${value.substring(0, 77)}...';
  }
}
