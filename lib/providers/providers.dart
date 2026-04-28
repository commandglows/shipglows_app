import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:flutter_riverpod/misc.dart';

import '../core/app_config.dart';
import '../core/app_diagnostics.dart';
import '../core/app_language.dart';
import '../core/app_theme_preference.dart';
import '../core/shared_preferences_provider.dart';
import '../data/models/affiliate_link.dart';
import '../data/models/ai_runtime.dart';
import '../data/models/drip_plan.dart';
import '../data/models/app_access_state.dart';
import '../data/models/app_bootstrap.dart';
import '../data/models/app_settings.dart';
import '../data/models/auth_session.dart';
import '../data/models/content_item.dart';
import '../data/models/creator_profile.dart';
import '../data/models/feedback_entry.dart';
import '../data/models/idea.dart';
import '../data/models/offline_sync.dart';
import '../data/models/openrouter_credential.dart';
import '../data/models/persona.dart';
import '../data/models/project.dart';
import '../data/models/ritual.dart';
import '../data/services/api_service.dart';
import '../data/services/clerk_auth_service.dart';
import '../data/services/feedback_local_store.dart';
import '../data/services/feedback_service.dart';
import '../data/services/offline_storage_service.dart';

const _apiBaseUrlKey = 'api_base_url';
const _appLanguagePreferenceKey = 'app_language_preference';
const _appThemePreferenceKey = 'app_theme_preference';
const _demoModeKey = 'demo_mode_enabled';
const _demoOnboardingKey = 'demo_onboarding_complete';

final apiBaseUrlProvider = StateNotifierProvider<ApiBaseUrlNotifier, String>((
  ref,
) {
  return ApiBaseUrlNotifier(ref);
});

final appLanguagePreferenceProvider =
    StateNotifierProvider<AppLanguagePreferenceNotifier, String>((ref) {
      return AppLanguagePreferenceNotifier(ref);
    });

final appThemePreferenceProvider =
    StateNotifierProvider<AppThemePreferenceNotifier, String>((ref) {
      return AppThemePreferenceNotifier(ref);
    });

String _normalizeApiBaseUrl(String? raw) {
  final fallback = AppConfig.apiBaseUrl;
  final value = raw?.trim();
  if (value == null || value.isEmpty) {
    return fallback;
  }

  final uri = Uri.tryParse(value);
  if (uri == null ||
      !uri.hasScheme ||
      !(uri.scheme == 'http' || uri.scheme == 'https') ||
      uri.host.isEmpty) {
    return fallback;
  }

  if (uri.path.isNotEmpty && uri.path != '/') {
    return fallback;
  }

  return uri
      .replace(path: '', query: null, fragment: null)
      .toString()
      .replaceAll(RegExp(r'/$'), '');
}

class ApiBaseUrlNotifier extends StateNotifier<String> {
  ApiBaseUrlNotifier(this.ref)
    : super(
        _normalizeApiBaseUrl(
          ref.read(sharedPrefsProvider).getString(_apiBaseUrlKey),
        ),
      );

  final Ref ref;

  Future<void> update(String url) async {
    final normalized = _normalizeApiBaseUrl(url);
    state = normalized;
    await ref.read(sharedPrefsProvider).setString(_apiBaseUrlKey, normalized);
  }
}

class AppLanguagePreferenceNotifier extends StateNotifier<String> {
  AppLanguagePreferenceNotifier(this.ref)
    : super(
        normalizeAppLanguagePreference(
          ref.read(sharedPrefsProvider).getString(_appLanguagePreferenceKey),
        ),
      );

  final Ref ref;

  Future<void> update(String language) async {
    final normalized = normalizeAppLanguagePreference(language);
    state = normalized;
    await ref
        .read(sharedPrefsProvider)
        .setString(_appLanguagePreferenceKey, normalized);
  }
}

class AppThemePreferenceNotifier extends StateNotifier<String> {
  AppThemePreferenceNotifier(this.ref)
    : super(
        normalizeAppThemePreference(
          ref.read(sharedPrefsProvider).getString(_appThemePreferenceKey),
        ),
      );

  final Ref ref;

  Future<void> update(String theme) async {
    final normalized = normalizeAppThemePreference(theme);
    state = normalized;
    await ref
        .read(sharedPrefsProvider)
        .setString(_appThemePreferenceKey, normalized);
  }
}

String _offlineStorageScope(AuthSession session) {
  if (session.isDemo) {
    return 'demo';
  }
  if (!session.isAuthenticated) {
    return 'signed_out';
  }

  final email = session.email?.trim().toLowerCase();
  if (email != null && email.isNotEmpty) {
    return 'user:$email';
  }
  final token = session.bearerToken;
  if (token != null && token.isNotEmpty) {
    return 'token:${token.hashCode}';
  }
  return 'authenticated';
}

final offlineStorageScopeProvider = Provider<String>((ref) {
  final session = ref.watch(authSessionProvider);
  return _offlineStorageScope(session);
});

class OfflineSyncStateNotifier extends StateNotifier<OfflineSyncState> {
  OfflineSyncStateNotifier({required String scope})
    : super(OfflineSyncState(scope: scope));

  void markFresh(String cacheKey) {
    final nextKeys = {...state.staleKeys}..remove(cacheKey);
    state = state.copyWith(staleKeys: nextKeys);
  }

  void markStale(String cacheKey) {
    final nextKeys = {...state.staleKeys, cacheKey};
    state = state.copyWith(staleKeys: nextKeys);
  }

  void rewriteIds(Map<String, String> idMappings) {
    if (idMappings.isEmpty || state.staleKeys.isEmpty) {
      return;
    }

    state = state.copyWith(
      staleKeys: state.staleKeys
          .map((entry) => rewriteOfflineIdsInString(entry, idMappings))
          .toSet(),
    );
  }

  void replaceQueue(List<QueuedOfflineAction> queue) {
    var pending = 0;
    var retrying = 0;
    var blockedDependency = 0;
    var pausedAuth = 0;
    var failed = 0;
    for (final action in queue) {
      switch (action.status) {
        case OfflineQueueStatus.pending:
          pending++;
          break;
        case OfflineQueueStatus.retrying:
          retrying++;
          break;
        case OfflineQueueStatus.blockedDependency:
          blockedDependency++;
          break;
        case OfflineQueueStatus.pausedAuth:
          pausedAuth++;
          break;
        case OfflineQueueStatus.failed:
          failed++;
          break;
        case OfflineQueueStatus.cancelled:
          break;
      }
    }

    state = state.copyWith(
      pendingCount: pending,
      retryingCount: retrying,
      blockedDependencyCount: blockedDependency,
      pausedAuthCount: pausedAuth,
      failedCount: failed,
    );
  }

  void setReplaying(bool value) {
    state = state.copyWith(
      isReplaying: value,
      lastReplayAt: value ? null : DateTime.now(),
      clearLastReplayAt: value,
    );
  }

  void setReplayError(String? value) {
    state = state.copyWith(
      lastReplayError: value,
      clearLastReplayError: value == null,
    );
  }
}

final offlineSyncStateProvider =
    StateNotifierProvider<OfflineSyncStateNotifier, OfflineSyncState>((ref) {
      final scope = ref.watch(offlineStorageScopeProvider);
      return OfflineSyncStateNotifier(scope: scope);
    });

final offlineCacheStoreProvider = Provider<OfflineCacheStore>((ref) {
  return OfflineCacheStore(ref.read(sharedPrefsProvider));
});

final offlineQueueStoreProvider = Provider<OfflineQueueStore>((ref) {
  return OfflineQueueStore(ref.read(sharedPrefsProvider));
});

final offlineIdMappingStoreProvider = Provider<OfflineIdMappingStore>((ref) {
  return OfflineIdMappingStore(ref.read(sharedPrefsProvider));
});

final offlineQueueRevisionProvider = StateProvider<int>((ref) => 0);

final offlineQueueEntriesProvider = FutureProvider<List<QueuedOfflineAction>>((
  ref,
) async {
  ref.watch(offlineQueueRevisionProvider);
  final scope = ref.watch(offlineStorageScopeProvider);
  final items = await ref.read(offlineQueueStoreProvider).load(scope);
  ref.read(offlineSyncStateProvider.notifier).replaceQueue(items);
  return items;
});

