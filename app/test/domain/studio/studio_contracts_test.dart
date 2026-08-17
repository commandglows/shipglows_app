import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/domain/studio/studio_contracts.dart';

void main() {
  group('Studio contracts', () {
    test('allows the contract state path and rejects skipped proof', () {
      expect(
        transitionStudioState(StudioState.unavailable, StudioState.starting),
        StudioState.starting,
      );
      expect(
        () => transitionStudioState(
          StudioState.unavailable,
          StudioState.verified,
        ),
        throwsA(isA<StudioContractException>()),
      );
    });

    test('negotiates the exact trusted first-party profile', () {
      final profile = StudioTargetProfile(
        profileId: 'shipglows.astro.hero.v1',
        projectId: 'shipglows_app',
        sourceRevision: 'abc123',
        repositoryDigest: 'digest',
        adapterVersion: '1.0.0',
        capabilityVersion: '1.0.0',
        capabilities: const {StudioCapability.tokenSet},
        trustedFirstPartyBaseOnly: true,
        productionExcluded: true,
      );
      StudioTargetRequest request({String projectId = 'shipglows_app'}) =>
          StudioTargetRequest(
            projectId: projectId,
            sourceRevision: 'abc123',
            repositoryDigest: 'digest',
            adapterVersion: '1.0.0',
            capabilityVersion: '1.0.0',
            capabilities: const {StudioCapability.tokenSet},
            trustedFirstPartyBase: true,
          );

      expect(
        negotiateStudioTarget(profile, request()),
        isA<StudioTargetSupported>(),
      );
      expect(
        (negotiateStudioTarget(profile, request(projectId: 'customer'))
                as StudioTargetUnsupported)
            .reason,
        'profileMismatch',
      );

      final gocharbon = StudioTargetProfile(
        profileId: 'gocharbon.astro.hero.v1',
        projectId: 'gocharbon',
        sourceRevision: 'abc123',
        repositoryDigest: 'digest',
        adapterVersion: '1.0.0',
        capabilityVersion: '1.0.0',
        capabilities: const {StudioCapability.tokenSet},
        trustedFirstPartyBaseOnly: true,
        productionExcluded: true,
      );
      expect(
        negotiateStudioTarget(
          gocharbon,
          StudioTargetRequest(
            projectId: 'gocharbon',
            sourceRevision: 'abc123',
            repositoryDigest: 'digest',
            adapterVersion: '1.0.0',
            capabilityVersion: '1.0.0',
            capabilities: const {StudioCapability.tokenSet},
            trustedFirstPartyBase: true,
          ),
        ),
        isA<StudioTargetSupported>(),
      );
    });

    test('rejects raw source-like parameters and oversized node sets', () {
      VisualCommand command(Map<String, Object> parameters, List<String> ids) =>
          VisualCommand(
            commandId: 'cmd_1',
            sessionId: 'session_1',
            capability: StudioCapability.tokenSet,
            parameters: parameters,
            affectedRuntimeNodeIds: ids,
            affectedDimensions: const {StudioDimension.design},
            revision: 1,
            idempotencyKey: 'idem_1',
          );

      expect(
        () => command({'css': 'body{}'}, ['node_1']).validate(),
        throwsA(isA<StudioContractException>()),
      );
      expect(
        () => command({
          'token': 'color.accent',
        }, List.filled(StudioLimits.maxNodes + 1, 'node')).validate(),
        throwsA(isA<StudioContractException>()),
      );
    });

    test('parses the exact closed ready and selected anchor fixtures', () {
      const surfaces = [
        StudioSurfaceSummary(
          id: 'hero.title',
          label: 'Title',
          sourceConfidence: 'exact',
          sourceSymbol: 'Hero.title',
          capabilities: {
            StudioCapability.opacitySet,
            StudioCapability.transformSet,
            StudioCapability.visibilitySet,
            StudioCapability.motionDuration,
            StudioCapability.motionEasing,
          },
        ),
      ];
      final ready = parseStudioReadyAnchors([
        {
          'id': 'hero.title',
          'label': 'Title',
          'sourceSymbol': 'Hero.title',
          'capabilities': [
            'opacity.set',
            'transform.set',
            'visibility.set',
            'motion.duration',
            'motion.easing',
          ],
        },
      ], surfaces);
      expect(ready.single.id, 'hero.title');
      final selected = parseStudioSelectedAnchor({
        'id': 'hero.title',
        'label': 'Title',
        'sourceSymbol': 'Hero.title',
        'capabilities': [
          'opacity.set',
          'transform.set',
          'visibility.set',
          'motion.duration',
          'motion.easing',
        ],
        'bounds': {'x': 1, 'y': 2, 'width': 300, 'height': 80},
      }, surfaces);
      expect(selected.bounds.width, 300);
      expect(
        () => parseStudioReadyAnchors([
          {
            'id': 'hero.title',
            'label': 'Title',
            'sourceSymbol': 'Hero.title',
            'capabilities': [
              'opacity.set',
              'transform.set',
              'visibility.set',
              'motion.duration',
              'motion.easing',
            ],
            'source': {'path': 'site/src/components/Hero.astro'},
          },
        ], surfaces),
        throwsA(isA<StudioContractException>()),
      );
      expect(
        () => parseStudioSelectedAnchor({
          'id': 'hero.title',
          'label': 'Title',
          'sourceSymbol': 'Hero.title',
          'capabilities': ['inspect'],
          'bounds': {'x': 1, 'y': 2, 'width': 300, 'height': 80},
        }, surfaces),
        throwsA(isA<StudioContractException>()),
      );
    });

    test('enforces the shared total bridge budget in UTF-8 at N and N+1', () {
      final overhead = studioBridgeMessageBytes({'pad': ''});
      expect(
        isWithinStudioBridgeMessageLimit({
          'pad': 'a' * (StudioLimits.maxBridgeMessageBytes - overhead),
        }),
        isTrue,
      );
      expect(
        isWithinStudioBridgeMessageLimit({
          'pad': 'a' * (StudioLimits.maxBridgeMessageBytes - overhead + 1),
        }),
        isFalse,
      );
      expect(studioBridgeMessageBytes({'pad': 'é'}), greaterThan(11));
      expect(
        isWithinStudioCommandLimit({
          'pad': 'a' * (StudioLimits.maxRequestBytes - overhead),
        }),
        isTrue,
      );
      expect(
        isWithinStudioCommandLimit({
          'pad': 'a' * (StudioLimits.maxRequestBytes - overhead + 1),
        }),
        isFalse,
      );
    });
  });
}
