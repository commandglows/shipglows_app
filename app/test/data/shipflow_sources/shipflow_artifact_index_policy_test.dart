import 'package:flutter_test/flutter_test.dart';
import 'package:shipflow_app/data/shipflow_sources/shipflow_artifact_index_policy.dart';

void main() {
  group('ShipFlowArtifactIndexPolicy', () {
    const policy = ShipFlowArtifactIndexPolicy();

    test('allows the ShipFlow governance corpus', () {
      final allowed = <String, ShipFlowArtifactType>{
        'shipflow_data/business/business.md': ShipFlowArtifactType.business,
        'shipflow_data/editorial/content-map.md':
            ShipFlowArtifactType.editorial,
        'shipflow_data/technical/firestore-data-model.md':
            ShipFlowArtifactType.technical,
        'shipflow_data/workflow/TASKS.md': ShipFlowArtifactType.workflowTracker,
        'shipflow_data/workflow/AUDIT_LOG.md':
            ShipFlowArtifactType.workflowTracker,
        'shipflow_data/workflow/specs/demo.md': ShipFlowArtifactType.spec,
        'README.md': ShipFlowArtifactType.rootCompatibility,
      };

      for (final entry in allowed.entries) {
        final result = policy.classify(entry.key);
        expect(result.allowed, isTrue, reason: entry.key);
        expect(result.artifactType, entry.value, reason: entry.key);
      }
    });

    test('rejects arbitrary docs, build output, and secret-like paths', () {
      for (final path in const <String>[
        'docs/random.md',
        'shipflow_data/workflow/random.md',
        '.git/config.md',
        'build/output.md',
        'shipflow_data/technical/nested/file.md',
        'shipflow_data/technical/client-secret.md',
      ]) {
        expect(policy.classify(path).allowed, isFalse, reason: path);
      }
    });

    test('prefers shipflow_data artifacts over root compatibility docs', () {
      final selected = policy.selectAllowed([
        'README.md',
        'CHANGELOG.md',
        'shipflow_data/technical/firestore-data-model.md',
      ]);

      expect(selected.map((item) => item.path), [
        'shipflow_data/technical/firestore-data-model.md',
      ]);
    });
  });
}
