import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../personal_cloud/personal_cloud_transports.dart';
import '../../providers/personal_cloud/personal_cloud_transport_providers.dart';
import '../../providers/personal_cloud/personal_cloud_projects_provider.dart';
import '../widgets/personal_cloud/project_preview_pane.dart';
import '../widgets/personal_cloud/reconnecting_workspace_terminal.dart';
import '../widgets/shipglows_scaffold.dart';

enum PersonalCloudPane { preview, terminal }

class PersonalCloudProjectScreen extends ConsumerWidget {
  const PersonalCloudProjectScreen({
    required this.projectId,
    required this.projectName,
    super.key,
  });

  final String projectId;
  final String projectName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(personalCloudProjectsProvider);
    return ShipGlowsScaffold(
      title: 'Espace distant · $projectName',
      body: projects.when(
        loading: () => const _ProjectRouteState(
          icon: Icons.verified_user_outlined,
          title: 'Vérification de l’accès au projet…',
          message: 'ShipGlows vérifie que ce projet appartient à votre compte.',
          loading: true,
        ),
        error: (error, _) => _ProjectRouteState(
          icon: Icons.cloud_off_outlined,
          title: 'Impossible de vérifier ce projet',
          message: error.toString(),
          actionLabel: 'Réessayer',
          onAction: () => ref.invalidate(personalCloudProjectsProvider),
        ),
        data: (items) {
          final authorized = items.any((project) => project.id == projectId);
          if (!authorized) {
            return _ProjectRouteState(
              icon: Icons.lock_person_outlined,
              title: 'Projet non autorisé',
              message:
                  'Ce projet n’est pas associé au compte connecté. Aucun accès à sa Preview ou à son terminal n’a été ouvert.',
              actionLabel: 'Voir mes projets',
              onAction: () => context.go('/projects'),
            );
          }
          return PersonalCloudProjectSurface(
            projectId: projectId,
            projectName: projectName,
            previewTransport: ref.watch(projectPreviewTransportProvider),
            workspaceTransport: ref.watch(remoteWorkspaceTransportProvider),
          );
        },
      ),
    );
  }
}

class _ProjectRouteState extends StatelessWidget {
  const _ProjectRouteState({
    required this.icon,
    required this.title,
    required this.message,
    this.loading = false,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final bool loading;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: tokens.conversation.messageMaxWidth,
        ),
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(tokens.spacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 40),
                SizedBox(height: tokens.spacing.sm),
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                SizedBox(height: tokens.spacing.xs),
                Text(message, textAlign: TextAlign.center),
                if (loading) ...[
                  SizedBox(height: tokens.spacing.md),
                  const CircularProgressIndicator(),
                ],
                if (actionLabel != null && onAction != null) ...[
                  SizedBox(height: tokens.spacing.md),
                  FilledButton(onPressed: onAction, child: Text(actionLabel!)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class PersonalCloudProjectSurface extends StatefulWidget {
  const PersonalCloudProjectSurface({
    required this.projectId,
    required this.projectName,
    required this.previewTransport,
    required this.workspaceTransport,
    this.previewFrameBuilder,
    this.workspaceReconnectPolicy = const WorkspaceReconnectPolicy(),
    this.workspaceDelay = defaultWorkspaceDelay,
    super.key,
  });

  final String projectId;
  final String projectName;
  final ProjectPreviewTransport? previewTransport;
  final RemoteWorkspaceTransport? workspaceTransport;
  final ProjectPreviewFrameBuilder? previewFrameBuilder;
  final WorkspaceReconnectPolicy workspaceReconnectPolicy;
  final WorkspaceDelay workspaceDelay;

  @override
  State<PersonalCloudProjectSurface> createState() =>
      _PersonalCloudProjectSurfaceState();
}

class _PersonalCloudProjectSurfaceState
    extends State<PersonalCloudProjectSurface> {
  PersonalCloudPane _selectedPane = PersonalCloudPane.preview;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final windowClass = tokens.breakpoints.classify(constraints.maxWidth);
        final preview = ProjectPreviewPane(
          key: const ValueKey('personal-cloud-preview-pane'),
          projectId: widget.projectId,
          projectName: widget.projectName,
          transport: widget.previewTransport,
          frameBuilder: widget.previewFrameBuilder,
        );
        final terminal = ReconnectingWorkspaceTerminal(
          key: const ValueKey('personal-cloud-terminal-pane'),
          projectId: widget.projectId,
          projectName: widget.projectName,
          transport: widget.workspaceTransport,
          showAccessoryKeys: windowClass == AppWindowClass.compact,
          reconnectPolicy: widget.workspaceReconnectPolicy,
          delay: widget.workspaceDelay,
        );

        if (windowClass == AppWindowClass.expanded) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: preview),
              VerticalDivider(width: tokens.spacing.md),
              Expanded(child: terminal),
            ],
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Semantics(
                label: 'Choisir la surface du projet',
                child: SegmentedButton<PersonalCloudPane>(
                  segments: const [
                    ButtonSegment(
                      value: PersonalCloudPane.preview,
                      icon: Icon(Icons.visibility_outlined),
                      label: Text('Preview'),
                    ),
                    ButtonSegment(
                      value: PersonalCloudPane.terminal,
                      icon: Icon(Icons.terminal_rounded),
                      label: Text('Terminal'),
                    ),
                  ],
                  selected: {_selectedPane},
                  showSelectedIcon: false,
                  onSelectionChanged: (selection) {
                    setState(() => _selectedPane = selection.single);
                  },
                ),
              ),
            ),
            SizedBox(height: tokens.spacing.sm),
            Expanded(
              child: IndexedStack(
                index: _selectedPane.index,
                children: [preview, terminal],
              ),
            ),
          ],
        );
      },
    );
  }
}
