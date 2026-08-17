import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

import '../../../../domain/studio/studio_contracts.dart';
import '../../../../domain/studio/studio_session.dart';

class StudioPreviewFrame extends StatefulWidget {
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
  State<StudioPreviewFrame> createState() => _StudioPreviewFrameState();
}

class _StudioPreviewFrameState extends State<StudioPreviewFrame> {
  static var _nextViewId = 0;
  static const _frameExtent = '100%';
  static const _frameBorder = '0';
  static const _frameDisplay = 'block';
  late final String _viewType;
  late final String _channelId;
  late final web.HTMLIFrameElement _frame;
  StreamSubscription<web.MessageEvent>? _messages;
  StreamSubscription<web.Event>? _loadEvents;
  StreamSubscription<web.Event>? _errorEvents;
  var _ready = false;
  Timer? _handshakeTimer;
  static const _handshakeTimeout = Duration(seconds: 8);

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
      ..setAttribute('sandbox', 'allow-scripts allow-same-origin');
    _frame.style
      ..width = _frameExtent
      ..height = _frameExtent
      ..border = _frameBorder
      ..display = _frameDisplay;
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) => _frame);
    _messages = web.window.onMessage.listen(_handleMessage);
    _loadEvents = _frame.onLoad.listen((_) {
      _ready = false;
      widget.onHandshakeChanged(StudioPreviewHandshake.waiting);
      _attach();
    });
    _errorEvents = _frame.onError.listen((_) {
      _ready = false;
      _handshakeTimer?.cancel();
      widget.onHandshakeChanged(StudioPreviewHandshake.failed);
    });
  }

  @override
  void didUpdateWidget(covariant StudioPreviewFrame oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.retryRevision != widget.retryRevision) {
      _ready = false;
      _attach();
      return;
    }
    if (!_ready) return;
    if (oldWidget.selectedSurfaceId != widget.selectedSurfaceId) {
      _sendSelection();
    }
    if (oldWidget.journalRevision != widget.journalRevision ||
        _commandSignature(oldWidget.commands) !=
            _commandSignature(widget.commands)) {
      _sendCommands();
    }
  }

  void _attach() {
    _handshakeTimer?.cancel();
    _handshakeTimer = Timer(_handshakeTimeout, () {
      if (!_ready) widget.onHandshakeChanged(StudioPreviewHandshake.failed);
    });
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
    if (message['version'] != widget.capability.bridgeVersion ||
        message['channelId'] != _channelId) {
      return;
    }
    if (message['type'] == 'studio.ready') {
      const readyKeys = {
        'version',
        'type',
        'channelId',
        'profileId',
        'anchors',
      };
      if (message.keys.any(
            (key) => key is! String || !readyKeys.contains(key),
          ) ||
          message.length != readyKeys.length ||
          message['profileId'] != widget.capability.profileId ||
          message['anchors'] is! List) {
        return;
      }
      try {
        parseStudioReadyAnchors(message['anchors'], widget.capability.surfaces);
      } on StudioContractException {
        return;
      }
      _ready = true;
      _handshakeTimer?.cancel();
      widget.onHandshakeChanged(StudioPreviewHandshake.ready);
      _sendSelection();
      _sendCommands();
      return;
    }
    const selectedKeys = {'version', 'type', 'channelId', 'anchor'};
    if (message['type'] != 'studio.selected' ||
        message.length != selectedKeys.length ||
        message.keys.any(
          (key) => key is! String || !selectedKeys.contains(key),
        ) ||
        message['anchor'] is! Map) {
      return;
    }
    StudioBridgeSelectedAnchor anchor;
    try {
      anchor = parseStudioSelectedAnchor(
        message['anchor'],
        widget.capability.surfaces,
      );
    } on StudioContractException {
      return;
    }
    widget.onSurfaceSelected(anchor.id);
  }

  void _sendSelection() {
    final selectedSurfaceId = widget.selectedSurfaceId;
    if (!_ready || selectedSurfaceId == null) return;
    _frame.contentWindow?.postMessage(
      <String, Object>{
        'version': widget.capability.bridgeVersion,
        'type': 'studio.select',
        'channelId': _channelId,
        'anchorId': selectedSurfaceId,
      }.jsify(),
      widget.capability.previewOrigin.origin.toJS,
    );
  }

  void _sendCommands() {
    if (!_ready) return;
    final message = <String, Object>{
      'version': widget.capability.bridgeVersion,
      'type': 'studio.commands',
      'channelId': _channelId,
      'revision': widget.journalRevision,
      'commands': widget.commands.map((command) => command.toJson()).toList(),
    };
    if (widget.commands.any(
          (command) => !isWithinStudioCommandLimit(command.toJson()),
        ) ||
        !isWithinStudioBridgeMessageLimit(message)) {
      widget.onHandshakeChanged(StudioPreviewHandshake.failed);
      return;
    }
    _frame.contentWindow?.postMessage(
      message.jsify(),
      widget.capability.previewOrigin.origin.toJS,
    );
  }

  String _commandSignature(List<VisualCommand> commands) =>
      jsonEncode(commands.map((command) => command.toJson()).toList());

  @override
  void dispose() {
    unawaited(_messages?.cancel());
    unawaited(_loadEvents?.cancel());
    unawaited(_errorEvents?.cancel());
    _handshakeTimer?.cancel();
    _frame.remove();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _viewType);
}