final offlineIdMappingsProvider = FutureProvider<Map<String, String>>((
  ref,
) async {
  ref.watch(offlineQueueRevisionProvider);
  final scope = ref.watch(offlineStorageScopeProvider);
  return ref.read(offlineIdMappingStoreProvider).load(scope);
});

String offlineEntityKey(String entityType, String entityId) {
  return '$entityType:$entityId';
}

int _offlineEntitySyncRank(OfflineEntitySyncStatus status) {
  return switch (status) {
    OfflineEntitySyncStatus.failed => 5,
    OfflineEntitySyncStatus.pausedAuth => 4,
    OfflineEntitySyncStatus.retrying => 3,
    OfflineEntitySyncStatus.blockedDependency => 2,
    OfflineEntitySyncStatus.pending => 1,
  };
}

OfflineEntitySyncStatus _offlineEntityStatusFromQueueStatus(
  OfflineQueueStatus status,
) {
  return switch (status) {
    OfflineQueueStatus.failed => OfflineEntitySyncStatus.failed,
    OfflineQueueStatus.pausedAuth => OfflineEntitySyncStatus.pausedAuth,
    OfflineQueueStatus.retrying => OfflineEntitySyncStatus.retrying,
    OfflineQueueStatus.blockedDependency =>
      OfflineEntitySyncStatus.blockedDependency,
    _ => OfflineEntitySyncStatus.pending,
  };
}

final offlineEntitySyncMapProvider =
    Provider<Map<String, OfflineEntitySyncInfo>>((ref) {
      final queue = ref.watch(offlineQueueEntriesProvider).value ?? const [];
      final entries = <String, OfflineEntitySyncInfo>{};

      for (final action in queue) {
        final entityType = action.entityType;
        final entityId = action.entityId;
        if (entityType == null ||
            entityType.isEmpty ||
            entityId == null ||
            entityId.isEmpty) {
          continue;
        }

        final key = offlineEntityKey(entityType, entityId);
        final nextStatus = _offlineEntityStatusFromQueueStatus(action.status);
        final previous = entries[key];
        if (previous == null ||
            _offlineEntitySyncRank(nextStatus) >=
                _offlineEntitySyncRank(previous.status)) {
          entries[key] = OfflineEntitySyncInfo(
            entityType: entityType,
            entityId: entityId,
            status: nextStatus,
            actionCount: (previous?.actionCount ?? 0) + 1,
            lastError: action.lastError ?? previous?.lastError,
          );
        } else {
          entries[key] = OfflineEntitySyncInfo(
            entityType: previous.entityType,
            entityId: previous.entityId,
            status: previous.status,
            actionCount: previous.actionCount + 1,
            lastError: previous.lastError ?? action.lastError,
          );
        }
      }

      return entries;
    });

final offlineEntitySyncProvider =
    Provider.family<OfflineEntitySyncInfo?, String>((ref, entityKey) {
      return ref.watch(offlineEntitySyncMapProvider)[entityKey];
    });

final apiServiceProvider = Provider<ApiService>((ref) {
  final baseUrl = ref.watch(apiBaseUrlProvider);
  final authSession = ref.watch(authSessionProvider);
  final clerkAuthService = ref.watch(clerkAuthServiceProvider);
  final syncState = ref.read(offlineSyncStateProvider.notifier);
  return ApiService(
    baseUrl: baseUrl,
    authToken: authSession.bearerToken,
    authTokenProvider: authSession.isAuthenticated
        ? () async => clerkAuthService?.getFreshToken()
        : null,
    allowDemoData: authSession.isDemo,
    diagnostics: ref.watch(appDiagnosticsProvider),
    onUnauthorized: () {
      ref.read(authSessionProvider.notifier).handleUnauthorized();
    },
    cacheStore: ref.read(offlineCacheStoreProvider),
    queueStore: ref.read(offlineQueueStoreProvider),
    idMappingStore: ref.read(offlineIdMappingStoreProvider),
    offlineScope: ref.watch(offlineStorageScopeProvider),
    onCacheKeyFresh: (cacheKey) async => syncState.markFresh(cacheKey),
    onCacheKeyStale: (cacheKey) async => syncState.markStale(cacheKey),
    onQueueUpdated: (queue) async {
      syncState.replaceQueue(queue);
      ref.read(offlineQueueRevisionProvider.notifier).state++;
    },
  );
});

final Provider<FeedbackLocalStore> feedbackLocalStoreProvider =
    Provider<FeedbackLocalStore>((ref) {
      return FeedbackLocalStore(ref.read(sharedPrefsProvider));
    });

final Provider<FeedbackService> feedbackServiceProvider =
    Provider<FeedbackService>((ref) {
      return FeedbackService(
        api: () => ref.read(apiServiceProvider),
        localStore: () => ref.read(feedbackLocalStoreProvider),
        authSession: () => ref.read(authSessionProvider),
        language: () => ref.read(currentUserSettingsProvider).value?.language,
        invalidateRecentSubmissions: () {
          ref.invalidate(feedbackRecentSubmissionsProvider);
        },
        invalidateDefaultAdminEntries: () {
          ref.invalidate(
            feedbackAdminEntriesProvider(const FeedbackAdminQuery()),
          );
        },
      );
    });

final isFeedbackAdminProvider = FutureProvider<bool>((ref) async {
  final session = ref.watch(authSessionProvider);
  final accessState = ref.watch(appAccessStateProvider).value;
  if (!session.isAuthenticated || session.isDemo) {
    return false;
  }
  if (accessState?.canUseWorkspaceData != true) {
    return false;
  }
  return ref.read(feedbackServiceProvider).fetchAdminCapability();
});

final Provider<String> feedbackDraftProvider = Provider<String>((ref) {
  return ref.read(feedbackServiceProvider).loadDraftMessage();
});

final FutureProvider<List<LocalFeedbackSubmission>>
feedbackRecentSubmissionsProvider =
    FutureProvider<List<LocalFeedbackSubmission>>((ref) async {
      return ref.read(feedbackServiceProvider).loadRecentSubmissions();
    });

final FutureProviderFamily<List<FeedbackEntry>, FeedbackAdminQuery>
feedbackAdminEntriesProvider =
    FutureProvider.family<List<FeedbackEntry>, FeedbackAdminQuery>((
      ref,
      query,
    ) async {
      return ref.read(feedbackServiceProvider).listAdmin(query: query);
    });

final clerkPublishableKeyProvider = Provider<String>(
  (ref) => AppConfig.clerkPublishableKey,
);

final clerkAuthServiceProvider = Provider<ClerkAuthService?>((ref) {
  final publishableKey = ref.watch(clerkPublishableKeyProvider);
  if (publishableKey.isEmpty) {
    return null;
  }

  final service = ClerkAuthService(
    publishableKey: publishableKey,
    sharedPreferences: ref.read(sharedPrefsProvider),
  );
  ref.onDispose(service.terminate);
  return service;
});

final authSessionProvider =
    StateNotifierProvider<AuthSessionNotifier, AuthSession>(
      (ref) => AuthSessionNotifier(ref),
    );

final appAccessStateProvider =
    AsyncNotifierProvider<AppAccessNotifier, AppAccessState>(
      AppAccessNotifier.new,
    );

enum AppAccessRefreshMode { interactive, silentResume }

bool shouldEmitIntermediateAppAccessStages(AppAccessRefreshMode mode) {
  return mode == AppAccessRefreshMode.interactive;
}

class AuthSessionNotifier extends StateNotifier<AuthSession> {
  AuthSessionNotifier(this.ref)
    : super(const AuthSession(status: AuthStatus.loading)) {
    unawaited(_restoreSession());
  }

  final Ref ref;

