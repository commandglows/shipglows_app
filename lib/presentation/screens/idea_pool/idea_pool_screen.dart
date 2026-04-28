import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../data/models/idea.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import '../../widgets/project_picker_action.dart';

const _statusFilters = ['all', 'raw', 'enriched', 'used', 'dismissed'];
const _sourceFilters = [
  'all',
  'newsletter_inbox',
  'seo_keywords',
  'competitor_watch',
  'social_listening',
  'manual',
];

class IdeaPoolScreen extends ConsumerWidget {
  const IdeaPoolScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ideasAsync = ref.watch(ideasProvider);
    final notifier = ref.read(ideasProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Idea Pool')),
        actions: [
          const ProjectPickerAction(),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(ideasProvider),
          ),
        ],
      ),
      body: ideasAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: AppErrorView(
            scope: 'idea_pool.load',
            title: context.tr('Failed to load ideas'),
            error: error,
            stackTrace: stackTrace,
            onRetry: () => ref.invalidate(ideasProvider),
          ),
        ),
        data: (ideas) {
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(ideasProvider),
            child: CustomScrollView(
              slivers: [
                // Stats
                SliverToBoxAdapter(child: _StatsRow(ideas: ideas)),
                // Status filter
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _statusFilters.map((filter) {
                          final selected = notifier.statusFilter == filter;
                          final label = filter == 'all'
                              ? 'All'
                              : filter[0].toUpperCase() + filter.substring(1);
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(context.tr(label)),
                              selected: selected,
                              onSelected: (_) =>
                                  notifier.setStatusFilter(filter),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),
                // Source filter
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _sourceFilters.map((filter) {
                          final selected = notifier.sourceFilter == filter;
                          final label = filter == 'all'
                              ? context.tr('All sources')
                              : Idea(
                                  id: '',
                                  source: filter,
                                  title: '',
                                  createdAt: DateTime.now(),
                                  updatedAt: DateTime.now(),
                                ).sourceLabel;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(label),
                              selected: selected,
                              onSelected: (_) =>
                                  notifier.setSourceFilter(filter),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),
                // Ideas list
                if (ideas.isEmpty)
                  const SliverFillRemaining(child: _EmptyState())
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _IdeaCard(
                        idea: ideas[index],
                        onDismiss: () =>
                            notifier.dismissIdea(ideas[index].id),
                        onDelete: () => _confirmDelete(
                            context, ref, ideas[index]),
                        onPrioritize: (score) =>
                            notifier.prioritizeIdea(ideas[index].id, score),
                      ),
                      childCount: ideas.length,
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, Idea idea) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('Delete idea?')),
        content: Text(
          context.tr(
            'Remove "{title}"? This cannot be undone.',
            {'title': idea.title},
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text(context.tr('Delete')),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      ref.read(ideasProvider.notifier).deleteIdea(idea.id);
    }
  }
}

// ─── Stats Row ──────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.ideas});
  final List<Idea> ideas;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final raw = ideas.where((i) => i.status == 'raw').length;
    final enriched = ideas.where((i) => i.status == 'enriched').length;
    final used = ideas.where((i) => i.status == 'used').length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          _StatChip(
            label: 'Total',
            value: '${ideas.length}',
            color: theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 8),
          _StatChip(
            label: 'Raw',
            value: '$raw',
            color: AppTheme.warningColor,
          ),
          const SizedBox(width: 8),
          _StatChip(
            label: 'Enriched',
            value: '$enriched',
            color: AppTheme.approveColor,
          ),
          const SizedBox(width: 8),
          _StatChip(
            label: 'Used',
            value: '$used',
            color: theme.colorScheme.primary,
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip(
      {required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withAlpha(25),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(context.tr(label),
                style: TextStyle(fontSize: 11, color: color.withAlpha(180))),
          ],
        ),
      ),
    );
  }
}

// ─── Idea Card ──────────────────────────────────────────

class _IdeaCard extends StatelessWidget {
  const _IdeaCard({
    required this.idea,
    required this.onDismiss,
    required this.onDelete,
    required this.onPrioritize,
  });

  final Idea idea;
  final VoidCallback onDismiss;
  final VoidCallback onDelete;
  final ValueChanged<double> onPrioritize;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final dateFormat = DateFormat('MMM d, y', context.localeTag);

