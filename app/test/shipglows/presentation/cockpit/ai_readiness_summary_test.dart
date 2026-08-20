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
      score: 65,
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
      ],
      recommendations: <String>['Add project-level agent guidance.'],
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: const Scaffold(body: AiReadinessSummary(readiness: readiness)),
      ),
    );

    expect(find.text('65/100 · Needs work'), findsOneWidget);
    expect(find.text('Structure'), findsOneWidget);
    expect(find.text('Agent guide'), findsOneWidget);
    expect(find.text('• Add project-level agent guidance.'), findsOneWidget);
    expect(
      tester.getSemantics(find.byType(AiReadinessSummary)),
      matchesSemantics(label: 'AI readiness: 65 out of 100'),
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
    expect(tester.takeException(), isNull);
  });
}