  Future<void> _restoreSession() async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    diagnostics.info(
      scope: 'auth.restore',
      message: 'Restoring stored session.',
    );
    final prefs = ref.read(sharedPrefsProvider);
    if (prefs.getBool(_demoModeKey) == true) {
      state = AuthSession(
        status: AuthStatus.demo,
        onboardingComplete: prefs.getBool(_demoOnboardingKey) ?? false,
      );
      diagnostics.info(
        scope: 'auth.restore',
        message: 'Restored demo session.',
        context: {'onboardingComplete': state.onboardingComplete},
      );
      ref.invalidate(appBootstrapProvider);
      return;
    }

    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      _clearLegacyAuthPrefs();
      state = const AuthSession(status: AuthStatus.signedOut);
      diagnostics.warning(
        scope: 'auth.restore',
        message: 'Clerk is not configured. Starting signed out.',
      );
      return;
    }

    try {
      final restored = await service.restoreSession();
      if (restored == null) {
        _clearLegacyAuthPrefs();
        state = const AuthSession(status: AuthStatus.signedOut);
        diagnostics.info(
          scope: 'auth.restore',
          message: 'No active Clerk session found.',
        );
        return;
      }

      _clearLegacyAuthPrefs();
      state = AuthSession(
        status: AuthStatus.authenticated,
        bearerToken: restored.bearerToken,
        email: restored.email,
      );
      diagnostics.info(
        scope: 'auth.restore',
        message: 'Restored authenticated Clerk session.',
        context: {'email': restored.email ?? 'none'},
      );
      _invalidateAuthenticatedState();
    } catch (error, stackTrace) {
      _clearLegacyAuthPrefs();
      state = const AuthSession(status: AuthStatus.signedOut);
      diagnostics.error(
        scope: 'auth.restore',
        message: 'Failed to restore Clerk session.',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  void signInDemo() {
    final prefs = ref.read(sharedPrefsProvider);
    prefs.setBool(_demoModeKey, true);
    prefs.setBool(_demoOnboardingKey, false);
    _clearLegacyAuthPrefs();
    state = const AuthSession(
      status: AuthStatus.demo,
      onboardingComplete: false,
    );
    ref
        .read(appDiagnosticsProvider)
        .info(scope: 'auth.session', message: 'Signed in to demo workspace.');
    _invalidateAuthenticatedState();
  }

  void setAuthenticatedSession(String token, {String? email}) {
    final prefs = ref.read(sharedPrefsProvider);
    prefs.remove(_demoModeKey);
    prefs.remove(_demoOnboardingKey);
    _clearLegacyAuthPrefs();

    state = AuthSession(
      status: AuthStatus.authenticated,
      bearerToken: token,
      email: email,
    );
    ref
        .read(appDiagnosticsProvider)
        .info(
          scope: 'auth.session',
          message: 'Authenticated session established.',
          context: {'email': email ?? 'none'},
        );
    _invalidateAuthenticatedState();
  }

  void markOnboardingComplete() {
    if (!state.isDemo) {
      return;
    }

    final prefs = ref.read(sharedPrefsProvider);
    prefs.setBool(_demoOnboardingKey, true);
    state = state.copyWith(onboardingComplete: true);
    ref.invalidate(appBootstrapProvider);
  }

  Future<void> signInWithPassword({
    required String email,
    required String password,
  }) async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      diagnostics.warning(
        scope: 'auth.sign_in',
        message: 'Sign-in requested without Clerk configuration.',
        context: {'email': email},
      );
      throw StateError('Clerk is not configured. Set CLERK_PUBLISHABLE_KEY.');
    }

    diagnostics.info(
      scope: 'auth.sign_in',
      message: 'Attempting password sign-in.',
      context: {'email': email},
    );

    try {
      final result = await service.signInWithPassword(
        email: email,
        password: password,
      );
      setAuthenticatedSession(result.bearerToken, email: result.email ?? email);
    } catch (error, stackTrace) {
      diagnostics.error(
        scope: 'auth.sign_in',
        message: 'Password sign-in failed.',
        error: error,
        stackTrace: stackTrace,
        context: {'email': email},
      );
      rethrow;
    }
  }

  Future<void> signUpWithPassword({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
  }) async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      diagnostics.warning(
        scope: 'auth.sign_up',
        message: 'Sign-up requested without Clerk configuration.',
        context: {'email': email},
      );
      throw StateError('Clerk is not configured. Set CLERK_PUBLISHABLE_KEY.');
    }

    diagnostics.info(
      scope: 'auth.sign_up',
      message: 'Attempting password sign-up.',
      context: {'email': email, 'firstName': firstName, 'lastName': lastName},
    );

    try {
      final result = await service.signUpWithPassword(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
      );
      setAuthenticatedSession(result.bearerToken, email: result.email ?? email);
    } catch (error, stackTrace) {
      diagnostics.error(
        scope: 'auth.sign_up',
        message: 'Password sign-up failed.',
        error: error,
        stackTrace: stackTrace,
        context: {'email': email, 'firstName': firstName, 'lastName': lastName},
      );
      rethrow;
    }
  }

  Future<void> syncFromClerkSession() async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final service = ref.read(clerkAuthServiceProvider);
    if (service == null) {
      diagnostics.warning(
        scope: 'auth.sync',
        message: 'Session sync requested without Clerk configuration.',
      );
      throw StateError('Clerk is not configured. Set CLERK_PUBLISHABLE_KEY.');
    }

    diagnostics.info(
      scope: 'auth.sync',
      message: 'Syncing from Clerk session.',
    );

    try {
      final restored = await service.restoreSession();
      if (restored == null) {
        throw StateError('Clerk did not return an active session.');
      }

      setAuthenticatedSession(restored.bearerToken, email: restored.email);
    } catch (error, stackTrace) {
      diagnostics.error(
        scope: 'auth.sync',
        message: 'Failed to sync from Clerk session.',
        error: error,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  Future<void> clearLocalSession() async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final service = ref.read(clerkAuthServiceProvider);
    try {
      await service?.signOut();
    } catch (error, stackTrace) {
      diagnostics.warning(
        scope: 'auth.clear_session',
        message: 'Remote sign-out failed while clearing local session.',
        error: error,
        stackTrace: stackTrace,
      );
    }

    final prefs = ref.read(sharedPrefsProvider);
    await prefs.remove(_demoModeKey);
    await prefs.remove(_demoOnboardingKey);

    for (final key in prefs.getKeys()) {
      final normalized = key.toLowerCase();
      if (normalized.contains('clerk') ||
          normalized.contains('session') ||
          normalized.contains('jwt')) {
        await prefs.remove(key);
      }
    }

    _clearLegacyAuthPrefs();
    state = const AuthSession(status: AuthStatus.signedOut);
    diagnostics.info(
      scope: 'auth.clear_session',
      message: 'Local auth session cleared.',
    );
    _invalidateAuthenticatedState();
  }

  void signOut() {
    ref
        .read(appDiagnosticsProvider)
        .info(scope: 'auth.sign_out', message: 'Sign-out requested.');
    unawaited(_signOut(remote: true));
  }

  void handleUnauthorized() {
    if (!state.isAuthenticated) {
      return;
    }
    ref
        .read(appDiagnosticsProvider)
        .warning(
          scope: 'auth.unauthorized',
          message: 'Backend returned unauthorized for active session.',
        );
    unawaited(_signOut(remote: false));
  }

  Future<void> _signOut({required bool remote}) async {
    if (remote) {
      final service = ref.read(clerkAuthServiceProvider);
      try {
        await service?.signOut();
      } catch (error, stackTrace) {
        ref
            .read(appDiagnosticsProvider)
            .warning(
              scope: 'auth.sign_out',
              message: 'Remote sign-out failed. Clearing local session anyway.',
              error: error,
              stackTrace: stackTrace,
            );
      }
    }

    final prefs = ref.read(sharedPrefsProvider);
    await prefs.remove(_demoModeKey);
    await prefs.remove(_demoOnboardingKey);
    _clearLegacyAuthPrefs();

    state = const AuthSession(status: AuthStatus.signedOut);
    ref
        .read(appDiagnosticsProvider)
        .info(
          scope: 'auth.sign_out',
          message: 'Session signed out locally.',
          context: {'remote': remote},
        );
    _invalidateAuthenticatedState();
  }

  void _invalidateAuthenticatedState() {
    ref.invalidate(appBootstrapProvider);
    ref.invalidate(projectsProvider);
    ref.invalidate(currentUserSettingsProvider);
    ref.invalidate(creatorProfileProvider);
    ref.invalidate(publishAccountsProvider);
    ref.invalidate(pendingContentProvider);
    ref.invalidate(contentHistoryProvider);
    ref.invalidate(personasProvider);
    ref.invalidate(dripPlansProvider);
    ref.invalidate(isFeedbackAdminProvider);
    ref.invalidate(feedbackRecentSubmissionsProvider);
    ref.invalidate(feedbackAdminEntriesProvider(const FeedbackAdminQuery()));
    ref.invalidate(offlineQueueEntriesProvider);
    ref.invalidate(offlineIdMappingsProvider);
    ref.invalidate(offlineQueueControllerProvider);
  }

  void _clearLegacyAuthPrefs() {
    final prefs = ref.read(sharedPrefsProvider);
    prefs.remove('auth_mode');
    prefs.remove('auth_bearer_token');
    prefs.remove('auth_email');
    prefs.remove('is_logged_in');
    prefs.remove('onboarding_complete');
  }
}

