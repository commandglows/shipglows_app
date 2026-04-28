const projectSelectionModeAuto = 'auto';
const projectSelectionModeSelected = 'selected';
const projectSelectionModeNone = 'none';

String normalizeProjectSelectionMode(String? raw) {
  final value = (raw ?? projectSelectionModeAuto).trim().toLowerCase();
  if (value == projectSelectionModeSelected || value == projectSelectionModeNone) {
    return value;
  }
  return projectSelectionModeAuto;
}

class AppSettings {
  final String id;
  final String userId;
  final String theme;
  final String? language;
  final bool emailNotifications;
  final String? webhookUrl;
  final String? defaultProjectId;
  final String projectSelectionMode;
  final Map<String, dynamic>? dashboardLayout;
  final Map<String, dynamic>? robotSettings;

  const AppSettings({
    required this.id,
    required this.userId,
    this.theme = 'system',
    this.language,
    this.emailNotifications = true,
    this.webhookUrl,
    this.defaultProjectId,
    this.projectSelectionMode = projectSelectionModeAuto,
    this.dashboardLayout,
    this.robotSettings,
  });

  bool get notificationsEnabled => emailNotifications;

  /// Whether the Idea Pool curation step is enabled before content generation.
  bool get ideaPoolEnabled =>
      robotSettings?['ideaPoolEnabled'] as bool? ?? false;

  /// Content frequency config from robotSettings.contentFrequency
  Map<String, dynamic> get contentFrequency =>
      (robotSettings?['contentFrequency'] as Map<String, dynamic>?) ?? {};

  /// Runtime mode from robotSettings.aiRuntime.mode
  String get aiRuntimeMode {
    final aiRuntime =
        robotSettings?['aiRuntime'] as Map<String, dynamic>? ?? const {};
    final mode = (aiRuntime['mode'] ?? 'byok').toString();
    if (mode == 'platform') {
      return 'platform';
    }
    return 'byok';
  }

  AppSettings copyWith({
    String? id,
    String? userId,
    String? theme,
    String? language,
    bool? emailNotifications,
    String? webhookUrl,
    bool clearWebhookUrl = false,
    String? defaultProjectId,
    bool clearDefaultProjectId = false,
    String? projectSelectionMode,
    Map<String, dynamic>? dashboardLayout,
    Map<String, dynamic>? robotSettings,
  }) {
    return AppSettings(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      theme: theme ?? this.theme,
      language: language ?? this.language,
      emailNotifications: emailNotifications ?? this.emailNotifications,
      webhookUrl: clearWebhookUrl ? null : (webhookUrl ?? this.webhookUrl),
      defaultProjectId: clearDefaultProjectId
          ? null
          : (defaultProjectId ?? this.defaultProjectId),
      projectSelectionMode: normalizeProjectSelectionMode(
        projectSelectionMode ?? this.projectSelectionMode,
      ),
      dashboardLayout: dashboardLayout ?? this.dashboardLayout,
      robotSettings: robotSettings ?? this.robotSettings,
    );
  }

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    return AppSettings(
      id: json['id'] as String,
      userId: json['userId'] as String,
      theme: json['theme'] as String? ?? 'system',
      language: json['language'] as String?,
      emailNotifications: json['emailNotifications'] as bool? ?? true,
      webhookUrl: json['webhookUrl'] as String?,
      defaultProjectId: json['defaultProjectId'] as String?,
      projectSelectionMode: normalizeProjectSelectionMode(
        json['projectSelectionMode'] as String?,
      ),
      dashboardLayout: json['dashboardLayout'] as Map<String, dynamic>?,
      robotSettings: json['robotSettings'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'theme': theme,
      'language': language,
      'emailNotifications': emailNotifications,
      'webhookUrl': webhookUrl,
      'defaultProjectId': defaultProjectId,
      'projectSelectionMode': projectSelectionMode,
      'dashboardLayout': dashboardLayout,
      'robotSettings': robotSettings,
    };
  }

  Map<String, dynamic> toUpdateJson() {
    return {
      'theme': theme,
      'language': language,
      'emailNotifications': emailNotifications,
      'webhookUrl': webhookUrl,
      'defaultProjectId': defaultProjectId,
      'projectSelectionMode': projectSelectionMode,
      'dashboardLayout': dashboardLayout,
      'robotSettings': robotSettings,
    };
  }
}

class PublishAccount {
  final String id;
  final String platform;
  final String username;
  final String displayName;
  final String? avatar;
  final String status;

  const PublishAccount({
    required this.id,
    required this.platform,
    required this.username,
    required this.displayName,
    this.avatar,
    this.status = 'active',
  });

  bool get isActive => status.toLowerCase() == 'active';

  factory PublishAccount.fromJson(Map<String, dynamic> json) {
    final username = (json['username'] ?? '').toString();
    final displayName =
        (json['display_name'] ?? json['displayName'] ?? username).toString();

    return PublishAccount(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      platform: (json['platform'] ?? '').toString().toLowerCase(),
      username: username,
      displayName: displayName.isEmpty ? username : displayName,
      avatar: json['avatar'] as String?,
      status: (json['status'] ?? 'active').toString(),
    );
  }
}
