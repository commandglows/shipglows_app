import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/data/conversations/conversation_event_mapper.dart';
import 'package:shipglows_app/shipglows/data/managed_runner_api.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/conversations/conversation_timeline.dart';

void main() {
  testWidgets('renders a safe semantic timeline with no visible ANSI', (
    tester,
  ) async {
    const mapper = ConversationEventMapper();
    final item = mapper.map(
      ManagedConversationEvent(
        cursor: 1,
        id: 'event-1',
        type: 'message.assistant.completed',
        payload: {'text': '\u001b[31mBonjour\u001b[0m\u0000${'x' * 8000}'},
        occurredAt: '2026-08-11T00:00:00Z',
      ),
    );
    final semantics = tester.ensureSemantics();

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.buildForTesting(Brightness.light),
        home: Scaffold(body: ConversationTimeline(items: [item])),
      ),
    );

    expect(find.textContaining('\u001b'), findsNothing);
    expect(find.textContaining('Bonjour'), findsOneWidget);
    expect(item.body.length, lessThanOrEqualTo(maxConversationBodyCharacters));
    expect(
      find.bySemanticsLabel(RegExp('Historique de la conversation')),
      findsOneWidget,
    );
    expect(
      find.bySemanticsLabel(RegExp(r'Assistant\. Bonjour')),
      findsOneWidget,
    );
    semantics.dispose();
  });
}
