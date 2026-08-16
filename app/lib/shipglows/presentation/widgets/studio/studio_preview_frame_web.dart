import 'dart:async';
import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

import '../../../../domain/studio/studio_contracts.dart';

class StudioPreviewFrame extends StatefulWidget {
  const StudioPreviewFrame({
    required this.capability,
    required this.onSurfaceSelected,
    super.key,
  });

  final StudioPreviewCapability capability;
  final ValueChanged<String> onSurfaceSelected;

  @override
  State<StudioPreviewFrame> createState() => _StudioPreviewFrameState();
}

class _StudioPreviewFrameState extends State<StudioPreviewFrame> {
  static var _nextViewId = 0;
  late final String _viewType;
  late final String _channelId;
  late final web.HTMLIFrameElement _frame;
  StreamSubscription<web.MessageEvent>? _messages;

  @override
  void initState() {
    super.initState();
    _viewType = 'shipglows-studio-preview-${_nextViewId++}';
    _channelId =
        'channel_${web.window.crypto.randomUUID().replaceAll('-', '')}';
    _frame = web.HTMLIFrameElement()
      ..src = widget.capability.previewOrigin.toString()
      ..title = 'Aperçu Astro réel'
      ..referrerPolicy = 'no-referrer'
      ..setAttribute('sandbox', 'allow-scripts allow-same-origin')
      ..setAttribute('style', 'width:100%;height:100%;border:0;display:block;');
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) => _frame);
    _messages = web.window.onMessage.listen(_handleMessage);
    _frame.onLoad.listen((_) => _attach());
  }

  void _attach() {
    _frame.contentWindow?.postMessage(
      <String, Object>{
        'version': widget.capability.bridgeVersion,
        'type': 'studio.attach',
        'channelId': _channelId,
      }.jsify(),
      widget.capability.previewOrigin.origin.toJS,
    );
  }

  void _handleMessage(web.MessageEvent event) {
    if (event.origin != widget.capability.previewOrigin.origin ||
        event.source != _frame.contentWindow) {
      return;
    }
    final raw = event.data.dartify();
    if (raw is! Map) return;
    final message = Map<Object?, Object?>.from(raw);
    const allowed = {'version', 'type', 'channelId', 'anchor'};
    if (message.keys.any((key) => key is! String || !allowed.contains(key)) ||
        message['version'] != widget.capability.bridgeVersion ||
        message['type'] != 'studio.selected' ||
        message['channelId'] != _channelId ||
        message['anchor'] is! Map) {
      return;
    }
    final anchor = Map<Object?, Object?>.from(message['anchor'] as Map);
    final id = anchor['id'];
    if (id is String &&
        widget.capability.surfaces.any((surface) => surface.id == id)) {
      widget.onSurfaceSelected(id);
    }
  }

  @override
  void dispose() {
    unawaited(_messages?.cancel());
    _frame.remove();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _viewType);
}
