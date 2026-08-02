import 'package:flutter/material.dart';

import '../../../data/firestore_projection/firestore_projection_models.dart';
import '../../data/dashboard_readonly_projection_repository.dart';

class DashboardProjectionPanel extends StatelessWidget {
  const DashboardProjectionPanel({
    super.key,
    required this.snapshot,
    this.onRefreshRequested,
  });

  final DashboardReadonlySnapshot snapshot;
  final ValueChanged<String>? onRefreshRequested;

  @override
  Widget build(BuildContext context) {
    if (snapshot.isSignedOut) {
      return const _StateMessage(
        title: 'Sign in required',
        message: 'No project projection reads run before authentication.',
      );
    }
    if (snapshot.projects.isEmpty) {
      return const _StateMessage(
        title: 'No visible projects',
        message:
            'Connect GitHub and select a repository to create a ShipGlows project.',
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: snapshot.projects.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final project = snapshot.projects[index];
        return _ProjectProjectionCard(
          project: project,
          onRefreshRequested: onRefreshRequested,
        );
      },
    );
  }
}

class _ProjectProjectionCard extends StatelessWidget {
  const _ProjectProjectionCard({
    required this.project,
    required this.onRefreshRequested,
  });

  final DashboardProjectSummary project;
  final ValueChanged<String>? onRefreshRequested;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final stateLabel = _stateLabel(project.state);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.displayName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        project.githubFullName,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Semantics(
                  label: 'Project state: $stateLabel',
                  child: Chip(label: Text(stateLabel)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _statusChip(context, 'Artifacts', '${project.artifactCount}'),
                _statusChip(
                  context,
                  'Diagnostics',
                  '${project.diagnosticCount}',
                ),
                _statusChip(context, 'Access', project.accessStatus.wireName),
              ],
            ),
            if (project.staleReason != null) ...[
              const SizedBox(height: 12),
              _WarningText(text: project.staleReason!),
            ],
            if (project.refreshDisabledReason != null) ...[
              const SizedBox(height: 12),
              _WarningText(text: project.refreshDisabledReason!),
            ],
            const SizedBox(height: 14),
            FilledButton.tonalIcon(
              onPressed: project.canRequestRefresh && onRefreshRequested != null
                  ? () => onRefreshRequested!(project.projectId)
                  : null,
              icon: const Icon(Icons.sync),
              label: const Text('Request refresh'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(BuildContext context, String label, String value) {
    return Chip(label: Text('$label: $value'));
  }

  String _stateLabel(DashboardProjectViewState state) {
    return switch (state) {
      DashboardProjectViewState.accessLost => 'access lost',
      DashboardProjectViewState.corpusMissing => 'corpus missing',
      _ => state.name,
    };
  }
}

class _WarningText extends StatelessWidget {
  const _WarningText({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Semantics(
      label: 'Warning: $text',
      child: Text(
        text,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: colorScheme.error,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _StateMessage extends StatelessWidget {
  const _StateMessage({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
