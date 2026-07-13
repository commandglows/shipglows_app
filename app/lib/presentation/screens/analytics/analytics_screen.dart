import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/content_item.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/project_picker_action.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingContentProvider);
    final historyAsync = ref.watch(contentHistoryProvider);
    final theme = Theme.of(context);

    final List<ContentItem> allContent = [
      ...pendingAsync.value ?? [],
      ...historyAsync.value ?? [],
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Analytics')),
        actions: [
          const ProjectPickerAction(),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(pendingContentProvider);
              ref.invalidate(contentHistoryProvider);
            },
          ),
        ],
      ),
      body: allContent.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.insights_outlined,
                    size: 64,
                    color: theme.colorScheme.outlineVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    context.tr('No data yet'),
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    context.tr(
                      'Analytics will appear as content flows through the pipeline',
                    ),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.outlineVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(pendingContentProvider);
                ref.invalidate(contentHistoryProvider);
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _PipelineFunnel(content: allContent, theme: theme),
                  const SizedBox(height: 20),
                  _ContentByType(content: allContent, theme: theme),
                  const SizedBox(height: 20),
                  _ChannelDistribution(content: allContent, theme: theme),
                  const SizedBox(height: 20),
                  _PublishingTimeline(content: allContent, theme: theme),
                ],
              ),
            ),
    );
  }
}

class _PipelineFunnel extends StatelessWidget {
  const _PipelineFunnel({required this.content, required this.theme});
  final List<ContentItem> content;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final total = content.length;
    final pending = content
        .where((c) => c.status == ContentStatus.pending)
        .length;
    final published = content
        .where((c) => c.status == ContentStatus.published)
        .length;
    final rejected = content
        .where((c) => c.status == ContentStatus.rejected)
        .length;
    final approved = content
        .where((c) => c.status == ContentStatus.approved)
        .length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.tr('Pipeline Funnel'), style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        _FunnelBar(
          label: 'Total',
          count: total,
          maxCount: total,
          color: theme.colorScheme.primary,
        ),
        const SizedBox(height: 6),
        _FunnelBar(
          label: 'Pending Review',
          count: pending,
          maxCount: total,
          color: AppTheme.warningColor,
        ),
        const SizedBox(height: 6),
        _FunnelBar(
          label: 'Approved',
          count: approved,
          maxCount: total,
          color: AppTheme.editColor,
        ),
        const SizedBox(height: 6),
        _FunnelBar(
          label: 'Published',
          count: published,
          maxCount: total,
          color: AppTheme.approveColor,
        ),
        const SizedBox(height: 6),
        _FunnelBar(
          label: 'Rejected',
          count: rejected,
          maxCount: total,
          color: AppTheme.rejectColor,
        ),
      ],
    );
  }
}

class _FunnelBar extends StatelessWidget {
  const _FunnelBar({
    required this.label,
    required this.count,
    required this.maxCount,
    required this.color,
  });
  final String label;
  final int count;
  final int maxCount;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final fraction = maxCount > 0 ? count / maxCount : 0.0;
    return Row(
      children: [
        SizedBox(
          width: 110,
          child: Text(context.tr(label), style: const TextStyle(fontSize: 12)),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: fraction,
              backgroundColor: color.withValues(alpha: 0.1),
              color: color,
              minHeight: 20,
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 30,
          child: Text(
            '$count',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}

class _ContentByType extends StatelessWidget {
  const _ContentByType({required this.content, required this.theme});
  final List<ContentItem> content;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final typeCounts = <ContentType, int>{};
    for (final item in content) {
      typeCounts[item.type] = (typeCounts[item.type] ?? 0) + 1;
    }

    final sorted = typeCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.tr('Content by Type'), style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        ...sorted.map((e) {
          final label = e.key.name
              .replaceAllMapped(RegExp(r'[A-Z]'), (m) => ' ${m.group(0)}')
              .trim();
          return _FunnelBar(
            label: label,
            count: e.value,
            maxCount: content.length,
            color: theme.colorScheme.secondary,
          );
        }),
      ],
    );
  }
}

class _ChannelDistribution extends StatelessWidget {
  const _ChannelDistribution({required this.content, required this.theme});
  final List<ContentItem> content;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final channelCounts = <String, int>{};
    for (final item in content) {
      for (final channel in item.channels) {
        final name = channel.name;
        channelCounts[name] = (channelCounts[name] ?? 0) + 1;
      }
    }

    if (channelCounts.isEmpty) return const SizedBox.shrink();

    final sorted = channelCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.tr('Channel Distribution'),
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: sorted
              .map(
                (e) => Chip(
                  avatar: CircleAvatar(
                    radius: 12,
                    backgroundColor: theme.colorScheme.tertiaryContainer,
                    child: Text(
                      '${e.value}',
                      style: TextStyle(
                        fontSize: 10,
                        color: theme.colorScheme.onTertiaryContainer,
                      ),
                    ),
                  ),
                  label: Text(e.key, style: const TextStyle(fontSize: 12)),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _PublishingTimeline extends StatelessWidget {
  const _PublishingTimeline({required this.content, required this.theme});
  final List<ContentItem> content;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final published =
        content
            .where(
              (c) =>
                  c.status == ContentStatus.published && c.publishedAt != null,
            )
            .toList()
          ..sort((a, b) => b.publishedAt!.compareTo(a.publishedAt!));

    if (published.isEmpty) return const SizedBox.shrink();

    // Group by day
    final byDay = <String, int>{};
    for (final item in published) {
      final day = item.publishedAt!.toIso8601String().split('T').first;
      byDay[day] = (byDay[day] ?? 0) + 1;
    }

    final sortedDays = byDay.entries.toList()
      ..sort((a, b) => b.key.compareTo(a.key));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.tr('Publishing Timeline'),
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        ...sortedDays
            .take(14)
            .map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    SizedBox(
                      width: 90,
                      child: Text(e.key, style: const TextStyle(fontSize: 12)),
                    ),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: e.value / (sortedDays.first.value),
                          backgroundColor: AppTheme.approveColor.withValues(
                            alpha: 0.1,
                          ),
                          color: AppTheme.approveColor,
                          minHeight: 16,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${e.value}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
      ],
    );
  }
}
