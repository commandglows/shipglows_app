import 'package:flutter/material.dart';

const genericPreviewFrameSupported = false;

class GenericPreviewFrame extends StatelessWidget {
  const GenericPreviewFrame({
    required this.origin,
    required this.title,
    required this.reloadRevision,
    required this.onLoaded,
    required this.onFailed,
    super.key,
  });

  final Uri origin;
  final String title;
  final int reloadRevision;
  final VoidCallback onLoaded;
  final VoidCallback onFailed;

  @override
  Widget build(BuildContext context) => const Center(
    child: Text(
      'La Preview intégrée est disponible dans ShipGlows Web. '
      'Cette plateforme native ne possède pas encore de WebView admise.',
      textAlign: TextAlign.center,
    ),
  );
}
