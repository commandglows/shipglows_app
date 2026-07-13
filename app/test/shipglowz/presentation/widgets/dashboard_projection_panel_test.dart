import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglowz_app/data/firestore_projection/firestore_projection_models.dart';
import 'package:shipglowz_app/shipglowz/data/dashboard_readonly_projection_repository.dart';
import 'package:shipglowz_app/shipglowz/presentation/widgets/dashboard_projection_panel.dart';

void main() {
  testWidgets('shows signed-out state without project reads', (tester) async {
    await tester.pumpWidget(
      _app(
        DashboardProjectionPanel(
          snapshot: DashboardReadonlySnapshot(
            status: DashboardProjectionLoadStatus.signedOut,
            uid: null,
            generatedAt: DateTime.utc(2026, 5, 30),
            projects: const <DashboardProjectSummary>[],
            artifacts: const <DashboardArtifactSummary>[],
            diagnostics: const <DashboardDiagnosticSummary>[],
            indexRuns: const <DashboardIndexRunSummary>[],
          ),
        ),
      ),
    );

    expect(find.text('Sign in required'), findsOneWidget);
    expect(
      find.text('No project projection reads run before authentication.'),
      findsOneWidget,
    );
  });

  testWidgets('renders access-lost project with disabled refresh', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        DashboardProjectionPanel(
          snapshot: DashboardReadonlySnapshot(
            status: DashboardProjectionLoadStatus.ready,
            uid: 'user_a',
            generatedAt: DateTime.utc(2026, 5, 30),
            projects: [
              DashboardProjectSummary(
                projectId: 'proj_a',
                displayName: 'alpha',
                githubFullName: 'acme/alpha',
                state: DashboardProjectViewState.accessLost,
                projectionStatus: ProjectionStatus.accessLost,
                accessStatus: GitHubAccessStatus.githubAccessLost,
                sourceCommit: 'abcdef1',
                updatedAt: DateTime.utc(2026, 5, 30),
                artifactCount: 3,
                diagnosticCount: 1,
                refreshDisabledReason:
                    'GitHub access must be restored before refresh or indexing.',
              ),
            ],
            artifacts: const <DashboardArtifactSummary>[],
            diagnostics: const <DashboardDiagnosticSummary>[],
            indexRuns: const <DashboardIndexRunSummary>[],
          ),
        ),
      ),
    );

    expect(find.text('alpha'), findsOneWidget);
    expect(find.text('access lost'), findsOneWidget);
    expect(find.text('Request refresh'), findsOneWidget);
    final button = tester.widget<FilledButton>(find.byType(FilledButton));
    expect(button.onPressed, isNull);
  });
}

Widget _app(Widget child) {
  return MaterialApp(home: Scaffold(body: child));
}
