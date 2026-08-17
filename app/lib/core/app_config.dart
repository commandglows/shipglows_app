class AppConfig {
  static const canonicalSiteUrl = 'https://contentflow.winflowz.com';

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.winflowz.com',
  );

  static const managedRunnerBaseUrl = String.fromEnvironment(
    'MANAGED_RUNNER_BASE_URL',
    defaultValue: '',
  );

  static bool get managedRunnerEnabled =>
      managedRunnerBaseUrl.trim().isNotEmpty;

  static const personalCloudEnabled = bool.fromEnvironment(
    'PERSONAL_CLOUD_ENABLED',
    defaultValue: false,
  );

  static const _localStudioAuthOverride = bool.fromEnvironment(
    'LOCAL_STUDIO_AUTH_ENABLED',
    defaultValue: false,
  );

  static bool isLocalStudioRunner(String value) {
    final uri = Uri.tryParse(value.trim());
    return uri != null &&
        uri.scheme == 'http' &&
        uri.host == '127.0.0.1' &&
        uri.port == 3210 &&
        (uri.path.isEmpty || uri.path == '/');
  }

  static bool get localStudioAuthEnabled =>
      _localStudioAuthOverride && isLocalStudioRunner(managedRunnerBaseUrl);

  static const clerkPublishableKey = String.fromEnvironment(
    'CLERK_PUBLISHABLE_KEY',
    defaultValue: '',
  );

  static const _openAccessOverride = String.fromEnvironment(
    'OPEN_ACCESS',
    defaultValue: '',
  );

  static const siteUrl = String.fromEnvironment(
    'APP_SITE_URL',
    defaultValue: canonicalSiteUrl,
  );

  static const appWebUrl = String.fromEnvironment(
    'APP_WEB_URL',
    defaultValue: 'https://app.contentflow.winflowz.com',
  );

  static const buildCommitSha = String.fromEnvironment(
    'BUILD_COMMIT_SHA',
    defaultValue: 'unknown',
  );

  static const buildId = String.fromEnvironment(
    'BUILD_ID',
    defaultValue: 'unknown',
  );

  static const buildEnvironment = String.fromEnvironment(
    'BUILD_ENVIRONMENT',
    defaultValue: 'unknown',
  );

  static const buildTimestamp = String.fromEnvironment(
    'BUILD_TIMESTAMP',
    defaultValue: 'unknown',
  );

  static const buildAtParis = String.fromEnvironment(
    'BUILD_AT_PARIS',
    defaultValue: 'unknown',
  );

  static const buildAtUtc = String.fromEnvironment(
    'BUILD_AT_UTC',
    defaultValue: buildTimestamp,
  );

  static List<String> buildIdentityHeader() {
    final buildPart = buildId == 'unknown' || buildId.trim().isEmpty
        ? buildCommitSha
        : '$buildCommitSha $buildId';
    return <String>[
      'commit/build: $buildPart',
      'build_at_paris: $buildAtParis',
      'build_at_utc: $buildAtUtc',
    ];
  }

  static String buildIdentityText() {
    return buildIdentityHeader().join('\n');
  }

  static bool get openAccessEnabled {
    final normalized = _openAccessOverride.trim().toLowerCase();
    if (normalized == 'true' || normalized == '1' || normalized == 'yes') {
      return true;
    }
    if (normalized == 'false' || normalized == '0' || normalized == 'no') {
      return false;
    }
    return clerkPublishableKey.isEmpty;
  }

  static bool get siteUrlPointsToAppHost {
    final configured = Uri.tryParse(siteUrl);
    final app = Uri.tryParse(appWebUrl);
    if (configured == null || configured.host.isEmpty) {
      return false;
    }
    if (app == null || app.host.isEmpty) {
      return false;
    }
    return configured.host == app.host;
  }

  static String get effectiveSiteUrl {
    final configured = Uri.tryParse(siteUrl);
    if (configured == null || configured.host.isEmpty) {
      return canonicalSiteUrl;
    }
    if (siteUrlPointsToAppHost) {
      return canonicalSiteUrl;
    }
    return siteUrl;
  }
}
