import 'dart:convert';
import 'dart:io';

import 'package:yaml/yaml.dart';

import '../firestore_projection/firestore_projection_models.dart';
import '../firestore_projection/firestore_projection_validators.dart';
import 'shipglowz_artifact_index_policy.dart';
import 'source_file_reader.dart';
import 'source_models.dart';
import 'source_path_policy.dart';

class LocalFakeIndexRequest {
  const LocalFakeIndexRequest({
    required this.projectId,
    required this.requestId,
    required this.repositoryPath,
    required this.githubOwner,
    required this.githubRepo,
    required this.sourceCommit,
    this.previousFiles = const <IndexedFileRecord>[],
    this.activeRun,
    this.accessStatus = GitHubAccessStatus.connected,
    this.failTokenThenRetry = false,
    this.failRepositoryMaterialization = false,
    this.failProjection = false,
  });

  final String projectId;
  final String requestId;
  final String repositoryPath;
  final String githubOwner;
  final String githubRepo;
  final String sourceCommit;
  final List<IndexedFileRecord> previousFiles;
  final ActiveIndexRunRecord? activeRun;
  final GitHubAccessStatus accessStatus;
  final bool failTokenThenRetry;
  final bool failRepositoryMaterialization;
  final bool failProjection;
}

class LocalFakeIndexResult {
  const LocalFakeIndexResult({
    required this.run,
    required this.files,
    required this.diagnostics,
    required this.projectionStatus,
  });

  final IndexRunRecord run;
  final List<IndexedFileRecord> files;
  final List<DiagnosticRecord> diagnostics;
  final ProjectionStatus projectionStatus;

  Map<String, Object?> toMap() => <String, Object?>{
    'run': run.toMap(),
    'files': files.map((file) => file.toMap()).toList(growable: false),
    'diagnostics': diagnostics
        .map((diagnostic) => diagnostic.toMap())
        .toList(growable: false),
    'projectionStatus': projectionStatus.wireName,
  };
}

class LocalFakeCloneIndexer {
  LocalFakeCloneIndexer({
    required this.pathPolicy,
    ShipGlowzArtifactIndexPolicy? artifactPolicy,
    DateTime Function()? clock,
  }) : artifactPolicy = artifactPolicy ?? const ShipGlowzArtifactIndexPolicy(),
       _clock = clock ?? (() => DateTime.now().toUtc());

  final SourcePathPolicy pathPolicy;
  final ShipGlowzArtifactIndexPolicy artifactPolicy;
  final DateTime Function() _clock;

  static const _managedCloneRedactedPath = '[managed-clone]';

