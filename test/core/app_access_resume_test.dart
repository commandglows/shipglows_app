import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:contentflow_app/core/app_diagnostics.dart';
import 'package:contentflow_app/core/shared_preferences_provider.dart';
import 'package:contentflow_app/data/models/app_access_state.dart';
import 'package:contentflow_app/data/models/app_bootstrap.dart';
import 'package:contentflow_app/data/models/auth_session.dart';
import 'package:contentflow_app/data/services/api_service.dart';
import 'package:contentflow_app/data/services/clerk_auth_service.dart';
import 'package:contentflow_app/providers/providers.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppAccessNotifier.refresh', () {
    test(
      'silentResume keeps checks in background then returns ready',
      () async {
        final harness = await _createHarness();
        addTearDown(harness.dispose);
        await _waitForStableReady(harness.container);

        final observed = <AppAccessStage>[];
        final sub = harness.container.listen<AsyncValue<AppAccessState>>(
          appAccessStateProvider,
          (_, next) {
            final stage = next.value?.stage;
            if (stage != null) {
              observed.add(stage);
            }
          },
          fireImmediately: true,
        );
        addTearDown(sub.close);

        final health = Completer<Map<String, dynamic>>();
        final bootstrap = Completer<AppBootstrap>();
        harness.api.onHealthCheck = () => health.future;
        harness.api.onFetchBootstrap = () => bootstrap.future;

        observed.clear();
        final refresh = harness.container
            .read(appAccessStateProvider.notifier)
            .refresh(mode: AppAccessRefreshMode.silentResume);

        await _nextTick();
        expect(
          observed.where(
            (stage) =>
                stage == AppAccessStage.checkingBackend ||
                stage == AppAccessStage.checkingWorkspace,
          ),
          isEmpty,
        );

        health.complete(const {'status': 'healthy'});
        bootstrap.complete(_readyBootstrap());
        await refresh;

        expect(
          harness.container.read(appAccessStateProvider).value?.stage,
          AppAccessStage.ready,
        );
      },
    );

    test(
      'silentResume transitions to apiUnavailable in degraded backend mode',
      () async {
        final harness = await _createHarness();
        addTearDown(harness.dispose);
        await _waitForStableReady(harness.container);

        harness.api.onHealthCheck = () async => const {'status': 'offline'};
        harness.api.onLoadCachedBootstrap = () async => _readyBootstrap();

        await harness.container
            .read(appAccessStateProvider.notifier)
            .refresh(mode: AppAccessRefreshMode.silentResume);

        final state = harness.container.read(appAccessStateProvider).value;
        expect(state?.stage, AppAccessStage.apiUnavailable);
        expect(state?.bootstrap, isNotNull);
      },
    );

    test('silentResume preserves terminal unauthorized transition', () async {
      final harness = await _createHarness();
      addTearDown(harness.dispose);
      await _waitForStableReady(harness.container);

      harness.api.onHealthCheck = () async => const {'status': 'healthy'};
      harness.api.onFetchBootstrap = () async {
        throw const ApiException(
          ApiErrorType.unauthorized,
          'Unauthorized',
          statusCode: 401,
          method: 'GET',
          path: '/api/bootstrap',
        );
      };

      await harness.container
          .read(appAccessStateProvider.notifier)
          .refresh(mode: AppAccessRefreshMode.silentResume);

      expect(
        harness.container.read(appAccessStateProvider).value?.stage,
        AppAccessStage.bootstrapUnauthorized,
      );
    });

    test(
      'interactive refresh emits intermediate stages after silent resume',
      () async {
        final harness = await _createHarness();
        addTearDown(harness.dispose);
        await _waitForStableReady(harness.container);

        final observed = <AppAccessStage>[];
        final sub = harness.container.listen<AsyncValue<AppAccessState>>(
          appAccessStateProvider,
          (_, next) {
            final stage = next.value?.stage;
            if (stage != null) {
              observed.add(stage);
            }
          },
          fireImmediately: true,
        );
        addTearDown(sub.close);

        final silentHealth = Completer<Map<String, dynamic>>();
        final silentBootstrap = Completer<AppBootstrap>();
        harness.api.onHealthCheck = () => silentHealth.future;
        harness.api.onFetchBootstrap = () => silentBootstrap.future;

        observed.clear();
        final silentRefresh = harness.container
            .read(appAccessStateProvider.notifier)
            .refresh(mode: AppAccessRefreshMode.silentResume);
        await _nextTick();
        expect(
          observed.where(
            (stage) =>
                stage == AppAccessStage.checkingBackend ||
                stage == AppAccessStage.checkingWorkspace,
          ),
          isEmpty,
        );
        silentHealth.complete(const {'status': 'healthy'});
        silentBootstrap.complete(_readyBootstrap());
        await silentRefresh;

        observed.clear();
        final interactiveHealth = Completer<Map<String, dynamic>>();
        final interactiveBootstrap = Completer<AppBootstrap>();
        harness.api.onHealthCheck = () => interactiveHealth.future;
        harness.api.onFetchBootstrap = () => interactiveBootstrap.future;

        final interactiveRefresh = harness.container
            .read(appAccessStateProvider.notifier)
            .refresh(mode: AppAccessRefreshMode.interactive);
        await _nextTick();

        expect(observed, contains(AppAccessStage.checkingBackend));

        interactiveHealth.complete(const {'status': 'healthy'});
        await _nextTick();
        expect(observed, contains(AppAccessStage.checkingWorkspace));

        interactiveBootstrap.complete(_readyBootstrap());
        await interactiveRefresh;

        expect(
          harness.container.read(appAccessStateProvider).value?.stage,
          AppAccessStage.ready,
        );
      },
    );
  });
}

