import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../data/models/content_item.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/project_picker_action.dart';
import '../../widgets/app_error_view.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(contentHistoryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('History')),
        actions: const [ProjectPickerAction()],
      ),
      body: historyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: AppErrorView(
            scope: 'history.load',
            title: context.tr('Failed to load history'),
            error: error,
            stackTrace: stackTrace,
            onRetry: () => ref.invalidate(contentHistoryProvider),
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.history,
                    size: 64,
                    color: theme.colorScheme.outlineVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    context.tr('No history yet'),
                    style: TextStyle(
                      fontSize: 18,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, index) => _HistoryTile(item: items[index]),
          );
        },
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  final ContentItem item;

  const _HistoryTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    final typeColor = AppTheme.colorForContentType(item.typeLabel);
    final statusColor = _statusColor(context, item.status);
    final dateFormat = DateFormat('MMM d, HH:mm', context.localeTag);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Row(
        children: [
          // Status icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: statusColor.withAlpha(30),
              shape: BoxShape.circle,
            ),
            child: Icon(_statusIcon(item.status), color: statusColor, size: 22),
          ),
          const SizedBox(width: 14),
          // Content info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: TextStyle(
                    color: theme.colorScheme.onSurface,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: typeColor.withAlpha(30),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item.typeLabel,
                        style: TextStyle(color: typeColor, fontSize: 11),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      dateFormat.format(item.publishedAt ?? item.createdAt),
                      style: TextStyle(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                if (item.reviewActorDisplay != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        Icons.verified_user_outlined,
                        size: 13,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          context.tr('Reviewed by {reviewer}{typeSuffix}', {
                            'reviewer': item.reviewActorDisplay,
                            'typeSuffix': item.reviewActorType == null
                                ? ''
                                : ' (${item.reviewActorType})',
                          }),
                          style: TextStyle(
                            color: theme.colorScheme.onSurfaceVariant,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: statusColor.withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              context.tr(item.status.name),
              style: TextStyle(
                color: statusColor,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(BuildContext context, ContentStatus status) {
    return switch (status) {
      ContentStatus.published => AppTheme.approveColor,
      ContentStatus.rejected => AppTheme.rejectColor,
      ContentStatus.approved => AppTheme.warningColor,
      ContentStatus.editing => AppTheme.editColor,
      ContentStatus.pending => Theme.of(context).colorScheme.onSurfaceVariant,
    };
  }

  IconData _statusIcon(ContentStatus status) {
    return switch (status) {
      ContentStatus.published => Icons.check_circle_rounded,
      ContentStatus.rejected => Icons.cancel_rounded,
      ContentStatus.approved => Icons.schedule_rounded,
      ContentStatus.editing => Icons.edit_rounded,
      ContentStatus.pending => Icons.hourglass_empty_rounded,
    };
  }
}
