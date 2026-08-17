import 'dart:async';
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

const genericPreviewFrameSupported = true;

class GenericPreviewFrame extends StatefulWidget {
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
  State<GenericPreviewFrame> createState() => _GenericPreviewFrameState();
}

class _GenericPreviewFrameState extends State<GenericPreviewFrame> {
  static var _nextViewId = 0;
  late final String _viewType;
  late final web.HTMLIFrameElement _frame;
  StreamSubscription<web.Event>? _loads;
  StreamSubscription<web.Event>? _errors;

  @override
  void initState() {
    super.initState();
    _viewType = 'shipglows-project-preview-${_nextViewId++}';
    _frame = web.HTMLIFrameElement()
      ..src = widget.origin.toString()
      ..title = widget.title
      ..referrerPolicy = 'no-referrer'
      ..setAttribute(
        'sandbox',
        'allow-scripts allow-same-origin allow-forms allow-modals',
      );
    _frame.style
      ..width = '100%'
      ..height = '100%'
      ..border = '0'
      ..display = 'block';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) => _frame);
    _loads = _frame.onLoad.listen((_) => widget.onLoaded());
    _errors = _frame.onError.listen((_) => widget.onFailed());
  }

  @override
  void didUpdateWidget(covariant GenericPreviewFrame oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.origin != widget.origin ||
        oldWidget.reloadRevision != widget.reloadRevision) {
      _frame.src = widget.origin.toString();
    }
    if (oldWidget.title != widget.title) _frame.title = widget.title;
  }

  @override
  void dispose() {
    unawaited(_loads?.cancel());
    unawaited(_errors?.cancel());
    _frame.remove();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _viewType);
}
