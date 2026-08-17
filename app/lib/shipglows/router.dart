import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'presentation/screens/diagnostics_screen.dart';
import 'presentation/screens/overview_screen.dart';
import 'presentation/screens/project_detail_screen.dart';
import 'presentation/screens/projects_screen.dart';
import 'presentation/screens/operator_workspace_screen.dart';
import 'presentation/screens/settings_screen.dart';
import 'presentation/screens/studio_screen.dart';

GoRouter createShipGlowsRouter() {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        pageBuilder: (context, state) =>
            const MaterialPage(child: OverviewScreen()),
      ),
      GoRoute(
        path: '/project/:project',
        pageBuilder: (context, state) {
          final project = state.pathParameters['project'] ?? '';
          return MaterialPage(
            child: ProjectDetailScreen(
              projectName: Uri.decodeComponent(project),
              runnerProjectId: state.uri.queryParameters['runnerProjectId'],
            ),
          );
        },
      ),
      GoRoute(
        path: '/project/:project/workspace',
        pageBuilder: (context, state) => MaterialPage(
          child: OperatorWorkspaceScreen(
            projectName: Uri.decodeComponent(
              state.pathParameters['project'] ?? '',
            ),
            projectId: state.uri.queryParameters['runnerProjectId'] ?? '',
          ),
        ),
      ),
      GoRoute(
        path: '/project/:project/studio',
        pageBuilder: (context, state) => MaterialPage(
          child: StudioScreen(
            projectName: Uri.decodeComponent(
              state.pathParameters['project'] ?? '',
            ),
            projectId: state.uri.queryParameters['runnerProjectId'] ?? '',
          ),
        ),
      ),
      GoRoute(
        path: '/projects',
        pageBuilder: (context, state) =>
            const MaterialPage(child: ProjectsScreen()),
      ),
      GoRoute(
        path: '/projects/github/setup',
        pageBuilder: (context, state) => MaterialPage(
          child: GitHubSetupReturnScreen(
            installationId: int.tryParse(
              state.uri.queryParameters['installation_id'] ?? '',
            ),
            state: state.uri.queryParameters['state'],
          ),
        ),
      ),
      GoRoute(
        path: '/diagnostics',
        pageBuilder: (context, state) =>
            const MaterialPage(child: DiagnosticsScreen()),
      ),
      GoRoute(
        path: '/settings',
        pageBuilder: (context, state) =>
            const MaterialPage(child: SettingsScreen()),
      ),
    ],
  );
}
