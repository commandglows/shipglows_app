import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/firestore_projection/firestore_projection_models.dart';
import 'package:shipglows_app/data/firestore_projection/firestore_projection_validators.dart';
import 'package:shipglows_app/data/shipglows_sources/local_fake_clone_indexer.dart';
import 'package:shipglows_app/data/shipglows_sources/source_path_policy.dart';

void main() {
  setUp(() {
    debugDefaultTargetPlatformOverride = TargetPlatform.linux;
  });

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
  });

  group('LocalFakeCloneIndexer', () {
    test('indexes allowed Markdown into Firestore-shaped records', () async {
      final repo = await _repoFixture();
      final indexer = _indexer(repo);

      File(
        '${repo.path}/shipglows_data/technical/firestore-data-model.md',
      ).writeAsStringSync('''
---
artifact: technical_module_context
status: draft
---
# Firestore
''');
      Directory('${repo.path}/docs').createSync();
      File('${repo.path}/docs/random.md').writeAsStringSync('# ignored');

      final result = await indexer.index(
        _request(repo, sourceCommit: 'abcdef1'),
      );

      expect(result.run.status, IndexRunStatus.success);
      expect(result.projectionStatus, ProjectionStatus.fresh);
      expect(result.files, hasLength(1));
      expect(
        result.files.single.path,
        'shipglows_data/technical/firestore-data-model.md',
      );
      expect(
        result.files.single.frontmatter['artifact'],
        'technical_module_context',
      );
      expect(result.toMap().toString(), isNot(contains('/tmp/')));
      expect(
        () => FirestoreProjectionValidators.validateNoSecretLikeFields(
          result.toMap(),
        ),
        returnsNormally,
      );
    });

    test('returns existing active run for duplicate requestId', () async {
      final repo = await _repoFixture();
      final indexer = _indexer(repo);
      final active = ActiveIndexRunRecord(
        runId: 'run-existing',
        requestId: 'req-123456',
        status: IndexRunStatus.running,
        startedAt: DateTime.utc(2026, 5, 14),
      );

      final result = await indexer.index(_request(repo, activeRun: active));

      expect(result.run.status, IndexRunStatus.alreadyRunning);
      expect(result.run.runId, 'run-existing');
      expect(result.diagnostics.single.code, 'already_running');
    });

    test('rejects overlapping different requestId', () async {
      final repo = await _repoFixture();
      final indexer = _indexer(repo);
      final active = ActiveIndexRunRecord(
        runId: 'run-existing',
        requestId: 'req-123456',
        status: IndexRunStatus.running,
        startedAt: DateTime.utc(2026, 5, 14),
      );

      expect(
        () => indexer.index(
          _request(repo, requestId: 'req-abcdef', activeRun: active),
        ),
        throwsA(isA<FirestoreProjectionValidationError>()),
      );
    });

    test(
      'redacts managed clone filesystem paths in failure diagnostics',
      () async {
        final repo = await _repoFixture();
        final indexer = _indexer(repo);

        final result = await indexer.index(
          _request(
            repo,
            requestId: 'req-missing1',
            repositoryPath: '${repo.path}/missing',
          ),
        );

        expect(result.run.status, IndexRunStatus.failed);
        expect(result.diagnostics.single.redactedPath, '[managed-clone]');
        expect(result.toMap().toString(), isNot(contains(repo.path)));
      },
    );

    test(
      'surfaces access denied, token retry, materialization and projection failures',
      () async {
        final repo = await _repoFixture();
        final indexer = _indexer(repo);

        final accessDenied = await indexer.index(
          _request(repo, accessStatus: GitHubAccessStatus.githubAccessLost),
        );
        expect(accessDenied.projectionStatus, ProjectionStatus.accessLost);
        expect(accessDenied.diagnostics.single.code, 'access_denied');

        final tokenRetry = await indexer.index(
          _request(repo, requestId: 'req-token1', failTokenThenRetry: true),
        );
        expect(
          tokenRetry.diagnostics.map((diag) => diag.code),
          contains('token_refresh_retried'),
        );

        final materializationFailed = await indexer.index(
          _request(
            repo,
            requestId: 'req-clone1',
            failRepositoryMaterialization: true,
          ),
        );
        expect(materializationFailed.run.status, IndexRunStatus.failed);
        expect(
          materializationFailed.diagnostics.map((diag) => diag.code),
          contains('clone_failed'),
        );

        final projectionFailed = await indexer.index(
          _request(repo, requestId: 'req-proj01', failProjection: true),
        );
        expect(projectionFailed.projectionStatus, ProjectionStatus.error);
        expect(
          projectionFailed.diagnostics.map((diag) => diag.code),
          contains('projection_failed'),
        );
      },
    );

    test(
      'records parse failures, oversized files, refresh budget, and deleted tombstones',
      () async {
        final repo = await _repoFixture();
        final indexer = _indexer(repo, maxFileBytes: 30, maxTotalBytes: 80);
        File('${repo.path}/shipglows_data/business/business.md')
          ..createSync(recursive: true)
          ..writeAsStringSync('# ok');
        File('${repo.path}/shipglows_data/editorial/content-map.md')
          ..createSync(recursive: true)
          ..writeAsStringSync('---\nartifact: [bad\n---\n# bad');
        File('${repo.path}/shipglows_data/technical/large.md')
          ..createSync(recursive: true)
          ..writeAsStringSync('# ${List.filled(80, 'x').join()}');
        File('${repo.path}/shipglows_data/workflow/TASKS.md')
          ..createSync(recursive: true)
          ..writeAsStringSync('# ${List.filled(40, 'y').join()}');

        final previous = IndexedFileRecord(
          fileId: 'old_file',
          path: 'shipglows_data/workflow/specs/deleted.md',
          artifactType: 'spec',
          sourceCommit: 'aaaaaaa',
          contentHash: 'fnv64:old',
          projectionStatus: ProjectionStatus.fresh,
          deleted: false,
          indexedAt: DateTime.utc(2026, 5, 1),
        );

        final result = await indexer.index(
          _request(repo, requestId: 'req-budget1', previousFiles: [previous]),
        );

        expect(result.run.status, IndexRunStatus.partial);
        expect(
          result.files.any(
            (file) => file.parseStatus == IndexedFileParseStatus.parseFailed,
          ),
          isTrue,
        );
        expect(result.files.any((file) => file.deleted), isTrue);
        expect(
          result.diagnostics.map((diag) => diag.code),
          containsAll(['parse_failed', 'source_too_large', 'deleted_file']),
        );
      },
    );

    test(
      'records refresh budget exhaustion as a redacted diagnostic',
      () async {
        final repo = await _repoFixture();
        final indexer = _indexer(repo, maxFileBytes: 100, maxTotalBytes: 30);
        File('${repo.path}/shipglows_data/business/business.md')
          ..createSync(recursive: true)
          ..writeAsStringSync('# ${List.filled(40, 'x').join()}');

        final result = await indexer.index(
          _request(repo, requestId: 'req-refresh1'),
        );

        expect(result.run.status, IndexRunStatus.partial);
        expect(result.files, isEmpty);
        expect(
          result.diagnostics.map((diag) => diag.code),
          contains('refresh_too_large'),
        );
      },
    );
  });
}

