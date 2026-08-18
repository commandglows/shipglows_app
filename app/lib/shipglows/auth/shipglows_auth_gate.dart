import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../presentation/theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../data/managed_runner_api.dart';
import '../providers/managed_runner_provider.dart';
import '../providers/personal_cloud/personal_cloud_projects_provider.dart';
import '../providers/personal_cloud/personal_cloud_transport_providers.dart';
import '../../core/app_config.dart';
import 'auth_provider.dart';

enum ShipGlowsAuthGateStatus { loading, signedOut, signedIn, denied, error }

typedef ShipGlowsSessionAuthorizer =
    Future<void> Function(ShipGlowsSession session);

class ShipGlowsAuthGate extends ConsumerStatefulWidget {
  const ShipGlowsAuthGate({
    required this.child,
    this.authorizeSession,
    super.key,
  });

  final Widget child;
  final ShipGlowsSessionAuthorizer? authorizeSession;

  @override
  ConsumerState<ShipGlowsAuthGate> createState() => _ShipGlowsAuthGateState();
}

class _ShipGlowsAuthGateState extends ConsumerState<ShipGlowsAuthGate> {
  StreamSubscription<ShipGlowsAuthState>? _subscription;
  ShipGlowsAuthGateStatus _status = ShipGlowsAuthGateStatus.loading;
  String? _message;
  String? _diagnosticId;
  int _authGeneration = 0;
  bool _interactiveSignIn = false;

  ShipGlowsAuthProvider get _auth => ref.read(shipGlowsAuthProvider);

  @override
  void initState() {
    super.initState();
    final auth = _auth;
    if (!auth.requiresAuthentication) {
      _status = ShipGlowsAuthGateStatus.signedIn;
      return;
    }
    _subscription = auth.authStateChanges.listen(
      (state) {
        if (!_interactiveSignIn) unawaited(_applyAuthState(state));
      },
      onError: (Object _) =>
          _showError('La session n’a pas pu être vérifiée. Réessayez.'),
    );
    unawaited(_restoreSession());
  }

  Future<void> _restoreSession() async {
    try {
      final session = await _auth.currentSession();
      if (!mounted) return;
      await _applyAuthState(
        session == null
            ? const ShipGlowsAuthState.signedOut()
            : ShipGlowsAuthState.signedIn(session),
      );
    } catch (_) {
      _showError('La session n’a pas pu être restaurée. Réessayez.');
    }
  }

  Future<void> _applyAuthState(ShipGlowsAuthState state) async {
    if (!mounted) return;
    final generation = ++_authGeneration;
    final session = state.session;
    if (state.status == ShipGlowsAuthStatus.signedOut || session == null) {
      setState(() {
        _status = ShipGlowsAuthGateStatus.signedOut;
        _message = null;
        _diagnosticId = null;
      });
      return;
    }
    setState(() {
      _status = ShipGlowsAuthGateStatus.loading;
      _message = null;
      _diagnosticId = null;
    });
    try {
      await (widget.authorizeSession?.call(session) ??
              _authorizeWithRunner(session))
          .timeout(const Duration(seconds: 15));
      if (!mounted || generation != _authGeneration) return;
      _invalidatePersonalCloudState();
      setState(() {
        _status = ShipGlowsAuthGateStatus.signedIn;
        _diagnosticId = null;
      });
    } on ManagedRunnerException catch (error) {
      if (!mounted || generation != _authGeneration) return;
      final denied = error.statusCode == 403;
      final diagnosticId = _recordDiagnostic(
        stage: 'runner',
        code: error.statusCode == 401 ? 'firebase_token_rejected' : error.code,
      );
      setState(() {
        _status = denied
            ? ShipGlowsAuthGateStatus.denied
            : ShipGlowsAuthGateStatus.error;
        _message = denied
            ? 'Ce compte est connecté, mais il n’a pas accès à cette ressource.'
            : error.statusCode == 401
            ? 'Votre session Firebase a été refusée. Reconnectez-vous.'
            : 'Le Personal Cloud ne répond pas. Réessayez.';
        _diagnosticId = diagnosticId;
      });
    } on TimeoutException {
      if (!mounted || generation != _authGeneration) return;
      _showError(
        'La vérification d’accès a expiré. Réessayez.',
        stage: 'runner',
        code: 'access_timeout',
      );
    } catch (error) {
      if (!mounted || generation != _authGeneration) return;
      _showError(
        'L’accès au Personal Cloud n’a pas pu être vérifié.',
        stage: 'runner',
        code: 'access_unexpected_${error.runtimeType}',
      );
    }
  }

  Future<void> _authorizeWithRunner(ShipGlowsSession session) async {
    if (!AppConfig.personalCloudEnabled) return;
    if (!AppConfig.managedRunnerEnabled) {
      throw const ManagedRunnerException(
        code: 'runnerUnavailable',
        message: 'The managed runner is unavailable.',
      );
    }
    final client = ManagedRunnerApi(
      baseUrl: AppConfig.managedRunnerBaseUrl,
      accessTokenProvider: ({forceRefresh = false}) async =>
          session.accessToken,
    );
    await client.loadPersonalCloudProjects();
  }

