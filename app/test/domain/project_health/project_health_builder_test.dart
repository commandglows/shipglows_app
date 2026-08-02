import 'package:flutter_test/flutter_test.dart';
import 'package:shipglowz_app/data/shipglowz_sources/parsers/parsed_models.dart';
import 'package:shipglowz_app/data/shipglowz_sources/parsers/shipglowz_sources_parser.dart';
import 'package:shipglowz_app/domain/project_health/project_health_builder.dart';
import 'package:shipglowz_app/domain/project_health/project_health_models.dart';

void main() {
  group('ProjectHealthBuilder', () {
    test('marks project as neverChecked without dependency events', () {
      final parsed = ParsedShipGlowzData(
        projects: const [
          ProjectRegistryEntry(
            name: 'demo',
            path: '/tmp/demo',
            stack: 'Flutter',
            domains: {'deps'},
          ),
        ],
        auditLog: const [],
        tasks: const [],
        operationsEvents: const [],
        dependencyEvents: const [],
        specs: const [],
        diagnostics: const [],
      );

      final model = ProjectHealthBuilder().build(
        parsedData: parsed,
        allowlistedRoots: const ['/tmp'],
        generatedAt: DateTime.utc(2026, 4, 27),
      );

      expect(model.projects.length, 1);
      expect(
        model.projects.first.dependencyPosture,
        DependencyPosture.neverChecked,
      );
      expect(
        model.projects.first.health.dimension(HealthDimension.tech).status,
        HealthStatus.notReported,
      );
      expect(model.projects.first.health.coverage, 0);
      expect(model.projects.first.health.overallStatus, HealthStatus.unknown);
      expect(
        HealthDimension.values.map((dimension) => dimension.wireName),
        containsAll(<String>[
          'tech',
          'content',
          'seo',
          'performance',
          'security',
        ]),
      );
    });

    test(
      'uses trustworthy reported evidence without treating gaps as healthy',
      () {
        final checkedAt = DateTime.now().toUtc().subtract(
          const Duration(days: 2),
        );
        final parsed = ParsedShipGlowzData(
          projects: const [
            ProjectRegistryEntry(
              name: 'demo',
              path: '/tmp/demo',
              stack: 'Flutter',
              domains: {'deps'},
            ),
          ],
          auditLog: const [],
          tasks: const [],
          operationsEvents: const [],
          dependencyEvents: [
            LedgerEvent(
              eventId: 'dep-1',
              eventType: 'dependency_audit',
              project: 'demo',
              status: 'completed',
              riskLevel: 'low',
              summary: 'Dependencies checked',
              finishedAt: checkedAt,
              source: 'DEPENDENCY_LOG.md',
              nextStep: '/sf-verify demo',
            ),
          ],
          specs: const [],
          diagnostics: const [],
        );

        final model = ProjectHealthBuilder().build(
          parsedData: parsed,
          allowlistedRoots: const ['/tmp'],
          generatedAt: DateTime.now().toUtc(),
        );
        final health = model.projects.single.health;

        expect(
          health.dimension(HealthDimension.tech).status,
          HealthStatus.healthy,
        );
        expect(health.dimension(HealthDimension.tech).checkedAt, checkedAt);
        expect(
          health.dimension(HealthDimension.content).status,
          HealthStatus.notReported,
        );
        expect(health.overallStatus, HealthStatus.healthy);
        expect(health.reportedDimensions, 1);
        expect(health.coverage, closeTo(0.2, 0.0001));
      },
    );

    test('computes the worst reported state and excludes unknown coverage', () {
      final matrix =
          ProjectHealthMatrix.fromDimensions(<ProjectHealthDimension>[
            const ProjectHealthDimension(
              dimension: HealthDimension.tech,
              status: HealthStatus.healthy,
              summary: 'Checks pass',
              producer: 'test',
              evidenceCount: 1,
            ),
            const ProjectHealthDimension(
              dimension: HealthDimension.security,
              status: HealthStatus.critical,
              summary: 'Critical finding',
              producer: 'test',
              evidenceCount: 1,
            ),
          ]);

      expect(matrix.overallStatus, HealthStatus.critical);
      expect(matrix.reportedDimensions, 2);
      expect(matrix.coverage, closeTo(0.4, 0.0001));
      expect(
        matrix.dimension(HealthDimension.seo).status,
        HealthStatus.notReported,
      );
    });

    test('rejects an out-of-range producer score', () {
      expect(
        () => ProjectHealthDimension(
          dimension: HealthDimension.performance,
          status: HealthStatus.warning,
          summary: 'Measured regression',
          producer: 'lighthouse',
          evidenceCount: 1,
          score: 101,
        ),
        throwsAssertionError,
      );
    });
  });
}
