import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:contentflow_app/data/models/app_access_state.dart';
import 'package:contentflow_app/data/models/app_bootstrap.dart';
import 'package:contentflow_app/data/models/offline_sync.dart';
import 'package:contentflow_app/data/services/offline_storage_service.dart';
import 'package:contentflow_app/providers/providers.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('OfflineCacheStore', () {
    test('stores and loads cache entries per scope', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final store = OfflineCacheStore(prefs);

      await store.write('user:a@example.com', 'settings', {
        'id': 'settings-1',
        'userId': 'user-a',
      });
      await store.write('user:b@example.com', 'settings', {
        'id': 'settings-2',
        'userId': 'user-b',
      });

      final a = await store.read('user:a@example.com', 'settings');
      final b = await store.read('user:b@example.com', 'settings');

      expect(a, isNotNull);
      expect(b, isNotNull);
      expect((a!.data as Map<String, dynamic>)['userId'], 'user-a');
      expect((b!.data as Map<String, dynamic>)['userId'], 'user-b');
    });
  });

  group('OfflineQueueStore', () {
    test('persists queued actions', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final store = OfflineQueueStore(prefs);

      final now = DateTime.utc(2026, 4, 20, 12);
      await store.save('user:test@example.com', [
        QueuedOfflineAction(
          id: 'action-1',
          userScope: 'user:test@example.com',
          resourceType: 'settings',
          actionType: 'update',
          label: 'Update settings',
          method: 'PATCH',
          path: '/api/settings',
          dedupeKey: 'settings:update',
          payload: const {'theme': 'dark'},
          createdAt: now,
          updatedAt: now,
        ),
      ]);

      final loaded = await store.load('user:test@example.com');
      expect(loaded, hasLength(1));
      expect(loaded.first.path, '/api/settings');
      expect(loaded.first.payload?['theme'], 'dark');
    });
  });

  group('Offline ID reconciliation', () {
    test('rewrites queued action IDs across path, payload, and meta', () {
      final action = QueuedOfflineAction(
        id: 'action-1',
        userScope: 'user:test@example.com',
        resourceType: 'settings',
        actionType: 'update',
        label: 'Update settings',
        method: 'PATCH',
        path: '/api/projects/offline-project-1/settings',
        dedupeKey: 'settings:update:offline-project-1',
        payload: const {'defaultProjectId': 'offline-project-1'},
        meta: const {'tempId': 'offline-project-1'},
        createdAt: DateTime.utc(2026, 4, 20, 12),
        updatedAt: DateTime.utc(2026, 4, 20, 12),
      );

      final rewritten = action.rewriteIds(const {
        'offline-project-1': 'project-123',
      });

      expect(rewritten.path, '/api/projects/project-123/settings');
      expect(rewritten.dedupeKey, 'settings:update:project-123');
      expect(rewritten.payload?['defaultProjectId'], 'project-123');
      expect(rewritten.meta['tempId'], 'project-123');
    });

    test('persists temp ID mappings per scope', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final store = OfflineIdMappingStore(prefs);

      await store.register(
        'user:test@example.com',
        'offline-project-1',
        'project-123',
      );

      final loaded = await store.load('user:test@example.com');
      expect(loaded['offline-project-1'], 'project-123');
    });

    test('rewrites cached scope entries when temp IDs are resolved', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final store = OfflineCacheStore(prefs);

      await store.write('user:test@example.com', 'settings', {
        'defaultProjectId': 'offline-project-1',
      });

      await store.rewriteIds('user:test@example.com', const {
        'offline-project-1': 'project-123',
      });

      final loaded = await store.read('user:test@example.com', 'settings');
      expect(
        (loaded!.data as Map<String, dynamic>)['defaultProjectId'],
        'project-123',
      );
    });
  });

  group('Offline sync status map', () {
    QueuedOfflineAction queuedAction({
      required String id,
      required OfflineQueueStatus status,
      String entityType = 'content',
      String entityId = 'entity-1',
      DateTime? createdAt,
    }) {
      return QueuedOfflineAction(
        id: id,
        userScope: 'user:test@example.com',
        resourceType: 'content',
        actionType: 'update',
        label: 'Status mapping test',
        method: 'PATCH',
        path: '/api/content/$entityId',
        dedupeKey: 'content:update:$entityId',
        meta: {
          'entityType': entityType,
          'entityId': entityId,
          'tempId': entityId,
        },
        createdAt: createdAt ?? DateTime(2026, 4, 20, 12),
        updatedAt: createdAt ?? DateTime(2026, 4, 20, 12),
        status: status,
      );
    }

    test(
      'maps entity sync to the highest-severity status per entity',
      () async {
        final container = ProviderContainer(
          overrides: <Override>[
            offlineQueueEntriesProvider.overrideWith((ref) async {
              return [
                queuedAction(
                  id: 'pending',
                  status: OfflineQueueStatus.pending,
                  entityId: 'project-1',
                  createdAt: DateTime(2026, 4, 20, 12),
                ),
                queuedAction(
                  id: 'blocked',
                  status: OfflineQueueStatus.blockedDependency,
                  entityId: 'project-1',
                  createdAt: DateTime(2026, 4, 20, 12, 1),
                ),
              ];
            }),
          ],
        );
        addTearDown(container.dispose);

        final entries = await container.read(
          offlineQueueEntriesProvider.future,
        );
        expect(entries, hasLength(2));

        final syncMap = container.read(offlineEntitySyncMapProvider);
        expect(
          syncMap[offlineEntityKey('content', 'project-1')]?.status,
          OfflineEntitySyncStatus.blockedDependency,
        );
        expect(
          syncMap[offlineEntityKey('content', 'project-1')]?.actionCount,
          2,
        );
      },
    );

    test('maps failed action as highest priority for entity status', () async {
      final container = ProviderContainer(
        overrides: <Override>[
          offlineQueueEntriesProvider.overrideWith((ref) async {
            return [
              queuedAction(
                id: 'blocked',
                status: OfflineQueueStatus.blockedDependency,
                entityId: 'content-1',
                createdAt: DateTime(2026, 4, 20, 12),
              ),
              queuedAction(
                id: 'failed',
                status: OfflineQueueStatus.failed,
                entityId: 'content-1',
                createdAt: DateTime(2026, 4, 20, 12, 1),
              ),
            ];
          }),
        ],
      );
      addTearDown(container.dispose);

      await container.read(offlineQueueEntriesProvider.future);
      final syncMap = container.read(offlineEntitySyncMapProvider);
      expect(
        syncMap[offlineEntityKey('content', 'content-1')]?.status,
        OfflineEntitySyncStatus.failed,
      );
    });
  });

  group('AppAccessState', () {
    test(
      'allows cached workspace data in degraded mode when bootstrap exists',
      () {
        const bootstrap = AppBootstrap(
          user: AppBootstrapUser(
            userId: 'user-1',
            workspaceExists: true,
            defaultProjectId: 'project-1',
          ),
          projectsCount: 1,
          defaultProjectId: 'project-1',
          workspaceStatus: 'ready',
        );

        const state = AppAccessState(
          stage: AppAccessStage.apiUnavailable,
          bootstrap: bootstrap,
        );

        expect(state.isDegraded, isTrue);
        expect(state.canUseWorkspaceData, isTrue);
      },
    );
  });
}
