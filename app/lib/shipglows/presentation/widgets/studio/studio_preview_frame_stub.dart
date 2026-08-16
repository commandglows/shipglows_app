import 'package:flutter/material.dart';

import '../../../../domain/studio/studio_contracts.dart';

class StudioPreviewFrame extends StatelessWidget {
  const StudioPreviewFrame({
    required this.capability,
    required this.onSurfaceSelected,
    super.key,
  });

  final StudioPreviewCapability capability;
  final ValueChanged<String> onSurfaceSelected;

  @override
  Widget build(BuildContext context) => const Center(
    child: Text(
      'L’aperçu Astro réel est disponible uniquement dans Flutter Web.',
    ),
  );
}
