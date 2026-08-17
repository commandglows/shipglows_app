import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/project_context_panel.dart';
import 'package:shipglows_app/shipglows/providers/managed_project_context_provider.dart';

void main() {
  testWidgets(
    'shows bounded verified provenance without private source details',
    (tester) async {
      await _pump(
        tester,
        ManagedProjectContextState(
          ManagedProjectContextLoadStatus.ready,
          projection: _projection(ManagedProjectContextStatus.ready),
        ),
      );

      expect(find.text('Vérifié'), findsOneWidget);
      expect(find.text('abc123'), findsOneWidget);
      expect(find.text('private/path'), findsNothing);
      expect(find.text('2'), findsWidgets);
    },
  );

  testWidgets('shows stale, missing and access-lost states honestly', (
    tester,
  ) async {
    for (final entry in <(ManagedProjectContextState, String)>[
      (
        ManagedProjectContextState(
          ManagedProjectContextLoadStatus.stale,
          projection: _projection(ManagedProjectContextStatus.stale),
        ),
        'À actualiser',
      ),
      (
        const ManagedProjectContextState(
          ManagedProjectContextLoadStatus.missing,
        ),
        'Absent',
      ),
      (
        const ManagedProjectContextState(
          ManagedProjectContextLoadStatus.accessLost,
        ),
        'Accès perdu',
      ),
    ]) {
      await _pump(tester, entry.$1);
      expect(find.text(entry.$2), findsOneWidget);
      await tester.pumpWidget(const SizedBox.shrink());
    }
  });

  testWidgets('refresh action invokes the runner then reloads the projection', (
    tester,
  ) async {
    final client = _RefreshClient();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          managedProjectContextClientProvider.overrideWithValue(client),
          managedProjectContextProvider('project-one').overrideWith(
            (ref) async => const ManagedProjectContextState(
              ManagedProjectContextLoadStatus.missing,
            ),
          ),
        ],
        child: MaterialApp(
          theme: AppTheme.buildForTesting(Brightness.light),
          home: const Scaffold(
            body: ProjectContextPanel(projectId: 'project-one'),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Actualiser le contexte'));
    await tester.pumpAndSettle();

    expect(client.refreshCount, 1);
    expect(client.lastProjectId, 'project-one');
    expect(client.lastIdempotencyKey, startsWith('context:project-one:'));
  });
}

Future<void> _pump(
  WidgetTester tester,
  ManagedProjectContextState state,
) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        managedProjectContextProvider(
          'project-one',
        ).overrideWith((ref) async => state),
      ],
      child: MaterialApp(
        theme: AppTheme.buildForTesting(Brightness.light),
        home: const Scaffold(
          body: SingleChildScrollView(
            child: ProjectContextPanel(projectId: 'project-one'),
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

ManagedProjectContextProjection _projection(
  ManagedProjectContextStatus status,
) {
  return ManagedProjectContextProjection(
    projectId: 'project-one',
    status: status,
    observedAt: DateTime.utc(2026, 8, 17),
    sourceCommit: 'abc123',
    repositorySnapshotCount: 2,
    shipglowsArtifactCount: 1,
    redactionCount: 3,
  );
}

class _RefreshClient implements ManagedProjectContextClient {
  int refreshCount = 0;
  String? lastProjectId;
  String? lastIdempotencyKey;

  @override
  Future<ManagedProjectContextProjection> loadProjectContext({
    required String projectId,
  }) async => _projection(ManagedProjectContextStatus.ready);

  @override
  Future<ManagedProjectContextProjection> refreshProjectContext({
    required String projectId,
    required String idempotencyKey,
  }) async {
    refreshCount += 1;
    lastProjectId = projectId;
    lastIdempotencyKey = idempotencyKey;
    return _projection(ManagedProjectContextStatus.ready);
  }
}
