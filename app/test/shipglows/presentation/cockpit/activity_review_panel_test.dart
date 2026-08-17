import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/data/activity_review_models.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/cockpit/activity_review_panel.dart';
import 'package:shipglows_app/shipglows/providers/managed_activity_review_provider.dart';

void main() {
  testWidgets(
    'shows normalized activity and navigates without resolving review',
    (tester) async {
      var navigationCount = 0;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            managedActivityReviewClientProvider.overrideWithValue(
              _ActivityClient(_projection()),
            ),
          ],
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            home: Scaffold(
              body: SingleChildScrollView(
                child: ActivityReviewPanel(
                  projectId: 'project-1',
                  accessState: ProjectAccessState.available,
                  onOpenConversations: () => navigationCount += 1,
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Approval requested'), findsWidgets);
      expect(find.text('Run completed'), findsOneWidget);
      expect(find.text('Approuver'), findsNothing);
      expect(find.text('Refuser'), findsNothing);

      await tester.tap(find.text('Ouvrir Conversations'));
      expect(navigationCount, 1);
    },
  );

  testWidgets('keeps access loss visible and performs no load', (tester) async {
    final client = _ActivityClient(_projection());
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          managedActivityReviewClientProvider.overrideWithValue(client),
        ],
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: const Scaffold(
            body: ActivityReviewPanel(
              projectId: 'project-1',
              accessState: ProjectAccessState.accessLost,
              onOpenConversations: _noop,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Accès perdu'), findsOneWidget);
    expect(find.text('Ouvrir Conversations'), findsNothing);
    expect(client.calls, 0);
  });
}

void _noop() {}

class _ActivityClient implements ManagedActivityReviewClient {
  _ActivityClient(this.projection);

  final ManagedActivityReviewProjection projection;
  int calls = 0;

  @override
  Future<ManagedActivityReviewProjection> loadActivityReview({
    required String projectId,
  }) async {
    calls += 1;
    return projection;
  }
}

ManagedActivityReviewProjection _projection() =>
    ManagedActivityReviewProjection(
      projectId: 'project-1',
      status: ManagedActivityReviewStatus.degraded,
      reasons: const ['studioReviewUnavailable'],
      activity: [
        ManagedActivityItem(
          id: 'event-1',
          conversationId: 'conversation-1',
          conversationTitle: 'Release check',
          kind: ManagedActivityKind.run,
          label: 'Run completed',
          occurredAt: DateTime.utc(2026, 8, 17, 11),
          destination: ManagedReviewDestination.conversations,
        ),
      ],
      review: [
        ManagedReviewItem(
          id: 'approval-1',
          conversationId: 'conversation-1',
          conversationTitle: 'Release check',
          kind: ManagedReviewKind.approval,
          label: 'Approval requested',
          occurredAt: DateTime.utc(2026, 8, 17, 10),
          destination: ManagedReviewDestination.conversations,
        ),
      ],
    );