class AppAccessNotifier extends AsyncNotifier<AppAccessState> {
  @override
  Future<AppAccessState> build() async {
    ref.watch(apiBaseUrlProvider);
    final authSession = ref.watch(authSessionProvider);
    return _resolve(authSession);
  }

  Future<void> refresh({
    AppAccessRefreshMode mode = AppAccessRefreshMode.interactive,
  }) async {
    final authSession = ref.read(authSessionProvider);
    state = await AsyncValue.guard(() => _resolve(authSession, mode: mode));
  }

  Future<AppAccessState> _resolve(
    AuthSession authSession, {
    AppAccessRefreshMode mode = AppAccessRefreshMode.interactive,
  }) async {
    final diagnostics = ref.read(appDiagnosticsProvider);
    final emitIntermediateStages = shouldEmitIntermediateAppAccessStages(mode);
    diagnostics.info(
      scope: 'app_access.resolve',
      message: 'Resolving app access.',
      context: {'mode': mode.name},
    );
    if (authSession.isLoading) {
      return const AppAccessState(stage: AppAccessStage.restoringSession);
    }

    if (authSession.status == AuthStatus.signedOut) {
      diagnostics.info(
        scope: 'app_access.resolve',
        message: 'Access resolution ended in signed-out state.',
      );
      return const AppAccessState(stage: AppAccessStage.signedOut);
    }

    if (authSession.isDemo || authSession.bearerToken == null) {
      diagnostics.info(
        scope: 'app_access.resolve',
        message: 'Access resolution entered demo mode.',
      );
      return AppAccessState(
        stage: AppAccessStage.demo,
        bootstrap: AppBootstrap.demo(
          onboardingComplete: authSession.onboardingComplete,
        ),
        checkedAt: DateTime.now(),
      );
    }

    final api = ref.read(apiServiceProvider);
    diagnostics.info(
      scope: 'app_access.resolve',
      message: 'Checking backend availability.',
    );
    if (emitIntermediateStages) {
      state = AsyncData(
        AppAccessState(
          stage: AppAccessStage.checkingBackend,
          checkedAt: DateTime.now(),
        ),
      );
    }

    final health = await api.healthCheck();
    final checkedAt = DateTime.now();
    final backendReachable =
        health['status'] == 'ok' || health['status'] == 'healthy';

    if (!backendReachable) {
      final cachedBootstrap = await api.loadCachedBootstrap();
      diagnostics.warning(
        scope: 'app_access.resolve',
        message: 'Backend health check reported unavailable status.',
        context: {
          'backendStatus': health['status'],
          'cachedBootstrap': cachedBootstrap != null,
        },
      );
      return AppAccessState(
        stage: AppAccessStage.apiUnavailable,
        backendHealth: health,
        bootstrap: cachedBootstrap,
        message: cachedBootstrap == null
            ? 'FastAPI health check did not return a healthy status.'
            : 'FastAPI is unavailable. Using the last cached workspace bootstrap.',
        checkedAt: checkedAt,
      );
    }

    if (emitIntermediateStages) {
      state = AsyncData(
        AppAccessState(
          stage: AppAccessStage.checkingWorkspace,
          backendHealth: health,
          checkedAt: checkedAt,
        ),
      );
    }

    try {
      diagnostics.info(
        scope: 'app_access.resolve',
        message: 'Loading workspace bootstrap.',
      );
      final bootstrap = await api.fetchBootstrap();
      diagnostics.info(
        scope: 'app_access.resolve',
        message: bootstrap.shouldOnboard
            ? 'Workspace requires onboarding.'
            : 'Workspace bootstrap completed.',
      );
      return AppAccessState(
        stage: bootstrap.shouldOnboard
            ? AppAccessStage.needsOnboarding
            : AppAccessStage.ready,
        backendHealth: health,
        bootstrap: bootstrap,
        checkedAt: DateTime.now(),
      );
    } on ApiException catch (error) {
      final cachedBootstrap = error.isUnauthorized
          ? null
          : await api.loadCachedBootstrap();
      diagnostics.warning(
        scope: 'app_access.resolve',
        message: error.isUnauthorized
            ? 'Workspace bootstrap was rejected by the backend.'
            : 'Workspace bootstrap failed.',
        error: error,
        context: {
          'statusCode': error.statusCode,
          'path': error.path,
          'method': error.method,
        },
      );
      return AppAccessState(
        stage: error.isUnauthorized
            ? AppAccessStage.bootstrapUnauthorized
            : AppAccessStage.bootstrapFailed,
        backendHealth: health,
        bootstrap: cachedBootstrap,
        statusCode: error.statusCode,
        message: error.message,
        checkedAt: DateTime.now(),
      );
    } catch (error, stackTrace) {
      diagnostics.error(
        scope: 'app_access.resolve',
        message: 'Workspace bootstrap failed unexpectedly.',
        error: error,
        stackTrace: stackTrace,
      );
      return AppAccessState(
        stage: AppAccessStage.bootstrapFailed,
        backendHealth: health,
        message: error.toString(),
        checkedAt: DateTime.now(),
      );
    }
  }
}

final appBootstrapProvider = Provider<AppBootstrap?>((ref) {
  return ref.watch(appAccessStateProvider).value?.bootstrap;
});

final offlineQueueControllerProvider =
    AsyncNotifierProvider<OfflineQueueController, void>(
      OfflineQueueController.new,
    );

class OfflineQueueController extends AsyncNotifier<void> {
  @override
  Future<void> build() async {
    final scope = ref.watch(offlineStorageScopeProvider);
    final queue = await ref.read(offlineQueueStoreProvider).load(scope);
    ref.read(offlineSyncStateProvider.notifier).replaceQueue(queue);
  }

  Future<void> refresh() async {
    final scope = ref.read(offlineStorageScopeProvider);
    final queue = await ref.read(offlineQueueStoreProvider).load(scope);
    ref.read(offlineSyncStateProvider.notifier).replaceQueue(queue);
    ref.read(offlineQueueRevisionProvider.notifier).state++;
  }

  Future<void> cancel(String id) async {
    final scope = ref.read(offlineStorageScopeProvider);
    final store = ref.read(offlineQueueStoreProvider);
    final queue = await store.load(scope);
    final next = queue.where((entry) => entry.id != id).toList();
    await store.save(scope, next);
    ref.read(offlineSyncStateProvider.notifier).replaceQueue(next);
    ref.read(offlineQueueRevisionProvider.notifier).state++;
  }

  Future<void> retryOne(String id) async {
    await _replay(onlyId: id);
  }

  Future<void> retryAll() async {
    await _replay();
  }

  String? _extractCreatedId(Object? data) {
    if (data is Map) {
      final id =
          data['id'] ??
          data['content_record_id'] ??
          data['plan_id'] ??
          data['record_id'];
      if (id != null) {
        return id.toString();
      }
    }
    return null;
  }

  List<String> _unresolvedDependencies(
    QueuedOfflineAction action,
    Map<String, String> idMappings,
  ) {
    return action.dependsOnTempIds
        .where((tempId) => !idMappings.containsKey(tempId))
        .toList();
  }

  Future<List<QueuedOfflineAction>> _reconcileTempId({
    required String scope,
    required List<QueuedOfflineAction> queue,
    required String tempId,
    required String realId,
  }) async {
    if (tempId == realId) {
      return queue;
    }

    final idMappings = {tempId: realId};
    await ref
        .read(offlineIdMappingStoreProvider)
        .register(scope, tempId, realId);
    await ref.read(offlineCacheStoreProvider).rewriteIds(scope, idMappings);
    ref.read(offlineSyncStateProvider.notifier).rewriteIds(idMappings);
    return queue.map((entry) => entry.rewriteIds(idMappings)).toList();
  }

