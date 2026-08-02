import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/shipglows_sources/shipglows_artifact_index_policy.dart';

void main() {
  group('ShipGlowsArtifactIndexPolicy', () {
    const policy = ShipGlowsArtifactIndexPolicy();

    test('allows the ShipGlows governance corpus', () {
      final allowed = <String, ShipGlowsArtifactType>{
        'shipglows_data/business/business.md': ShipGlowsArtifactType.business,
        'shipglows_data/editorial/content-map.md':
            ShipGlowsArtifactType.editorial,
        'shipglows_data/technical/firestore-data-model.md':
            ShipGlowsArtifactType.technical,
        'shipglows_data/workflow/TASKS.md': ShipGlowsArtifactType.workflowTracker,
        'shipglows_data/workflow/AUDIT_LOG.md':
            ShipGlowsArtifactType.workflowTracker,
        'shipglows_data/workflow/specs/demo.md': ShipGlowsArtifactType.spec,
        'README.md': ShipGlowsArtifactType.rootCompatibility,
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
        'shipglows_data/workflow/random.md',
        '.git/config.md',
        'build/output.md',
        'shipglows_data/technical/nested/file.md',
        'shipglows_data/technical/client-secret.md',
      ]) {
        expect(policy.classify(path).allowed, isFalse, reason: path);
      }
    });

    test('prefers shipglows_data artifacts over root compatibility docs', () {
      final selected = policy.selectAllowed([
        'README.md',
        'CHANGELOG.md',
        'shipglows_data/technical/firestore-data-model.md',
      ]);

      expect(selected.map((item) => item.path), [
        'shipglows_data/technical/firestore-data-model.md',
      ]);
    });
  });
}
