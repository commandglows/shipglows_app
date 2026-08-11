import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/providers/managed_cockpit_provider.dart';
import 'package:shipglows_app/shipglows/providers/managed_runner_provider.dart';

void main() {
  group('managedCockpitSnapshotProvider', () {
    test('reports local-only when the runner is not configured', () async {
      final container = ProviderContainer(
        overrides: [managedRunnerApiProvider.overrideWithValue(null)],
      );
      addTearDown(container.dispose);

      final state = await container.read(managedCockpitSnapshotProvider.future);

      expect(state.status, ManagedCockpitStatus.localOnly);
      expect(state.snapshot, isNull);
    });

    test('keeps an empty server snapshot authoritative', () async {
      final snapshot = CockpitSnapshot(
        generatedAt: DateTime.utc(2026, 8, 11),
        projects: const [],
      );
      final container = ProviderContainer(
        overrides: [
          managedRunnerApiProvider.overrideWithValue(_FakeRunner(snapshot)),
        ],
      );
      addTearDown(container.dispose);

      final state = await container.read(managedCockpitSnapshotProvider.future);

      expect(state.status, ManagedCockpitStatus.empty);
      expect(state.snapshot, same(snapshot));
    });

    test('exposes an expired session instead of swallowing a 401', () async {
      final container = ProviderContainer(
        overrides: [
          managedRunnerApiProvider.overrideWithValue(
            _FakeRunner.error(
              const ManagedRunnerException(
                code: 'unauthorized',
                message: 'Token expired',
                statusCode: 401,
              ),
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final state = await container.read(managedCockpitSnapshotProvider.future);

      expect(state.status, ManagedCockpitStatus.sessionExpired);
      expect(state.safeMessage, isNot(contains('Token expired')));
    });

    test('returns a retryable safe failure for runner errors', () async {
      final container = ProviderContainer(
        overrides: [
          managedRunnerApiProvider.overrideWithValue(
            _FakeRunner.error(
              const ManagedRunnerException(
                code: 'offline',
                message: '/secret/path failed with token=abc',
              ),
            ),
          ),
        ],
      );
      addTearDown(container.dispose);

      final state = await container.read(managedCockpitSnapshotProvider.future);

      expect(state.status, ManagedCockpitStatus.failure);
      expect(state.safeMessage, isNot(contains('/secret/path')));
      expect(state.safeMessage, isNot(contains('token=abc')));
    });
  });
}

class _FakeRunner implements ManagedRunnerClient {
  _FakeRunner(this._snapshot) : _error = null;

  _FakeRunner.error(Object error) : _snapshot = null, _error = error;

  final CockpitSnapshot? _snapshot;
  final Object? _error;

  @override
  Future<CockpitSnapshot> loadCockpit() async {
    if (_error case final error?) throw error;
    return _snapshot!;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
