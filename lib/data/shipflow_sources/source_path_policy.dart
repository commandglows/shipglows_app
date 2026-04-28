import 'dart:io';

import 'package:flutter/foundation.dart';

import 'source_models.dart';

class PathCheckResult {
  const PathCheckResult({
    required this.allowed,
    required this.path,
    required this.redactedPath,
    this.diagnostic,
  });

  final bool allowed;
  final String path;
  final String redactedPath;
  final SourceDiagnostic? diagnostic;
}

class SourcePathPolicy {
  SourcePathPolicy({
    required List<String> allowedRoots,
    this.maxFileBytes = 2 * 1024 * 1024,
    this.maxTotalBytes = 20 * 1024 * 1024,
  }) : allowedRoots =
           allowedRoots
               .map((root) => Directory(root).absolute.path)
               .toSet()
               .toList()
             ..sort();

  final List<String> allowedRoots;
  final int maxFileBytes;
  final int maxTotalBytes;

  static SourcePathPolicy defaultPolicy() {
    return SourcePathPolicy(
      allowedRoots: const [
        '/home/claude/shipflow',
        '/home/claude/shipflow_data',
        '/home/claude/shipflow_app',
      ],
    );
  }

  bool get isDesktopSupported {
    if (kIsWeb) {
      return false;
    }
    return Platform.isLinux || Platform.isMacOS || Platform.isWindows;
  }

  String redactPath(String rawPath) {
    final normalized = rawPath.trim();
    final segments = normalized.split('/');
    final shouldRedact = segments.any(
      (segment) => _isSensitiveSegment(segment.toLowerCase()),
    );
    if (!shouldRedact) {
      return normalized;
    }
    if (segments.length <= 2) {
      return '[redacted]';
    }
    final head = segments.take(2).join('/');
    final tail = segments.isNotEmpty ? segments.last : '';
    return '$head/.../$tail';
  }

  PathCheckResult checkPath(String rawPath) {
    final path = rawPath.trim();
    final redacted = redactPath(path);
    if (path.isEmpty) {
      return PathCheckResult(
        allowed: false,
        path: path,
        redactedPath: redacted,
        diagnostic: SourceDiagnostic(
          code: DiagnosticCode.sourceGap,
          severity: DiagnosticSeverity.error,
          message: 'Source path is empty.',
          source: redacted,
        ),
      );
    }

    final file = File(path);
    final resolved = _resolvePath(file);
    if (resolved == null) {
      return PathCheckResult(
        allowed: false,
        path: path,
        redactedPath: redacted,
        diagnostic: SourceDiagnostic(
          code: DiagnosticCode.pathDenied,
          severity: DiagnosticSeverity.error,
          message: 'Path cannot be resolved.',
          source: redacted,
        ),
      );
    }

    if (!_isInsideAllowedRoots(resolved)) {
      return PathCheckResult(
        allowed: false,
        path: resolved,
        redactedPath: redactPath(resolved),
        diagnostic: SourceDiagnostic(
          code: DiagnosticCode.pathDenied,
          severity: DiagnosticSeverity.error,
          message: 'Source is outside allowed roots.',
          source: redactPath(resolved),
        ),
      );
    }

    return PathCheckResult(
      allowed: true,
      path: resolved,
      redactedPath: redactPath(resolved),
    );
  }

  String? _resolvePath(File file) {
    try {
      if (file.existsSync()) {
        final resolved = file.resolveSymbolicLinksSync();
        return File(resolved).absolute.path;
      }
      // Resolve non-existing files for deterministic diagnostics.
      return file.absolute.path;
    } on FileSystemException {
      return null;
    }
  }

  bool _isInsideAllowedRoots(String resolvedPath) {
    for (final root in allowedRoots) {
      if (resolvedPath == root || resolvedPath.startsWith('$root/')) {
        return true;
      }
    }
    return false;
  }

  bool _isSensitiveSegment(String segment) {
    return segment.contains('.env') ||
        segment.contains('secret') ||
        segment.contains('token') ||
        segment.contains('key') ||
        segment.contains('auth') ||
        segment.contains('cookie');
  }
}
