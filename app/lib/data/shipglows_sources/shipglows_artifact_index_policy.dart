enum ShipGlowsArtifactType {
  business,
  editorial,
  technical,
  workflowTracker,
  spec,
  rootCompatibility,
}

class ShipGlowsArtifactClassification {
  const ShipGlowsArtifactClassification({
    required this.allowed,
    required this.path,
    this.artifactType,
    this.reason,
  });

  final bool allowed;
  final String path;
  final ShipGlowsArtifactType? artifactType;
  final String? reason;
}

class ShipGlowsArtifactIndexPolicy {
  const ShipGlowsArtifactIndexPolicy();

  static const Set<String> rootCompatibilityDocs = <String>{
    'AGENT.md',
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'CHANGELOG.md',
  };

  ShipGlowsArtifactClassification classify(String rawPath) {
    final path = _normalize(rawPath);
    if (path.isEmpty) {
      return const ShipGlowsArtifactClassification(
        allowed: false,
        path: '',
        reason: 'empty_path',
      );
    }
    if (_containsDeniedSegment(path)) {
      return ShipGlowsArtifactClassification(
        allowed: false,
        path: path,
        reason: 'denied_segment',
      );
    }
    if (!path.endsWith('.md')) {
      return ShipGlowsArtifactClassification(
        allowed: false,
        path: path,
        reason: 'not_markdown',
      );
    }
    if (_matchesDirectoryGlob(path, 'shipglows_data/business/')) {
      return _allowed(path, ShipGlowsArtifactType.business);
    }
    if (_matchesDirectoryGlob(path, 'shipglows_data/editorial/')) {
      return _allowed(path, ShipGlowsArtifactType.editorial);
    }
    if (_matchesDirectoryGlob(path, 'shipglows_data/technical/')) {
      return _allowed(path, ShipGlowsArtifactType.technical);
    }
    if (path == 'shipglows_data/workflow/TASKS.md' ||
        path == 'shipglows_data/workflow/AUDIT_LOG.md') {
      return _allowed(path, ShipGlowsArtifactType.workflowTracker);
    }
    if (_matchesDirectoryGlob(path, 'shipglows_data/workflow/specs/')) {
      return _allowed(path, ShipGlowsArtifactType.spec);
    }
    if (!path.contains('/') && rootCompatibilityDocs.contains(path)) {
      return _allowed(path, ShipGlowsArtifactType.rootCompatibility);
    }
    return ShipGlowsArtifactClassification(
      allowed: false,
      path: path,
      reason: 'outside_shipglows_allowlist',
    );
  }

  List<ShipGlowsArtifactClassification> selectAllowed(
    Iterable<String> rawPaths,
  ) {
    final classifications = rawPaths.map(classify).toList(growable: false);
    final hasShipGlowsData = classifications.any(
      (item) => item.allowed && item.path.startsWith('shipglows_data/'),
    );
    return classifications
        .where(
          (item) =>
              item.allowed &&
              (!hasShipGlowsData ||
                  item.artifactType != ShipGlowsArtifactType.rootCompatibility),
        )
        .toList(growable: false);
  }

  ShipGlowsArtifactClassification _allowed(
    String path,
    ShipGlowsArtifactType type,
  ) {
    return ShipGlowsArtifactClassification(
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