  Future<void> _replay({String? onlyId}) async {
    final authSession = ref.read(authSessionProvider);
    if (authSession.isLoading) {
      return;
    }

    final scope = ref.read(offlineStorageScopeProvider);
    final store = ref.read(offlineQueueStoreProvider);
    final api = ref.read(apiServiceProvider);
    var queue = await store.load(scope);
    var idMappings = await ref.read(offlineIdMappingStoreProvider).load(scope);
    if (queue.isEmpty) {
      return;
    }

    final sync = ref.read(offlineSyncStateProvider.notifier);
    sync.setReplaying(true);
    sync.setReplayError(null);
    var shouldRefreshWorkspaceData = false;

    try {
      for (var index = 0; index < queue.length; index++) {
        final action = queue[index];
        if (onlyId != null && action.id != onlyId) {
          continue;
        }
        if (action.status == OfflineQueueStatus.cancelled) {
          continue;
        }

        final unresolvedDependencies = _unresolvedDependencies(
          action,
          idMappings,
        );
        if (unresolvedDependencies.isNotEmpty) {
          queue[index] = action.copyWith(
            status: OfflineQueueStatus.blockedDependency,
            lastError: 'Waiting for queued dependency sync.',
            updatedAt: DateTime.now(),
          );
          await store.save(scope, queue);
          sync.replaceQueue(queue);
          ref.read(offlineQueueRevisionProvider.notifier).state++;
          continue;
        }

        final retrying = action.copyWith(
          status: OfflineQueueStatus.retrying,
          attemptCount: action.attemptCount + 1,
          updatedAt: DateTime.now(),
          clearLastError: true,
        );
        queue[index] = retrying;
        await store.save(scope, queue);
        sync.replaceQueue(queue);
        ref.read(offlineQueueRevisionProvider.notifier).state++;

        try {
          final responseData = await api.replayQueuedAction(retrying);
          queue.removeAt(index);
          index--;
          final tempId = retrying.meta['tempId']?.toString();
          final realId = _extractCreatedId(responseData);
          if (tempId != null &&
              tempId.isNotEmpty &&
              realId != null &&
              realId.isNotEmpty &&
              tempId != realId) {
            idMappings = {...idMappings, tempId: realId};
            queue = await _reconcileTempId(
              scope: scope,
              queue: queue,
              tempId: tempId,
              realId: realId,
            );
          }
          await store.save(scope, queue);
          sync.replaceQueue(queue);
          shouldRefreshWorkspaceData = true;
          ref.read(offlineQueueRevisionProvider.notifier).state++;
        } on ApiException catch (error) {
          final nextStatus = switch (error.statusCode) {
            401 || 403 => OfflineQueueStatus.pausedAuth,
            final code when code != null && code >= 400 && code < 500 =>
              OfflineQueueStatus.failed,
            _ => OfflineQueueStatus.pending,
          };
          queue[index] = retrying.copyWith(
            status: nextStatus,
            lastError: error.message,
            updatedAt: DateTime.now(),
          );
          await store.save(scope, queue);
          sync.replaceQueue(queue);
          sync.setReplayError(error.message);
          ref.read(offlineQueueRevisionProvider.notifier).state++;

          if (nextStatus == OfflineQueueStatus.pausedAuth ||
              nextStatus == OfflineQueueStatus.pending) {
            break;
          }
        }
      }
    } finally {
      sync.setReplaying(false);
      ref.read(offlineQueueRevisionProvider.notifier).state++;
      if (shouldRefreshWorkspaceData) {
        ref.invalidate(appBootstrapProvider);
        ref.invalidate(projectsProvider);
        ref.invalidate(projectsStateProvider);
        ref.invalidate(currentUserSettingsProvider);
        ref.invalidate(personasProvider);
        ref.invalidate(affiliationsProvider);
        ref.invalidate(pendingContentProvider);
        ref.invalidate(dripPlansProvider);
        ref.invalidate(offlineIdMappingsProvider);
      }
      unawaited(ref.read(appAccessStateProvider.notifier).refresh());
    }
  }
}

class ProjectsState {
  const ProjectsState({
    this.items = const <Project>[],
    this.message,
    this.isDegraded = false,
  });

  final List<Project> items;
  final String? message;
  final bool isDegraded;
}

final projectsStateProvider = FutureProvider<ProjectsState>((ref) async {
  final accessState = ref.watch(appAccessStateProvider).value;
  if (accessState?.canUseWorkspaceData != true) {
    return const ProjectsState();
  }

  final api = ref.read(apiServiceProvider);
  try {
    final projects = await api.fetchProjects();
    return ProjectsState(items: projects);
  } catch (error, stackTrace) {
    if (!_isNonCriticalReadFailure(error)) {
      rethrow;
    }
    _logDegradedRead(
      ref,
      scope: 'projects.read.degraded',
      message:
          'Projects fetch failed; project UI will stay available in degraded mode.',
      error: error,
      stackTrace: stackTrace,
    );
    return ProjectsState(message: error.toString(), isDegraded: true);
  }
});

final projectsProvider = FutureProvider<List<Project>>((ref) async {
  final state = await ref.watch(projectsStateProvider.future);
  return state.items;
});

final availableProjectsProvider = Provider<List<Project>>((ref) {
  final projects = ref.watch(projectsProvider).value ?? const <Project>[];
  return projects.where((project) => !project.isDeleted).toList();
});

final activeProjectProvider = Provider<Project?>((ref) {
  final availableProjects = ref.watch(availableProjectsProvider);
  final selectableProjects = availableProjects
      .where((project) => !project.isArchived)
      .toList();
  if (selectableProjects.isEmpty) {
    return null;
  }

  final userSettings = ref.watch(currentUserSettingsProvider).value;
  final bootstrap = ref.watch(appBootstrapProvider);
  if (userSettings == null &&
      bootstrap != null &&
      bootstrap.user.workspaceExists &&
      (bootstrap.defaultProjectId == null ||
          bootstrap.defaultProjectId!.trim().isEmpty)) {
    return null;
  }
  final selectionMode = normalizeProjectSelectionMode(
    userSettings?.projectSelectionMode,
  );

  Project? byId(String? id) {
    if (id == null || id.trim().isEmpty) {
      return null;
    }
    for (final project in selectableProjects) {
      if (project.id == id) {
        return project;
      }
    }
    return null;
  }

  if (selectionMode == projectSelectionModeNone) {
    return null;
  }

  if (selectionMode == projectSelectionModeSelected) {
    return byId(userSettings?.defaultProjectId);
  }

  return byId(userSettings?.defaultProjectId) ??
      byId(bootstrap?.defaultProjectId) ??
      selectableProjects.cast<Project?>().firstWhere(
        (project) => project?.isDefault == true,
        orElse: () => selectableProjects.first,
      );
});

final activeProjectIdProvider = Provider<String?>((ref) {
  return ref.watch(activeProjectProvider.select((project) => project?.id));
});

class PublishAccountsState {
  const PublishAccountsState({
    this.accounts = const <PublishAccount>[],
    this.availability = PublishAccountsAvailability.available,
    this.message,
  });

  final List<PublishAccount> accounts;
  final PublishAccountsAvailability availability;
  final String? message;

  bool get isAvailable => availability == PublishAccountsAvailability.available;
  bool get isUnavailable =>
      availability == PublishAccountsAvailability.unavailable;
  bool get hasError => availability == PublishAccountsAvailability.error;
}

enum PublishAccountsAvailability { available, unavailable, error }

class GithubIntegrationState {
  const GithubIntegrationState({
    this.connected = false,
    this.username,
    this.scope,
    this.message,
  });

  final bool connected;
  final String? username;
  final String? scope;
  final String? message;
}

final githubIntegrationStatusProvider = FutureProvider<GithubIntegrationState>((
  ref,
) async {
  final accessState = ref.watch(appAccessStateProvider).value;
  if (accessState?.canUseWorkspaceData != true) {
    return const GithubIntegrationState();
  }

  try {
    final status = await ref
        .watch(apiServiceProvider)
        .fetchGithubIntegrationStatus();
    return GithubIntegrationState(
      connected: status['connected'] as bool? ?? false,
      username: status['github_username']?.toString(),
      scope: (status['scope'] is List)
          ? (status['scope'] as List).join(', ')
          : status['scope']?.toString(),
      message: status['message']?.toString(),
    );
  } on ApiException catch (error) {
    return GithubIntegrationState(message: error.message.trim());
  }
});

