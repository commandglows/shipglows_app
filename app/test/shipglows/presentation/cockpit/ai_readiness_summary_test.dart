import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/cockpit/ai_readiness_summary.dart';

void main() {
  testWidgets('shows an explainable accessible AI readiness result', (
    tester,
  ) async {
    const readiness = ProjectAiReadiness(
      version: 'shipglows.ai-readiness.v1',
      status: AiReadinessStatus.needsWork,
      score: 80,
      coverage: 1,
      evaluatedAt: null,
      checks: <AiReadinessCheck>[
        AiReadinessCheck(
          id: AiReadinessCheckId.structure,
          outcome: AiReadinessCheckOutcome.passed,
          earnedPoints: 20,
          maxPoints: 20,
          summary: 'Structure is discoverable.',
        ),
        AiReadinessCheck(
          id: AiReadinessCheckId.agentGuidance,
          outcome: AiReadinessCheckOutcome.missing,
          earnedPoints: 0,
          maxPoints: 20,
          summary: 'Agent guidance is missing.',
        ),
        AiReadinessCheck(
          id: AiReadinessCheckId.schemas,
          outcome: AiReadinessCheckOutcome.passed,
          earnedPoints: 15,
          maxPoints: 15,
          summary: 'Schemas are discoverable.',
        ),
        AiReadinessCheck(
          id: AiReadinessCheckId.llmsText,
          outcome: AiReadinessCheckOutcome.passed,
          earnedPoints: 15,
          maxPoints: 15,
          summary: 'llms.txt is discoverable.',
        ),
        AiReadinessCheck(
          id: AiReadinessCheckId.sitemap,
          outcome: AiReadinessCheckOutcome.passed,
          earnedPoints: 10,
          maxPoints: 10,
          summary: 'Sitemap is discoverable.',
        ),
        AiReadinessCheck(
          id: AiReadinessCheckId.fastFeedback,
          outcome: AiReadinessCheckOutcome.passed,
          earnedPoints: 20,
          maxPoints: 20,
          summary: 'Fast checks are discoverable.',
        ),
      ],
      recommendations: <String>['Add project-level agent guidance.'],
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: const Scaffold(body: AiReadinessSummary(readiness: readiness)),
      ),
    );

    expect(find.text('80/100 · Needs work'), findsOneWidget);
    expect(find.text('Evidence coverage: 100%'), findsOneWidget);
    expect(find.text('Structure'), findsOneWidget);
    expect(find.text('Agent guide'), findsOneWidget);
    expect(find.text('• Add project-level agent guidance.'), findsOneWidget);
    expect(
      tester.getSemantics(find.byType(AiReadinessSummary)),
      matchesSemantics(
        label: 'AI readiness: 80 out of 100. Evidence coverage: 100%',
      ),
    );
    expect(
      find.bySemanticsLabel('Agent guide: missing. Agent guidance is missing.'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('keeps unavailable readiness explicit', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: const Scaffold(
          body: AiReadinessSummary(readiness: ProjectAiReadiness.unavailable()),
        ),
      ),
    );

    expect(find.text('Not evaluated'), findsOneWidget);
    expect(find.text('Evidence coverage: unavailable'), findsOneWidget);
    expect(find.byType(LinearProgressIndicator), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('renders partial coverage without presenting it as score zero', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: const Scaffold(
          body: AiReadinessSummary(
            readiness: ProjectAiReadiness(
              version: 'shipglows.ai-readiness.v1',
              status: AiReadinessStatus.partial,
              score: null,
              coverage: 1 / 3,
              evaluatedAt: null,
              checks: <AiReadinessCheck>[
                AiReadinessCheck(
                  id: AiReadinessCheckId.structure,
                  outcome: AiReadinessCheckOutcome.passed,
                  earnedPoints: 20,
                  maxPoints: 20,
                  summary: 'Structure is discoverable.',
                ),
                AiReadinessCheck(
                  id: AiReadinessCheckId.schemas,
                  outcome: AiReadinessCheckOutcome.passed,
                  earnedPoints: 15,
                  maxPoints: 15,
                  summary: 'Schemas are discoverable.',
                ),
              ],
              recommendations: <String>['Complete the bounded scan.'],
            ),
          ),
        ),
      ),
    );

    expect(find.text('Partial scan'), findsOneWidget);
    expect(find.text('Evidence coverage: 33%'), findsOneWidget);
    expect(find.textContaining('/100'), findsNothing);
    expect(find.byType(LinearProgressIndicator), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('keeps maximum evidence readable at 320 dp and 2x text', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 2;
    tester.view.physicalSize = const Size(640, 1600);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);
    final checks = <AiReadinessCheck>[
      for (final id in AiReadinessCheckId.values)
        AiReadinessCheck(
          id: id,
          outcome: AiReadinessCheckOutcome.missing,
          earnedPoints: 0,
          maxPoints: switch (id) {
            AiReadinessCheckId.structure ||
            AiReadinessCheckId.agentGuidance ||
            AiReadinessCheckId.fastFeedback => 20,
            AiReadinessCheckId.schemas || AiReadinessCheckId.llmsText => 15,
            AiReadinessCheckId.sitemap => 10,
          },
          summary:
              'This evidence is missing and needs a clear project artifact.',
        ),
    ];

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: const TextScaler.linear(2)),
          child: child!,
        ),
        home: Scaffold(
          body: SingleChildScrollView(
            child: AiReadinessSummary(
              readiness: ProjectAiReadiness(
                version: 'shipglows.ai-readiness.v1',
                status: AiReadinessStatus.needsWork,
                score: 0,
                coverage: 1,
                evaluatedAt: null,
                checks: checks,
                recommendations: const <String>[
                  'Add explicit project guidance for agents and contributors.',
                  'Add machine-readable contracts for the main interfaces.',
                  'Add standard fast validation commands for safe feedback.',
                ],
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.text('Evidence coverage: 100%'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
