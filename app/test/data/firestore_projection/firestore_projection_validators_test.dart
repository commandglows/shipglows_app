import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/firestore_projection/firestore_projection_models.dart';
import 'package:shipglows_app/data/firestore_projection/firestore_projection_validators.dart';

void main() {
  group('FirestoreProjectionValidators', () {
    test('rejects forbidden client fields', () {
      expect(
        () => FirestoreProjectionValidators.validateClientWritablePayload(
          <String, Object?>{'sourceCommit': 'abc123', 'title': 'demo'},
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });

    test('rejects secret-like payload keys', () {
      expect(
        () => FirestoreProjectionValidators.validateNoSecretLikeFields(
          <String, Object?>{
            'github': <String, Object?>{'installationToken': 'x'},
          },
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
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
      expect(
        () => FirestoreProjectionValidators.validateSourceCommit('abcdef1'),
        returnsNormally,
      );
    });

    test('validates request ids and GitHub repository identity', () {
      expect(
        () => FirestoreProjectionValidators.validateRequestId('req-123456'),
        returnsNormally,
      );
      expect(
        () => FirestoreProjectionValidators.validateRequestId('short'),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
      expect(
        () => FirestoreProjectionValidators.validateGitHubRepository(
          owner: 'octocat',
          repo: 'hello-world',
          fullName: 'octocat/hello-world',
        ),
        returnsNormally,
      );
      expect(
        () => FirestoreProjectionValidators.validateGitHubRepository(
          owner: 'octocat',
          repo: 'hello-world',
          fullName: 'octocat/other',
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });

    test('prevents overlapping active runs but allows idempotent replay', () {
      final active = ActiveIndexRunRecord(
        runId: 'run-1',
        requestId: 'req-123456',
        status: IndexRunStatus.running,
        startedAt: DateTime.utc(2026, 5, 14),
      );
      expect(
        () => FirestoreProjectionValidators.validateOneActiveRun(
          activeRun: active,
          requestId: 'req-123456',
        ),
        returnsNormally,
      );
      expect(
        () => FirestoreProjectionValidators.validateOneActiveRun(
          activeRun: active,
          requestId: 'req-abcdef',
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });

    test('enforces indexing byte budgets', () {
      expect(
        () => FirestoreProjectionValidators.validateIndexFileBytes(
          maxIndexFileBytes,
        ),
        returnsNormally,
      );
      expect(
        () => FirestoreProjectionValidators.validateIndexFileBytes(
          maxIndexFileBytes + 1,
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
      expect(
        () => FirestoreProjectionValidators.validateIndexRefreshBytes(
          maxIndexRefreshBytes,
        ),
        returnsNormally,
      );
      expect(
        () => FirestoreProjectionValidators.validateIndexRefreshBytes(
          maxIndexRefreshBytes + 1,
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });

    test('accepts owner and viewer roles', () {
      expect(
        () => FirestoreProjectionValidators.validateProjectRole(
          ShipGlowsProjectRole.owner,
        ),
        returnsNormally,
      );
      expect(
        () => FirestoreProjectionValidators.validateProjectRole(
          ShipGlowsProjectRole.viewer,
        ),
        returnsNormally,
      );
    });

    test('retains latest 20 index runs', () {
      List<IndexRunRecord> runs(int count) => List.generate(
        count,
        (i) => IndexRunRecord(
          runId: 'run-$i',
          requestId: 'req-retain-$i',
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
