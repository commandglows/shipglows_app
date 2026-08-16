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
  });
}
