import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../data/models/ai_runtime.dart';
import '../../../data/models/app_settings.dart';
import '../../../data/models/auth_session.dart';
import '../../../data/models/content_item.dart';
import '../../../data/models/openrouter_credential.dart';
import '../../../data/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';
import '../../widgets/project_picker_action.dart';
import 'settings_widgets.dart';

/// Sub-page nested under /settings, hosting every connection to external
/// services (backend, AI runtime, OpenRouter key, GitHub, publishing channels).
/// Keeps the main Settings page lean by lifting noisy, infrequent connection
/// flows into a dedicated screen.
class IntegrationsScreen extends ConsumerStatefulWidget {
  const IntegrationsScreen({super.key});

  @override
  ConsumerState<IntegrationsScreen> createState() => _IntegrationsScreenState();
}

class _IntegrationsScreenState extends ConsumerState<IntegrationsScreen> {
  late TextEditingController _apiUrlController;
  late TextEditingController _openRouterApiKeyController;
  bool _showOpenRouterKey = false;
  bool _isSavingRuntimeMode = false;
  bool _isSavingOpenRouterKey = false;
  bool _isValidatingOpenRouterKey = false;
  bool _isDeletingOpenRouterKey = false;

  @override
  void initState() {
    super.initState();
    _apiUrlController = TextEditingController();
    _openRouterApiKeyController = TextEditingController();
  }