    final statusColor = _statusColor(idea.status, colorScheme);
    final sourceColor = _sourceColor(idea.source, colorScheme);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title + status
            Row(
              children: [
                Expanded(
                  child: Text(
                    idea.title,
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(30),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    idea.statusLabel,
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: statusColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // Metadata chips
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                _MetaChip(
                  icon: Icons.source_outlined,
                  text: idea.sourceLabel,
                  color: sourceColor,
                ),
                if (idea.priorityScore != null)
                  _MetaChip(
                    icon: Icons.trending_up,
                    text: context.tr(
                      'Score {score}',
                      {'score': idea.priorityScore!.toStringAsFixed(0)},
                    ),
                    color: AppTheme.approveColor,
                  ),
                if (idea.searchVolume != null)
                  _MetaChip(
                    icon: Icons.search,
                    text: context.tr(
                      '{volume} vol',
                      {'volume': idea.searchVolume},
                    ),
                    color: AppTheme.infoColor,
                  ),
                if (idea.keywordDifficulty != null)
                  _MetaChip(
                    icon: Icons.speed,
                    text: context.tr(
                      'KD {score}',
                      {'score': idea.keywordDifficulty!.toStringAsFixed(0)},
                    ),
                    color: AppTheme.rejectColor,
                  ),
                _MetaChip(
                  icon: Icons.calendar_today_outlined,
                  text: dateFormat.format(idea.createdAt),
                  color: colorScheme.onSurfaceVariant,
                ),
              ],
            ),
            // Tags
            if (idea.tags.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 4,
                runSpacing: 4,
                children: idea.tags.take(5).map((tag) {
                  return Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withAlpha(20),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      tag,
                      style: TextStyle(
                          fontSize: 11, color: colorScheme.primary),
                    ),
                  );
                }).toList(),
              ),
            ],
            // Actions
            if (idea.status == 'raw' || idea.status == 'enriched') ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  if (idea.status == 'enriched')
                    _ActionButton(
                      icon: Icons.arrow_upward,
                      label: 'Boost',
                      color: AppTheme.approveColor,
                      onTap: () => onPrioritize(
                          (idea.priorityScore ?? 50) + 10),
                    ),
                  if (idea.status == 'enriched') const SizedBox(width: 8),
                  if (idea.status == 'enriched')
                    _ActionButton(
                      icon: Icons.arrow_downward,
                      label: 'Lower',
                      color: AppTheme.warningColor,
                      onTap: () => onPrioritize(
                          ((idea.priorityScore ?? 50) - 10).clamp(0, 100)),
                    ),
                  const Spacer(),
                  _ActionButton(
                    icon: Icons.close,
                    label: 'Dismiss',
                    color: colorScheme.onSurfaceVariant,
                    onTap: onDismiss,
                  ),
                  const SizedBox(width: 8),
                  _ActionButton(
                    icon: Icons.delete_outline,
                    label: 'Delete',
                    color: colorScheme.error,
                    onTap: onDelete,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status, ColorScheme colorScheme) {
    return switch (status) {
      'raw' => AppTheme.warningColor,
      'enriched' => AppTheme.approveColor,
      'used' => colorScheme.primary,
      'dismissed' => colorScheme.onSurfaceVariant,
      _ => colorScheme.outline,
    };
  }

  Color _sourceColor(String source, ColorScheme colorScheme) {
    return switch (source) {
      'newsletter_inbox' => AppTheme.warningColor,
      'seo_keywords' => AppTheme.infoColor,
      'competitor_watch' => AppTheme.rejectColor,
      'social_listening' => AppTheme.editColor,
      'manual' => colorScheme.primary,
      _ => colorScheme.outline,
    };
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip(
      {required this.icon, required this.text, required this.color});
  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 3),
        Text(text, style: TextStyle(fontSize: 12, color: color)),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        constraints: const BoxConstraints(minHeight: 44),
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(context.tr(label),
                style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w500, color: color)),
          ],
        ),
      ),
    );
  }
}

// ─── Empty State ────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lightbulb_outline,
              size: 64, color: colorScheme.outlineVariant),
          const SizedBox(height: 16),
          Text(
            context.tr('No ideas yet'),
            style:
                TextStyle(color: colorScheme.onSurfaceVariant, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            context.tr(
              'Ideas from newsletters, SEO, competitors\nand social listening will appear here.',
            ),
            textAlign: TextAlign.center,
            style:
                TextStyle(color: colorScheme.onSurfaceVariant, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