  Future<LocalFakeIndexResult> index(LocalFakeIndexRequest request) async {
    FirestoreProjectionValidators.validateRequestId(request.requestId);
    FirestoreProjectionValidators.validateSourceCommit(request.sourceCommit);
    FirestoreProjectionValidators.validateGitHubRepository(
      owner: request.githubOwner,
      repo: request.githubRepo,
      fullName: '${request.githubOwner}/${request.githubRepo}',
    );
    FirestoreProjectionValidators.validateOneActiveRun(
      activeRun: request.activeRun,
      requestId: request.requestId,
    );

    final startedAt = _clock();
    final runId = _runId(request);
    final diagnostics = <DiagnosticRecord>[];
    final previousByPath = {
      for (final file in request.previousFiles) file.path: file,
    };

    if (request.activeRun != null &&
        request.activeRun!.requestId == request.requestId) {
      return _result(
        request: request,
        runId: request.activeRun!.runId,
        startedAt: request.activeRun!.startedAt,
        status: IndexRunStatus.alreadyRunning,
        projectionStatus: ProjectionStatus.indexing,
        diagnostics: [
          _diagnostic(
            RunnerDiagnosticCode.alreadyRunning,
            'Index request is already active.',
          ),
        ],
      );
    }

    if (request.accessStatus != GitHubAccessStatus.connected &&
        request.accessStatus != GitHubAccessStatus.accessCached) {
      return _result(
        request: request,
        runId: runId,
        startedAt: startedAt,
        status: IndexRunStatus.failed,
        projectionStatus: ProjectionStatus.accessLost,
        diagnostics: [
          _diagnostic(
            RunnerDiagnosticCode.accessDenied,
            'GitHub access was not valid for this repository.',
          ),
        ],
      );
    }

    if (request.failTokenThenRetry) {
      diagnostics.add(
        _diagnostic(
          RunnerDiagnosticCode.tokenRefreshRetried,
          'Repository access token expired once and was regenerated for a bounded retry.',
        ),
      );
    }

    if (request.failRepositoryMaterialization) {
      return _result(
        request: request,
        runId: runId,
        startedAt: startedAt,
        status: IndexRunStatus.failed,
        projectionStatus: ProjectionStatus.stale,
        diagnostics: [
          ...diagnostics,
          _diagnostic(
            RunnerDiagnosticCode.cloneFailed,
            'Managed repository materialization failed.',
          ),
        ],
      );
    }

    final repositoryCheck = pathPolicy.checkPath(request.repositoryPath);
    if (!repositoryCheck.allowed) {
      return _result(
        request: request,
        runId: runId,
        startedAt: startedAt,
        status: IndexRunStatus.failed,
        projectionStatus: ProjectionStatus.error,
        diagnostics: [
          ...diagnostics,
          _diagnostic(
            RunnerDiagnosticCode.cloneFailed,
            'Repository path is outside the local fake runner allowlist.',
            redactedPath: _managedCloneRedactedPath,
          ),
        ],
      );
    }

    final root = Directory(repositoryCheck.path);
    if (!root.existsSync()) {
      return _result(
        request: request,
        runId: runId,
        startedAt: startedAt,
        status: IndexRunStatus.failed,
        projectionStatus: ProjectionStatus.error,
        diagnostics: [
          ...diagnostics,
          _diagnostic(
            RunnerDiagnosticCode.cloneFailed,
            'Repository fixture directory is missing.',
            redactedPath: _managedCloneRedactedPath,
          ),
        ],
      );
    }

    final indexed = <IndexedFileRecord>[];
    var totalBytes = 0;
    for (final file in _candidateFiles(root)) {
      final relativePath = _relativePath(root.path, file.path);
      final classification = artifactPolicy.classify(relativePath);
      if (!classification.allowed) {
        continue;
      }
      final stat = file.statSync();
      if (stat.size > pathPolicy.maxFileBytes) {
        diagnostics.add(
          _diagnostic(
            RunnerDiagnosticCode.sourceTooLarge,
            'Indexed file exceeds the 2 MB budget.',
            redactedPath: relativePath,
          ),
        );
        continue;
      }
      if (totalBytes + stat.size > pathPolicy.maxTotalBytes) {
        diagnostics.add(
          _diagnostic(
            RunnerDiagnosticCode.refreshTooLarge,
            'Index refresh exceeds the 20 MB budget.',
            redactedPath: relativePath,
          ),
        );
        break;
      }
      final content = await file.readAsString();
      totalBytes += utf8Length(content);
      final parsed = _parseFrontmatter(content);
      if (parsed.failed) {
        diagnostics.add(
          _diagnostic(
            RunnerDiagnosticCode.parseFailed,
            'Markdown frontmatter could not be parsed.',
            redactedPath: relativePath,
          ),
        );
      }
      indexed.add(
        IndexedFileRecord(
          fileId: _fileId(relativePath),
          path: relativePath,
          artifactType: classification.artifactType!.name,
          sourceCommit: request.sourceCommit,
          contentHash: _contentHash(content),
          projectionStatus: parsed.failed
              ? ProjectionStatus.partial
              : ProjectionStatus.fresh,
          deleted: false,
          indexedAt: _clock(),
          parseStatus: parsed.failed
              ? IndexedFileParseStatus.parseFailed
              : IndexedFileParseStatus.parsed,
          frontmatter: parsed.frontmatter,
          markdownBody: content,
        ),
      );
      previousByPath.remove(relativePath);
    }

    for (final stale in previousByPath.values) {
      diagnostics.add(
        _diagnostic(
          RunnerDiagnosticCode.deletedFile,
          'Previously indexed file is missing from the latest source commit.',
          redactedPath: stale.path,
        ),
      );
      indexed.add(
        IndexedFileRecord(
          fileId: stale.fileId,
          path: stale.path,
          artifactType: stale.artifactType,
          sourceCommit: request.sourceCommit,
          contentHash: stale.contentHash,
          projectionStatus: ProjectionStatus.stale,
          deleted: true,
          indexedAt: _clock(),
          parseStatus: IndexedFileParseStatus.deleted,
        ),
      );
    }

    if (request.failProjection) {
      diagnostics.add(
        _diagnostic(
          RunnerDiagnosticCode.projectionFailed,
          'Firestore projection write failed after local indexing.',
        ),
      );
      return _result(
        request: request,
        runId: runId,
        startedAt: startedAt,
        status: IndexRunStatus.failed,
        projectionStatus: ProjectionStatus.error,
        diagnostics: diagnostics,
        files: indexed,
      );
    }

    final hasErrors = diagnostics.any(
      (diagnostic) =>
          diagnostic.severity == DiagnosticSeverity.error.name ||
          diagnostic.code == RunnerDiagnosticCode.parseFailed.wireName,
    );
    final status = hasErrors ? IndexRunStatus.partial : IndexRunStatus.success;
    return _result(
      request: request,
      runId: runId,
      startedAt: startedAt,
      status: status,
      projectionStatus: hasErrors
          ? ProjectionStatus.partial
          : ProjectionStatus.fresh,
      diagnostics: diagnostics,
      files: indexed,
    );
  }

