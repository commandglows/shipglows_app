import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../presentation/theme/app_theme.dart';
import '../../../personal_cloud/personal_cloud_models.dart';
import '../../../personal_cloud/personal_cloud_transports.dart';
import 'generic_preview_frame.dart';

typedef ProjectPreviewFrameBuilder =
    Widget Function(
      Uri origin,
      int reloadRevision,
      VoidCallback onLoaded,
      VoidCallback onFailed,
    );

typedef ProjectPreviewExternalOpener = Future<bool> Function(Uri origin);

class ProjectPreviewPane extends StatefulWidget {
  const ProjectPreviewPane({
    required this.projectId,
    required this.projectName,
    required this.transport,
    this.frameBuilder,
    this.previewLoadTimeout = const Duration(seconds: 12),
    this.openExternal,
    super.key,
  });

  final String projectId;
  final String projectName;
  final ProjectPreviewTransport? transport;
  final ProjectPreviewFrameBuilder? frameBuilder;
  final Duration previewLoadTimeout;
  final ProjectPreviewExternalOpener? openExternal;

  @override
  State<ProjectPreviewPane> createState() => _ProjectPreviewPaneState();
}

class _ProjectPreviewPaneState extends State<ProjectPreviewPane> {
  ProjectPreviewSnapshot? _snapshot;
  RemoteSurfaceException? _failure;
  bool _loading = true;
  bool _showBrowserHelp = false;
  bool _manualBrowserHelp = false;
  int _reloadRevision = 0;
  Timer? _loadTimer;
  late final String _diagnosticId;

  @override
  void initState() {
    super.initState();
    _diagnosticId =
        'pd_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}';
    unawaited(_open());
  }

