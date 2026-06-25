enum ShipFlowArtifactType {
  business,
  editorial,
  technical,
  workflowTracker,
  spec,
  rootCompatibility,
}

class ShipFlowArtifactClassification {
  const ShipFlowArtifactClassification({
    required this.allowed,
    required this.path,
    this.artifactType,
    this.reason,
  });

  final bool allowed;
  final String path;
  final ShipFlowArtifactType? artifactType;
  final String? reason;
}

class ShipFlowArtifactIndexPolicy {
  const ShipFlowArtifactIndexPolicy();

  static const Set<String> rootCompatibilityDocs = <String>{
    'AGENT.md',
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'CHANGELOG.md',
  };

  ShipFlowArtifactClassification classify(String rawPath) {
    final path = _normalize(rawPath);
    if (path.isEmpty) {
      return const ShipFlowArtifactClassification(
        allowed: false,
        path: '',
        reason: 'empty_path',
      );
    }
    if (_containsDeniedSegment(path)) {
      return ShipFlowArtifactClassification(
        allowed: false,
        path: path,
        reason: 'denied_segment',
      );
    }
    if (!path.endsWith('.md')) {
      return ShipFlowArtifactClassification(
        allowed: false,
        path: path,
        reason: 'not_markdown',
      );
    }
    if (_matchesDirectoryGlob(path, 'shipflow_data/business/')) {
      return _allowed(path, ShipFlowArtifactType.business);
    }
    if (_matchesDirectoryGlob(path, 'shipflow_data/editorial/')) {
      return _allowed(path, ShipFlowArtifactType.editorial);
    }
    if (_matchesDirectoryGlob(path, 'shipflow_data/technical/')) {
      return _allowed(path, ShipFlowArtifactType.technical);
    }
    if (path == 'shipflow_data/workflow/TASKS.md' ||
        path == 'shipflow_data/workflow/AUDIT_LOG.md') {
      return _allowed(path, ShipFlowArtifactType.workflowTracker);
    }
    if (_matchesDirectoryGlob(path, 'shipflow_data/workflow/specs/')) {
      return _allowed(path, ShipFlowArtifactType.spec);
    }
    if (!path.contains('/') && rootCompatibilityDocs.contains(path)) {
      return _allowed(path, ShipFlowArtifactType.rootCompatibility);
    }
    return ShipFlowArtifactClassification(
      allowed: false,
      path: path,
      reason: 'outside_shipflow_allowlist',
    );
  }

  List<ShipFlowArtifactClassification> selectAllowed(
    Iterable<String> rawPaths,
  ) {
    final classifications = rawPaths.map(classify).toList(growable: false);
    final hasShipFlowData = classifications.any(
      (item) => item.allowed && item.path.startsWith('shipflow_data/'),
    );
    return classifications
        .where(
          (item) =>
              item.allowed &&
              (!hasShipFlowData ||
                  item.artifactType != ShipFlowArtifactType.rootCompatibility),
        )
        .toList(growable: false);
  }

  ShipFlowArtifactClassification _allowed(
    String path,
    ShipFlowArtifactType type,
  ) {
    return ShipFlowArtifactClassification(
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
