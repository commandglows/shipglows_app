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
                    'summary': <String, Object?>{'text': 'Checks pass'},
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
              'aiReadiness': <String, Object?>{
                'version': 'shipglows.ai-readiness.v1',
                'status': 'needsWork',
                'score': 20,
                'coverage': 1.0,
                'evaluatedAt': '2026-07-18T07:30:00Z',
                'checks': <Object?>[
                  for (final id in <String>[
                    'structure',
                    'schemas',
                    'agentGuidance',
                    'llmsText',
                    'sitemap',
                    'fastFeedback',
                  ])
                    <String, Object?>{
                      'id': id,
                      'outcome': id == 'structure' ? 'passed' : 'missing',
                      'earnedPoints': id == 'structure' ? 20 : 0,
                      'maxPoints':
                          id == 'structure' ||
                              id == 'agentGuidance' ||
                              id == 'fastFeedback'
                          ? 20
                          : id == 'sitemap'
                          ? 10
                          : 15,
                      'summary': '$id evidence',
                    },
                ],
                'recommendations': <Object?>['Add agent guidance.'],
              },
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
      expect(
        project.health.dimension(HealthDimension.tech).summary,
        'Checks pass',
      );
      expect(project.aiReadiness.score, 20);
      expect(project.aiReadiness.checks, hasLength(6));
      expect(
        project.aiReadiness.checks.first.outcome,
        AiReadinessCheckOutcome.passed,
      );
    });

    test('rejects contradictory or duplicate AI readiness evidence', () {
      Map<String, Object?> projectWith(Map<String, Object?> readiness) =>
          <String, Object?>{
            'id': 'prj_demo',
            'name': 'Demo',
            'repositoryFullName': 'shipglows/demo',
            'accessState': 'available',
            'health': <String, Object?>{
              'overallStatus': 'unknown',
              'coverage': 0.0,
              'dimensions': <Object?>[],
            },
            'conversationCount': 0,
            'activeRunCount': 0,
            'aiReadiness': readiness,
          };

      final base = <String, Object?>{
        'version': 'shipglows.ai-readiness.v1',
        'status': 'partial',
        'score': null,
        'coverage': 1 / 6,
        'evaluatedAt': '2026-07-18T07:30:00Z',
        'checks': <Object?>[
          <String, Object?>{
            'id': 'structure',
            'outcome': 'passed',
            'earnedPoints': 20,
            'maxPoints': 20,
            'summary': 'Structure present',
          },
        ],
        'recommendations': <Object?>[],
      };

      expect(
        () => const CockpitDtoMapper().projectFromJson(
          projectWith(<String, Object?>{...base, 'score': 80}),
        ),
        throwsFormatException,
      );
      expect(
        () => const CockpitDtoMapper().projectFromJson(
          projectWith(<String, Object?>{
            ...base,
            'checks': <Object?>[
              ...(base['checks']! as List<Object?>),
              ...(base['checks']! as List<Object?>),
            ],
          }),
        ),
        throwsFormatException,
      );
      expect(
        () => const CockpitDtoMapper().projectFromJson(
          projectWith(<String, Object?>{...base, 'unexpected': true}),
        ),
        throwsFormatException,
      );
      expect(
        () => const CockpitDtoMapper().projectFromJson(
          projectWith(<String, Object?>{
            'version': 'shipglows.ai-readiness.v1',
            'status': 'ready',
            'score': 100,
            'coverage': 1.0,
            'evaluatedAt': '2026-07-18T07:30:00Z',
            'checks': <Object?>[
              for (final entry in <(String, int)>[
                ('structure', 20),
                ('schemas', 15),
                ('agentGuidance', 20),
                ('llmsText', 15),
                ('sitemap', 10),
                ('fastFeedback', 20),
              ])
                <String, Object?>{
                  'id': entry.$1,
                  'outcome': 'missing',
                  'earnedPoints': 0,
                  'maxPoints': entry.$2,
                  'summary': 'Missing evidence',
                },
            ],
            'recommendations': <Object?>[],
          }),
        ),
        throwsFormatException,
      );
    });

    test('keeps an older Cockpit response usable without AI readiness', () {
      final project = const CockpitDtoMapper().projectFromJson(
        <String, Object?>{
          'id': 'prj_demo',
          'name': 'Demo',
          'repositoryFullName': 'shipglows/demo',
          'accessState': 'available',
          'health': <String, Object?>{
            'overallStatus': 'unknown',
            'coverage': 0.0,
            'dimensions': <Object?>[],
          },
          'conversationCount': 0,
          'activeRunCount': 0,
        },
      );

      expect(project.aiReadiness.status, AiReadinessStatus.unavailable);
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
