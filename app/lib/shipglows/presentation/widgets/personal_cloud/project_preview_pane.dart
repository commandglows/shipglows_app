import 'dart:async';

import 'package:flutter/material.dart';

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

class ProjectPreviewPane extends StatefulWidget {
  const ProjectPreviewPane({
    required this.projectId,
    required this.projectName,
    required this.transport,
    this.frameBuilder,
    super.key,
  });

  final String projectId;
  final String projectName;
  final ProjectPreviewTransport? transport;
  final ProjectPreviewFrameBuilder? frameBuilder;

  @override
  State<ProjectPreviewPane> createState() => _ProjectPreviewPaneState();
}

class _ProjectPreviewPaneState extends State<ProjectPreviewPane> {
  ProjectPreviewSnapshot? _snapshot;
  RemoteSurfaceException? _failure;
  bool _loading = true;
  int _reloadRevision = 0;

  @override
  void initState() {
    super.initState();
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

  Future<void> _open() async {
    final transport = widget.transport;
    setState(() {
      _loading = true;
      _failure = null;
    });
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
    if (mounted) setState(() => _loading = false);
  }

  void _markFrameFailed() {
    if (!mounted) return;
    setState(() {
      _loading = false;
      _failure = const RemoteSurfaceException(
        failure: RemoteSurfaceFailure.network,
        message: 'La Preview ne répond plus. Le projet reste inchangé.',
        retryable: true,
      );
    });
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

class _PaneHeader extends StatelessWidget {
  const _PaneHeader({
    required this.title,
    required this.status,
    required this.icon,
    this.onRetry,
  });

  final String title;
  final String status;
  final IconData icon;
  final Future<void> Function()? onRetry;

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
