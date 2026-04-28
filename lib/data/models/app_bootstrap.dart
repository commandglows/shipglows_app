class AppBootstrapUser {
  final String userId;
  final String? email;
  final bool workspaceExists;
  final String? defaultProjectId;

  const AppBootstrapUser({
    required this.userId,
    this.email,
    required this.workspaceExists,
    this.defaultProjectId,
  });

  factory AppBootstrapUser.fromJson(Map<String, dynamic> json) {
    return AppBootstrapUser(
      userId: json['user_id'] as String? ?? '',
      email: json['email'] as String?,
      workspaceExists: json['workspace_exists'] == true,
      defaultProjectId: json['default_project_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'email': email,
      'workspace_exists': workspaceExists,
      'default_project_id': defaultProjectId,
    };
  }
}

class AppBootstrap {
  final AppBootstrapUser user;
  final int projectsCount;
  final String? defaultProjectId;
  final String workspaceStatus;

  const AppBootstrap({
    required this.user,
    required this.projectsCount,
    required this.defaultProjectId,
    required this.workspaceStatus,
  });

  bool get shouldOnboard {
    final normalizedStatus = workspaceStatus.trim().toLowerCase();

    if (normalizedStatus == 'ready') {
      return false;
    }

    if (normalizedStatus == 'needs_onboarding' ||
        normalizedStatus == 'empty' ||
        normalizedStatus == 'missing') {
      return true;
    }

    if (user.workspaceExists) {
      return false;
    }

    if ((defaultProjectId?.trim().isNotEmpty ?? false) ||
        (user.defaultProjectId?.trim().isNotEmpty ?? false)) {
      return false;
    }

    return projectsCount == 0;
  }

  factory AppBootstrap.fromJson(Map<String, dynamic> json) {
    return AppBootstrap(
      user: AppBootstrapUser.fromJson(
        json['user'] as Map<String, dynamic>? ?? const {},
      ),
      projectsCount: json['projects_count'] as int? ?? 0,
      defaultProjectId: json['default_project_id'] as String?,
      workspaceStatus: json['workspace_status'] as String? ?? 'missing',
    );
  }

  factory AppBootstrap.demo({required bool onboardingComplete}) {
    return AppBootstrap(
      user: AppBootstrapUser(
        userId: 'demo-user',
        workspaceExists: onboardingComplete,
      ),
      projectsCount: onboardingComplete ? 1 : 0,
      defaultProjectId: onboardingComplete ? 'demo-project' : null,
      workspaceStatus: onboardingComplete ? 'ready' : 'needs_onboarding',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user.toJson(),
      'projects_count': projectsCount,
      'default_project_id': defaultProjectId,
      'workspace_status': workspaceStatus,
    };
  }
}
