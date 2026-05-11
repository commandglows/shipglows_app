import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;

import 'io_stub.dart' if (dart.library.io) 'io_native.dart';

import 'source_diagnostic_helpers.dart';
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
               .map(_normalizeRoot)
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
    return switch (defaultTargetPlatform) {
      TargetPlatform.linux ||
      TargetPlatform.macOS ||
      TargetPlatform.windows => true,
      _ => false,
    };
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
    if (!isDesktopSupported) {
      return PathCheckResult(
        allowed: false,
        path: path,
        redactedPath: redacted,
        diagnostic: SourceDiagnostic(
          code: DiagnosticCode.unsupportedSource,
          severity: DiagnosticSeverity.error,
          message: 'Path resolution is disabled on this platform.',
          source: redacted,
          details: diagnosticDetails({
            'targetPlatform': defaultTargetPlatform.name,
            'supportsLocalFileSystem': supportsLocalFileSystem,
          }),
          suggestedCommand: 'flutter run -d linux',
        ),
      );
    }
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
          details: diagnosticDetails({'rawPathLength': rawPath.length}),
          suggestedCommand: '/sf-verify ShipFlow source inventory',
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
          details: diagnosticDetails({
            'rawPath': redacted,
            'allowedRoots': allowedRoots.join(', '),
          }),
          suggestedCommand: '/sf-verify ShipFlow source inventory',
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
          details: diagnosticDetails({
            'resolvedPath': redactPath(resolved),
            'allowedRoots': allowedRoots.join(', '),
          }),
          suggestedCommand: '/sf-verify ShipFlow source inventory',
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

  static String _normalizeRoot(String rawRoot) {
    final normalized = rawRoot.trim();
    if (normalized.isEmpty) {
      return normalized;
    }
    if (supportsLocalFileSystem) {
      return Directory(normalized).absolute.path;
    }
    return p.normalize(normalized);
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
