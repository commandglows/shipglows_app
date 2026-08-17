import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../domain/project_health/project_health_models.dart';
import '../../../presentation/theme/app_theme.dart';
import '../../data/cockpit/cockpit_models.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/managed_cockpit_provider.dart';
import '../widgets/cockpit/cockpit_project_card.dart';
import '../widgets/cockpit/cockpit_status_panel.dart';
import '../widgets/cockpit/activity_review_panel.dart';
import '../widgets/cockpit/project_workspace_tabs.dart';
import '../widgets/shipglows_scaffold.dart';

class CockpitScreen extends ConsumerWidget {
  const CockpitScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final managed = ref.watch(managedCockpitSnapshotProvider);
    final local = ref.watch(dashboardProvider);
    return ShipGlowsScaffold(
      title: 'ShipGlows Cockpit',
      actions: [
        IconButton(
          tooltip: 'Refresh Cockpit',
          onPressed: () => _refresh(ref),
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
      body: managed.when(
        loading: () => const _LoadingView(),
        error: (_, _) =>
            _FallbackOrError(local: local, onRetry: () => _refresh(ref)),
        data: (state) => switch (state.status) {
          ManagedCockpitStatus.active => _ServerCockpit(
            snapshot: state.snapshot!,
          ),
          ManagedCockpitStatus.empty => const _EmptyView(),
          ManagedCockpitStatus.sessionExpired => _SessionExpiredView(
            onRetry: () => _refresh(ref),
          ),
          ManagedCockpitStatus.localOnly => _LocalCockpit(
            local: local,
            fallback: false,
            onRetry: () => _refresh(ref),
          ),
          ManagedCockpitStatus.failure => _LocalCockpit(
            local: local,
            fallback: true,
            onRetry: () => _refresh(ref),
          ),
        },
      ),
    );
  }

  void _refresh(WidgetRef ref) {
    ref.invalidate(managedCockpitSnapshotProvider);
    ref.read(dashboardProvider.notifier).refresh();
  }
}

class _ServerCockpit extends StatelessWidget {
  const _ServerCockpit({required this.snapshot});

  final CockpitSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final activeRuns = snapshot.projects.fold<int>(
      0,
      (sum, project) => sum + project.activeRunCount,
    );
    final conversations = snapshot.projects.fold<int>(
      0,
      (sum, project) => sum + project.conversationCount,
    );
    return _CockpitList(
      header: CockpitStatusPanel(
        title: 'Managed Cockpit active',
        message:
            '${snapshot.projects.length} projects · $conversations conversations · $activeRuns active runs',
        tone: CockpitStatusTone.info,
      ),
      tabs: ProjectWorkspaceTabs(projects: snapshot.projects),
      cards: [
        for (final project in snapshot.projects)
          _ServerProjectSection(project: project),
      ],
    );
  }
}

class _ServerProjectSection extends StatelessWidget {
  const _ServerProjectSection({required this.project});

  final CockpitProject project;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final location =
        '/project/${Uri.encodeComponent(project.name)}'
        '?runnerProjectId=${Uri.encodeComponent(project.id)}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CockpitProjectCard.server(project: project),
        SizedBox(height: tokens.spacing.sm),
        ActivityReviewPanel(
          projectId: project.id,
          accessState: project.accessState,
          onOpenConversations: () => context.go(location),
        ),
      ],
    );
  }
}

class _LocalCockpit extends StatelessWidget {
  const _LocalCockpit({
    required this.local,
    required this.fallback,
    required this.onRetry,
  });

  final AsyncValue<DashboardModel> local;
  final bool fallback;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => local.when(
    loading: () => const _LoadingView(),
    error: (_, _) => _ErrorView(onRetry: onRetry),
    data: (dashboard) {
      if (dashboard.projects.isEmpty) return _ErrorView(onRetry: onRetry);
      return _CockpitList(
        header: CockpitStatusPanel(
          title: fallback ? 'Local fallback active' : 'Local Cockpit only',
          message: fallback
              ? 'Managed data is unavailable. Showing repository evidence.'
              : 'The managed runner is not configured. Showing repository evidence.',
          tone: CockpitStatusTone.warning,
          action: fallback
              ? FilledButton(onPressed: onRetry, child: const Text('Retry'))
              : null,
        ),
        cards: [
          for (final project in dashboard.projects)
            CockpitProjectCard.local(project: project),
        ],
      );
    },
  );
}

class _FallbackOrError extends StatelessWidget {
  const _FallbackOrError({required this.local, required this.onRetry});

  final AsyncValue<DashboardModel> local;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) =>
      _LocalCockpit(local: local, fallback: true, onRetry: onRetry);
}

class _CockpitList extends StatelessWidget {
  const _CockpitList({required this.header, required this.cards, this.tabs});

  final Widget header;
  final Widget? tabs;
  final List<Widget> cards;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return ListView(
      padding: EdgeInsets.all(tokens.spacing.xs),
      children: [
        header,
        if (tabs case final tabs?) ...[
          SizedBox(height: tokens.spacing.md),
          tabs,
        ],
        SizedBox(height: tokens.spacing.md),
        for (final card in cards) ...[
          card,
          SizedBox(height: tokens.spacing.md),
        ],
      ],
    );
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) => Center(
    child: Semantics(
      liveRegion: true,
      label: 'Loading Cockpit',
      child: const CircularProgressIndicator(),
    ),
  );
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) => const Center(
    child: CockpitStatusPanel(
      title: 'No managed projects yet',
      message: 'Connect an authorized repository to populate the Cockpit.',
      tone: CockpitStatusTone.info,
    ),
  );
}

class _SessionExpiredView extends StatelessWidget {
  const _SessionExpiredView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: CockpitStatusPanel(
      title: 'Session expired',
      message: 'Sign in again before retrying the managed Cockpit.',
      tone: CockpitStatusTone.error,
      action: FilledButton(onPressed: onRetry, child: const Text('Retry')),
    ),
  );
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: CockpitStatusPanel(
      title: 'Cockpit unavailable',
      message: 'No managed or local project data can be shown safely.',
      tone: CockpitStatusTone.error,
      action: FilledButton(onPressed: onRetry, child: const Text('Retry')),
    ),
  );
}
