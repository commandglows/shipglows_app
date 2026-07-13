enum ShipGlowzArtifactType {
  business,
  editorial,
  technical,
  workflowTracker,
  spec,
  rootCompatibility,
}

class ShipGlowzArtifactClassification {
  const ShipGlowzArtifactClassification({
    required this.allowed,
    required this.path,
    this.artifactType,
    this.reason,
  });

  final bool allowed;
  final String path;
  final ShipGlowzArtifactType? artifactType;
  final String? reason;
}

class ShipGlowzArtifactIndexPolicy {
  const ShipGlowzArtifactIndexPolicy();

  static const Set<String> rootCompatibilityDocs = <String>{
    'AGENT.md',
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'CHANGELOG.md',
  };

  ShipGlowzArtifactClassification classify(String rawPath) {
    final path = _normalize(rawPath);
    if (path.isEmpty) {
      return const ShipGlowzArtifactClassification(
        allowed: false,
        path: '',
        reason: 'empty_path',
      );
    }
    if (_containsDeniedSegment(path)) {
      return ShipGlowzArtifactClassification(
        allowed: false,
        path: path,
        reason: 'denied_segment',
      );
    }
    if (!path.endsWith('.md')) {
      return ShipGlowzArtifactClassification(
        allowed: false,
        path: path,
        reason: 'not_markdown',
      );
    }
    if (_matchesDirectoryGlob(path, 'shipglowz_data/business/')) {
      return _allowed(path, ShipGlowzArtifactType.business);
    }
    if (_matchesDirectoryGlob(path, 'shipglowz_data/editorial/')) {
      return _allowed(path, ShipGlowzArtifactType.editorial);
    }
    if (_matchesDirectoryGlob(path, 'shipglowz_data/technical/')) {
      return _allowed(path, ShipGlowzArtifactType.technical);
    }
    if (path == 'shipglowz_data/workflow/TASKS.md' ||
        path == 'shipglowz_data/workflow/AUDIT_LOG.md') {
      return _allowed(path, ShipGlowzArtifactType.workflowTracker);
    }
    if (_matchesDirectoryGlob(path, 'shipglowz_data/workflow/specs/')) {
      return _allowed(path, ShipGlowzArtifactType.spec);
    }
    if (!path.contains('/') && rootCompatibilityDocs.contains(path)) {
      return _allowed(path, ShipGlowzArtifactType.rootCompatibility);
    }
    return ShipGlowzArtifactClassification(
      allowed: false,
      path: path,
      reason: 'outside_shipglowz_allowlist',
    );
  }

  List<ShipGlowzArtifactClassification> selectAllowed(
    Iterable<String> rawPaths,
  ) {
    final classifications = rawPaths.map(classify).toList(growable: false);
    final hasShipGlowzData = classifications.any(
      (item) => item.allowed && item.path.startsWith('shipglowz_data/'),
    );
    return classifications
        .where(
          (item) =>
              item.allowed &&
              (!hasShipGlowzData ||
                  item.artifactType != ShipGlowzArtifactType.rootCompatibility),
        )
        .toList(growable: false);
  }

  ShipGlowzArtifactClassification _allowed(
    String path,
    ShipGlowzArtifactType type,
  ) {
    return ShipGlowzArtifactClassification(
      allowed: true,
      path: path,
      artifactType: type,
    );
  }

  bool _matchesDirectoryGlob(String path, String prefix) {
    if (!path.startsWith(prefix)) {
      return false;
    }
    final remainder = path.substring(prefix.length);
    return remainder.isNotEmpty && !remainder.contains('/');
  }

  bool _containsDeniedSegment(String path) {
    final segments = path.split('/');
    return segments.any(
      (segment) =>
          segment == '.git' ||
          segment == 'build' ||
          segment == '.dart_tool' ||
          segment == 'node_modules' ||
          segment == '.env' ||
          segment.toLowerCase().contains('secret'),
    );
  }

  String _normalize(String rawPath) {
    return rawPath.trim().replaceAll('\\', '/').replaceAll(RegExp(r'/+'), '/');
  }
}
