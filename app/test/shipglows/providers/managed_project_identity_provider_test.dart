import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/managed_project_identity_provider.dart';

void main() {
  final projects = <ManagedProjectRecord>[
    const ManagedProjectRecord(
      id: 'proj_opaque_1',
      name: 'ShipGlows App',
      repositoryFullName: 'shipglows/app',
      isDefault: true,
      isArchived: false,
      builtin: false,
      studioAvailable: true,
    ),
  ];

  test('resolves the opaque project id from the dashboard project name', () {
    expect(
      resolveManagedRunnerProjectId('shipglows_app', projects),
      'proj_opaque_1',
    );
  });

  test('fails closed when the dashboard name is ambiguous', () {
    final ambiguous = [
      ...projects,
      const ManagedProjectRecord(
        id: 'proj_opaque_2',
        name: 'ShipGlows App',
        repositoryFullName: 'other/app',
        isDefault: false,
        isArchived: false,
        builtin: false,
        studioAvailable: false,
      ),
    ];
    expect(resolveManagedRunnerProjectId('ShipGlows App', ambiguous), isNull);
  });
}