Future<void> _nextTick() async {
  await Future<void>.delayed(Duration.zero);
}

Future<void> _waitForStableReady(ProviderContainer container) async {
  var consecutiveReady = 0;
  for (var i = 0; i < 200; i++) {
    final value = container.read(appAccessStateProvider);
    if (!value.isLoading && value.value?.stage == AppAccessStage.ready) {
      consecutiveReady += 1;
      if (consecutiveReady >= 3) {
        return;
      }
    } else {
      consecutiveReady = 0;
    }
    await Future<void>.delayed(const Duration(milliseconds: 5));
  }
  fail('Timed out waiting for a stable ready app access state.');
}

AppBootstrap _readyBootstrap() {
  return const AppBootstrap(
    user: AppBootstrapUser(
      userId: 'user-1',
      workspaceExists: true,
      defaultProjectId: 'project-1',
    ),
    projectsCount: 1,
    defaultProjectId: 'project-1',
    workspaceStatus: 'ready',
  );
}

class _Harness {
  const _Harness({required this.container, required this.api});

  final ProviderContainer container;
  final _FakeApiService api;

  void dispose() {
    container.dispose();
  }
}

Future<_Harness> _createHarness() async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  final api = _FakeApiService();
  final clerk = _HangingClerkAuthService(prefs);

  final container = ProviderContainer(
    overrides: [
      sharedPrefsProvider.overrideWithValue(prefs),
      appDiagnosticsProvider.overrideWithValue(AppDiagnostics()),
      clerkAuthServiceProvider.overrideWith((ref) => clerk),
      authSessionProvider.overrideWith(
        (ref) => _TestAuthSessionNotifier(ref, _authenticatedSession),
      ),
      apiServiceProvider.overrideWith((ref) => api),
    ],
  );

  await container.read(appAccessStateProvider.future);
  return _Harness(container: container, api: api);
}

const _authenticatedSession = AuthSession(
  status: AuthStatus.authenticated,
  bearerToken: 'token-test',
  email: 'test@example.com',
);

class _TestAuthSessionNotifier extends AuthSessionNotifier {
  _TestAuthSessionNotifier(super.ref, AuthSession session) : super() {
    state = session;
  }
}

class _HangingClerkAuthService extends ClerkAuthService {
  _HangingClerkAuthService(SharedPreferences prefs)
    : super(publishableKey: 'pk_test', sharedPreferences: prefs);

  @override
  Future<ClerkAuthResult?> restoreSession() {
    final completer = Completer<ClerkAuthResult?>();
    return completer.future;
  }
}

class _FakeApiService extends ApiService {
  _FakeApiService() : super(baseUrl: 'https://api.test');

  Future<Map<String, dynamic>> Function()? onHealthCheck;
  Future<AppBootstrap> Function()? onFetchBootstrap;
  Future<AppBootstrap?> Function()? onLoadCachedBootstrap;

  @override
  Future<Map<String, dynamic>> healthCheck() async {
    final callback = onHealthCheck;
    if (callback != null) {
      return callback();
    }
    return const {'status': 'healthy'};
  }

  @override
  Future<AppBootstrap> fetchBootstrap() async {
    final callback = onFetchBootstrap;
    if (callback != null) {
      return callback();
    }
    return _readyBootstrap();
  }

  @override
  Future<AppBootstrap?> loadCachedBootstrap() async {
    final callback = onLoadCachedBootstrap;
    if (callback != null) {
      return callback();
    }
    return null;
  }
}
