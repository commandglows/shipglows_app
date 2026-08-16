import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shipglows_app/domain/studio/studio_contracts.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/presentation/screens/studio_screen.dart';
import 'package:shipglows_app/shipglows/providers/studio_provider.dart';

void main() {
  final capability = StudioPreviewCapability(
    profileId: 'shipglows.astro.hero.v1',
    bridgeVersion: 'shipglows.studio.bridge.v1',
    previewOrigin: Uri(scheme: 'http', host: '127.0.0.1', port: 3003),
    surfaces: [
      StudioSurfaceSummary(
        id: 'hero.root',
        label: 'Hero',
        sourceConfidence: 'exact',
      ),
      StudioSurfaceSummary(
        id: 'hero.title',
        label: 'Title',
        sourceConfidence: 'exact',
      ),
    ],
  );

  testWidgets('shows fail-closed unavailable state without runner admission', (
    tester,
  ) async {
    await tester.pumpWidget(_app(capability: null));
    await tester.pumpAndSettle();
    expect(find.text('Studio indisponible'), findsOneWidget);
    expect(find.textContaining('Aucun aperçu'), findsOneWidget);
  });

  testWidgets('selects an admitted semantic surface in read-only inspector', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      _app(
        capability: capability,
        previewBuilder: (value, onSelected) =>
            const Center(child: Text('Preview ready')),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      find.text('Lecture seule · aucune modification source'),
      findsOneWidget,
    );
    await tester.tap(find.text('Title'));
    await tester.pump();
    expect(find.text('Surface sélectionnée'), findsOneWidget);
    expect(find.text('hero.title'), findsWidgets);
  });
}

Widget _app({
  required StudioPreviewCapability? capability,
  Widget Function(StudioPreviewCapability, ValueChanged<String>)?
  previewBuilder,
}) {
  final router = GoRouter(
    initialLocation: '/project/shipglows_app/studio',
    routes: [
      GoRoute(
        path: '/project/:project/studio',
        builder: (context, state) => StudioScreen(
          projectId: 'shipglows_app',
          projectName: 'ShipGlows',
          previewBuilder: previewBuilder,
        ),
      ),
    ],
  );
  return ProviderScope(
    overrides: [
      managedStudioCapabilityProvider(
        'shipglows_app',
      ).overrideWith((ref) async => capability),
    ],
    child: MaterialApp.router(
      theme: AppTheme.buildForTesting(Brightness.light),
      routerConfig: router,
    ),
  );
}
