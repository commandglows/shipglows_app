import 'package:contentflow_app/data/models/content_item.dart';
import 'package:contentflow_app/data/models/drip_plan.dart';
import 'package:contentflow_app/data/models/offline_sync.dart';
import 'package:contentflow_app/data/models/project.dart';
import 'package:contentflow_app/data/models/app_settings.dart';
import 'package:contentflow_app/l10n/app_localizations.dart';
import 'package:contentflow_app/presentation/screens/feed/feed_screen.dart';
import 'package:contentflow_app/providers/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('empty feed shows the activation dashboard and opens setup', (
    tester,
  ) async {
    await _pumpFeedScreen(
      tester,
      items: const [],
      dripPlans: [_dripPlan('plan-1'), _dripPlan('plan-2')],
      queuedActions: [_queuedAction('action-1')],
    );

    expect(
      find.text('Your content machine is ready to be configured.'),
      findsOneWidget,
    );
    expect(find.text('Next best actions'), findsOneWidget);
    expect(find.text('Upcoming content queue'), findsOneWidget);
    expect(find.text('2 plan(s)'), findsOneWidget);

    await tester.tap(
      find.widgetWithText(FilledButton, 'Review creation settings'),
    );
    await tester.pumpAndSettle();

    expect(find.text('onboarding mode=create projectId='), findsOneWidget);
  });

  testWidgets('empty feed opens onboarding in edit mode when active project exists', (
    tester,
  ) async {
    await _pumpFeedScreen(
      tester,
      items: const [],
      activeProject: Project(
        id: 'project-42',
        name: 'Project 42',
        url: 'https://example.com',
        createdAt: DateTime(2026, 4, 21),
      ),
    );

    await tester.tap(
      find.widgetWithText(FilledButton, 'Review creation settings'),
    );
    await tester.pumpAndSettle();

    expect(
      find.text('onboarding mode=edit projectId=project-42'),
      findsOneWidget,
    );
  });

  testWidgets('empty feed links to the drip queue', (tester) async {
    await _pumpFeedScreen(
      tester,
      items: const [],
      dripPlans: [_dripPlan('plan-1')],
    );

    await tester.ensureVisible(find.text('Open drip queue'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open drip queue'));
    await tester.pumpAndSettle();

    expect(find.text('drip screen'), findsOneWidget);
  });

  testWidgets('feed with pending content keeps the swiper UI', (tester) async {
    await _pumpFeedScreen(
      tester,
      items: [
        ContentItem(
          id: 'content-1',
          title: 'Draft title',
          body: 'Draft body',
          type: ContentType.blogPost,
          status: ContentStatus.pending,
          createdAt: DateTime(2026, 4, 21),
        ),
      ],
    );

    expect(find.text('Draft title'), findsOneWidget);
    expect(
      find.text('Your content machine is ready to be configured.'),
      findsNothing,
    );
  });

  testWidgets('empty feed remains usable on a narrow mobile viewport', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 720);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await _pumpFeedScreen(
      tester,
      items: const [],
      dripPlans: [_dripPlan('plan-1')],
    );

    expect(find.text('Review creation settings'), findsOneWidget);
    expect(find.text('Create content'), findsOneWidget);

    await tester.drag(find.byType(ListView), const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

Future<void> _pumpFeedScreen(
  WidgetTester tester, {
  required List<ContentItem> items,
  List<DripPlan> dripPlans = const [],
  List<QueuedOfflineAction> queuedActions = const [],
  Project? activeProject,
}) async {
  final router = GoRouter(
    initialLocation: '/feed',
    routes: [
      GoRoute(path: '/feed', builder: (context, state) => const FeedScreen()),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => Scaffold(
          body: Center(
            child: Text(
              'onboarding mode=${state.uri.queryParameters['mode'] ?? ''} projectId=${state.uri.queryParameters['projectId'] ?? ''}',
            ),
          ),
        ),
      ),
      GoRoute(
        path: '/angles',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('angles screen'))),
      ),
      GoRoute(
        path: '/templates',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('templates screen'))),
      ),
      GoRoute(
        path: '/drip',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('drip screen'))),
      ),
      GoRoute(
        path: '/editor/:id',
        builder: (context, state) =>
            const Scaffold(body: Center(child: Text('editor screen'))),
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        pendingContentProvider.overrideWith(
          () => _TestPendingContentNotifier(items),
        ),
        dripPlansProvider.overrideWith((ref) async => dripPlans),
        offlineQueueEntriesProvider.overrideWith((ref) async => queuedActions),
        contentHistoryProvider.overrideWith(
          (ref) async => const <ContentItem>[],
        ),
        projectsStateProvider.overrideWith(
          (ref) async => const ProjectsState(),
        ),
        activeProjectProvider.overrideWith((ref) => activeProject),
        currentUserSettingsProvider.overrideWith(
          () => _TestUserSettingsNotifier(
            const AppSettings(
              id: 'settings-1',
              userId: 'user-1',
              projectSelectionMode: projectSelectionModeAuto,
            ),
          ),
        ),
      ],
      child: MaterialApp.router(
        routerConfig: router,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
      ),
    ),
  );

  await tester.pumpAndSettle();
}

class _TestPendingContentNotifier extends PendingContentNotifier {
  _TestPendingContentNotifier(this.items);

  final List<ContentItem> items;

  @override
  Future<List<ContentItem>> build() async => items;
}

class _TestUserSettingsNotifier extends UserSettingsNotifier {
  _TestUserSettingsNotifier(this._settings);

  final AppSettings _settings;

  @override
  Future<AppSettings?> build() async => _settings;
}

DripPlan _dripPlan(String id) {
  return DripPlan(id: id, userId: 'user-1', name: 'Plan $id', status: 'active');
}

QueuedOfflineAction _queuedAction(String id) {
  return QueuedOfflineAction(
    id: id,
    userScope: 'user-1',
    resourceType: 'content',
    actionType: 'create',
    label: 'Queued action',
    method: 'POST',
    path: '/api/content',
    dedupeKey: 'key-$id',
    createdAt: DateTime(2026, 4, 21),
    updatedAt: DateTime(2026, 4, 21),
  );
}
