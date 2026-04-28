import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/project_picker_action.dart';

class ReelsScreen extends ConsumerStatefulWidget {
  const ReelsScreen({super.key});

  @override
  ConsumerState<ReelsScreen> createState() => _ReelsScreenState();
}

class _ReelsScreenState extends ConsumerState<ReelsScreen> {
  final _urlCtrl = TextEditingController();
  bool _downloading = false;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _urlCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Reels')),
        actions: const [ProjectPickerAction()],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Info card
          Card(
            color: palette.mutedSurface,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Icon(Icons.slow_motion_video,
                      color: theme.colorScheme.primary, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(context.tr('Reel Repurposing'),
                            style: theme.textTheme.titleSmall),
                        const SizedBox(height: 2),
                        Text(
                          context.tr('Download Instagram reels, extract audio, upload to CDN'),
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          Text(context.tr('Download Reel'), style: theme.textTheme.titleMedium),
          const SizedBox(height: 12),

          TextField(
            controller: _urlCtrl,
            decoration: InputDecoration(
              labelText: context.tr('Instagram Reel URL'),
              hintText: context.tr('https://www.instagram.com/reel/...'),
              prefixIcon: const Icon(Icons.link),
            ),
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 16),

          FilledButton.icon(
            onPressed: _downloading ? null : _download,
            icon: _downloading
                ? const SizedBox(
                    height: 18, width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.download),
            label: Text(_downloading
                ? context.tr('Downloading...')
                : context.tr('Download & Extract')),
          ),

          if (_result != null) ...[
            const SizedBox(height: 20),
            _ResultCard(result: _result!, theme: theme),
          ],
        ],
      ),
    );
  }

  Future<void> _download() async {
    if (_urlCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('Enter an Instagram Reel URL'))),
      );
      return;
    }

    setState(() {
      _downloading = true;
      _result = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final result = await api.downloadReel(
        url: _urlCtrl.text.trim(),
        userId: 'current',
      );
      setState(() => _result = result);
    } catch (error, stackTrace) {
      if (mounted) {
        showDiagnosticSnackBar(
          context,
          ref,
          message: context.tr('Download failed: {error}', {'error': '$error'}),
          scope: 'reels.download',
          error: error,
          stackTrace: stackTrace,
          contextData: {'url': _urlCtrl.text.trim()},
        );
      }
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.result, required this.theme});
  final Map<String, dynamic> result;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final reelId = result['reel_id'] as String? ?? '';
    final videoUrl = result['video_url'] as String? ?? '';
    final audioUrl = result['audio_url'] as String? ?? '';
    final duration = result['duration'] as num?;
    final caption = result['caption'] as String?;
    final author = result['author'] as String?;
    final successColor = AppTheme.approveColor;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.check_circle, color: successColor, size: 20),
                const SizedBox(width: 8),
                Text(context.tr('Download Complete'),
                    style: theme.textTheme.titleSmall
                        ?.copyWith(color: successColor)),
              ],
            ),
            const SizedBox(height: 12),
            if (author != null) _InfoRow(label: context.tr('Author'), value: author),
            if (reelId.isNotEmpty)
              _InfoRow(label: context.tr('Reel ID'), value: reelId),
            if (duration != null)
              _InfoRow(label: context.tr('Duration'),
                  value: '${duration.toInt()}s'),
            if (videoUrl.isNotEmpty)
              _InfoRow(label: context.tr('Video'), value: videoUrl, isUrl: true),
            if (audioUrl.isNotEmpty)
              _InfoRow(label: context.tr('Audio'), value: audioUrl, isUrl: true),
            if (caption != null && caption.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(context.tr('Caption'), style: theme.textTheme.labelSmall),
              const SizedBox(height: 4),
              Text(caption,
                  style: theme.textTheme.bodySmall,
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value, this.isUrl = false});
  final String label;
  final String value;
  final bool isUrl;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 70,
            child: Text('$label:',
                style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant)),
          ),
          Expanded(
            child: Text(
              isUrl && value.length > 40 ? '${value.substring(0, 40)}...' : value,
              style: TextStyle(
                fontSize: 12,
                color: isUrl ? Theme.of(context).colorScheme.primary : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
