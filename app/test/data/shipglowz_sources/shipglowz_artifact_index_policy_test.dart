import 'package:flutter_test/flutter_test.dart';
import 'package:shipglowz_app/data/shipglowz_sources/shipglowz_artifact_index_policy.dart';

void main() {
  group('ShipGlowzArtifactIndexPolicy', () {
    const policy = ShipGlowzArtifactIndexPolicy();

    test('allows the ShipGlowz governance corpus', () {
      final allowed = <String, ShipGlowzArtifactType>{
        'shipglowz_data/business/business.md': ShipGlowzArtifactType.business,
        'shipglowz_data/editorial/content-map.md':
            ShipGlowzArtifactType.editorial,
        'shipglowz_data/technical/firestore-data-model.md':
            ShipGlowzArtifactType.technical,
        'shipglowz_data/workflow/TASKS.md': ShipGlowzArtifactType.workflowTracker,
        'shipglowz_data/workflow/AUDIT_LOG.md':
            ShipGlowzArtifactType.workflowTracker,
        'shipglowz_data/workflow/specs/demo.md': ShipGlowzArtifactType.spec,
        'README.md': ShipGlowzArtifactType.rootCompatibility,
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
        'shipglowz_data/workflow/random.md',
        '.git/config.md',
        'build/output.md',
        'shipglowz_data/technical/nested/file.md',
        'shipglowz_data/technical/client-secret.md',
      ]) {
        expect(policy.classify(path).allowed, isFalse, reason: path);
      }
    });

    test('prefers shipglowz_data artifacts over root compatibility docs', () {
      final selected = policy.selectAllowed([
        'README.md',
        'CHANGELOG.md',
        'shipglowz_data/technical/firestore-data-model.md',
      ]);

      expect(selected.map((item) => item.path), [
        'shipglowz_data/technical/firestore-data-model.md',
      ]);
    });
  });
}
