import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';

void main() {
  test('parses a unified local and GitHub project without private fields', () {
    final project = ManagedProjectRecord.fromJson({
      'id': 'shipglows_app',
      'name': 'ShipGlows',
      'repositoryFullName': 'shipglows/shipglows_app',
      'sourceKinds': ['local', 'github'],
      'readiness': 'ready',
      'detectedPlatforms': ['flutter', 'node'],
      'capabilities': {
        'cockpit': true,
        'studio': true,
        'conversations': true,
        'workspace': false,
      },
      'isDefault': true,
      'isArchived': false,
      'builtin': true,
      'studioAvailable': true,
    });

    expect(project.sourceKinds, ['local', 'github']);
    expect(project.readiness, ManagedProjectReadiness.ready);
    expect(project.detectedPlatforms, ['flutter', 'node']);
    expect(project.capabilities.studio, true);
    expect(project.capabilities.workspace, false);
  });

  test('parses every honest GitHub connection state', () {
    for (final entry in {
      'disabled': ManagedGitHubConnectionState.disabled,
      'disconnected': ManagedGitHubConnectionState.disconnected,
      'verifying': ManagedGitHubConnectionState.verifying,
      'ready': ManagedGitHubConnectionState.ready,
      'degraded': ManagedGitHubConnectionState.degraded,
      'accessLost': ManagedGitHubConnectionState.accessLost,
    }.entries) {
      final status = ManagedGitHubSourceStatus.fromJson({
        'state': entry.key,
        'message': 'status',
      });
      expect(status.state, entry.value);
    }
  });

  test('accepts only a GitHub-hosted App setup action', () {
    final setup = ManagedGitHubSetup.fromJson({
      'actionUrl':
          'https://github.com/apps/shipglows-local/installations/new?state=opaque',
      'setupUrl': 'http://127.0.0.1:3005/projects/github/setup',
      'expiresAt': '2026-08-17T12:10:00.000Z',
    });
    expect(setup.actionUrl.host, 'github.com');
    expect(setup.setupUrl.path, '/projects/github/setup');
    expect(
      () => ManagedGitHubSetup.fromJson({
        'actionUrl': 'https://evil.example/install',
        'setupUrl': 'http://127.0.0.1:3005/projects/github/setup',
        'expiresAt': '2026-08-17T12:10:00.000Z',
      }),
      throwsA(isA<ManagedRunnerException>()),
    );
  });

  test('rejects unknown readiness and source values', () {
    Map<String, Object?> invalid(String readiness, List<String> sourceKinds) =>
        {
          'id': 'project_1',
          'name': 'Project',
          'repositoryFullName': 'shipglows/project',
          'sourceKinds': sourceKinds,
          'readiness': readiness,
          'detectedPlatforms': <String>[],
          'capabilities': {
            'cockpit': true,
            'studio': false,
            'conversations': true,
            'workspace': false,
          },
          'isDefault': true,
          'isArchived': false,
          'builtin': false,
          'studioAvailable': false,
        };

    expect(
      () => ManagedProjectRecord.fromJson(invalid('indexing', ['local'])),
      throwsA(isA<ManagedRunnerException>()),
    );
    expect(
      () => ManagedProjectRecord.fromJson(invalid('ready', ['token'])),
      throwsA(isA<ManagedRunnerException>()),
    );
  });
}
