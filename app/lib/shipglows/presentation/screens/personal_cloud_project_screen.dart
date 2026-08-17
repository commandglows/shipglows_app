import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../personal_cloud/personal_cloud_transports.dart';
import '../../providers/personal_cloud/personal_cloud_transport_providers.dart';
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
  Widget build(BuildContext context, WidgetRef ref) => ShipGlowsScaffold(
    title: 'Espace distant · $projectName',
    body: PersonalCloudProjectSurface(
      projectId: projectId,
      projectName: projectName,
      previewTransport: ref.watch(projectPreviewTransportProvider),
      workspaceTransport: ref.watch(remoteWorkspaceTransportProvider),
    ),
  );
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