final openRouterCredentialStatusProvider =
    FutureProvider<OpenRouterCredentialStatus>((ref) async {
      final accessState = ref.watch(appAccessStateProvider).value;
      if (accessState?.canUseWorkspaceData != true) {
        return const OpenRouterCredentialStatus(
          provider: 'openrouter',
          configured: false,
          validationStatus: 'unknown',
        );
      }

      try {
        return await ref
            .watch(apiServiceProvider)
            .fetchOpenRouterCredentialStatus();
      } on ApiException {
        return const OpenRouterCredentialStatus(
          provider: 'openrouter',
          configured: false,
          validationStatus: 'unknown',
        );
      }
    });

final aiRuntimeSettingsProvider = FutureProvider<AIRuntimeSettings>((
  ref,
) async {
  final accessState = ref.watch(appAccessStateProvider).value;
  if (accessState?.canUseWorkspaceData != true) {
    return AIRuntimeSettings.fallback();
  }

  try {
    return await ref.watch(apiServiceProvider).fetchAiRuntimeSettings();
  } on ApiException {
    return AIRuntimeSettings.fallback();
  }
});

final publishAccountsStateProvider = FutureProvider<PublishAccountsState>((
  ref,
) async {
  final accessState = ref.watch(appAccessStateProvider).value;
  if (accessState?.canUseWorkspaceData != true) {
    return const PublishAccountsState();
  }
  final api = ref.watch(apiServiceProvider);
  try {
    final accounts = await api.fetchPublishAccounts();
    return PublishAccountsState(accounts: accounts);
  } on ApiException catch (error) {
    final message = error.message.trim();
    final normalizedMessage = message.toLowerCase();
    final isMissingPublishConfig =
        error.statusCode == 503 &&
        error.path == '/api/publish/accounts' &&
        (normalizedMessage.contains('not configured') ||
            normalizedMessage.contains('api key'));

    if (isMissingPublishConfig) {
      return PublishAccountsState(
        availability: PublishAccountsAvailability.unavailable,
        message: message.isEmpty
            ? 'Publish account connections are unavailable because the backend publish integration is not configured.'
            : message,
      );
    }

    return PublishAccountsState(
      availability: PublishAccountsAvailability.error,
      message: message.isEmpty
          ? 'Could not fetch connected accounts.'
          : message,
    );
  }
});

final publishAccountsProvider = FutureProvider<List<PublishAccount>>((
  ref,
) async {
  final state = await ref.watch(publishAccountsStateProvider.future);
  return state.accounts;
});

final pendingContentProvider =
    AsyncNotifierProvider<PendingContentNotifier, List<ContentItem>>(
      PendingContentNotifier.new,
    );

class PendingContentNotifier extends AsyncNotifier<List<ContentItem>> {
  @override
  Future<List<ContentItem>> build() async {
    final api = ref.read(apiServiceProvider);
    final activeProjectId = ref.watch(activeProjectIdProvider);
    if (activeProjectId == null) {
      return const <ContentItem>[];
    }
    try {
      return await api.fetchPendingContent(projectId: activeProjectId);
    } catch (error, stackTrace) {
      if (!_isNonCriticalReadFailure(error)) {
        rethrow;
      }
      _logDegradedRead(
        ref,
        scope: 'content.pending.degraded',
        message:
            'Pending content fetch failed; showing an empty review queue until the backend recovers.',
        error: error,
        stackTrace: stackTrace,
      );
      return const <ContentItem>[];
    }
  }

  Future<void> refresh() async {
    final previous = state.value ?? const <ContentItem>[];
    state = const AsyncLoading();
    final activeProjectId = ref.watch(activeProjectIdProvider);
    if (activeProjectId == null) {
      state = const AsyncData(<ContentItem>[]);
      return;
    }
    try {
      final api = ref.read(apiServiceProvider);
      final items = await api.fetchPendingContent(projectId: activeProjectId);
      state = AsyncData(items);
    } catch (error, stackTrace) {
      if (!_isNonCriticalReadFailure(error)) {
        state = AsyncError(error, stackTrace);
        return;
      }
      _logDegradedRead(
        ref,
        scope: 'content.pending.degraded',
        message:
            'Pending content refresh failed; keeping the current review queue.',
        error: error,
        stackTrace: stackTrace,
      );
      state = AsyncData(previous);
    }
  }

  Future<ApproveResult> approve(String id) async {
    final current = state.value ?? [];
    final item = current.where((c) => c.id == id).firstOrNull;
    state = AsyncData(current.where((c) => c.id != id).toList());
    try {
      final api = ref.read(apiServiceProvider);
      await api.approveContent(id);

      if (item == null) {
        ref.invalidate(contentHistoryProvider);
        return const ApproveResult(
          approved: true,
          published: false,
          message: 'Content approved.',
        );
      }

      if (item.channels.isEmpty) {
        ref.invalidate(contentHistoryProvider);
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}" with no publish channels configured.',
          severity: ApproveSeverity.info,
        );
      }

      final publishableChannels = <PublishingChannel>[];
      final unsupportedChannels = <String>[];
      for (final channel in item.channels) {
        if (channelToPlatform(channel) != null) {
          publishableChannels.add(channel);
        } else {
          unsupportedChannels.add(channel.name);
        }
      }

      if (publishableChannels.isEmpty) {
        ref.invalidate(contentHistoryProvider);
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}", but selected channels are not wired to LATE yet: ${unsupportedChannels.join(', ')}.',
          severity: ApproveSeverity.warning,
        );
      }

      final publishAccountsState = await ref.read(
        publishAccountsStateProvider.future,
      );
      final accounts = publishAccountsState.accounts;

      if (publishAccountsState.isUnavailable) {
        ref.invalidate(contentHistoryProvider);
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}", but publish accounts are unavailable: ${publishAccountsState.message ?? 'backend publish integration is not configured'}.',
          severity: ApproveSeverity.warning,
        );
      }

      if (publishAccountsState.hasError) {
        ref.invalidate(contentHistoryProvider);
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}", but connected accounts could not be checked: ${publishAccountsState.message ?? 'unknown error'}.',
          severity: ApproveSeverity.warning,
        );
      }

      final platforms = <Map<String, String>>[];
      final missingAccounts = <String>[];

      for (final channel in publishableChannels) {
        final platform = channelToPlatform(channel);
        if (platform == null) continue;
        final account = _resolvePublishAccount(accounts, platform);
        if (account == null) {
          missingAccounts.add(platform);
          continue;
        }
        platforms.add({'platform': platform, 'account_id': account.id});
      }

      if (platforms.isEmpty) {
        ref.invalidate(contentHistoryProvider);
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}", but no connected LATE accounts matched: ${missingAccounts.join(', ')}.',
          severity: ApproveSeverity.warning,
        );
      }

      final response = await api.publishContent(
        content: item.body,
        platforms: platforms,
        title: item.title,
        tags: item.tags,
        contentRecordId: item.id,
      );

      ref.invalidate(contentHistoryProvider);

      final success = response['success'] == true;
      final publishedPlatforms = platforms
          .map((p) => p['platform'])
          .whereType<String>()
          .toList();
      final warnings = <String>[
        if (missingAccounts.isNotEmpty)
          'missing accounts: ${missingAccounts.join(', ')}',
        if (unsupportedChannels.isNotEmpty)
          'unsupported channels: ${unsupportedChannels.join(', ')}',
      ];

      if (!success) {
        final error = (response['error'] ?? 'Publishing failed').toString();
        return ApproveResult(
          approved: true,
          published: false,
          message:
              'Approved "${item.title}", but publish failed: $error${warnings.isNotEmpty ? ' (${warnings.join(' | ')})' : ''}.',
          severity: ApproveSeverity.warning,
        );
      }

      return ApproveResult(
        approved: true,
        published: true,
        message:
            'Published "${item.title}" to ${publishedPlatforms.join(', ')}${warnings.isNotEmpty ? ' (${warnings.join(' | ')})' : ''}.',
        severity: warnings.isEmpty
            ? ApproveSeverity.success
            : ApproveSeverity.warning,
      );
    } catch (error) {
      state = AsyncData(current);
      return ApproveResult(
        approved: false,
        published: false,
        message: 'Approval failed: $error',
        severity: ApproveSeverity.error,
      );
    }
  }

  Future<void> reject(String id) async {
    final current = state.value ?? [];
    state = AsyncData(current.where((c) => c.id != id).toList());
    try {
      final api = ref.read(apiServiceProvider);
      await api.rejectContent(id);
      ref.invalidate(contentHistoryProvider);
    } catch (_) {
      state = AsyncData(current);
    }
  }

  void updateItem(ContentItem updated) {
    final current = state.value ?? [];
    state = AsyncData(
      current.map((c) => c.id == updated.id ? updated : c).toList(),
    );
  }
}