Future<Directory> _repoFixture() async {
  final repo = await Directory.systemTemp.createTemp('shipglows_fake_repo_');
  Directory('${repo.path}/shipglows_data/business').createSync(recursive: true);
  Directory('${repo.path}/shipglows_data/editorial').createSync(recursive: true);
  Directory('${repo.path}/shipglows_data/technical').createSync(recursive: true);
  Directory(
    '${repo.path}/shipglows_data/workflow/specs',
  ).createSync(recursive: true);
  addTearDown(() => repo.delete(recursive: true));
  return repo;
}

LocalFakeCloneIndexer _indexer(
  Directory repo, {
  int maxFileBytes = 2 * 1024 * 1024,
  int maxTotalBytes = 20 * 1024 * 1024,
}) {
  return LocalFakeCloneIndexer(
    pathPolicy: SourcePathPolicy(
      allowedRoots: [repo.path],
      maxFileBytes: maxFileBytes,
      maxTotalBytes: maxTotalBytes,
    ),
    clock: () => DateTime.utc(2026, 5, 14, 12),
  );
}

LocalFakeIndexRequest _request(
  Directory repo, {
  String requestId = 'req-123456',
  String? repositoryPath,
  String sourceCommit = 'abcdef1',
  List<IndexedFileRecord> previousFiles = const <IndexedFileRecord>[],
  ActiveIndexRunRecord? activeRun,
  GitHubAccessStatus accessStatus = GitHubAccessStatus.connected,
  bool failTokenThenRetry = false,
  bool failRepositoryMaterialization = false,
  bool failProjection = false,
}) {
  return LocalFakeIndexRequest(
    projectId: 'proj_123',
    requestId: requestId,
    repositoryPath: repositoryPath ?? repo.path,
    githubOwner: 'octocat',
    githubRepo: 'hello-world',
    sourceCommit: sourceCommit,
    previousFiles: previousFiles,
    activeRun: activeRun,
    accessStatus: accessStatus,
    failTokenThenRetry: failTokenThenRetry,
    failRepositoryMaterialization: failRepositoryMaterialization,
    failProjection: failProjection,
  );
}