  @override
  void didUpdateWidget(covariant ProjectPreviewPane oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.projectId != widget.projectId ||
        oldWidget.transport != widget.transport) {
      unawaited(_open());
    }
  }

  @override
  void dispose() {
    _loadTimer?.cancel();
    super.dispose();
  }

  Future<void> _open() async {
    final transport = widget.transport;
    setState(() {
      _loading = true;
      _showBrowserHelp = false;
      _manualBrowserHelp = false;
      _failure = null;
    });
    _loadTimer?.cancel();
    if (transport == null) {
      setState(() {
        _loading = false;
        _failure = const RemoteSurfaceException(
          failure: RemoteSurfaceFailure.unsupported,
          message:
              'La Preview distante n’est pas encore reliée à cette application.',
          retryable: false,
        );
      });
      return;
    }
    try {
      final snapshot = await transport.openPreview(projectId: widget.projectId);
      if (!mounted) return;
      if (snapshot.canRender &&
          (snapshot.origin!.scheme != 'https' ||
              snapshot.origin!.host.isEmpty ||
              snapshot.origin!.hasPort)) {
        throw const RemoteSurfaceException(
          failure: RemoteSurfaceFailure.protocol,
          message: 'Le runner a refusé une origine Preview non persistante.',
          retryable: false,
        );
      }
      setState(() {
        _snapshot = snapshot;
        _loading = snapshot.canRender;
        _reloadRevision += 1;
      });
      if (snapshot.canRender) _startLoadTimer();
    } on RemoteSurfaceException catch (error) {
      if (mounted) {
        setState(() {
          _loading = false;
          _failure = error;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _failure = const RemoteSurfaceException(
            failure: RemoteSurfaceFailure.network,
            message: 'La connexion à la Preview a été interrompue.',
            retryable: true,
          );
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final snapshot = _snapshot;
    return Semantics(
      container: true,
      label: 'Preview du projet ${widget.projectName}',
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _PaneHeader(
              title: 'Preview',
              status: _statusLabel,
              icon: Icons.visibility_outlined,
              onRetry: _canRetry ? _open : null,
              onHelp: snapshot?.canRender == true ? _toggleBrowserHelp : null,
            ),
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (snapshot?.canRender == true)
                    _buildFrame(snapshot!.origin!)
                  else
                    _PreviewStateView(
                      icon: _stateIcon,
                      message: _stateMessage,
                      onRetry: _canRetry ? _open : null,
                    ),
                  if (_loading)
                    ColoredBox(
                      color: Theme.of(
                        context,
                      ).colorScheme.surface.withValues(alpha: 0.88),
                      child: Center(
                        child: Semantics(
                          liveRegion: true,
                          label: 'Connexion à la Preview en cours',
                          child: const CircularProgressIndicator(),
                        ),
                      ),
                    ),
                  if (_showBrowserHelp && snapshot?.canRender == true)
                    ColoredBox(
                      color: Theme.of(context).colorScheme.surface,
                      child: _PreviewBrowserHelp(
                        origin: snapshot!.origin!,
                        onRetry: _open,
                        onOpenExternal: _openInNewTab,
                        onCopy: _copyPreviewUrl,
                        onReport: _reportProblem,
                        diagnosticId: _diagnosticId,
                      ),
                    ),
                  if (snapshot?.canRender == true && !_showBrowserHelp)
                    Align(
                      alignment: Alignment.bottomCenter,
                      child: Material(
                        color: Theme.of(context).colorScheme.surface,
                        child: Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: tokens.spacing.md,
                            vertical: tokens.spacing.xs,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.help_outline_rounded),
                              SizedBox(width: tokens.spacing.xs),
                              const Flexible(
                                child: Text('La Preview ne s’affiche pas ?'),
                              ),
                              SizedBox(width: tokens.spacing.xs),
                              TextButton(
                                onPressed: _toggleBrowserHelp,
                                child: const Text('Diagnostiquer'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            SizedBox(height: tokens.spacing.xxs),
          ],
        ),
      ),
    );
  }

  Widget _buildFrame(Uri origin) {
    final builder = widget.frameBuilder;
    if (builder != null) {
      return builder(origin, _reloadRevision, _markLoaded, _markFrameFailed);
    }
    if (!genericPreviewFrameSupported) {
      return const _PreviewStateView(
        icon: Icons.devices_other_outlined,
        message:
            'La Preview intégrée est disponible dans ShipGlows Web. Cette plateforme native reste explicitement non prise en charge.',
      );
    }
    return GenericPreviewFrame(
      origin: origin,
      title: 'Preview de ${widget.projectName}',
      reloadRevision: _reloadRevision,
      onLoaded: _markLoaded,
      onFailed: _markFrameFailed,
    );
  }

  void _markLoaded() {
    _loadTimer?.cancel();
    if (mounted) {
      setState(() {
        _loading = false;
        if (!_manualBrowserHelp) _showBrowserHelp = false;
      });
    }
  }

  void _markFrameFailed() {
    if (!mounted) return;
    _loadTimer?.cancel();
    setState(() {
      _loading = false;
      _showBrowserHelp = true;
      _failure = const RemoteSurfaceException(
        failure: RemoteSurfaceFailure.network,
        message: 'La Preview ne répond plus. Le projet reste inchangé.',
        retryable: true,
      );
    });
    _reportDiagnostic(stage: 'frame', code: 'frame_error');
  }

  void _startLoadTimer() {
    _loadTimer?.cancel();
    _loadTimer = Timer(widget.previewLoadTimeout, () {
      if (!mounted || !_loading || _snapshot?.canRender != true) return;
      setState(() {
        _loading = false;
        _showBrowserHelp = true;
      });
      _reportDiagnostic(stage: 'frame', code: 'timeout');
    });
  }

  void _toggleBrowserHelp() {
    setState(() {
      _loading = false;
      _manualBrowserHelp = !_manualBrowserHelp;
      _showBrowserHelp = _manualBrowserHelp;
    });
    if (_showBrowserHelp) {
      _reportDiagnostic(stage: 'recovery', code: 'browser_help');
    }
  }

  void _reportDiagnostic({required String stage, required String code}) {
    final transport = widget.transport;
    if (transport is! ProjectPreviewDiagnosticsTransport) return;
    final diagnosticsTransport =
        transport as ProjectPreviewDiagnosticsTransport;
    unawaited(
      diagnosticsTransport
          .reportPreviewDiagnostic(
            projectId: widget.projectId,
            diagnosticId: _diagnosticId,
            stage: stage,
            code: code,
            occurredAt: DateTime.now().toUtc(),
          )
          .catchError((_) {}),
    );
  }

  Future<void> _reportProblem() async {
    _reportDiagnostic(stage: 'recovery', code: 'reported');
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Diagnostic $_diagnosticId enregistré.')),
    );
  }

  Future<void> _openInNewTab(Uri origin) async {
    final opened =
        await (widget.openExternal?.call(origin) ??
            launchUrl(origin, webOnlyWindowName: '_blank'));
    if (!opened && mounted) {
      _reportDiagnostic(stage: 'recovery', code: 'popup_blocked');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Le navigateur a bloqué le nouvel onglet. Autorisez les pop-ups puis réessayez.',
          ),
        ),
      );
    }
  }

  Future<void> _copyPreviewUrl(Uri origin) async {
    await Clipboard.setData(ClipboardData(text: origin.toString()));
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('URL de la Preview copiée.')));
  }

  bool get _canRetry {
    final failure = _failure;
    if (failure != null) return failure.retryable;
    return _snapshot?.state != ProjectPreviewState.denied &&
        _snapshot?.state != ProjectPreviewState.unsupported;
  }

  String get _statusLabel {
    if (_failure != null) return 'Interrompue';
    if (_loading) return 'Connexion…';
    return switch (_snapshot?.state) {
      ProjectPreviewState.ready => 'Connectée',
      ProjectPreviewState.starting => 'Démarrage…',
      ProjectPreviewState.reconnecting => 'Reconnexion…',
      ProjectPreviewState.stopped => 'Arrêtée',
      ProjectPreviewState.expired => 'Session expirée',
      ProjectPreviewState.denied => 'Accès refusé',
      ProjectPreviewState.unsupported => 'Non prise en charge',
      null => 'Indisponible',
    };
  }

  String get _stateMessage =>
      _failure?.message ??
      _snapshot?.message ??
      'La Preview n’est pas disponible pour ce projet.';

  IconData get _stateIcon {
    if (_failure != null) return Icons.sync_problem_outlined;
    return switch (_snapshot?.state) {
      ProjectPreviewState.starting => Icons.pending_outlined,
      ProjectPreviewState.ready => Icons.visibility_outlined,
      ProjectPreviewState.reconnecting => Icons.sync_outlined,
      ProjectPreviewState.stopped => Icons.stop_circle_outlined,
      ProjectPreviewState.expired => Icons.timer_off_outlined,
      ProjectPreviewState.denied => Icons.lock_outline,
      ProjectPreviewState.unsupported => Icons.devices_other_outlined,
      null => Icons.cloud_off_outlined,
    };
  }
}