  @override
  void dispose() {
    _apiUrlController.dispose();
    _openRouterApiKeyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final apiBaseUrl = ref.watch(apiBaseUrlProvider);
    final appAccess = ref.watch(appAccessStateProvider).value;
    final authSession = ref.watch(authSessionProvider);
    final backendStatus = ref.watch(backendStatusProvider);
    final githubIntegration = ref.watch(githubIntegrationStatusProvider);
    final aiRuntimeSettings = ref.watch(aiRuntimeSettingsProvider);
    final openRouterCredential = ref.watch(openRouterCredentialStatusProvider);
    final publishAccountsState = ref.watch(publishAccountsStateProvider);
    final publishAccounts = ref.watch(publishAccountsProvider);

    if (_apiUrlController.text.isEmpty) {
      _apiUrlController.text = apiBaseUrl;
    }

    final groupGap = settingsGroupGap(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('Integrations')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          tooltip: context.tr('Back'),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        actions: const [ProjectPickerAction()],
      ),
      body: SafeArea(
        child: ListView(
          padding: settingsPagePadding(context),
          children: [
            _buildIntegrationsHero(),
            SizedBox(height: groupGap),

            SettingsGroup(
              title: 'AI runtime',
              caption:
                  'How AI features are funded. BYOK uses your OpenRouter key. Platform uses ContentFlow-managed credits.',
              gap: 0,
              children: [
                SettingsBlock(
                  child: _buildAiRuntimeBody(
                    aiRuntimeSettings,
                    authSession: authSession,
                  ),
                ),
              ],
            ),
            SizedBox(height: groupGap),

            SettingsGroup(
              title: 'OpenRouter API key',
              caption:
                  'Stored encrypted server-side. Used for persona prefill, ritual, angles, newsletter and research.',
              gap: 0,
              children: [
                SettingsBlock(
                  child: _buildOpenRouterBody(
                    openRouterCredential,
                    authSession: authSession,
                  ),
                ),
              ],
            ),
            SizedBox(height: groupGap),

            SettingsGroup(
              title: 'GitHub',
              gap: 0,
              children: [
                SettingsBlock(child: _buildGithubBody(githubIntegration)),
              ],
            ),
            SizedBox(height: groupGap),

            SettingsGroup(
              title: 'Backend connection',
              caption:
                  'FastAPI endpoint used for workspace, content and project data.',
              gap: 0,
              children: [
                SettingsBlock(
                  child: _buildBackendBody(backendStatus, appAccess: appAccess),
                ),
              ],
            ),
            SizedBox(height: groupGap),

            SettingsGroup(
              title: 'Publishing channels',
              caption:
                  'Connect once, publish from the editor. OAuth opens in your browser.',
              gap: 0,
              children: _buildChannelRows(
                accountsAsync: publishAccounts,
                publishAccountsState: publishAccountsState,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIntegrationsHero() {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: palette.heroGradient,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withAlpha(40),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.hub_outlined,
              color: theme.colorScheme.primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.tr('Connect your stack'),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  context.tr(
                    'AI runtime, API keys, GitHub and publishing destinations live here.',
                  ),
                  style: TextStyle(
                    fontSize: 12,
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ----- Backend ---------------------------------------------------------

  Widget _buildBackendBody(
    AsyncValue<Map<String, dynamic>> backendStatus, {
    required dynamic appAccess,
  }) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        backendStatus.when(
          data: (data) {
            final isOnline =
                data['status'] == 'ok' || data['status'] == 'healthy';
            return SettingsStatusPill(
              label: isOnline
                  ? context.tr('Connected')
                  : context.tr('Offline (using mock data)'),
              color: isOnline ? AppTheme.approveColor : AppTheme.rejectColor,
              icon: isOnline ? Icons.circle : Icons.warning_amber_rounded,
            );
          },
          loading: () => Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 8),
              Text(context.tr('Checking...')),
            ],
          ),
          error: (error, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SettingsStatusPill(
                label: context.tr('Error checking status'),
                color: AppTheme.warningColor,
                icon: Icons.error_outline,
              ),
              const SizedBox(height: 10),
              SettingsErrorDiagnostic(
                details: 'Backend error: ${(error.toString()).trim()}',
                linkUrl: '${ref.read(apiBaseUrlProvider)}/health',
                linkLabel: context.tr('Open {screen}', {'screen': 'Health'}),
              ),
            ],
          ),
        ),
        if (appAccess?.isDegraded == true) ...[
          const SizedBox(height: 12),
          Text(
            context.tr(
              'Degraded mode is active. The app stays available, cached data may be stale, and queued actions will replay when FastAPI recovers.',
            ),
            style: TextStyle(
              color: AppTheme.warningColor.withAlpha(220),
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
        const SizedBox(height: 14),
        TextField(
          controller: _apiUrlController,
          decoration: InputDecoration(
            labelText: context.tr('API URL'),
            hintText: 'http://localhost:8000',
            isDense: true,
            suffixIcon: IconButton(
              icon: const Icon(Icons.check_rounded),
              tooltip: context.tr('Apply'),
              onPressed: () {
                ref
                    .read(apiBaseUrlProvider.notifier)
                    .update(_apiUrlController.text);
                ref.invalidate(backendStatusProvider);
                ref.invalidate(appAccessStateProvider);
                ref.invalidate(pendingContentProvider);
                ref.invalidate(publishAccountsProvider);
              },
            ),
          ),
        ),
        if (theme.brightness == Brightness.light) const SizedBox.shrink(),
      ],
    );
  }

  // ----- AI runtime ------------------------------------------------------

  Widget _buildAiRuntimeBody(
    AsyncValue<AIRuntimeSettings> state, {
    required AuthSession authSession,
  }) {
    final theme = Theme.of(context);
    final canManage = authSession.isAuthenticated && !authSession.isDemo;

    return state.when(
      data: (settings) => AiRuntimeSettingsCard(
        settings: settings,
        canManage: canManage,
        isUpdating: _isSavingRuntimeMode,
        onModeSelected: canManage ? _setAiRuntimeMode : null,
      ),
      loading: () => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('Loading AI runtime settings...'),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ],
      ),
      error: (error, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('Unable to load AI runtime settings.'),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 8),
          SettingsErrorDiagnostic(
            details: 'AI runtime error: ${(error.toString()).trim()}',
            linkUrl: '${ref.read(apiBaseUrlProvider)}/api/settings/ai-runtime',
            linkLabel: context.tr('Open AI runtime endpoint'),
          ),
        ],
      ),
    );
  }

