import 'package:flutter_test/flutter_test.dart';

import 'package:contentflow_app/data/models/app_bootstrap.dart';

void main() {
  group('AppBootstrap.shouldOnboard', () {
    test('requires onboarding when the workspace is explicitly missing', () {
      const bootstrap = AppBootstrap(
        user: AppBootstrapUser(
          userId: 'user_123',
          workspaceExists: false,
        ),
        projectsCount: 0,
        defaultProjectId: null,
        workspaceStatus: 'missing',
      );

      expect(bootstrap.shouldOnboard, isTrue);
    });

    test(
      'does not require onboarding when the workspace is ready but projects count is zero',
      () {
        const bootstrap = AppBootstrap(
          user: AppBootstrapUser(
            userId: 'user_123',
            workspaceExists: true,
          ),
          projectsCount: 0,
          defaultProjectId: null,
          workspaceStatus: 'ready',
        );

        expect(bootstrap.shouldOnboard, isFalse);
      },
    );

    test(
      'does not require onboarding when a workspace exists even if projects count is zero',
      () {
        const bootstrap = AppBootstrap(
          user: AppBootstrapUser(
            userId: 'user_123',
            workspaceExists: true,
          ),
          projectsCount: 0,
          defaultProjectId: null,
          workspaceStatus: 'unknown',
        );

        expect(bootstrap.shouldOnboard, isFalse);
      },
    );

    test('does not require onboarding when a default project id exists', () {
      const bootstrap = AppBootstrap(
        user: AppBootstrapUser(
          userId: 'user_123',
          workspaceExists: false,
          defaultProjectId: 'proj_123',
        ),
        projectsCount: 0,
        defaultProjectId: 'proj_123',
        workspaceStatus: 'unknown',
      );

      expect(bootstrap.shouldOnboard, isFalse);
    });
  });
}
