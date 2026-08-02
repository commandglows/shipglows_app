import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/models/project.dart';
import 'package:shipglows_app/shipglows/providers/managed_project_identity_provider.dart';

void main() {
  final projects = <Project>[
    Project(
      id: 'proj_opaque_1',
      name: 'ShipGlows App',
      url: 'https://github.com/shipglows/app',
      createdAt: DateTime.utc(2026, 1, 1),
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
      Project(
        id: 'proj_opaque_2',
        name: 'ShipGlows App',
        url: 'https://github.com/other/app',
        createdAt: DateTime.utc(2026, 1, 2),
      ),
    ];
    expect(resolveManagedRunnerProjectId('ShipGlows App', ambiguous), isNull);
  });
}
