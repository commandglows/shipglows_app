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
  int _authGeneration = 0;

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
      (state) => unawaited(_applyAuthState(state)),
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
    _invalidatePersonalCloudState();
    if (state.status == ShipGlowsAuthStatus.signedOut || session == null) {
      setState(() {
        _status = ShipGlowsAuthGateStatus.signedOut;
        _message = null;
      });
      return;
    }
    setState(() {
      _status = ShipGlowsAuthGateStatus.loading;
      _message = null;
    });
    try {
      await (widget.authorizeSession?.call(session) ??
              _authorizeWithRunner(session))
          .timeout(const Duration(seconds: 15));
      if (!mounted || generation != _authGeneration) return;
      setState(() => _status = ShipGlowsAuthGateStatus.signedIn);
    } on ManagedRunnerException catch (error) {
      if (!mounted || generation != _authGeneration) return;
      final denied = error.statusCode == 401 || error.statusCode == 403;
      setState(() {
        _status = denied
            ? ShipGlowsAuthGateStatus.denied
            : ShipGlowsAuthGateStatus.error;
        _message = denied
            ? 'Ce compte n’a pas accès à ce Personal Cloud.'
            : 'Le Personal Cloud ne répond pas. Réessayez.';
      });
    } on TimeoutException {
      if (!mounted || generation != _authGeneration) return;
      _showError('La vérification d’accès a expiré. Réessayez.');
    } catch (_) {
      if (!mounted || generation != _authGeneration) return;
      _showError('L’accès au Personal Cloud n’a pas pu être vérifié.');
    }
  }

  Future<void> _authorizeWithRunner(ShipGlowsSession _) async {
    if (!AppConfig.personalCloudEnabled) return;
    final client = ref.read(managedRunnerApiProvider);
    if (client is! ManagedRunnerApi) {
      throw const ManagedRunnerException(
        code: 'runnerUnavailable',
        message: 'The managed runner is unavailable.',
      );
    }
    await client.loadPersonalCloudProjects();
  }

  void _invalidatePersonalCloudState() {
    ref.invalidate(managedRunnerApiProvider);
    ref.invalidate(personalCloudProjectsProvider);
    ref.invalidate(projectPreviewTransportProvider);
    ref.invalidate(remoteWorkspaceTransportProvider);
  }

  void _showError(String message) {
    if (!mounted) return;
    setState(() {
      _status = ShipGlowsAuthGateStatus.error;
      _message = message;
    });
  }

  Future<void> _signIn() async {
    setState(() {
      _status = ShipGlowsAuthGateStatus.loading;
      _message = null;
    });
    try {
      await _auth.signInWithGoogle();
      final session = await _auth.currentSession(forceRefresh: true);
      if (!mounted) return;
      await _applyAuthState(
        session == null
            ? const ShipGlowsAuthState.signedOut()
            : ShipGlowsAuthState.signedIn(session),
      );
    } on ShipGlowsAuthException catch (error) {
      _showError(error.message);
    } catch (_) {
      _showError('La connexion Google a échoué. Réessayez.');
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
    required this.onSignIn,
    required this.onRetry,
    required this.onSignOut,
  });

  final ShipGlowsAuthGateStatus status;
  final String? message;
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