  Future<void> _setAiRuntimeMode(String mode) async {
    if (_isSavingRuntimeMode) return;
    setState(() => _isSavingRuntimeMode = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.updateAiRuntimeMode(mode);
      if (!mounted) return;
      ref.invalidate(aiRuntimeSettingsProvider);
      ref.invalidate(openRouterCredentialStatusProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('AI runtime mode updated to {mode}.', {'mode': mode}),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: error.message.trim().isEmpty
            ? context.tr('Failed to update AI runtime mode.')
            : error.message.trim(),
        scope: 'settings.ai_runtime.update',
        contextData: {'mode': mode, 'responseBody': error.responseBody},
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    } finally {
      if (mounted) setState(() => _isSavingRuntimeMode = false);
    }
  }

  // ----- OpenRouter ------------------------------------------------------

  Widget _buildOpenRouterBody(
    AsyncValue<OpenRouterCredentialStatus> state, {
    required AuthSession authSession,
  }) {
    final theme = Theme.of(context);
    final canManage = authSession.isAuthenticated && !authSession.isDemo;
    final busy =
        _isSavingOpenRouterKey ||
        _isValidatingOpenRouterKey ||
        _isDeletingOpenRouterKey;

    return state.when(
      data: (status) {
        final statusColor = _openRouterStatusColor(status);
        final statusLabel = _openRouterStatusLabel(status);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SettingsStatusPill(
              label: statusLabel,
              color: statusColor,
              icon: status.configured
                  ? Icons.key_rounded
                  : Icons.add_circle_outline,
            ),
            if (status.maskedSecret != null &&
                status.maskedSecret!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.infoColor.withAlpha(12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.infoColor.withAlpha(40)),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.lock_outline,
                      size: 16,
                      color: AppTheme.infoColor,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        context.tr('Stored key: {key}', {
                          'key': status.maskedSecret!,
                        }),
                        style: TextStyle(
                          color: theme.colorScheme.onSurface,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (status.updatedAt != null || status.lastValidatedAt != null) ...[
              const SizedBox(height: 8),
              Text(
                _openRouterMetaText(status),
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 12,
                ),
              ),
            ],
            const SizedBox(height: 16),
            TextField(
              controller: _openRouterApiKeyController,
              obscureText: !_showOpenRouterKey,
              enabled: canManage && !busy,
              autocorrect: false,
              enableSuggestions: false,
              decoration: InputDecoration(
                labelText: context.tr('OpenRouter API key'),
                hintText: 'sk-or-v1-...',
                helperText: canManage
                    ? context.tr('Paste a new key to replace the current one.')
                    : context.tr('Sign in to manage your OpenRouter key'),
                helperMaxLines: 2,
                isDense: true,
                suffixIcon: IconButton(
                  onPressed: () =>
                      setState(() => _showOpenRouterKey = !_showOpenRouterKey),
                  tooltip: _showOpenRouterKey
                      ? context.tr('Hide key')
                      : context.tr('Show key'),
                  icon: Icon(
                    _showOpenRouterKey
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.icon(
                  onPressed: canManage && !busy
                      ? _saveOpenRouterCredential
                      : null,
                  icon: _isSavingOpenRouterKey
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_rounded, size: 18),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.approveColor,
                    minimumSize: const Size(0, 44),
                  ),
                  label: Text(context.tr('Save key')),
                ),
                OutlinedButton.icon(
                  onPressed: canManage && status.configured && !busy
                      ? _validateOpenRouterCredential
                      : null,
                  icon: _isValidatingOpenRouterKey
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.verified_outlined, size: 18),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 44),
                  ),
                  label: Text(context.tr('Validate')),
                ),
                OutlinedButton.icon(
                  onPressed: canManage && status.configured && !busy
                      ? _deleteOpenRouterCredential
                      : null,
                  icon: _isDeletingOpenRouterKey
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.delete_outline, size: 18),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.rejectColor,
                    side: BorderSide(color: AppTheme.rejectColor.withAlpha(80)),
                    minimumSize: const Size(0, 44),
                  ),
                  label: Text(context.tr('Delete')),
                ),
                TextButton.icon(
                  onPressed: busy
                      ? null
                      : () => openSettingsUrl(
                          context,
                          ref,
                          'https://openrouter.ai/keys',
                        ),
                  icon: const Icon(Icons.open_in_new, size: 18),
                  label: Text(context.tr('Get a key')),
                  style: TextButton.styleFrom(minimumSize: const Size(0, 44)),
                ),
              ],
            ),
          ],
        );
      },
      loading: () => Row(
        children: [
          const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 12),
          Text(
            context.tr('Loading OpenRouter credential status...'),
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
      error: (error, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('Unable to load OpenRouter credential state.'),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 8),
          SettingsErrorDiagnostic(
            details: 'OpenRouter error: ${(error.toString()).trim()}',
            linkUrl:
                '${ref.read(apiBaseUrlProvider)}/api/settings/integrations/openrouter',
            linkLabel: context.tr('Open OpenRouter endpoint'),
          ),
        ],
      ),
    );
  }

  Color _openRouterStatusColor(OpenRouterCredentialStatus status) {
    if (!status.configured) {
      return Theme.of(context).colorScheme.onSurfaceVariant;
    }
    if (status.isValid) return AppTheme.approveColor;
    if (status.isInvalid) return AppTheme.rejectColor;
    return AppTheme.warningColor;
  }

  String _openRouterStatusLabel(OpenRouterCredentialStatus status) {
    if (!status.configured) {
      return context.tr('No OpenRouter key configured');
    }
    switch (status.validationStatus) {
      case 'valid':
        return context.tr('OpenRouter key is valid');
      case 'invalid':
        return context.tr('OpenRouter key is invalid');
      case 'missing':
        return context.tr('OpenRouter key is missing');
      default:
        return context.tr('OpenRouter key saved, not validated yet');
    }
  }

  String _openRouterMetaText(OpenRouterCredentialStatus status) {
    final parts = <String>[];
    if (status.updatedAt != null) {
      parts.add(
        context.tr('Updated: {date}', {
          'date': _formatDateTime(status.updatedAt!),
        }),
      );
    }
    if (status.lastValidatedAt != null) {
      parts.add(
        context.tr('Validated: {date}', {
          'date': _formatDateTime(status.lastValidatedAt!),
        }),
      );
    }
    return parts.join(' • ');
  }

  String _formatDateTime(DateTime value) {
    final local = value.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${local.year}-${two(local.month)}-${two(local.day)} '
        '${two(local.hour)}:${two(local.minute)}';
  }

  Future<void> _saveOpenRouterCredential() async {
    final apiKey = _openRouterApiKeyController.text.trim();
    if (apiKey.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('Enter an OpenRouter API key first.')),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isSavingOpenRouterKey = true);
    try {
      final api = ref.read(apiServiceProvider);
      final status = await api.saveOpenRouterCredential(apiKey);
      _openRouterApiKeyController.clear();
      ref.invalidate(openRouterCredentialStatusProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('OpenRouter key saved: {key}', {
              'key': status.maskedSecret ?? 'masked',
            }),
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Failed to save OpenRouter key: {error}', {
          'error': error.message,
        }),
        scope: 'settings.openrouter.save',
        error: error,
        contextData: {'statusCode': error.statusCode, 'path': error.path},
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    } catch (error, stackTrace) {
      if (!mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Failed to save OpenRouter key: {error}', {
          'error': '$error',
        }),
        scope: 'settings.openrouter.save.unexpected',
        error: error,
        stackTrace: stackTrace,
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    } finally {
      if (mounted) setState(() => _isSavingOpenRouterKey = false);
    }
  }

  Future<void> _validateOpenRouterCredential() async {
    setState(() => _isValidatingOpenRouterKey = true);
    try {
      final api = ref.read(apiServiceProvider);
      final result = await api.validateOpenRouterCredential();
      ref.invalidate(openRouterCredentialStatusProvider);
      if (!mounted) return;
      final validationMessage =
          result.message ?? context.tr('Validation completed.');
      if (result.valid) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(validationMessage),
            backgroundColor: AppTheme.approveColor.withAlpha(210),
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        showCopyableDiagnosticSnackBar(
          context,
          ref,
          message: validationMessage,
          scope: 'settings.openrouter.validation_warning',
          backgroundColor: AppTheme.warningColor.withAlpha(220),
        );
      }
    } on ApiException catch (error) {
      if (!mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Failed to validate OpenRouter key: {error}', {
          'error': error.message,
        }),
        scope: 'settings.openrouter.validate',
        error: error,
        contextData: {'statusCode': error.statusCode, 'path': error.path},
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    } catch (error, stackTrace) {
      if (!mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Failed to validate OpenRouter key: {error}', {
          'error': '$error',
        }),
        scope: 'settings.openrouter.validate.unexpected',
        error: error,
        stackTrace: stackTrace,
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    } finally {
      if (mounted) setState(() => _isValidatingOpenRouterKey = false);
    }
  }

  Future<void> _deleteOpenRouterCredential() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('Delete OpenRouter key?')),
        content: Text(
          context.tr(
            'This removes your stored OpenRouter credential and disables AI features across the app until you add a new one.',
          ),
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.rejectColor,
            ),
            child: Text(context.tr('Delete')),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isDeletingOpenRouterKey = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.deleteOpenRouterCredential();
      _openRouterApiKeyController.clear();
      ref.invalidate(openRouterCredentialStatusProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('OpenRouter key deleted.')),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Failed to delete OpenRouter key: {error}', {
          'error': error.message,
        }),
        scope: 'settings.openrouter.delete',
        error: error,
        contextData: {'statusCode': error.statusCode, 'path': error.path},
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    } catch (error, stackTrace) {
      if (!mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Failed to delete OpenRouter key: {error}', {
          'error': '$error',
        }),
        scope: 'settings.openrouter.delete.unexpected',
        error: error,
        stackTrace: stackTrace,
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    } finally {
      if (mounted) setState(() => _isDeletingOpenRouterKey = false);
    }
  }

  // ----- GitHub ----------------------------------------------------------

  Widget _buildGithubBody(AsyncValue<GithubIntegrationState> state) {
    final theme = Theme.of(context);

    return state.when(
      data: (value) {
        final connected = value.connected;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SettingsStatusPill(
              label: connected
                  ? context.tr('Connected as {username}', {
                      'username': value.username ?? context.tr('unknown'),
                    })
                  : context.tr('Not connected'),
              color: connected
                  ? AppTheme.approveColor
                  : theme.colorScheme.onSurfaceVariant,
              icon: connected ? Icons.check_circle_outline : Icons.link_off,
            ),
            if (value.scope != null && value.scope!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                context.tr('Granted scopes: {scope}', {'scope': value.scope!}),
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 12,
                ),
              ),
            ],
            const SizedBox(height: 14),
            connected
                ? OutlinedButton.icon(
                    icon: const Icon(Icons.link_off, size: 18),
                    label: Text(context.tr('Disconnect GitHub')),
                    onPressed: _disconnectGithub,
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 44),
                    ),
                  )
                : FilledButton.icon(
                    onPressed: _connectGithub,
                    icon: const Icon(Icons.link, size: 18),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.approveColor,
                      minimumSize: const Size(0, 44),
                    ),
                    label: Text(context.tr('Connect GitHub')),
                  ),
          ],
        );
      },
      loading: () => Row(
        children: [
          const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 12),
          Text(
            context.tr('Checking GitHub integration...'),
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
      error: (error, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('Unable to load GitHub integration state.'),
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 8),
          SettingsErrorDiagnostic(
            details: 'GitHub error: ${(error.toString()).trim()}',
            linkUrl:
                '${ref.read(apiBaseUrlProvider)}/api/integrations/github/status',
            linkLabel: context.tr('Open GitHub status endpoint'),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: _connectGithub,
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.approveColor,
              minimumSize: const Size(0, 44),
            ),
            child: Text(context.tr('Try reconnecting')),
          ),
        ],
      ),
    );
  }

  Future<void> _connectGithub() async {
    final api = ref.read(apiServiceProvider);
    String? connectUrl;
    try {
      connectUrl = await api.getGithubConnectUrl();
    } on ApiException catch (error, stackTrace) {
      if (!mounted) return;
      showDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('GitHub OAuth is unavailable: {error}', {
          'error': error.message,
        }),
        scope: 'settings.github.connect',
        error: error,
        stackTrace: stackTrace,
        contextData: {'path': error.path, 'statusCode': error.statusCode},
      );
      return;
    }

    if (connectUrl == null || connectUrl.isEmpty) {
      if (!mounted) return;
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr(
          'GitHub OAuth is unavailable. Check backend configuration.',
        ),
        scope: 'settings.github.connect_url_missing',
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
      return;
    }

    final uri = Uri.parse(connectUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(context.tr('GitHub connection')),
          content: Text(
            context.tr(
              'A browser opened for authorization. Once you finish, return here and tap Refresh.',
            ),
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(context.tr('Close')),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                ref.invalidate(githubIntegrationStatusProvider);
              },
              child: Text(context.tr('Refresh')),
            ),
          ],
        ),
      );
    } else if (mounted) {
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Could not open browser for GitHub authorization'),
        scope: 'settings.github.browser_unavailable',
        contextData: {'connectUrl': connectUrl},
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    }
  }

  Future<void> _disconnectGithub() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.tr('Disconnect GitHub?')),
        content: Text(
          context.tr(
            'This removes your GitHub connection and hides private repository data from the picker.',
          ),
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.rejectColor,
            ),
            child: Text(context.tr('Disconnect')),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final api = ref.read(apiServiceProvider);
    final success = await api.disconnectGithubIntegration();
    if (!mounted) return;

    if (success) {
      ref.invalidate(githubIntegrationStatusProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('GitHub disconnected.'))),
      );
    } else {
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Failed to disconnect GitHub.'),
        scope: 'settings.github.disconnect',
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    }
  }

  // ----- Publishing channels --------------------------------------------

  List<Widget> _buildChannelRows({
    required AsyncValue<List<PublishAccount>> accountsAsync,
    required AsyncValue<PublishAccountsState> publishAccountsState,
  }) {
    final notices = <Widget>[];
    final unavailable = publishAccountsState.value?.isUnavailable == true;
    final hasError = publishAccountsState.value?.hasError == true;

    if (unavailable) {
      notices.add(
        SettingsBlock(
          child: _buildPublishAccountsNotice(
            context.tr(
              'Publish account connections are unavailable until the backend publish integration is configured.',
            ),
            detail: publishAccountsState.value?.message,
          ),
        ),
      );
    } else if (hasError) {
      notices.add(
        SettingsBlock(
          child: _buildPublishAccountsNotice(
            context.tr(
              'Connected accounts could not be loaded right now. Publishing stays available only for already-resolved flows.',
            ),
            detail: publishAccountsState.value?.message,
            tone: AppTheme.warningColor,
          ),
        ),
      );
    }

    final channels = [
      ('WordPress', PublishingChannel.wordpress, Icons.language),
      ('Twitter / X', PublishingChannel.twitter, Icons.alternate_email),
      ('LinkedIn', PublishingChannel.linkedin, Icons.work_outline),
      ('Instagram', PublishingChannel.instagram, Icons.camera_alt_outlined),
      ('Ghost', PublishingChannel.ghost, Icons.edit_note),
      ('YouTube', PublishingChannel.youtube, Icons.play_circle_outline),
      ('TikTok', PublishingChannel.tiktok, Icons.music_note),
    ];

    final rows = channels.map((ch) {
      final (name, channel, icon) = ch;
      final platform = channelToPlatform(channel);
      final account = accountsAsync.value == null || platform == null
          ? null
          : _accountForPlatform(accountsAsync.value!, platform);
      final connected = account != null;

      return SettingsRow(
        icon: icon,
        title: name,
        subtitle: _channelSubtitle(
          accountsAsync: accountsAsync,
          publishAccountsState: publishAccountsState,
          platform: platform,
          connected: connected,
          account: account,
        ),
        iconColor: connected ? AppTheme.approveColor : null,
        trailing: _buildChannelTrailing(
          name: name,
          platform: platform,
          connected: connected,
          isLoading: accountsAsync.isLoading,
          publishAccountsState: publishAccountsState,
        ),
      );
    }).toList();

    return [...notices, ...rows];
  }

  Widget _buildPublishAccountsNotice(
    String message, {
    String? detail,
    Color? tone,
  }) {
    final theme = Theme.of(context);
    final resolvedTone = tone ?? AppTheme.rejectColor;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          message,
          style: TextStyle(color: resolvedTone, fontSize: 13, height: 1.4),
        ),
        if (detail != null && detail.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            detail,
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }

  String _channelSubtitle({
    required AsyncValue<List<PublishAccount>> accountsAsync,
    required AsyncValue<PublishAccountsState> publishAccountsState,
    required String? platform,
    required bool connected,
    required PublishAccount? account,
  }) {
    if (accountsAsync.isLoading) {
      return context.tr('Loading connected accounts...');
    }
    if (publishAccountsState.value?.isUnavailable == true) {
      return context.tr('Publish connections unavailable');
    }
    if (publishAccountsState.value?.hasError == true ||
        accountsAsync.hasError) {
      return context.tr('Could not fetch connected accounts');
    }
    if (platform == null) {
      return context.tr('Not wired to LATE publish flow yet');
    }
    if (connected && account != null) {
      return '${account.displayName} @${account.username}';
    }
    return context.tr('Tap Connect to authorize');
  }

  Widget? _buildChannelTrailing({
    required String name,
    required String? platform,
    required bool connected,
    required bool isLoading,
    required AsyncValue<PublishAccountsState> publishAccountsState,
  }) {
    if (isLoading) {
      return const SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }

    if (platform == null) {
      return Text(
        context.tr('Not wired'),
        style: TextStyle(
          color: AppTheme.warningColor.withAlpha(180),
          fontSize: 12,
        ),
      );
    }

    if (publishAccountsState.value?.isUnavailable == true ||
        publishAccountsState.value?.hasError == true) {
      return Text(
        context.tr('Unavailable'),
        style: TextStyle(
          color: AppTheme.warningColor.withAlpha(180),
          fontSize: 12,
        ),
      );
    }

    if (connected) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SettingsStatusPill(
            label: context.tr('Connected'),
            color: AppTheme.approveColor,
          ),
          const SizedBox(width: 4),
          IconButton(
            icon: Icon(
              Icons.link_off,
              size: 20,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            tooltip: context.tr('Disconnect'),
            onPressed: () => _disconnectChannel(name, platform),
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
          ),
        ],
      );
    }

    return FilledButton.tonal(
      onPressed: () => _connectChannel(name, platform),
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        minimumSize: const Size(0, 36),
      ),
      child: Text(context.tr('Connect')),
    );
  }

  Future<void> _connectChannel(String channelName, String? platform) async {
    if (platform == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr(
              '{channelName} is not supported for direct connection yet',
              {'channelName': channelName},
            ),
          ),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
      return;
    }

    final api = ref.read(apiServiceProvider);
    final connectUrl = await api.getConnectUrl(platform);

    if (!mounted) return;

    if (connectUrl == null || connectUrl.isEmpty) {
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr('Could not get connect URL for {channelName}', {
          'channelName': channelName,
        }),
        scope: 'settings.channel.connect_url_missing',
        contextData: {'channel': channelName, 'platform': platform},
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
      return;
    }

    final uri = Uri.parse(connectUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);

      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(
            context.tr('Connecting {channelName}', {
              'channelName': channelName,
            }),
          ),
          content: Text(
            context.tr(
              'A browser window has opened for you to authorize {channelName}.\n\nOnce done, tap "Refresh" to see your connected account.',
              {'channelName': channelName},
            ),
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(context.tr('Cancel')),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                ref.invalidate(publishAccountsProvider);
              },
              child: Text(context.tr('Refresh')),
            ),
          ],
        ),
      );
    } else if (mounted) {
      showCopyableDiagnosticSnackBar(
        context,
        ref,
        message: context.tr(
          'Could not open browser for {channelName} authorization',
          {'channelName': channelName},
        ),
        scope: 'settings.channel.browser_unavailable',
        contextData: {
          'channel': channelName,
          'platform': platform,
          'connectUrl': connectUrl,
        },
        backgroundColor: AppTheme.rejectColor.withAlpha(200),
      );
    }
  }

  Future<void> _disconnectChannel(String channelName, String platform) async {
    final accounts = ref.read(publishAccountsProvider).value ?? [];
    final account = _accountForPlatform(accounts, platform);
    if (account == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          context.tr('Disconnect {channelName}?', {'channelName': channelName}),
        ),
        content: Text(
          context.tr('This will remove the connection to {displayName}.', {
            'displayName': account.displayName,
          }),
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.tr('Cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.rejectColor,
            ),
            child: Text(context.tr('Disconnect')),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final api = ref.read(apiServiceProvider);
    final success = await api.disconnectAccount(account.id);

    if (mounted) {
      if (success) {
        ref.invalidate(publishAccountsProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.tr('Disconnected {channelName}', {
                'channelName': channelName,
              }),
            ),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      } else {
        showCopyableDiagnosticSnackBar(
          context,
          ref,
          message: context.tr('Failed to disconnect {channelName}', {
            'channelName': channelName,
          }),
          scope: 'settings.channel.disconnect',
          contextData: {'channel': channelName, 'platform': platform},
          backgroundColor: AppTheme.rejectColor.withAlpha(200),
        );
      }
    }
  }

  PublishAccount? _accountForPlatform(
    List<PublishAccount> accounts,
    String platform,
  ) {
    for (final account in accounts) {
      if (account.platform == platform && account.isActive) {
        return account;
      }
    }
    for (final account in accounts) {
      if (account.platform == platform) return account;
    }
    return null;
  }
}

