class AppConfig {
  static const canonicalSiteUrl = 'https://contentflow.winflowz.com';

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.winflowz.com',
  );

  static const clerkPublishableKey = String.fromEnvironment(
    'CLERK_PUBLISHABLE_KEY',
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

  static const buildEnvironment = String.fromEnvironment(
    'BUILD_ENVIRONMENT',
    defaultValue: 'unknown',
  );

  static const buildTimestamp = String.fromEnvironment(
    'BUILD_TIMESTAMP',
    defaultValue: 'unknown',
  );

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
