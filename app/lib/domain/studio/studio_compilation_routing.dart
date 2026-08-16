/// Closed, provider-neutral routing projection for a future Studio compiler
/// seam. It describes eligibility only: it cannot start a build or select a
/// provider, image, toolchain, or execution environment.
enum StudioArtifactTarget { astroWeb, flutterWeb, android, windows, ios }

String studioArtifactTargetCode(StudioArtifactTarget target) =>
    switch (target) {
      StudioArtifactTarget.astroWeb => 'ARTIFACT_ASTRO_WEB',
      StudioArtifactTarget.flutterWeb => 'ARTIFACT_FLUTTER_WEB',
      StudioArtifactTarget.android => 'ARTIFACT_ANDROID',
      StudioArtifactTarget.windows => 'ARTIFACT_WINDOWS',
      StudioArtifactTarget.ios => 'ARTIFACT_IOS',
    };

String studioArtifactTargetLabel(StudioArtifactTarget target) =>
    switch (target) {
      StudioArtifactTarget.astroWeb => 'Astro Web',
      StudioArtifactTarget.flutterWeb => 'Flutter Web',
      StudioArtifactTarget.android => 'Android',
      StudioArtifactTarget.windows => 'Windows',
      StudioArtifactTarget.ios => 'iOS',
    };

enum StudioProjectSupport { supported, unavailable, stale, error }

enum StudioCompilerAvailability {
  available,
  unavailable,
  ambiguous,
  stale,
  error,
}

enum StudioExecutionEnvironment { web, android, windows, apple }

enum StudioProjectKind { astro, flutter }

class StudioProjectArtifactDigest {
  const StudioProjectArtifactDigest({required this.path, required this.digest});

  final String path;
  final String digest;
}

String studioExecutionEnvironmentDescription(
  StudioExecutionEnvironment environment,
) => switch (environment) {
  StudioExecutionEnvironment.web => 'Environnement Web géré automatiquement',
  StudioExecutionEnvironment.android =>
    'Environnement Android géré automatiquement',
  StudioExecutionEnvironment.windows =>
    'Environnement Windows géré automatiquement',
  StudioExecutionEnvironment.apple =>
    'Environnement Apple géré automatiquement',
};

class StudioArtifactRoute {
  const StudioArtifactRoute({
    required this.target,
    required this.projectSupport,
    required this.compilerAvailability,
    required this.environment,
    required this.message,
  });

  final StudioArtifactTarget target;
  final StudioProjectSupport projectSupport;
  final StudioCompilerAvailability compilerAvailability;
  final StudioExecutionEnvironment environment;
  final String message;

  bool get projectSupported => projectSupport == StudioProjectSupport.supported;
  bool get compilerAvailable =>
      projectSupported &&
      compilerAvailability == StudioCompilerAvailability.available;

  String get accessibilitySummary =>
      '${studioArtifactTargetLabel(target)}. '
      '${studioExecutionEnvironmentDescription(environment)}. $message';
}

class StudioCompilationRoutingProjection {
  StudioCompilationRoutingProjection({
    required List<StudioArtifactRoute> routes,
    this.contractVersion,
    this.projectId,
    this.projectKind,
    this.sourceRevision,
    this.repositoryDigest,
    this.projectEvidenceDigest,
    this.artifactDigests = const [],
    this.observedAt,
    this.expiresAt,
  }) : routes = List.unmodifiable(routes) {
    if (routes.length != StudioArtifactTarget.values.length ||
        routes.map((route) => route.target).toSet().length != routes.length ||
        !StudioArtifactTarget.values.every(
          (target) => routes.any((route) => route.target == target),
        )) {
      throw ArgumentError.value(
        routes,
        'routes',
        'Studio routing must contain each artifact target exactly once.',
      );
    }
  }

  final List<StudioArtifactRoute> routes;
  final String? contractVersion;
  final String? projectId;
  final StudioProjectKind? projectKind;
  final String? sourceRevision;
  final String? repositoryDigest;
  final String? projectEvidenceDigest;
  final List<StudioProjectArtifactDigest> artifactDigests;
  final DateTime? observedAt;
  final DateTime? expiresAt;

  StudioArtifactRoute routeFor(StudioArtifactTarget target) =>
      routes.singleWhere((route) => route.target == target);

  List<StudioArtifactRoute> get projectSupportedRoutes =>
      List.unmodifiable(routes.where((route) => route.projectSupported));

  /// A single supported target can be displayed directly. Multiple supported
  /// targets deliberately require an operator selection; no hidden default is
  /// permitted before the API seam binds that selection to a compile intent.
  StudioArtifactTarget? get implicitTarget => projectSupportedRoutes.length == 1
      ? projectSupportedRoutes.single.target
      : null;

  static StudioCompilationRoutingProjection
  astroBridgeOnly() => StudioCompilationRoutingProjection(
    routes: const [
      StudioArtifactRoute(
        target: StudioArtifactTarget.astroWeb,
        projectSupport: StudioProjectSupport.supported,
        compilerAvailability: StudioCompilerAvailability.unavailable,
        environment: StudioExecutionEnvironment.web,
        message:
            'Le projet admet l’aperçu Astro ; aucun compilateur universel n’est encore admis.',
      ),
      StudioArtifactRoute(
        target: StudioArtifactTarget.flutterWeb,
        projectSupport: StudioProjectSupport.unavailable,
        compilerAvailability: StudioCompilerAvailability.unavailable,
        environment: StudioExecutionEnvironment.web,
        message: 'Cette cible n’est pas admise pour ce projet.',
      ),
      StudioArtifactRoute(
        target: StudioArtifactTarget.android,
        projectSupport: StudioProjectSupport.unavailable,
        compilerAvailability: StudioCompilerAvailability.unavailable,
        environment: StudioExecutionEnvironment.android,
        message: 'Cette cible n’est pas admise pour ce projet.',
      ),
      StudioArtifactRoute(
        target: StudioArtifactTarget.windows,
        projectSupport: StudioProjectSupport.unavailable,
        compilerAvailability: StudioCompilerAvailability.unavailable,
        environment: StudioExecutionEnvironment.windows,
        message: 'Cette cible n’est pas admise pour ce projet.',
      ),
      StudioArtifactRoute(
        target: StudioArtifactTarget.ios,
        projectSupport: StudioProjectSupport.unavailable,
        compilerAvailability: StudioCompilerAvailability.unavailable,
        environment: StudioExecutionEnvironment.apple,
        message: 'Cette cible n’est pas admise pour ce projet.',
      ),
    ],
  );
}
