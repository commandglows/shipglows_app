import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/domain/project_health/project_health_models.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_dto_mapper.dart';
import 'package:shipglows_app/shipglows/data/cockpit/cockpit_models.dart';

void main() {
  group('CockpitDtoMapper', () {
    test('maps five dimensions and preserves explicit missing evidence', () {
      final snapshot = const CockpitDtoMapper().snapshotFromJson(
        <String, Object?>{
          'generatedAt': '2026-07-18T08:00:00Z',
          'projects': <Object?>[
            <String, Object?>{
              'id': 'prj_demo',
              'name': 'Demo',
              'repositoryFullName': 'shipglows/demo',
              'accessState': 'available',
              'health': <String, Object?>{
                'overallStatus': 'warning',
                'coverage': 0.4,
                'dimensions': <Object?>[
                  <String, Object?>{
                    'dimension': 'tech',
                    'status': 'healthy',
                    'summary': 'Checks pass',
                    'producer': 'ci',
                    'evidenceCount': 2,
                    'checkedAt': '2026-07-18T07:00:00Z',
                  },
                  <String, Object?>{
                    'dimension': 'security',
                    'status': 'warning',
                    'summary': 'One finding',
                    'producer': 'audit',
                    'evidenceCount': 1,
                  },
                ],
              },
              'conversationCount': 3,
              'activeRunCount': 1,
            },
          ],
        },
      );

      final project = snapshot.projects.single;
      expect(project.health.overallStatus, HealthStatus.warning);
      expect(project.health.coverage, closeTo(0.4, 0.0001));
      expect(
        project.health.dimension(HealthDimension.content).status,
        HealthStatus.notReported,
      );
      expect(project.accessState, ProjectAccessState.available);
      expect(project.conversationCount, 3);
    });

    test('rejects a server aggregate that fabricates healthy state', () {
      expect(
        () => const CockpitDtoMapper().snapshotFromJson(<String, Object?>{
          'generatedAt': '2026-07-18T08:00:00Z',
          'projects': <Object?>[
            <String, Object?>{
              'id': 'prj_demo',
              'name': 'Demo',
              'repositoryFullName': 'shipglows/demo',
              'accessState': 'available',
              'health': <String, Object?>{
                'overallStatus': 'healthy',
                'coverage': 0.0,
                'dimensions': <Object?>[],
              },
              'conversationCount': 0,
              'activeRunCount': 0,
            },
          ],
        }),
        throwsFormatException,
      );
    });

    test('maps unknown upstream events to a safe non-executable type', () {
      final event = const CockpitDtoMapper().eventFromJson(<String, Object?>{
        'id': 'evt_1',
        'cursor': 8,
        'conversationId': 'convo_1',
        'type': 'future.executableThing',
        'occurredAt': '2026-07-18T08:00:00Z',
        'summary': 'Unsupported event',
      });

      expect(event.type, ConversationEventType.unknown);
      expect(event.cursor, 8);
      expect(event.summary, 'Unsupported event');
    });

    test('rejects negative event cursors and cross-shape payloads', () {
      expect(
        () => const CockpitDtoMapper().eventFromJson(<String, Object?>{
          'id': 'evt_1',
          'cursor': -1,
          'conversationId': 'convo_1',
          'type': 'turn.started',
          'occurredAt': '2026-07-18T08:00:00Z',
          'summary': 'Started',
        }),
        throwsFormatException,
      );
    });
  });
}
