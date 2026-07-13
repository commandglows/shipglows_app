import 'dart:io';

import 'source_diagnostic_helpers.dart';
import 'source_models.dart';
import 'source_path_policy.dart';

class SourceFileReader {
  SourceFileReader({
    required this.pathPolicy,
    this.shipglowzDataRoot = '/home/claude/shipglowz_data',
    this.shipglowzRoot = '/home/claude/shipglowz',
  });

  final SourcePathPolicy pathPolicy;
  final String shipglowzDataRoot;
  final String shipglowzRoot;

  static const _projectLocalSourceFiles = [
    'shipglowz_data/workflow/AUDIT_LOG.md',
    'shipglowz_data/workflow/TASKS.md',
    'CHANGELOG.md',
    'shipglowz_data/business/business.md',
    'shipglowz_data/business/product.md',
    'shipglowz_data/technical/guidelines.md',
    'shipglowz_data/technical/architecture.md',
  ];

  Future<SourceSnapshot> load() async {
    final diagnostics = <SourceDiagnostic>[];
    final documents = <String, SourceDocument>{};

    if (!pathPolicy.isDesktopSupported) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.unsupportedSource,
          severity: DiagnosticSeverity.error,
          message:
              'Local filesystem reading is supported only on desktop targets.',
          source: 'platform',
          suggestedCommand: 'flutter run -d linux',
          details: diagnosticDetails({
            'supportedTargets': 'linux, macos, windows',
          }),
        ),
      );
      return SourceSnapshot(
        documents: documents,
        diagnostics: diagnostics,
        loadedAt: DateTime.now().toUtc(),
      );
    }

    final baseSources = <String>[
      '$shipglowzDataRoot/PROJECTS.md',
      '$shipglowzDataRoot/AUDIT_LOG.md',
      '$shipglowzDataRoot/TASKS.md',
      '$shipglowzDataRoot/OPERATIONS_LOG.md',
      '$shipglowzDataRoot/DEPENDENCY_LOG.md',
    ];

    var totalBytes = 0;
    final projectPaths = <String>{};
    for (final source in baseSources) {
      final doc = await _readOne(
        source,
        diagnostics: diagnostics,
        currentTotalBytes: totalBytes,
      );
      if (doc == null) {
        continue;
      }
      totalBytes += utf8Length(doc.content);
      documents[doc.path] = doc;

      if (source.endsWith('/PROJECTS.md')) {
        projectPaths.addAll(_extractProjectPaths(doc.content));
      }
    }

    final specsDirectory = Directory(
      '$shipglowzRoot/shipglowz_data/workflow/specs',
    );
    final specFiles = specsDirectory.existsSync()
        ? specsDirectory
              .listSync(recursive: false, followLinks: false)
              .whereType<File>()
              .where((file) => file.path.endsWith('.md'))
              .map((file) => file.path)
        : const <String>[];

    final projectLocalFiles = projectPaths.expand(
      (projectPath) =>
          _projectLocalSourceFiles.map((fileName) => '$projectPath/$fileName'),
    );

    for (final source in [...specFiles, ...projectLocalFiles]) {
      if (totalBytes >= pathPolicy.maxTotalBytes) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.sourceTooLarge,
            severity: DiagnosticSeverity.error,
            message:
                'Total refresh size exceeds limit (${pathPolicy.maxTotalBytes} bytes).',
            source: source,
            details: diagnosticDetails({
              'currentTotalBytes': totalBytes,
              'maxTotalBytes': pathPolicy.maxTotalBytes,
            }),
            suggestedCommand: '/sf-verify ShipGlowz source inventory',
          ),
        );
        break;
      }

      final doc = await _readOne(
        source,
        diagnostics: diagnostics,
        currentTotalBytes: totalBytes,
      );
      if (doc == null) {
        continue;
      }
      totalBytes += utf8Length(doc.content);
      documents[doc.path] = doc;
    }

    return SourceSnapshot(
      documents: documents,
      diagnostics: diagnostics,
      loadedAt: DateTime.now().toUtc(),
    );
  }

  Future<SourceDocument?> _readOne(
    String rawPath, {
    required List<SourceDiagnostic> diagnostics,
    required int currentTotalBytes,
  }) async {
    final check = pathPolicy.checkPath(rawPath);
    if (!check.allowed) {
      if (check.diagnostic != null) {
        diagnostics.add(check.diagnostic!);
      }
      return null;
    }

    final file = File(check.path);
    if (!file.existsSync()) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.sourceGap,
          severity: DiagnosticSeverity.warning,
          message: 'Source file is missing.',
          source: check.redactedPath,
          details: diagnosticDetails({
            'resolvedPath': check.redactedPath,
            'allowedRoots': pathPolicy.allowedRoots.join(', '),
          }),
          suggestedCommand: '/sf-verify ShipGlowz source inventory',
        ),
      );
      return null;
    }

    try {
      final stat = file.statSync();
      if (stat.size > pathPolicy.maxFileBytes) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.sourceTooLarge,
            severity: DiagnosticSeverity.error,
            message:
                'Source file exceeds limit (${pathPolicy.maxFileBytes} bytes).',
            source: check.redactedPath,
            details: diagnosticDetails({
              'fileSizeBytes': stat.size,
              'maxFileBytes': pathPolicy.maxFileBytes,
            }),
            suggestedCommand: '/sf-verify ShipGlowz source inventory',
          ),
        );
        return null;
      }
      if (currentTotalBytes + stat.size > pathPolicy.maxTotalBytes) {
        diagnostics.add(
          SourceDiagnostic(
            code: DiagnosticCode.sourceTooLarge,
            severity: DiagnosticSeverity.error,
            message:
                'Skipping file because total refresh would exceed limit (${pathPolicy.maxTotalBytes} bytes).',
            source: check.redactedPath,
            details: diagnosticDetails({
              'fileSizeBytes': stat.size,
              'currentTotalBytes': currentTotalBytes,
              'maxTotalBytes': pathPolicy.maxTotalBytes,
            }),
            suggestedCommand: '/sf-verify ShipGlowz source inventory',
          ),
        );
        return null;
      }

      final content = await file.readAsString();
      return SourceDocument(
        path: check.path,
        redactedPath: check.redactedPath,
        content: content,
      );
    } on FileSystemException catch (error) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.permissionDenied,
          severity: DiagnosticSeverity.error,
          message: 'Filesystem error while reading source.',
          source: check.redactedPath,
          cause: diagnosticCause(error),
          details: diagnosticDetails({
            'osError': error.osError?.message,
            'osErrorCode': error.osError?.errorCode,
            'path': check.redactedPath,
          }),
          suggestedCommand: '/sf-verify ShipGlowz source inventory',
        ),
      );
      return null;
    }
  }

  Iterable<String> _extractProjectPaths(String markdown) sync* {
    final lines = markdown.split('\n');
    var inTable = false;
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.startsWith('| Name | Path |')) {
        inTable = true;
        continue;
      }
      if (!inTable) {
        continue;
      }
      if (trimmed.isEmpty || !trimmed.startsWith('|')) {
        break;
      }
      if (trimmed.startsWith('|------')) {
        continue;
      }

      final cells = trimmed
          .split('|')
          .map((value) => value.trim())
          .where((value) => value.isNotEmpty)
          .toList();
      if (cells.length < 2) {
        continue;
      }
      yield cells[1];
    }
  }
}

int utf8Length(String text) => text.codeUnits.length;
