import 'package:flutter/material.dart';

import '../../../../domain/studio/studio_contracts.dart';
import '../../../../domain/studio/studio_session.dart';

class StudioPreviewFrame extends StatelessWidget {
  const StudioPreviewFrame({
    required this.capability,
    required this.onSurfaceSelected,
    required this.onHandshakeChanged,
    required this.selectedSurfaceId,
    required this.commands,
    required this.journalRevision,
    required this.retryRevision,
    super.key,
  });

  final StudioPreviewCapability capability;
  final ValueChanged<String> onSurfaceSelected;
  final ValueChanged<StudioPreviewHandshake> onHandshakeChanged;
  final String? selectedSurfaceId;
  final List<VisualCommand> commands;
  final int journalRevision;
  final int retryRevision;

  @override
  Widget build(BuildContext context) => const Center(
    child: Text(
      'L’aperçu Astro réel est disponible uniquement dans Flutter Web.',
    ),
  );
}