class _PreviewBrowserHelp extends StatelessWidget {
  const _PreviewBrowserHelp({
    required this.origin,
    required this.onRetry,
    required this.onOpenExternal,
    required this.onCopy,
    required this.onReport,
    required this.diagnosticId,
  });

  final Uri origin;
  final Future<void> Function() onRetry;
  final Future<void> Function(Uri) onOpenExternal;
  final Future<void> Function(Uri) onCopy;
  final Future<void> Function() onReport;
  final String diagnosticId;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Center(
      child: SingleChildScrollView(
        padding: EdgeInsets.all(tokens.spacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.shield_outlined),
            SizedBox(height: tokens.spacing.sm),
            Text(
              'La Preview semble bloquée par le navigateur',
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: tokens.spacing.sm),
            const Text(
              'Autorisez les cookies, les pop-ups et le contenu intégré pour app.shipglows.com et *.preview.shipglows.com. Sur Vivaldi, cliquez sur le bouclier près de la barre d’adresse et autorisez ce site.',
              textAlign: TextAlign.center,
            ),
            SizedBox(height: tokens.spacing.md),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: tokens.spacing.sm,
              runSpacing: tokens.spacing.sm,
              children: [
                FilledButton.tonalIcon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('J’ai autorisé, réessayer'),
                ),
                OutlinedButton.icon(
                  onPressed: () => onOpenExternal(origin),
                  icon: const Icon(Icons.open_in_new_rounded),
                  label: const Text('Ouvrir dans un nouvel onglet'),
                ),
                TextButton.icon(
                  onPressed: () => onCopy(origin),
                  icon: const Icon(Icons.copy_rounded),
                  label: const Text('Copier l’URL'),
                ),
                TextButton.icon(
                  onPressed: onReport,
                  icon: const Icon(Icons.bug_report_outlined),
                  label: const Text('Signaler le problème'),
                ),
              ],
            ),
            SizedBox(height: tokens.spacing.sm),
            SelectableText(
              'Diagnostic : $diagnosticId',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _PaneHeader extends StatelessWidget {
  const _PaneHeader({
    required this.title,
    required this.status,
    required this.icon,
    this.onRetry,
    this.onHelp,
  });

  final String title;
  final String status;
  final IconData icon;
  final Future<void> Function()? onRetry;
  final VoidCallback? onHelp;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacing.md,
        vertical: tokens.spacing.sm,
      ),
      child: Row(
        children: [
          Icon(icon),
          SizedBox(width: tokens.spacing.sm),
          Expanded(
            child: Text(title, style: Theme.of(context).textTheme.titleMedium),
          ),
          Semantics(liveRegion: true, child: Text(status)),
          if (onHelp != null) ...[
            SizedBox(width: tokens.spacing.xs),
            IconButton(
              tooltip: 'Aide navigateur Preview',
              onPressed: onHelp,
              icon: const Icon(Icons.shield_outlined),
            ),
          ],
          if (onRetry != null) ...[
            SizedBox(width: tokens.spacing.xs),
            IconButton(
              tooltip: 'Reconnecter la Preview',
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ],
      ),
    );
  }
}

class _PreviewStateView extends StatelessWidget {
  const _PreviewStateView({
    required this.icon,
    required this.message,
    this.onRetry,
  });

  final IconData icon;
  final String message;
  final Future<void> Function()? onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Center(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon),
            SizedBox(height: tokens.spacing.sm),
            Semantics(
              liveRegion: true,
              child: Text(message, textAlign: TextAlign.center),
            ),
            if (onRetry != null) ...[
              SizedBox(height: tokens.spacing.md),
              FilledButton.tonalIcon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Réessayer'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
