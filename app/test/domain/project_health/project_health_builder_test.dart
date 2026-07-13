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
    });
  });
}
