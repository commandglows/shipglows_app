import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/app_config.dart';
import '../../../data/models/app_access_state.dart';
import '../../../data/models/auth_session.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_error_view.dart';

class EntryScreen extends ConsumerStatefulWidget {
  const EntryScreen({super.key});

  @override
  ConsumerState<EntryScreen> createState() => _EntryScreenState();
}

class _EntryScreenState extends ConsumerState<EntryScreen> {
  Future<void> _openWebsiteSignIn() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/sign-in')
        : Uri.parse('${AppConfig.appWebUrl}/sign-in');
    await launchUrl(url);
  }

  Future<void> _openWebsiteLaunch() async {
    final url = kIsWeb
        ? Uri.parse('${Uri.base.origin}/#/entry')
        : Uri.parse('${AppConfig.appWebUrl}/#/entry');
    await launchUrl(url);
  }

  Widget? _buildEntryErrorDiagnostics(
    AuthSession authSession,
    AppAccessState? accessState,
  ) {
    final message = accessState?.message;
    if (message == null || message.trim().isEmpty) {
      return null;
    }

    return AppErrorView(
      scope: 'entry.${accessState?.diagnosticsLabel ?? 'unknown'}',
      title: 'Copy this error',
      message: message,
      compact: true,
      showIcon: false,
      copyLabel: 'Copy diagnostics',
      helperText:
          'Copy this report and send it back so the failing auth/bootstrap state can be inspected.',
      contextData: {
        'accessStage': accessState?.diagnosticsLabel ?? 'unknown',
        'statusCode': accessState?.statusCode?.toString() ?? 'none',
        'backendStatus': accessState?.backendStatusLabel ?? 'unknown',
        'sessionState': authSession.status.name,
        'sessionEmail': authSession.email ?? 'none',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authSession = ref.watch(authSessionProvider);
    final appAccessAsync = ref.watch(appAccessStateProvider);
    final palette = AppTheme.paletteOf(context);
    final stateCard = _buildStateCard(
      context,
      ref,
      authSession,
      appAccessAsync,
    );

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: palette.heroGradient,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1160),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHero(context, ref, stateCard),
                    const SizedBox(height: 24),
                    _buildProofStrip(),
                    const SizedBox(height: 24),
                    _buildPainVsFlow(),
                    const SizedBox(height: 24),
                    _buildHowItWorks(),
                    const SizedBox(height: 24),
                    _buildFeatureGrid(),
                    const SizedBox(height: 24),
                    _buildFaqSection(),
                    const SizedBox(height: 32),
                    _buildBottomCta(context, ref),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context, WidgetRef ref, Widget stateCard) {
    final theme = Theme.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 900;
        final left = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _pill(
              icon: Icons.auto_awesome_rounded,
              label: 'AI content ops for founders, creators, and lean teams',
            ),
            const SizedBox(height: 20),
            Builder(
              builder: (context) {
                final sw = MediaQuery.sizeOf(context).width;
                final heroSize = sw < 400
                    ? 28.0
                    : sw < 600
                    ? 36.0
                    : 48.0;
                return Text(
                  context.tr('Turn one repo into a weekly content machine.'),
                  style: TextStyle(
                    color: theme.colorScheme.onSurface,
                    fontSize: heroSize,
                    fontWeight: FontWeight.w800,
                    height: 1.05,
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Text(
              context.tr(
                'ContentFlow analyzes your product, generates angles and drafts, then lets you approve, edit, schedule, and publish from one workflow instead of juggling prompts, docs, and social tools.',
              ),
              style: TextStyle(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 17,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                FilledButton.icon(
                  onPressed: () {
                    ref.read(authSessionProvider.notifier).signInDemo();
                    context.go('/onboarding?intent=entry');
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.approveColor,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 18,
                    ),
                  ),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: Text(context.tr('Open Interactive Demo')),
                ),
                OutlinedButton.icon(
                  onPressed: kIsWeb
                      ? _openWebsiteSignIn
                      : () => context.go('/auth'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: theme.colorScheme.onSurface,
                    side: BorderSide(
                      color: theme.colorScheme.outlineVariant.withValues(
                        alpha: 0.9,
                      ),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 18,
                    ),
                  ),
                  icon: const Icon(Icons.lock_open_rounded),
                  label: Text(
                    context.tr(kIsWeb ? 'Continue with Google' : 'Sign In'),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => context.push('/feedback'),
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.onSurfaceVariant,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 18,
                    ),
                  ),
                  icon: const Icon(Icons.forum_outlined),
                  label: Text(context.tr('Share Feedback')),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: const [
                _MetricChip(
                  value: '1',
                  label: 'workflow from angle to publish',
                ),
                _MetricChip(
                  value: '3',
                  label: 'setup steps before first workspace',
                ),
                _MetricChip(
                  value: '7',
                  label: 'publishing channels already modeled',
                ),
              ],
            ),
          ],
        );

        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [left, const SizedBox(height: 24), stateCard],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 6, child: left),
            const SizedBox(width: 24),
            Expanded(flex: 5, child: stateCard),
          ],
        );
      },
    );
  }

  Widget _buildProofStrip() {
    final palette = AppTheme.paletteOf(context);
    const items = [
      'Repo-aware onboarding instead of blank-prompt setup',
      'Narrative ritual plus personas before generation',
      'Swipe approval flow tied to real publish actions',
      'Demo workspace available without sales call',
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: palette.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: items
            .map(
              (item) =>
                  _pill(icon: Icons.check_circle_outline_rounded, label: item),
            )
            .toList(),
      ),
    );
  }

  Widget _buildPainVsFlow() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 900;
        final withoutCard = _comparisonCard(
          title: 'Without ContentFlow',
          accent: AppTheme.rejectColor,
          items: const [
            'You explain your product from scratch in every prompt.',
            'Ideas, drafts, and publishing live in separate tools.',
            'The team loses momentum between generation and approval.',
            'Publishing still depends on manual copy-paste.',
          ],
        );
        final withCard = _comparisonCard(
          title: 'With ContentFlow',
          accent: AppTheme.approveColor,
          items: const [
            'Your workspace starts from a real repo and a real content plan.',
            'Rituals and personas sharpen the angle before generation.',
            'Drafts are reviewed with one approval workflow.',
            'Publishing, scheduling, and channel readiness stay visible.',
          ],
        );

        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [withoutCard, const SizedBox(height: 20), withCard],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: withoutCard),
            const SizedBox(width: 20),
            Expanded(child: withCard),
          ],
        );
      },
    );
  }

  Widget _buildHowItWorks() {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    const steps = [
      (
        '1. Connect the product context',
        'Start with your repo, project name, and content mix so the app works from actual context.',
      ),
      (
        '2. Shape the narrative',
        'Capture rituals, personas, and angles before asking the model for drafts.',
      ),
      (
        '3. Review and publish',
        'Approve, edit, schedule, and publish content from one queue instead of bouncing across tools.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('How the workflow actually works'),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.tr(
              'The promise is not "AI writes for you". The promise is a tighter system from source material to published output.',
            ),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 15,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),
          LayoutBuilder(
            builder: (context, constraints) {
              final cardWidth = constraints.maxWidth < 700
                  ? constraints.maxWidth
                  : 320.0;
              return Wrap(
                spacing: 16,
                runSpacing: 16,
                children: steps
                    .map(
                      (step) => SizedBox(
                        width: cardWidth,
                        child: _infoCard(
                          title: step.$1,
                          description: step.$2,
                          icon: Icons.arrow_outward_rounded,
                          accent: AppTheme.editColor,
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureGrid() {
    final items = [
      (
        'Onboarding that creates a plan',
        'Project, repo, formats, and cadence are captured before generation starts.',
        Icons.rocket_launch_outlined,
        AppTheme.approveColor,
      ),
      (
        'Angles from persona context',
        'The app uses ritual and persona inputs to propose more relevant content directions.',
        Icons.psychology_alt_outlined,
        AppTheme.editColor,
      ),
      (
        'Approval-first feed',
        'Operators can swipe through content decisions quickly instead of managing a cluttered queue.',
        Icons.swipe_outlined,
        AppTheme.warningColor,
      ),
      (
        'Publishing visibility',
        'Channel connections, scheduling state, and publish results stay attached to the workflow.',
        Icons.publish_outlined,
        AppTheme.approveColor,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = constraints.maxWidth < 750
            ? constraints.maxWidth
            : 350.0;
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: items
              .map(
                (item) => SizedBox(
                  width: cardWidth,
                  child: _infoCard(
                    title: item.$1,
                    description: item.$2,
                    icon: item.$3,
                    accent: item.$4,
                  ),
                ),
              )
              .toList(),
        );
      },
    );
  }

  Widget _buildFaqSection() {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    final items = [
      (
        'Why not just use ChatGPT?',
        'Because the hard part is not getting text. The hard part is preserving product context, deciding what to say next, and moving approved drafts into publishing without friction.',
      ),
      (
        'What makes the demo useful?',
        'The demo is a stable public workspace, so visitors can inspect the workflow end-to-end before creating their own workspace.',
      ),
      (
        'Is this only for social posts?',
        'No. The product already models blog posts, newsletters, social posts, video scripts, and short-form video content.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: palette.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('Common objections'),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _faqItem(question: item.$1, answer: item.$2),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomCta(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('See the workflow before you commit'),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.tr(
              'Start with the stable demo workspace to inspect the flow, then create your own workspace when you are ready to connect a real product.',
            ),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 15,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton(
                onPressed: () {
                  ref.read(authSessionProvider.notifier).signInDemo();
                  context.go('/onboarding?intent=entry');
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.approveColor,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 18,
                  ),
                ),
                child: Text(context.tr('Open Demo Workspace')),
              ),
              OutlinedButton(
                onPressed: kIsWeb
                    ? _openWebsiteSignIn
                    : () => context.go('/auth'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: theme.colorScheme.onSurface,
                  side: BorderSide(
                    color: theme.colorScheme.outlineVariant.withValues(
                      alpha: 0.9,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 18,
                  ),
                ),
                child: Text(
                  context.tr(kIsWeb ? 'Continue with Google' : 'Sign In'),
                ),
              ),
              TextButton(
                onPressed: () => context.push('/feedback'),
                style: TextButton.styleFrom(
                  foregroundColor: theme.colorScheme.onSurfaceVariant,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 18,
                  ),
                ),
                child: Text(context.tr('Share Feedback')),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStateCard(
    BuildContext context,
    WidgetRef ref,
    AuthSession authSession,
    AsyncValue<AppAccessState> appAccessAsync,
  ) {
    final accessState = appAccessAsync.value;
    final stage = accessState?.stage;

    if (appAccessAsync.isLoading || stage == AppAccessStage.restoringSession) {
      return _card(
        eyebrow: 'Restoring session',
        title: 'Checking Clerk session',
        description:
            'The app is restoring your Clerk session and deciding whether to open auth, onboarding, or your workspace.',
        icon: Icons.sync_rounded,
        accent: AppTheme.editColor,
        primaryLabel: 'Please wait',
        onPrimary: null,
        secondaryLabel: 'Open Demo Workspace',
        onSecondary: () {
          ref.read(authSessionProvider.notifier).signInDemo();
          context.go('/onboarding?intent=entry');
        },
      );
    }

    if (stage == AppAccessStage.checkingBackend ||
        stage == AppAccessStage.checkingWorkspace) {
      return _card(
        eyebrow: 'Checking session',
        title: stage == AppAccessStage.checkingBackend
            ? 'Checking backend availability'
            : 'Loading your workspace',
        description: stage == AppAccessStage.checkingBackend
            ? 'Your Clerk session is active. The app is confirming that FastAPI is reachable before asking for workspace state.'
            : 'The app is validating your session and loading your workspace from FastAPI.',
        icon: Icons.sync_rounded,
        accent: AppTheme.editColor,
        primaryLabel: 'Please wait',
        onPrimary: null,
        secondaryLabel: 'Sign out',
        onSecondary: () => ref.read(authSessionProvider.notifier).signOut(),
      );
    }

    if (stage == AppAccessStage.apiUnavailable ||
        stage == AppAccessStage.bootstrapFailed ||
        stage == AppAccessStage.bootstrapUnauthorized) {
      final isUnauthorized = stage == AppAccessStage.bootstrapUnauthorized;
      final title = isUnauthorized
          ? 'Reconnect your account'
          : 'FastAPI is unavailable';
      final description = isUnauthorized
          ? 'Your Clerk session reached the app, but FastAPI rejected the bootstrap request. Sign in again to refresh the bearer token.'
          : 'Your Clerk session is active, but ContentFlow cannot load product state from FastAPI right now. Use the degraded mode tools to inspect backend status, retry, or wait for the API to recover.';

      return _card(
        eyebrow: stage == AppAccessStage.apiUnavailable
            ? 'API down'
            : 'Session error',
        title: title,
        description: description,
        icon: Icons.warning_amber_rounded,
        accent: AppTheme.warningColor,
        primaryLabel: isUnauthorized
            ? (kIsWeb ? 'Continue with Google' : 'Sign In Again')
            : 'Open System Status',
        onPrimary: () {
          if (isUnauthorized) {
            ref.read(authSessionProvider.notifier).signOut();
            if (kIsWeb) {
              _openWebsiteSignIn();
            } else {
              context.go('/auth');
            }
            return;
          }
          context.go('/uptime');
        },
        secondaryLabel: isUnauthorized ? 'Open Demo Workspace' : 'Retry API',
        onSecondary: () {
          if (isUnauthorized) {
            ref.read(authSessionProvider.notifier).signInDemo();
            context.go(
              authSession.onboardingComplete
                  ? '/feed'
                  : '/onboarding?intent=entry',
            );
            return;
          }
          ref.read(appAccessStateProvider.notifier).refresh();
        },
        caption: 'Backend detail: ${accessState?.message ?? 'unknown'}',
        extra: _buildEntryErrorDiagnostics(authSession, accessState),
      );
    }

    if (stage == AppAccessStage.ready) {
      return _card(
        eyebrow: 'Session active',
        title: 'Welcome back to ContentFlow',
        description:
            'Your account is already recognized. Jump back into the content pipeline instead of going through onboarding again.',
        icon: Icons.verified_user_rounded,
        accent: AppTheme.approveColor,
        primaryLabel: 'Open Dashboard',
        onPrimary: () => context.go('/feed'),
        secondaryLabel: 'Sign out',
        onSecondary: () => ref.read(authSessionProvider.notifier).signOut(),
        extra: _buildCopyFlowDiagnostics(
          context,
          ref,
          authSession,
          accessState,
        ),
      );
    }

    if (stage == AppAccessStage.needsOnboarding ||
        stage == AppAccessStage.demo) {
      return _card(
        eyebrow: 'Setup required',
        title: 'Finish onboarding before entering the app',
        description:
            'Your session exists, but the workspace setup is still incomplete. Continue onboarding to configure project, content types, and publishing flow.',
        icon: Icons.rocket_launch_rounded,
        accent: AppTheme.editColor,
        primaryLabel: 'Continue Onboarding',
        onPrimary: () => context.go('/onboarding?intent=entry'),
        secondaryLabel: 'Sign out',
        onSecondary: () => ref.read(authSessionProvider.notifier).signOut(),
        extra: _buildCopyFlowDiagnostics(
          context,
          ref,
          authSession,
          accessState,
        ),
      );
    }

    return _card(
      eyebrow: 'Logged out',
      title: 'Sign in to access your workspace',
      description: kIsWeb
          ? 'You are not signed in yet. Continue with Google on the dedicated app-domain Clerk page. Workspace creation and onboarding are only available after authentication.'
          : 'You are not signed in yet. The Flutter beta auth path has been archived, so use the dedicated web sign-in flow instead.',
      icon: Icons.lock_outline_rounded,
      accent: AppTheme.warningColor,
      primaryLabel: kIsWeb ? 'Continue with Google' : 'Sign In',
      onPrimary: kIsWeb ? _openWebsiteSignIn : () => context.go('/auth'),
      secondaryLabel: kIsWeb ? 'Open App Entry' : 'Open Demo Workspace',
      onSecondary: kIsWeb
          ? _openWebsiteLaunch
          : () {
              ref.read(authSessionProvider.notifier).signInDemo();
              context.go(
                authSession.onboardingComplete
                    ? '/feed'
                    : '/onboarding?intent=entry',
              );
            },
      caption: kIsWeb
          ? 'The stable path is now ClerkJS on `app.contentflow.winflowz.com/sign-in`, with a standard OAuth callback on `/sso-callback`.'
          : 'The demo uses one fixed public repository and pre-generated content so every visitor sees the same stable workspace. The old Flutter beta auth path now lives only in the legacy branch.',
      extra: _buildCopyFlowDiagnostics(context, ref, authSession, accessState),
    );
  }

  Widget _buildCopyFlowDiagnostics(
    BuildContext context,
    WidgetRef ref,
    AuthSession authSession,
    AppAccessState? accessState,
  ) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Align(
        alignment: Alignment.centerLeft,
        child: OutlinedButton.icon(
          onPressed: () {
            copyDiagnosticsToClipboard(
              context,
              ref,
              title: 'ContentFlow entry diagnostics',
              scope: 'entry.copy_flow_diagnostics',
              currentError: accessState?.message,
              contextData: {
                'sessionState': authSession.status.name,
                'sessionEmail': authSession.email ?? 'none',
                'accessStage': accessState?.diagnosticsLabel ?? 'loading',
                'backendStatus': accessState?.backendStatusLabel ?? 'unknown',
                'backendGitSha':
                    accessState?.backendHealth?['git_sha']?.toString() ??
                    'unknown',
                'bootstrapStatus':
                    accessState?.bootstrapStatusLabel ?? 'not_started',
                'workspaceStatus':
                    accessState?.bootstrap?.workspaceStatus ?? 'none',
                'workspaceExists':
                    accessState?.bootstrap?.user.workspaceExists ?? false,
                'projectsCount':
                    accessState?.bootstrap?.projectsCount ?? 'none',
                'defaultProjectId':
                    accessState?.bootstrap?.defaultProjectId ?? 'none',
              },
              successMessage: 'Entry diagnostics copied to clipboard.',
            );
          },
          style: OutlinedButton.styleFrom(
            foregroundColor: theme.colorScheme.onSurfaceVariant,
            side: BorderSide(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.9),
            ),
          ),
          icon: const Icon(Icons.copy_all_rounded, size: 18),
          label: Text(context.tr('Copy access diagnostics')),
        ),
      ),
    );
  }

  Widget _card({
    required String eyebrow,
    required String title,
    required String description,
    required IconData icon,
    required Color accent,
    required String primaryLabel,
    required VoidCallback? onPrimary,
    required String secondaryLabel,
    required VoidCallback onSecondary,
    String? caption,
    Widget? extra,
  }) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: palette.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: accent.withAlpha(22),
            blurRadius: 36,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: accent.withAlpha(30),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(icon, color: accent, size: 28),
          ),
          const SizedBox(height: 20),
          Text(
            context.tr(eyebrow).toUpperCase(),
            style: TextStyle(
              color: accent,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            context.tr(title),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 28,
              fontWeight: FontWeight.bold,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            context.tr(description),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 15,
              height: 1.5,
            ),
          ),
          if (caption != null) ...[
            const SizedBox(height: 12),
            Text(
              context.tr(caption),
              style: TextStyle(
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.8,
                ),
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ],
          if (extra case final extraWidget?) ...[extraWidget],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onPrimary,
              style: FilledButton.styleFrom(
                backgroundColor: accent,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(context.tr(primaryLabel)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onSecondary,
              style: OutlinedButton.styleFrom(
                foregroundColor: theme.colorScheme.onSurfaceVariant,
                side: BorderSide(
                  color: theme.colorScheme.outlineVariant.withValues(
                    alpha: 0.9,
                  ),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(context.tr(secondaryLabel)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pill({required IconData icon, required String label}) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: palette.surface.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: theme.colorScheme.onSurfaceVariant, size: 16),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              context.tr(label),
              style: TextStyle(
                color: theme.colorScheme.onSurface,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _comparisonCard({
    required String title,
    required Color accent,
    required List<String> items,
  }) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: accent.withAlpha(90)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr(title),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.circle, color: accent, size: 10),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      context.tr(item),
                      style: TextStyle(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 15,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard({
    required String title,
    required String description,
    required IconData icon,
    required Color accent,
  }) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: accent.withAlpha(26),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: accent),
          ),
          const SizedBox(height: 16),
          Text(
            context.tr(title),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.tr(description),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 14,
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }

  Widget _faqItem({required String question, required String answer}) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: palette.elevatedSurface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr(question),
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            context.tr(answer),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 14,
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: palette.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: TextStyle(
              color: theme.colorScheme.onSurface,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            context.tr(label),
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