  Iterable<File> _candidateFiles(Directory root) sync* {
    for (final entity in root.listSync(recursive: true, followLinks: false)) {
      if (entity is File) {
        yield entity;
      }
    }
  }

  String _relativePath(String rootPath, String filePath) {
    final root = rootPath.endsWith('/') ? rootPath : '$rootPath/';
    return filePath.startsWith(root)
        ? filePath.substring(root.length).replaceAll('\\', '/')
        : filePath.replaceAll('\\', '/');
  }

  LocalFakeIndexResult _result({
    required LocalFakeIndexRequest request,
    required String runId,
    required DateTime startedAt,
    required IndexRunStatus status,
    required ProjectionStatus projectionStatus,
    required List<DiagnosticRecord> diagnostics,
    List<IndexedFileRecord> files = const <IndexedFileRecord>[],
  }) {
    final run = IndexRunRecord(
      runId: runId,
      requestId: request.requestId,
      sourceCommit: request.sourceCommit,
      status: status,
      startedAt: startedAt,
      finishedAt: _clock(),
      filesIndexed: files.where((file) => !file.deleted).length,
      filesDeleted: files.where((file) => file.deleted).length,
    );
    final result = LocalFakeIndexResult(
      run: run,
      files: files,
      diagnostics: diagnostics,
      projectionStatus: projectionStatus,
    );
    FirestoreProjectionValidators.validateNoSecretLikeFields(result.toMap());
    return result;
  }

  DiagnosticRecord _diagnostic(
    RunnerDiagnosticCode code,
    String message, {
    String? redactedPath,
  }) {
    final severity = switch (code) {
      RunnerDiagnosticCode.tokenRefreshRetried ||
      RunnerDiagnosticCode.deletedFile ||
      RunnerDiagnosticCode.staleProjection => DiagnosticSeverity.warning.name,
      _ => DiagnosticSeverity.error.name,
    };
    return DiagnosticRecord(
      diagnosticId: 'diag_${code.name}_${_clock().microsecondsSinceEpoch}',
      code: code.wireName,
      severity: severity,
      message: message,
      createdAt: _clock(),
      redactedPath: redactedPath,
    );
  }

  String _runId(LocalFakeIndexRequest request) {
    return 'run_${_contentHash('${request.projectId}:${request.requestId}')}';
  }

  String _fileId(String path) {
    return path
        .replaceAll(RegExp(r'[^A-Za-z0-9]+'), '_')
        .replaceAll(RegExp(r'^_+|_+$'), '');
  }

  String _contentHash(String content) {
    const offset = 0xcbf29ce484222325;
    const prime = 0x100000001b3;
    var hash = offset;
    for (final byte in utf8.encode(content)) {
      hash ^= byte;
      hash = (hash * prime) & 0xFFFFFFFFFFFFFFFF;
    }
    return 'fnv64:${hash.toRadixString(16).padLeft(16, '0')}';
  }

  _FrontmatterResult _parseFrontmatter(String markdown) {
    final match = RegExp(r'^---\s*\n([\s\S]*?)\n---').firstMatch(markdown);
    if (match == null) {
      return const _FrontmatterResult(frontmatter: <String, Object?>{});
    }
    try {
      final yaml = loadYaml(match.group(1) ?? '');
      if (yaml is YamlMap) {
        return _FrontmatterResult(
          frontmatter: yaml.nodes.map(
            (key, value) => MapEntry(
              key.value.toString(),
              value.value is String || value.value is num || value.value is bool
                  ? value.value as Object
                  : value.value?.toString(),
            ),
          ),
        );
      }
      return const _FrontmatterResult(
        frontmatter: <String, Object?>{},
        failed: true,
      );
    } catch (_) {
      return const _FrontmatterResult(
        frontmatter: <String, Object?>{},
        failed: true,
      );
    }
  }
}

class _FrontmatterResult {
  const _FrontmatterResult({required this.frontmatter, this.failed = false});

  final Map<String, Object?> frontmatter;
  final bool failed;
}
