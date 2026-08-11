import 'package:flutter/material.dart';

import '../../../../presentation/theme/app_theme.dart';
import '../../../data/conversations/conversation_event_mapper.dart';

class ConversationTimeline extends StatefulWidget {
  const ConversationTimeline({required this.items, super.key});

  final List<ConversationPresentationItem> items;

  @override
  State<ConversationTimeline> createState() => _ConversationTimelineState();
}

class _ConversationTimelineState extends State<ConversationTimeline> {
  final _scrollController = ScrollController();
  var _nearBottom = true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_trackPosition);
  }

  @override
  void didUpdateWidget(covariant ConversationTimeline oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.items.length != oldWidget.items.length && _nearBottom) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    }
  }

  void _trackPosition() {
    if (!_scrollController.hasClients) return;
    final tokens = AppTheme.tokensOf(context);
    _nearBottom =
        _scrollController.position.extentAfter <= tokens.spacing.xxl * 2;
  }

  void _scrollToBottom() {
    if (!mounted || !_scrollController.hasClients) return;
    final tokens = AppTheme.tokensOf(context);
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: tokens.motion.standard,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_trackPosition)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Semantics(
      label: 'Historique de la conversation',
      liveRegion: true,
      child: ListView.separated(
        controller: _scrollController,
        itemCount: widget.items.length,
        padding: EdgeInsets.symmetric(vertical: tokens.spacing.xs),
        separatorBuilder: (_, _) => SizedBox(height: tokens.spacing.xs),
        itemBuilder: (context, index) =>
            _ConversationItem(item: widget.items[index]),
      ),
    );
  }
}

class _ConversationItem extends StatelessWidget {
  const _ConversationItem({required this.item});

  final ConversationPresentationItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = AppTheme.tokensOf(context);
    final palette = AppTheme.paletteOf(context);
    final accent = switch (item.kind) {
      ConversationItemKind.error => tokens.execution.failed,
      ConversationItemKind.approval => tokens.execution.awaitingApproval,
      ConversationItemKind.result => tokens.execution.completed,
      ConversationItemKind.progress => tokens.execution.running,
      _ => theme.colorScheme.outline,
    };
    final metadata = <String>[
      'Runtime : ${item.runtimeId ?? 'non renseigné'}',
      'Capacités : ${item.capabilities.isEmpty ? 'non renseignées' : item.capabilities.join(', ')}',
    ];

    return Semantics(
      label: '${item.title}. ${item.body}',
      child: Container(
        padding: EdgeInsets.all(tokens.spacing.md),
        decoration: BoxDecoration(
          color: palette.mutedSurface,
          borderRadius: BorderRadius.circular(tokens.radii.card),
          border: Border.all(color: accent),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.title, style: theme.textTheme.labelLarge),
            SizedBox(height: tokens.spacing.xxs),
            SelectableText(item.body),
            SizedBox(height: tokens.spacing.xs),
            Text(
              metadata.join(' · '),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
