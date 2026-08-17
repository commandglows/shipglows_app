import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/domain/studio/studio_compilation_routing.dart';

void main() {
  group('Studio compilation routing projection', () {
    test(
      'keeps all five stable artifact targets and environment descriptions',
      () {
        final routing = StudioCompilationRoutingProjection.astroBridgeOnly();

        expect(
          routing.routes.map((route) => route.target),
          StudioArtifactTarget.values,
        );
        expect(
          routing.routes.map((route) => studioArtifactTargetCode(route.target)),
          [
            'ARTIFACT_ASTRO_WEB',
            'ARTIFACT_FLUTTER_WEB',
            'ARTIFACT_ANDROID',
            'ARTIFACT_WINDOWS',
            'ARTIFACT_IOS',
          ],
        );
        expect(
          routing.routeFor(StudioArtifactTarget.android).accessibilitySummary,
          contains('Environnement Android géré automatiquement'),
        );
        expect(
          routing.routeFor(StudioArtifactTarget.ios).accessibilitySummary,
          contains('Environnement Apple géré automatiquement'),
        );
      },
    );

    test('separates project support from compiler availability and states', () {
      final routing = StudioCompilationRoutingProjection.astroBridgeOnly();
      final astro = routing.routeFor(StudioArtifactTarget.astroWeb);
      final android = routing.routeFor(StudioArtifactTarget.android);

      expect(astro.projectSupported, isTrue);
      expect(
        astro.compilerAvailability,
        StudioCompilerAvailability.unavailable,
      );
      expect(astro.compilerAvailable, isFalse);
      expect(android.projectSupport, StudioProjectSupport.unavailable);
      expect(android.compilerAvailable, isFalse);
      expect(
        StudioCompilerAvailability.values,
        containsAll([
          StudioCompilerAvailability.unavailable,
          StudioCompilerAvailability.ambiguous,
          StudioCompilerAvailability.stale,
          StudioCompilerAvailability.error,
        ]),
      );
    });

    test(
      'requires an explicit selection when several project targets exist',
      () {
        final routing = StudioCompilationRoutingProjection(
          routes: [
            for (final target in StudioArtifactTarget.values)
              StudioArtifactRoute(
                target: target,
                projectSupport:
                    target == StudioArtifactTarget.astroWeb ||
                        target == StudioArtifactTarget.flutterWeb
                    ? StudioProjectSupport.supported
                    : StudioProjectSupport.unavailable,
                compilerAvailability: StudioCompilerAvailability.unavailable,
                environment: StudioExecutionEnvironment.web,
                message: 'État projeté.',
              ),
          ],
        );

        expect(routing.implicitTarget, isNull);
      },
    );

    test('rejects incomplete or duplicate route projections', () {
      final route = StudioArtifactRoute(
        target: StudioArtifactTarget.astroWeb,
        projectSupport: StudioProjectSupport.supported,
        compilerAvailability: StudioCompilerAvailability.available,
        environment: StudioExecutionEnvironment.web,
        message: 'Prêt.',
      );
      expect(
        () => StudioCompilationRoutingProjection(
          routes: List.filled(StudioArtifactTarget.values.length, route),
        ),
        throwsArgumentError,
      );
    });
  });
}
