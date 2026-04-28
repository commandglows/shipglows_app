import 'package:contentflow_app/data/models/ai_runtime.dart';
import 'package:contentflow_app/l10n/app_localizations.dart';
import 'package:contentflow_app/presentation/screens/settings/integrations_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Widget wrap(Widget child) {
    return MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(
        body: Padding(padding: const EdgeInsets.all(12), child: child),
      ),
    );
  }

  testWidgets('renders runtime providers and selected mode', (tester) async {
    final settings = AIRuntimeSettings.fromJson({
      'mode': 'byok',
      'availableModes': [
        {'mode': 'byok', 'enabled': true},
        {'mode': 'platform', 'enabled': true},
      ],
      'providers': [
        {
          'provider': 'openrouter',
          'kind': 'llm',
          'byok': {'configured': true},
          'platform': {'configured': true, 'available': true},
        },
        {
          'provider': 'exa',
          'kind': 'search',
          'byok': {'configured': false},
          'platform': {'configured': false, 'available': false},
        },
      ],
    });

    await tester.pumpWidget(
      wrap(
        AiRuntimeSettingsCard(
          settings: settings,
          canManage: true,
          isUpdating: false,
          onModeSelected: (_) async {},
        ),
      ),
    );

    expect(find.byKey(const Key('ai-runtime-mode-byok')), findsOneWidget);
    expect(
      find.byKey(const Key('ai-runtime-provider-openrouter')),
      findsOneWidget,
    );
    expect(find.byKey(const Key('ai-runtime-provider-exa')), findsOneWidget);
  });

  testWidgets('disables platform mode when unavailable', (tester) async {
    final settings = AIRuntimeSettings.fromJson({
      'mode': 'byok',
      'availableModes': [
        {'mode': 'byok', 'enabled': true},
        {
          'mode': 'platform',
          'enabled': false,
          'message': 'Platform-paid mode is not enabled for this account.',
        },
      ],
      'providers': [],
    });

    String? selectedMode;

    await tester.pumpWidget(
      wrap(
        AiRuntimeSettingsCard(
          settings: settings,
          canManage: true,
          isUpdating: false,
          onModeSelected: (mode) async {
            selectedMode = mode;
          },
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('ai-runtime-mode-platform')));
    await tester.pump();

    expect(selectedMode, isNull);
    expect(
      find.text('Platform-paid mode is not enabled for this account.'),
      findsOneWidget,
    );
  });
}