enum ApproveSeverity { success, info, warning, error }

class ApproveResult {
  final bool approved;
  final bool published;
  final String message;
  final ApproveSeverity severity;

  const ApproveResult({
    required this.approved,
    required this.published,
    required this.message,
    this.severity = ApproveSeverity.success,
  });
}

String? channelToPlatform(PublishingChannel ch) => switch (ch) {
  PublishingChannel.twitter => 'twitter',
  PublishingChannel.linkedin => 'linkedin',
  PublishingChannel.instagram => 'instagram',
  PublishingChannel.tiktok => 'tiktok',
  PublishingChannel.youtube => 'youtube',
  _ => null,
};

PublishAccount? _resolvePublishAccount(
  List<PublishAccount> accounts,
  String platform,
) {
  for (final account in accounts) {
    if (account.platform == platform && account.isActive) {
      return account;
    }
  }
  for (final account in accounts) {
    if (account.platform == platform) {
      return account;
    }
  }
  return null;
}

bool _isNonCriticalReadFailure(Object error) {
  return switch (error) {
    ApiException(type: ApiErrorType.unauthorized) => false,
    ApiException _ => true,
    _ => true,
  };
}

bool _isDripReadFailureThatCanFallback(Object error) {
  return switch (error) {
    ApiException(type: ApiErrorType.offline) => true,
    _ => false,
  };
}

void _logDegradedRead(
  Ref ref, {
  required String scope,
  required String message,
  required Object error,
  StackTrace? stackTrace,
  Map<String, Object?> context = const <String, Object?>{},
}) {
  ref
      .read(appDiagnosticsProvider)
      .warning(
        scope: scope,
        message: message,
        error: error,
        stackTrace: stackTrace,
        context: context,
      );
}

final contentHistoryProvider = FutureProvider<List<ContentItem>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final activeProjectId = ref.watch(activeProjectIdProvider);
  if (activeProjectId == null) {
    return const <ContentItem>[];
  }
  try {
    return await api.fetchContentHistory(projectId: activeProjectId);
  } catch (error, stackTrace) {
    if (!_isNonCriticalReadFailure(error)) {
      rethrow;
    }
    _logDegradedRead(
      ref,
      scope: 'content.history.degraded',
      message:
          'Published content fetch failed; falling back to an empty history view.',
      error: error,
      stackTrace: stackTrace,
    );
    return const <ContentItem>[];
  }
});

final pendingCountProvider = Provider<int>((ref) {
  return ref.watch(pendingContentProvider).value?.length ?? 0;
});

final backendStatusProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final accessState = ref.watch(appAccessStateProvider).value;
  if (accessState?.backendHealth != null) {
    return accessState!.backendHealth!;
  }
  final api = ref.read(apiServiceProvider);
  return api.healthCheck();
});

final currentUserSettingsProvider =
    AsyncNotifierProvider<UserSettingsNotifier, AppSettings?>(
      UserSettingsNotifier.new,
    );

class UserSettingsNotifier extends AsyncNotifier<AppSettings?> {
  @override
  Future<AppSettings?> build() async {
    final authSession = ref.watch(authSessionProvider);
    final accessState = ref.watch(appAccessStateProvider).value;
    if (authSession.isLoading || authSession.status == AuthStatus.signedOut) {
      return null;
    }

    if (authSession.isDemo) {
      return AppSettings(
        id: 'demo-settings',
        userId: 'demo-user',
        theme: 'system',
        language: ref.read(appLanguagePreferenceProvider),
        emailNotifications: true,
      );
    }

    if (accessState?.canUseWorkspaceData != true) {
      return null;
    }

    final api = ref.read(apiServiceProvider);
    AppSettings settings;
    try {
      settings = await api.fetchSettings();
    } catch (error, stackTrace) {
      if (!_isNonCriticalReadFailure(error)) {
        rethrow;
      }
      _logDegradedRead(
        ref,
        scope: 'settings.read.degraded',
        message:
            'Settings fetch failed; leaving settings controls in degraded mode.',
        error: error,
        stackTrace: stackTrace,
      );
      return null;
    }
    final normalizedLanguage = normalizeAppLanguagePreference(
      settings.language,
    );
    final normalizedTheme = normalizeAppThemePreference(settings.theme);
    await ref
        .read(appLanguagePreferenceProvider.notifier)
        .update(normalizedLanguage);
    await ref.read(appThemePreferenceProvider.notifier).update(normalizedTheme);
    return settings.copyWith(
      language: normalizedLanguage,
      theme: normalizedTheme,
    );
  }

  Future<void> toggleNotifications(bool enabled) async {
    final current = state.value;
    if (current == null) {
      return;
    }

    if (ref.read(authSessionProvider).isDemo) {
      state = AsyncData(current.copyWith(emailNotifications: enabled));
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      return api.updateSettings({'emailNotifications': enabled});
    });
  }

  Future<void> toggleIdeaPool(bool enabled) async {
    final current = state.value;
    if (current == null) return;

    if (ref.read(authSessionProvider).isDemo) {
      final rs = Map<String, dynamic>.from(current.robotSettings ?? {});
      rs['ideaPoolEnabled'] = enabled;
      state = AsyncData(current.copyWith(robotSettings: rs));
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      return api.updateSettings({
        'robotSettings': {'ideaPoolEnabled': enabled},
      });
    });
  }

  Future<void> updateContentFrequency({
    required String key,
    required int value,
  }) async {
    final current = state.value;
    if (current == null) {
      return;
    }

    final currentRobotSettings = Map<String, dynamic>.from(
      current.robotSettings ?? <String, dynamic>{},
    );
    final currentFrequency = currentRobotSettings['contentFrequency'];
    final nextFrequency = currentFrequency is Map
        ? Map<String, dynamic>.from(currentFrequency)
        : <String, dynamic>{};
    nextFrequency[key] = value;
    final nextRobotSettings = <String, dynamic>{
      ...currentRobotSettings,
      'contentFrequency': nextFrequency,
    };

    if (ref.read(authSessionProvider).isDemo) {
      state = AsyncData(current.copyWith(robotSettings: nextRobotSettings));
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      return api.updateSettings({'robotSettings': nextRobotSettings});
    });
  }

  Future<void> updateLanguage(String language) async {
    final normalizedLanguage = normalizeAppLanguagePreference(language);
    await ref
        .read(appLanguagePreferenceProvider.notifier)
        .update(normalizedLanguage);

    final current = state.value;
    if (current == null) {
      return;
    }

    if (ref.read(authSessionProvider).isDemo) {
      state = AsyncData(current.copyWith(language: normalizedLanguage));
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      final settings = await api.updateSettings({
        'language': normalizedLanguage,
      });
      return settings.copyWith(language: normalizedLanguage);
    });
  }

  Future<AppSettings?> setDefaultProjectId(String? projectId) async {
    final current = state.value;
    if (current == null) {
      return null;
    }
    final nextSelectionMode = projectId == null
        ? projectSelectionModeNone
        : projectSelectionModeSelected;

    if (ref.read(authSessionProvider).isDemo) {
      final updated = current.copyWith(
        defaultProjectId: projectId,
        projectSelectionMode: nextSelectionMode,
      );
      state = AsyncData(updated);
      return updated;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      return api.updateSettings({
        'defaultProjectId': projectId,
        'projectSelectionMode': nextSelectionMode,
      });
    });
    if (state.hasError) {
      throw state.error!;
    }
    return state.value;
  }

  Future<AppSettings?> setNoProjectSelected() async {
    final current = state.value;
    if (current == null) {
      return null;
    }

    if (ref.read(authSessionProvider).isDemo) {
      final updated = current.copyWith(
        projectSelectionMode: projectSelectionModeNone,
      );
      state = AsyncData(updated);
      return updated;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      return api.updateSettings({
        'projectSelectionMode': projectSelectionModeNone,
      });
    });
    if (state.hasError) {
      throw state.error!;
    }
    return state.value;
  }

  Future<void> updateTheme(String theme) async {
    final normalizedTheme = normalizeAppThemePreference(theme);
    await ref.read(appThemePreferenceProvider.notifier).update(normalizedTheme);

    final current = state.value;
    if (current == null) {
      return;
    }

    if (ref.read(authSessionProvider).isDemo) {
      state = AsyncData(current.copyWith(theme: normalizedTheme));
      return;
    }

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      final settings = await api.updateSettings({'theme': normalizedTheme});
      return settings.copyWith(theme: normalizedTheme);
    });
  }
}