  void _invalidatePersonalCloudState() {
    ref.invalidate(managedRunnerApiProvider);
    ref.invalidate(personalCloudProjectsProvider);
    ref.invalidate(projectPreviewTransportProvider);
    ref.invalidate(remoteWorkspaceTransportProvider);
  }

  String _recordDiagnostic({required String stage, required String code}) {
    final id =
        'auth_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}';
    debugPrint('ShipGlows auth diagnostic=$id stage=$stage code=$code');
    return id;
  }

  void _showError(
    String message, {
    String stage = 'session',
    String code = 'unknown',
  }) {
    if (!mounted) return;
    setState(() {
      _status = ShipGlowsAuthGateStatus.error;
      _message = message;
      _diagnosticId = _recordDiagnostic(stage: stage, code: code);
    });
  }

  Future<void> _signIn() async {
    setState(() {
      _status = ShipGlowsAuthGateStatus.loading;
      _message = null;
    });
    try {
      _interactiveSignIn = true;
      await _auth.signInWithGoogle();
      final session = await _auth.currentSession();
      if (!mounted) return;
      await _applyAuthState(
        session == null
            ? const ShipGlowsAuthState.signedOut()
            : ShipGlowsAuthState.signedIn(session),
      );
    } on ShipGlowsAuthException catch (error) {
      _showError(
        error.message,
        stage: 'firebase_popup',
        code: error.failure.name,
      );
    } catch (error) {
      _showError(
        'La connexion Google a échoué. Réessayez.',
        stage: 'firebase_popup',
        code: 'unexpected_${error.runtimeType}',
      );
    } finally {
      _interactiveSignIn = false;
    }
  }

  Future<void> _signOut() async {
    setState(() => _status = ShipGlowsAuthGateStatus.loading);
    try {
      await _auth.signOut();
      if (mounted) {
        await _applyAuthState(const ShipGlowsAuthState.signedOut());
      }
    } catch (_) {
      _showError('La déconnexion a échoué. Réessayez.');
    }
  }

  @override
  void dispose() {
    unawaited(_subscription?.cancel());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_auth.requiresAuthentication) return widget.child;
    if (_status == ShipGlowsAuthGateStatus.signedIn) {
      return widget.child;
    }
    return _AuthenticationSurface(
      status: _status,
      message: _message,
      diagnosticId: _diagnosticId,
      onSignIn: _signIn,
      onRetry: _restoreSession,
      onSignOut: _signOut,
    );
  }
}

class _AuthenticationSurface extends StatelessWidget {
  const _AuthenticationSurface({
    required this.status,
    required this.message,
    required this.diagnosticId,
    required this.onSignIn,
    required this.onRetry,
    required this.onSignOut,
  });

  final ShipGlowsAuthGateStatus status;
  final String? message;
  final String? diagnosticId;
  final Future<void> Function() onSignIn;
  final Future<void> Function() onRetry;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final isLoading = status == ShipGlowsAuthGateStatus.loading;
    final isError = status == ShipGlowsAuthGateStatus.error;
    final isDenied = status == ShipGlowsAuthGateStatus.denied;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(tokens.spacing.lg),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: tokens.cockpit.contentMaxWidth,
              ),
              child: Card(
                child: Padding(
                  padding: EdgeInsets.all(tokens.spacing.xl),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isError || isDenied
                            ? Icons.lock_reset_rounded
                            : Icons.cloud_rounded,
                        color: isError || isDenied
                            ? tokens.health.critical
                            : Theme.of(context).colorScheme.primary,
                      ),
                      SizedBox(height: tokens.spacing.md),
                      Text(
                        'Votre Personal Cloud',
                        style: Theme.of(context).textTheme.headlineSmall,
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: tokens.spacing.sm),
                      Semantics(
                        liveRegion: true,
                        child: Text(
                          isLoading
                              ? 'Vérification de votre session sécurisée…'
                              : message ??
                                    'Connectez votre compte Google autorisé pour accéder à vos projets.',
                          textAlign: TextAlign.center,
                        ),
                      ),
                      if (diagnosticId != null) ...[
                        SizedBox(height: tokens.spacing.sm),
                        SelectableText(
                          'Diagnostic : $diagnosticId',
                          style: Theme.of(context).textTheme.bodySmall,
                          textAlign: TextAlign.center,
                        ),
                      ],
                      SizedBox(height: tokens.spacing.lg),
                      if (isLoading)
                        const CircularProgressIndicator()
                      else if (isDenied) ...[
                        FilledButton.icon(
                          onPressed: onSignOut,
                          icon: const Icon(Icons.switch_account_rounded),
                          label: const Text('Changer de compte'),
                        ),
                      ] else if (isError) ...[
                        FilledButton.icon(
                          onPressed: onSignIn,
                          icon: const Icon(Icons.login_rounded),
                          label: const Text('Se connecter avec Google'),
                        ),
                        SizedBox(height: tokens.spacing.sm),
                        TextButton(
                          onPressed: onRetry,
                          child: const Text('Revérifier la session'),
                        ),
                      ] else
                        FilledButton.icon(
                          onPressed: onSignIn,
                          icon: const Icon(Icons.login_rounded),
                          label: const Text('Se connecter avec Google'),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
