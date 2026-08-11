import 'package:flutter/material.dart';

import '../../../../presentation/theme/app_theme.dart';
import '../../../providers/managed_conversation_provider.dart';

class ConversationTabs extends StatelessWidget {
  const ConversationTabs({
    required this.workspace,
    required this.onAdd,
    required this.onSelect,
    required this.onClose,
    super.key,
  });

  final ManagedConversationWorkspaceState workspace;
  final VoidCallback onAdd;
  final ValueChanged<int> onSelect;
  final ValueChanged<int> onClose;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Semantics(
      label: 'Conversations ouvertes',
      child: Row(
        children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (var index = 0; index < workspace.tabs.length; index++)
                    Padding(
                      padding: EdgeInsets.only(right: tokens.spacing.xs),
                      child: Semantics(
                        selected: index == workspace.activeIndex,
                        label:
                            '${workspace.tabs[index].title}${workspace.tabs[index].unread ? ', nouveaux messages' : ''}',
                        child: InputChip(
                          label: Text(workspace.tabs[index].title),
                          selected: index == workspace.activeIndex,
                          avatar: workspace.tabs[index].unread
                              ? const Icon(Icons.mark_unread_chat_alt_outlined)
                              : null,
                          onPressed: () => onSelect(index),
                          onDeleted: () => onClose(index),
                          deleteButtonTooltipMessage: 'Fermer la conversation',
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          IconButton(
            tooltip: 'Nouvelle conversation',
            onPressed: onAdd,
            icon: const Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}
