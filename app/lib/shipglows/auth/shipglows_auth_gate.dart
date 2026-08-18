import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../presentation/theme/app_theme.dart';
import '../providers/auth_provider.dart';
import 'auth_provider.dart';

enum ShipGlowsAuthGateStatus { loading, signedOut, signedIn, error }

class ShipGlowsAuthGate extends ConsumerStatefulWidget {
  const ShipGlowsAuthGate({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<ShipGlowsAuthGate> createState() => _ShipGlowsAuthGateState();
}

class _ShipGlowsAuthGateState extends ConsumerState<ShipGlowsAuthGate> {
  StreamSubscription<ShipGlowsAuthState>? _subscription;
  ShipGlowsAuthGateStatus _status = ShipGlowsAuthGateStatus.loading;
  String? _message;

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
      _applyAuthState,
      onError: (Object _) =>
          _showError('La session n’a pas pu être vérifiée. Réessayez.'),
    );
    unawaited(_restoreSession());
  }

  Future<void> _restoreSession() async {
    try {
      final session = await _auth.currentSession();
      if (!mounted) return;
      _applyAuthState(
        session == null
            ? const ShipGlowsAuthState.signedOut()
            : ShipGlowsAuthState.signedIn(session),
      );
    } catch (_) {
      _showError('La session n’a pas pu être restaurée. Réessayez.');
    }
  }

  void _applyAuthState(ShipGlowsAuthState state) {
    if (!mounted) return;
    setState(() {
      _status = state.status == ShipGlowsAuthStatus.signedIn
          ? ShipGlowsAuthGateStatus.signedIn
          : ShipGlowsAuthGateStatus.signedOut;
      _message = null;
    });
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
      _applyAuthState(
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
      if (mounted) _applyAuthState(const ShipGlowsAuthState.signedOut());
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
      return _AuthenticatedSurface(onSignOut: _signOut, child: widget.child);
    }
    return _AuthenticationSurface(
      status: _status,
      message: _message,
      onSignIn: _signIn,
      onRetry: _restoreSession,
    );
  }
}

class _AuthenticatedSurface extends StatelessWidget {
  const _AuthenticatedSurface({required this.onSignOut, required this.child});

  final Future<void> Function() onSignOut;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        PositionedDirectional(
          top: AppTheme.tokensOf(context).spacing.sm,
          end: AppTheme.tokensOf(context).spacing.sm,
          child: SafeArea(
            child: IconButton.filledTonal(
              tooltip: 'Se déconnecter',
              onPressed: onSignOut,
              icon: const Icon(Icons.logout_rounded),
            ),
          ),
        ),
      ],
    );
  }
}

class _AuthenticationSurface extends StatelessWidget {
  const _AuthenticationSurface({
    required this.status,
    required this.message,
    required this.onSignIn,
    required this.onRetry,
  });

  final ShipGlowsAuthGateStatus status;
  final String? message;
  final Future<void> Function() onSignIn;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final isLoading = status == ShipGlowsAuthGateStatus.loading;
    final isError = status == ShipGlowsAuthGateStatus.error;
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
                        isError
                            ? Icons.lock_reset_rounded
                            : Icons.cloud_rounded,
                        color: isError
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
                      else if (isError) ...[
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