/// AI runtime mode selector. Lifted from the legacy settings screen unchanged
/// in behavior so existing tests continue to target `Key('ai-runtime-mode-...')`.
class AiRuntimeSettingsCard extends StatelessWidget {
  const AiRuntimeSettingsCard({
    super.key,
    required this.settings,
    required this.canManage,
    required this.isUpdating,
    this.onModeSelected,
  });

  final AIRuntimeSettings settings;
  final bool canManage;
  final bool isUpdating;
  final Future<void> Function(String mode)? onModeSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selectedMode = settings.mode == 'platform' ? 'platform' : 'byok';
    final byok = settings.modeAvailability('byok');
    final platform = settings.modeAvailability('platform');

    Widget modeChip({
      required String mode,
      required String label,
      required AIRuntimeModeAvailability? availability,
    }) {
      final enabled = availability?.enabled ?? (mode == 'byok');
      final selected = selectedMode == mode;
      final isDisabled = !enabled || !canManage || isUpdating;
      final subtitle = enabled
          ? null
          : availability?.message ?? 'Not available for this account';
      return Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ChoiceChip(
              key: Key('ai-runtime-mode-$mode'),
              label: Text(label),
              selected: selected,
              onSelected: isDisabled
                  ? null
                  : (_) {
                      final callback = onModeSelected;
                      if (callback != null) callback(mode);
                    },
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(
                subtitle,
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 12,
                ),
              ),
            ],
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            modeChip(
              mode: 'byok',
              label: context.tr('BYOK'),
              availability: byok,
            ),
            const SizedBox(width: 12),
            modeChip(
              mode: 'platform',
              label: context.tr('Platform'),
              availability: platform,
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (!canManage)
          Text(
            context.tr(
              'Sign in to manage AI runtime mode and provider states.',
            ),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
        if (isUpdating) ...[
          const SizedBox(height: 10),
          const LinearProgressIndicator(minHeight: 2),
        ],
        const SizedBox(height: 14),
        ...settings.providers.map((provider) {
          final providerLabel = switch (provider.provider) {
            'openrouter' => 'OpenRouter',
            'exa' => 'Exa',
            'firecrawl' => 'Firecrawl',
            _ => provider.provider,
          };
          final byokLabel = provider.byok.configured
              ? context.tr('BYOK configured')
              : context.tr('BYOK missing');
          final platformLabel = provider.platform.available
              ? context.tr('Platform ready')
              : provider.platform.configured
              ? context.tr('Platform configured (locked)')
              : context.tr('Platform missing');
          return Container(
            key: Key('ai-runtime-provider-${provider.provider}'),
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest.withAlpha(80),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: theme.colorScheme.outlineVariant.withAlpha(120),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    providerLabel,
                    style: TextStyle(
                      color: theme.colorScheme.onSurface,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  '$byokLabel · $platformLabel',
                  style: TextStyle(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