final activeProjectControllerProvider =
    AsyncNotifierProvider<ActiveProjectController, void>(
      ActiveProjectController.new,
    );

class ActiveProjectController extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> setActiveProject(String? projectId) async {
    final previous = ref.read(currentUserSettingsProvider).value;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      if (projectId == null) {
        await ref
            .read(currentUserSettingsProvider.notifier)
            .setNoProjectSelected();
      } else {
        await ref
            .read(currentUserSettingsProvider.notifier)
            .setDefaultProjectId(projectId);
      }
      ref.invalidate(appBootstrapProvider);
      ref.invalidate(projectsStateProvider);
      ref.invalidate(projectsProvider);
      ref.invalidate(pendingContentProvider);
      ref.invalidate(contentHistoryProvider);
      ref.invalidate(creatorProfileProvider);
      ref.invalidate(personasProvider);
      ref.invalidate(affiliationsProvider);
      ref.invalidate(ideasProvider);
      ref.invalidate(dripPlansProvider);
    });
    if (state.hasError) {
      if (previous != null) {
        ref.invalidate(currentUserSettingsProvider);
      }
      throw state.error!;
    }
  }
}

final projectMutationControllerProvider =
    AsyncNotifierProvider<ProjectMutationController, void>(
      ProjectMutationController.new,
    );

class ProjectMutationController extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> createProject({
    required String name,
    String? sourceUrl,
    List<ContentTypeConfig> contentTypes = const <ContentTypeConfig>[],
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      final project = await api.createProject(
        name: name,
        sourceUrl: sourceUrl,
        contentTypes: contentTypes,
      );
      ref.invalidate(projectsStateProvider);
      await ref
          .read(currentUserSettingsProvider.notifier)
          .setDefaultProjectId(project.id);
      await ref.read(appAccessStateProvider.notifier).refresh();
    });
    if (state.hasError) {
      throw state.error!;
    }
  }

  Future<void> updateProject({
    required String projectId,
    required String name,
    String? sourceUrl,
    List<ContentTypeConfig> contentTypes = const <ContentTypeConfig>[],
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      await api.updateProject(
        projectId: projectId,
        name: name,
        sourceUrl: sourceUrl,
        contentTypes: contentTypes,
      );
      ref.invalidate(projectsStateProvider);
    });
    if (state.hasError) {
      throw state.error!;
    }
  }

  Future<void> archiveProject(String projectId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      await api.archiveProject(projectId);
      ref.invalidate(projectsStateProvider);
      final activeProject = ref.read(activeProjectProvider);
      if (activeProject?.id == projectId) {
        await ref
            .read(currentUserSettingsProvider.notifier)
            .setDefaultProjectId(null);
      }
    });
    if (state.hasError) {
      throw state.error!;
    }
  }

  Future<void> unarchiveProject(String projectId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final api = ref.read(apiServiceProvider);
      await api.unarchiveProject(projectId);
      ref.invalidate(projectsStateProvider);
    });
    if (state.hasError) {
      throw state.error!;
    }
  }

  Future<void> deleteProject(String projectId) async {
    await archiveProject(projectId);
  }
}

final creatorProfileProvider = FutureProvider<CreatorProfile?>((ref) async {
  final authSession = ref.watch(authSessionProvider);
  if (!authSession.isAuthenticated) {
    return null;
  }

  final api = ref.read(apiServiceProvider);
  final activeProjectId = ref.watch(activeProjectIdProvider);
  if (activeProjectId == null) {
    return null;
  }
  return api.fetchCreatorProfile(projectId: activeProjectId);
});

final personasProvider = FutureProvider<List<Persona>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final activeProjectId = ref.watch(activeProjectIdProvider);
  if (activeProjectId == null) {
    return const <Persona>[];
  }
  return api.fetchPersonas(projectId: activeProjectId);
});

final affiliationsProvider = FutureProvider<List<AffiliateLink>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final activeProjectId = ref.watch(activeProjectIdProvider);
  if (activeProjectId == null) {
    return const <AffiliateLink>[];
  }
  return api.fetchAffiliations(projectId: activeProjectId);
});

final lastNarrativeProvider = StateProvider<NarrativeSynthesisResult?>(
  (ref) => null,
);

// ─── Idea Pool ──────────────────────────────────────────

final ideasProvider = AsyncNotifierProvider<IdeasNotifier, List<Idea>>(
  IdeasNotifier.new,
);

class IdeasNotifier extends AsyncNotifier<List<Idea>> {
  String _statusFilter = 'all';
  String _sourceFilter = 'all';

  String get statusFilter => _statusFilter;
  String get sourceFilter => _sourceFilter;

  @override
  Future<List<Idea>> build() async {
    final api = ref.read(apiServiceProvider);
    final activeProjectId = ref.watch(activeProjectIdProvider);
    if (activeProjectId == null) {
      return const <Idea>[];
    }
    return api.fetchIdeas(
      status: _statusFilter == 'all' ? null : _statusFilter,
      source: _sourceFilter == 'all' ? null : _sourceFilter,
      projectId: activeProjectId,
    );
  }

  void setStatusFilter(String filter) {
    _statusFilter = filter;
    ref.invalidateSelf();
  }

  void setSourceFilter(String filter) {
    _sourceFilter = filter;
    ref.invalidateSelf();
  }

  Future<void> dismissIdea(String id) async {
    final api = ref.read(apiServiceProvider);
    await api.updateIdea(id, {'status': 'dismissed'});
    ref.invalidateSelf();
  }

  Future<void> prioritizeIdea(String id, double score) async {
    final api = ref.read(apiServiceProvider);
    await api.updateIdea(id, {'priority_score': score});
    ref.invalidateSelf();
  }

  Future<void> deleteIdea(String id) async {
    final api = ref.read(apiServiceProvider);
    await api.deleteIdea(id);
    ref.invalidateSelf();
  }
}

// ─── Content Drip ──────────────────────────────────────────

final dripPlansProvider = FutureProvider<List<DripPlan>>((ref) async {
  final api = ref.read(apiServiceProvider);
  try {
    final raw = await api.fetchDripPlans();
    return raw.map((j) => DripPlan.fromJson(j)).toList();
  } catch (error, stackTrace) {
    if (!_isDripReadFailureThatCanFallback(error)) {
      rethrow;
    }
    _logDegradedRead(
      ref,
      scope: 'drip.plans.degraded',
      message:
          'Drip plans fetch failed; keeping the offline drip list available.',
      error: error,
      stackTrace: stackTrace,
    );
    return const <DripPlan>[];
  }
});

final dripStatsProvider = FutureProvider.family<DripStats, String>((
  ref,
  planId,
) async {
  final api = ref.read(apiServiceProvider);
  try {
    final raw = await api.getDripStats(planId);
    return DripStats.fromJson(raw);
  } catch (error, stackTrace) {
    if (!_isDripReadFailureThatCanFallback(error)) {
      rethrow;
    }
    _logDegradedRead(
      ref,
      scope: 'drip.stats.degraded',
      message:
          'Drip stats fetch failed; showing the plan without live progression details.',
      error: error,
      stackTrace: stackTrace,
      context: {'planId': planId},
    );
    return const DripStats();
  }
});
