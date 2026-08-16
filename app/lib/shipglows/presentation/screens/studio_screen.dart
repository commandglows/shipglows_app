import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../domain/studio/studio_contracts.dart';
import '../../../presentation/theme/app_theme.dart';
import '../../providers/studio_provider.dart';
import '../widgets/shipglows_scaffold.dart';
import '../widgets/studio/studio_preview_frame.dart';

class StudioScreen extends ConsumerWidget {
  const StudioScreen({
    required this.projectId,
    required this.projectName,
    this.previewBuilder,
    super.key,
  });

  final String projectId;
  final String projectName;
  final Widget Function(
    StudioPreviewCapability capability,
    ValueChanged<String> onSelected,
  )?
  previewBuilder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final capability = ref.watch(managedStudioCapabilityProvider(projectId));
    return ShipGlowsScaffold(
      title: 'Studio · $projectName',
      body: capability.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const _StudioUnavailable(),
        data: (value) => value == null
            ? const _StudioUnavailable()
            : _StudioWorkspace(
                capability: value,
                previewBuilder: previewBuilder,
              ),
      ),
    );
  }
}

class _StudioUnavailable extends StatelessWidget {
  const _StudioUnavailable();

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: tokens.conversation.messageMaxWidth,
        ),
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(tokens.spacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.visibility_off_outlined),
                SizedBox(height: tokens.spacing.md),
                Text(
                  'Studio indisponible',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                SizedBox(height: tokens.spacing.xs),
                const Text(
                  'Le runner n’a pas admis le profil Astro exact pour cette révision. Aucun aperçu ni contrôle de code n’est activé.',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StudioWorkspace extends StatefulWidget {
  const _StudioWorkspace({required this.capability, this.previewBuilder});

  final StudioPreviewCapability capability;
  final Widget Function(StudioPreviewCapability, ValueChanged<String>)?
  previewBuilder;

  @override
  State<_StudioWorkspace> createState() => _StudioWorkspaceState();
}

class _StudioWorkspaceState extends State<_StudioWorkspace> {
  String? selectedId;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final selected = widget.capability.surfaces
        .where((surface) => surface.id == selectedId)
        .firstOrNull;
    final preview =
        widget.previewBuilder?.call(widget.capability, _select) ??
        StudioPreviewFrame(
          capability: widget.capability,
          onSurfaceSelected: _select,
        );
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < tokens.breakpoints.tablet;
        final inspector = _StudioInspector(
          capability: widget.capability,
          selected: selected,
          onSelected: _select,
        );
        if (compact) {
          return Column(
            children: [
              Expanded(flex: 3, child: preview),
              Divider(height: tokens.spacing.xxs),
              Expanded(flex: 2, child: inspector),
            ],
          );
        }
        return Row(
          children: [
            Expanded(flex: 3, child: preview),
            VerticalDivider(width: tokens.spacing.xxs),
            Expanded(child: inspector),
          ],
        );
      },
    );
  }

  void _select(String id) => setState(() => selectedId = id);
}

class _StudioInspector extends StatelessWidget {
  const _StudioInspector({
    required this.capability,
    required this.selected,
    required this.onSelected,
  });

  final StudioPreviewCapability capability;
  final StudioSurfaceSummary? selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return ListView(
      padding: EdgeInsets.all(tokens.spacing.md),
      children: [
        Text('Inspection', style: Theme.of(context).textTheme.titleLarge),
        SizedBox(height: tokens.spacing.xs),
        const Text('Lecture seule · aucune modification source'),
        SizedBox(height: tokens.spacing.md),
        for (final surface in capability.surfaces)
          ListTile(
            selected: selected?.id == surface.id,
            title: Text(surface.label),
            subtitle: Text(
              '${surface.id} · source ${surface.sourceConfidence}',
            ),
            onTap: () => onSelected(surface.id),
          ),
        if (selected != null) ...[
          SizedBox(height: tokens.spacing.md),
          Text(
            'Surface sélectionnée',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          SizedBox(height: tokens.spacing.xs),
          Text(selected!.label),
          Text(selected!.id, style: Theme.of(context).textTheme.bodySmall),
        ],
      ],
    );
  }
}
