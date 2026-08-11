import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/providers/managed_conversation_provider.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/conversations/conversation_tabs.dart';

void main() {
  testWidgets('announces unread tabs and closes locally', (tester) async {
    final first = ManagedConversationNotifier(projectId: 'p', client: null);
    final second = ManagedConversationNotifier(projectId: 'p', client: null);
    final workspace = ManagedConversationWorkspaceState(
      tabs: [
        ManagedConversationTab(title: 'Conversation 1', notifier: first),
        ManagedConversationTab(
          title: 'Conversation 2',
          notifier: second,
          unread: true,
        ),
      ],
      activeIndex: 0,
    );
    int? closed;
    final semantics = tester.ensureSemantics();

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.buildForTesting(Brightness.light),
        home: Scaffold(
          body: ConversationTabs(
            workspace: workspace,
            onAdd: () {},
            onSelect: (_) {},
            onClose: (index) => closed = index,
          ),
        ),
      ),
    );

    expect(
      find.bySemanticsLabel(RegExp('Conversation 2, nouveaux messages')),
      findsOneWidget,
    );
    await tester.tap(find.byTooltip('Fermer la conversation').last);
    expect(closed, 1);
    semantics.dispose();
    first.dispose();
    second.dispose();
  });
}
