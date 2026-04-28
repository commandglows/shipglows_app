import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/app_config.dart';
import '../../../data/models/auth_session.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  bool _isSubmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasClerkKey = AppConfig.clerkPublishableKey.isNotEmpty;
    final authSession = ref.watch(authSessionProvider);
    final palette = AppTheme.paletteOf(context);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('Authentication'))),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: palette.elevatedSurface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: palette.borderSubtle),
              ),
              child: hasClerkKey
                  ? _buildForm(authSession)
                  : _buildConfigMissing(authSession),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildConfigMissing(AuthSession authSession) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          context.tr('Clerk is not configured'),
          style: TextStyle(
            color: theme.colorScheme.onSurface,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          context.tr(
            'Set `CLERK_PUBLISHABLE_KEY` with `--dart-define` to enable the production ClerkJS sign-in flow on the app domain.',
          ),
          style: TextStyle(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 15,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 20),
        _buildRuntimeDiagnostics(
          hasClerkKey: false,
          authSession: authSession,
          error: _error ?? 'Clerk is missing from runtime config.',
        ),
      ],
    );
  }

  Widget _buildForm(AuthSession authSession) {
    if (kIsWeb) {
      return _buildWebRedirectState(authSession);
    }

    return _buildNativeCustomState(authSession);
  }

  Widget _buildNativeCustomState(AuthSession authSession) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          context.tr('Use the web sign-in flow'),
          style: TextStyle(
            color: theme.colorScheme.onSurface,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          context.tr(
            'The Clerk Flutter beta SDK has been removed from the production path. For now, sign in through the dedicated web Google flow instead of the old embedded Flutter flow.',
          ),
          style: TextStyle(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 15,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        if (_error != null && _error!.isNotEmpty) ...[
          _buildRuntimeDiagnostics(
            hasClerkKey: true,
            authSession: authSession,
            error: _error,
          ),
          const SizedBox(height: 24),
        ],
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _isSubmitting ? null : _openAppWebSignIn,
            child: Text(context.tr('Continue with Google')),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isSubmitting ? null : _openAppWebEntry,
            child: Text(context.tr('Open App Entry')),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          context.tr(
            'Once Clerk ships a stable Flutter SDK, the archived beta branch can be revisited. Until then, production auth stays on the official ClerkJS web path.',
          ),
          style: TextStyle(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 12,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: TextButton(
            onPressed: _isSubmitting ? null : _clearLocalSession,
            child: Text(context.tr('Clear Local Clerk Session')),
          ),
        ),
      ],
    );
  }

  Widget _buildWebRedirectState(AuthSession authSession) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          context.tr('Sign in with Google'),
          style: TextStyle(
            color: theme.colorScheme.onSurface,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          context.tr(
            'ContentFlow web authentication now uses the official Clerk JavaScript SDK directly on the app domain. The old site handoff and the Flutter beta SDK are no longer the primary path.',
          ),
          style: TextStyle(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 15,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _openAppWebSignIn,
            child: Text(context.tr('Continue with Google')),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: TextButton(
            onPressed: _openAppWebEntry,
            child: Text(context.tr('Already signed in? Open App')),
          ),
        ),
      ],
    );
  }

  Widget _buildRuntimeDiagnostics({
    required bool hasClerkKey,
    required AuthSession authSession,
    required String? error,
  }) {
    return AppErrorView(
      scope: hasClerkKey ? 'auth.runtime' : 'auth.config_missing',
      title: hasClerkKey ? 'Authentication error' : 'Clerk is not configured',
      message: error,
      compact: true,
      showIcon: !hasClerkKey || (error != null && error.isNotEmpty),
      copyLabel: 'Copy diagnostics',
      helperText: hasClerkKey
          ? 'Copy this report and send it back with the error message above.'
          : 'Rebuild the app with a valid CLERK_PUBLISHABLE_KEY to enable the Clerk web flow.',
      contextData: {
        'hasClerkKey': hasClerkKey,
        'sessionState': authSession.status.name,
        'sessionEmail': authSession.email ?? 'none',
        'appWebUrl': AppConfig.appWebUrl,
        'siteUrl': AppConfig.siteUrl,
        'apiBaseUrl': AppConfig.apiBaseUrl,
        'currentPath': kIsWeb ? Uri.base.path : 'not-web',
      },
    );
  }

  Future<void> _clearLocalSession() async {
    setState(() {
      _error = null;
      _isSubmitting = true;
    });

    try {
      await ref.read(authSessionProvider.notifier).clearLocalSession();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('Local Clerk session cleared. Try signing in again.'),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Future<void> _openAppWebSignIn() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/sign-in')
        : Uri.parse('${AppConfig.appWebUrl}/sign-in');
    await launchUrl(url, mode: LaunchMode.platformDefault);
  }

  Future<void> _openAppWebEntry() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/#/entry')
        : Uri.parse('${AppConfig.appWebUrl}/#/entry');
    await launchUrl(url, mode: LaunchMode.platformDefault);
  }
}
