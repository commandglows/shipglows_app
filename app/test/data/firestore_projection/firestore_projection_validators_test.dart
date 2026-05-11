import 'package:flutter_test/flutter_test.dart';
import 'package:shipflow_app/data/firestore_projection/firestore_projection_models.dart';
import 'package:shipflow_app/data/firestore_projection/firestore_projection_validators.dart';

void main() {
  group('FirestoreProjectionValidators', () {
    test('rejects forbidden client fields', () {
      expect(
        () => FirestoreProjectionValidators.validateClientWritablePayload(
          <String, Object?>{
            'sourceCommit': 'abc123',
            'title': 'demo',
          },
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });

    test('rejects secret-like payload keys', () {
      expect(
        () => FirestoreProjectionValidators.validateNoSecretLikeFields(
          <String, Object?>{'installationToken': 'x'},
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
      expect(
        () => FirestoreProjectionValidators.validateNoSecretLikeFields(
          <String, Object?>{'clonePath': '/tmp/clone'},
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });

    test('validates sourceCommit presence', () {
      expect(
        () => FirestoreProjectionValidators.validateSourceCommit(''),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
      expect(
        () => FirestoreProjectionValidators.validateSourceCommit('abc123'),
        returnsNormally,
      );
    });

    test('accepts owner and viewer roles', () {
      expect(
        () => FirestoreProjectionValidators.validateProjectRole(
          ShipFlowProjectRole.owner,
        ),
        returnsNormally,
      );
      expect(
        () => FirestoreProjectionValidators.validateProjectRole(
          ShipFlowProjectRole.viewer,
        ),
        returnsNormally,
      );
    });

    test('retains latest 20 index runs', () {
      List<IndexRunRecord> runs(int count) => List.generate(
        count,
        (i) => IndexRunRecord(
          runId: 'run-$i',
          sourceCommit: 'sha-$i',
          status: IndexRunStatus.success,
          startedAt: DateTime.utc(2026, 5, 10, 0, i),
          finishedAt: DateTime.utc(2026, 5, 10, 0, i, 1),
          filesIndexed: 1,
          filesDeleted: 0,
        ),
      );

      expect(
        FirestoreProjectionValidators.retainLatestIndexRuns(runs(19)).length,
        19,
      );
      expect(
        FirestoreProjectionValidators.retainLatestIndexRuns(runs(20)).length,
        20,
      );
      final retained21 = FirestoreProjectionValidators.retainLatestIndexRuns(
        runs(21),
      );
      expect(retained21.length, 20);
      expect(retained21.first.runId, 'run-20');
      expect(retained21.last.runId, 'run-1');
    });
  });
}
