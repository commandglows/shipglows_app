import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../presentation/theme/app_theme.dart';
import '../../data/managed_runner_api.dart';
import '../../providers/managed_github_projects_provider.dart';
import '../../providers/managed_project_selection_provider.dart';
import '../../providers/managed_projects_provider.dart';
import '../widgets/shipglows_scaffold.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projects = ref.watch(managedProjectsProvider);
    final selection = ref.watch(managedProjectSelectionProvider);
    final tokens = AppTheme.tokensOf(context);
    return ShipGlowsScaffold(
      title: 'Projets',
      actions: [
        IconButton(
          tooltip: 'Actualiser les projets',
          onPressed: () {
            ref.invalidate(managedProjectsProvider);
            ref.invalidate(managedGitHubSourceStatusProvider);
          },
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
      body: projects.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => _ErrorState(
          message: _message(error),
          onRetry: () => ref.invalidate(managedProjectsProvider),
        ),
        data: (items) {
          final activeProjectId = resolveManagedProjectId(
            selection: selection,
            availableProjectIds: items
                .where((project) => !project.isArchived)
                .map((project) => project.id),
            defaultProjectId: _defaultProjectId(items),
          );
          return ListView(
            children: [
              _ProjectSourcePanel(
                onConnectLocal: () => _connectLocal(context, ref),
              ),
              SizedBox(height: tokens.spacing.lg),
              _ProjectSelectionModeCard(selection: selection),
              SizedBox(height: tokens.spacing.lg),
              Text(
                'Projets connectés',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              SizedBox(height: tokens.spacing.sm),
              if (items.isEmpty)
                const Card(
                  child: ListTile(title: Text('Aucun projet connecté.')),
                )
              else
                for (final project in items) ...[
                  _ProjectCard(
                    project: project,
                    active: activeProjectId == project.id,
                    automatic: selection.isAutomatic,
                  ),
                  if (project != items.last)
                    SizedBox(height: tokens.spacing.sm),
                ],
            ],
          );
        },
      ),
    );
  }

  Future<void> _connectLocal(BuildContext context, WidgetRef ref) async {
    final path = TextEditingController();
    final name = TextEditingController();
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) {
        final tokens = AppTheme.tokensOf(context);
        return AlertDialog(
          title: const Text('Connecter un projet local'),
          content: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: tokens.conversation.messageMaxWidth,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Le dossier doit être un dépôt Git situé dans le workspace ShipGlows. Aucun fichier Git ne sera modifié.',
                ),
                SizedBox(height: tokens.spacing.md),
                TextField(
                  controller: path,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'Chemin absolu du dépôt',
                    hintText: r'C:\Users\…\mon-projet',
                  ),
                ),
                SizedBox(height: tokens.spacing.sm),
                TextField(
                  controller: name,
                  decoration: const InputDecoration(
                    labelText: 'Nom affiché (facultatif)',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuler'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Connecter'),
            ),
          ],
        );
      },
    );
    if (accepted != true || path.text.trim().isEmpty || !context.mounted) {
      return;
    }
    try {
      final project = await ref
          .read(managedProjectsProvider.notifier)
          .connect(
            repositoryPath: path.text.trim(),
            name: name.text.trim().isEmpty ? null : name.text.trim(),
          );
      await ref
          .read(managedProjectSelectionProvider.notifier)
          .select(project.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Projet connecté et activé.')),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(_message(error))));
      }
    }
  }
}

class _ProjectSelectionModeCard extends ConsumerWidget {
  const _ProjectSelectionModeCard({required this.selection});

  final ManagedProjectSelection selection;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = AppTheme.tokensOf(context);
    return Card(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Projet actif',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: tokens.spacing.xs),
            Text(
              'Choisissez automatiquement le projet par défaut, un projet précis ci-dessous, ou aucun projet.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            SizedBox(height: tokens.spacing.sm),
            Wrap(
              spacing: tokens.spacing.xs,
              runSpacing: tokens.spacing.xs,
              children: [
                FilterChip(
                  key: const ValueKey('managed-project-selection-auto'),
                  avatar: const Icon(Icons.auto_awesome_outlined),
                  label: const Text('Sélection automatique'),
                  selected: selection.isAutomatic,
                  onSelected: (_) => ref
                      .read(managedProjectSelectionProvider.notifier)
                      .useAutomaticSelection(),
                ),
                FilterChip(
                  key: const ValueKey('managed-project-selection-none'),
                  avatar: const Icon(Icons.folder_off_outlined),
                  label: const Text('Aucun projet'),
                  selected: selection.hasNoProject,
                  onSelected: (_) => ref
                      .read(managedProjectSelectionProvider.notifier)
                      .selectNone(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectSourcePanel extends ConsumerWidget {
  const _ProjectSourcePanel({required this.onConnectLocal});
  final VoidCallback onConnectLocal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = AppTheme.tokensOf(context);
    final github = ref.watch(managedGitHubSourceStatusProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Ajouter un projet',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        SizedBox(height: tokens.spacing.xs),
        Text(
          'Reliez un dépôt déjà présent sur cette machine ou choisissez visuellement un repository autorisé par la GitHub App.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        SizedBox(height: tokens.spacing.sm),
        Wrap(
          spacing: tokens.spacing.sm,
          runSpacing: tokens.spacing.sm,
          children: [
            SizedBox(
              width: tokens.cockpit.cardMinWidth,
              child: _SourceCard(
                icon: Icons.folder_open_rounded,
                title: 'Dossier local',
                description:
                    'ShipGlows détecte le dépôt, sa plateforme et son origine GitHub.',
                actionLabel: 'Choisir un dossier',
                onPressed: onConnectLocal,
              ),
            ),
            SizedBox(
              width: tokens.cockpit.cardMinWidth,
              child: github.when(
                loading: () => const _SourceCard(
                  icon: Icons.hub_outlined,
                  title: 'GitHub App',
                  description: 'Vérification de la connexion GitHub…',
                  actionLabel: 'Vérification…',
                ),
                error: (_, _) => _SourceCard(
                  icon: Icons.cloud_off_outlined,
                  title: 'GitHub App',
                  description: 'La connexion GitHub ne peut pas être vérifiée.',
                  actionLabel: 'Réessayer',
                  onPressed: () =>
                      ref.invalidate(managedGitHubSourceStatusProvider),
                ),
                data: (status) => _GitHubSourceCard(status: status),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _GitHubSourceCard extends ConsumerWidget {
  const _GitHubSourceCard({required this.status});
  final ManagedGitHubSourceStatus status;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canBrowse =
        status.state == ManagedGitHubConnectionState.ready ||
        status.state == ManagedGitHubConnectionState.degraded;
    final label = switch (status.state) {
      ManagedGitHubConnectionState.disabled => 'Non configuré',
      ManagedGitHubConnectionState.disconnected => 'Connexion requise',
      ManagedGitHubConnectionState.verifying => 'Vérification…',
      ManagedGitHubConnectionState.ready => 'Choisir un repository',
      ManagedGitHubConnectionState.degraded => 'Voir les repositories',
      ManagedGitHubConnectionState.accessLost => 'Accès à rétablir',
    };
    return _SourceCard(
      icon: canBrowse ? Icons.hub_rounded : Icons.hub_outlined,
      title: status.accountLabel == null
          ? 'GitHub App'
          : 'GitHub · ${status.accountLabel}',
      description: status.message,
      actionLabel: label,
      onPressed: canBrowse
          ? () => showDialog<void>(
              context: context,
              builder: (_) => const _GitHubRepositoryDialog(),
            )
          : status.state == ManagedGitHubConnectionState.disconnected ||
                status.state == ManagedGitHubConnectionState.accessLost
          ? () => _beginSetup(context, ref)
          : null,
    );
  }

  Future<void> _beginSetup(BuildContext context, WidgetRef ref) async {
    try {
      final setup = await ref.read(managedGitHubSetupActionsProvider).begin();
      final opened = await launchUrl(
        setup.actionUrl,
        mode: LaunchMode.externalApplication,
      );
      if (!opened) {
        throw const ManagedRunnerException(
          code: 'githubSetupLaunchFailed',
          message: 'Impossible d\u2019ouvrir l\u2019installation GitHub App.',
        );
      }
      ref.invalidate(managedGitHubSourceStatusProvider);
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(_message(error))));
      }
    }
  }
}

class _SourceCard extends StatelessWidget {
  const _SourceCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.actionLabel,
    this.onPressed,
  });
  final IconData icon;
  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Card(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon),
            SizedBox(height: tokens.spacing.sm),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            SizedBox(height: tokens.spacing.xs),
            Text(description),
            SizedBox(height: tokens.spacing.md),
            FilledButton.tonal(onPressed: onPressed, child: Text(actionLabel)),
          ],
        ),
      ),
    );
  }
}

class _GitHubRepositoryDialog extends ConsumerStatefulWidget {
  const _GitHubRepositoryDialog();

  @override
  ConsumerState<_GitHubRepositoryDialog> createState() =>
      _GitHubRepositoryDialogState();
}

class _GitHubRepositoryDialogState
    extends ConsumerState<_GitHubRepositoryDialog> {
  String _query = '';
  String? _selectedId;
  bool _connecting = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    final repositories = ref.watch(managedGitHubRepositoriesProvider);
    return AlertDialog(
      title: const Text('Choisir un repository GitHub'),
      content: SizedBox(
        width: tokens.conversation.messageMaxWidth,
        height: tokens.conversation.panelPreferredHeight,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              autofocus: true,
              onChanged: (value) =>
                  setState(() => _query = value.trim().toLowerCase()),
              decoration: const InputDecoration(
                labelText: 'Rechercher',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
            SizedBox(height: tokens.spacing.sm),
            Flexible(
              child: repositories.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => _ErrorState(
                  message: _message(error),
                  onRetry: () =>
                      ref.invalidate(managedGitHubRepositoriesProvider),
                ),
                data: (state) {
                  final filtered = state.repositories
                      .where(
                        (item) => item.fullName.toLowerCase().contains(_query),
                      )
                      .toList(growable: false);
                  if (filtered.isEmpty) {
                    return const Center(
                      child: Text('Aucun repository accessible ne correspond.'),
                    );
                  }
                  return RadioGroup<String>(
                    groupValue: _selectedId,
                    onChanged: (value) => setState(() => _selectedId = value),
                    child: ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final repository = filtered[index];
                        return RadioListTile<String>(
                          value: repository.candidateId,
                          enabled: !repository.archived,
                          title: Text(repository.fullName),
                          subtitle: Text(
                            '${repository.isPrivate ? 'Privé' : 'Public'} · branche ${repository.defaultBranch}${repository.archived ? ' · archivé' : ''}',
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
            repositories.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
              data: (state) {
                final errorMessage = state.pageErrorMessage;
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (state.isLoadingNextPage) ...[
                      SizedBox(height: tokens.spacing.sm),
                      const LinearProgressIndicator(),
                    ],
                    if (errorMessage != null) ...[
                      SizedBox(height: tokens.spacing.sm),
                      Semantics(
                        liveRegion: true,
                        child: Text(
                          errorMessage,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ),
                    ],
                    if (state.canRetryNextPage) ...[
                      SizedBox(height: tokens.spacing.sm),
                      OutlinedButton.icon(
                        onPressed: state.isLoadingNextPage
                            ? null
                            : () => ref
                                  .read(
                                    managedGitHubRepositoriesProvider.notifier,
                                  )
                                  .retryNextPage(),
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Réessayer cette page'),
                      ),
                    ] else if (state.hasNextPage) ...[
                      SizedBox(height: tokens.spacing.sm),
                      OutlinedButton.icon(
                        onPressed: state.isLoadingNextPage
                            ? null
                            : () => ref
                                  .read(
                                    managedGitHubRepositoriesProvider.notifier,
                                  )
                                  .loadNextPage(),
                        icon: const Icon(Icons.expand_more_rounded),
                        label: const Text('Charger plus de repositories'),
                      ),
                    ],
                  ],
                );
              },
            ),
            if (_error != null) ...[
              SizedBox(height: tokens.spacing.sm),
              Semantics(
                liveRegion: true,
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _connecting ? null : () => Navigator.pop(context),
          child: const Text('Annuler'),
        ),
        FilledButton(
          onPressed: _selectedId == null || _connecting ? null : _connect,
          child: Text(
            _connecting ? 'Connexion…' : 'Ajouter le repository sélectionné',
          ),
        ),
      ],
    );
  }

  Future<void> _connect() async {
    setState(() {
      _connecting = true;
      _error = null;
    });
    try {
      final project = await ref
          .read(managedProjectsProvider.notifier)
          .connectGitHub(candidateId: _selectedId!);
      await ref
          .read(managedProjectSelectionProvider.notifier)
          .select(project.id);
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _connecting = false;
          _error = _message(error);
        });
      }
    }
  }
}

class _ProjectCard extends ConsumerWidget {
  const _ProjectCard({
    required this.project,
    required this.active,
    required this.automatic,
  });
  final ManagedProjectRecord project;
  final bool active;
  final bool automatic;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;
    final tokens = AppTheme.tokensOf(context);
    return Card(
      color: active ? colors.primaryContainer.withValues(alpha: .35) : null,
      child: Padding(
        padding: EdgeInsets.all(tokens.spacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  project.isArchived
                      ? Icons.inventory_2_outlined
                      : Icons.folder_copy_rounded,
                ),
                SizedBox(width: tokens.spacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.name,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(project.repositoryFullName),
                    ],
                  ),
                ),
                if (active)
                  Chip(
                    label: Text(automatic ? 'Actif automatiquement' : 'Actif'),
                  ),
              ],
            ),
            SizedBox(height: tokens.spacing.sm),
            Wrap(
              spacing: tokens.spacing.xs,
              runSpacing: tokens.spacing.xs,
              children: [
                for (final source in project.sourceKinds)
                  Chip(
                    avatar: Icon(
                      source == 'github'
                          ? Icons.hub_outlined
                          : Icons.computer_outlined,
                    ),
                    label: Text(source == 'github' ? 'GitHub' : 'Local'),
                  ),
                if (project.isDefault) const Chip(label: Text('Par défaut')),
                if (project.isArchived) const Chip(label: Text('Archivé')),
                if (project.readiness == ManagedProjectReadiness.degraded)
                  const Chip(label: Text('À vérifier')),
                if (project.readiness == ManagedProjectReadiness.accessLost)
                  const Chip(label: Text('Accès perdu')),
                for (final platform in project.detectedPlatforms)
                  Chip(label: Text(platform)),
              ],
            ),
            SizedBox(height: tokens.spacing.sm),
            Wrap(
              spacing: tokens.spacing.xs,
              runSpacing: tokens.spacing.xs,
              children: [
                _CapabilityChip(
                  label: 'Cockpit',
                  available: project.capabilities.cockpit,
                ),
                _CapabilityChip(
                  label: 'Studio',
                  available: project.capabilities.studio,
                ),
                _CapabilityChip(
                  label: 'Conversations',
                  available: project.capabilities.conversations,
                ),
                _CapabilityChip(
                  label: 'Workspace',
                  available: project.capabilities.workspace,
                ),
              ],
            ),
            SizedBox(height: tokens.spacing.sm),
            Wrap(
              spacing: tokens.spacing.xs,
              runSpacing: tokens.spacing.xs,
              children: [
                if (!active && !project.isArchived)
                  FilledButton.tonal(
                    onPressed: () => ref
                        .read(managedProjectSelectionProvider.notifier)
                        .select(project.id),
                    child: const Text('Activer'),
                  ),
                if (project.capabilities.cockpit && !project.isArchived)
                  OutlinedButton(
                    onPressed: () => context.go(_surfaceLocation(project)),
                    child: const Text('Ouvrir'),
                  ),
                if (project.capabilities.studio && !project.isArchived)
                  OutlinedButton(
                    onPressed: () =>
                        context.go(_surfaceLocation(project, 'studio')),
                    child: const Text('Studio'),
                  ),
                if (project.capabilities.workspace && !project.isArchived)
                  OutlinedButton(
                    onPressed: () =>
                        context.go(_surfaceLocation(project, 'workspace')),
                    child: const Text('Workspace'),
                  ),
                if (!project.isDefault && !project.isArchived)
                  OutlinedButton(
                    onPressed: () => _update(context, ref, isDefault: true),
                    child: const Text('Par défaut'),
                  ),
                OutlinedButton(
                  onPressed: () => _rename(context, ref),
                  child: const Text('Renommer'),
                ),
                OutlinedButton(
                  onPressed: project.isDefault
                      ? null
                      : () => _archive(context, ref),
                  child: Text(project.isArchived ? 'Restaurer' : 'Archiver'),
                ),
                if (project.sourceKinds.contains('github'))
                  TextButton(
                    onPressed:
                        project.isDefault &&
                            !project.sourceKinds.contains('local')
                        ? null
                        : () => _disconnectGitHub(context, ref),
                    child: const Text('D\u00e9connecter GitHub'),
                  ),
                if (!project.builtin && project.sourceKinds.contains('local'))
                  TextButton(
                    onPressed: project.isDefault
                        ? null
                        : () => _disconnect(context, ref),
                    child: const Text('Déconnecter le dossier local'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _rename(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController(text: project.name);
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Renommer le projet'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Nom affiché'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
    if (name == null || name.isEmpty) return;
    if (context.mounted) await _update(context, ref, name: name);
  }

  Future<void> _archive(BuildContext context, WidgetRef ref) async {
    if (!project.isArchived) {
      final confirmed = await _confirm(
        context,
        'Archiver ${project.name} ?',
        'Le projet disparaîtra des sélecteurs, mais restera restaurable.',
      );
      if (!confirmed) return;
    }
    if (context.mounted) {
      await _update(context, ref, isArchived: !project.isArchived);
    }
  }

  Future<void> _disconnect(BuildContext context, WidgetRef ref) async {
    final confirmed = await _confirm(
      context,
      'Déconnecter le dossier local de ${project.name} ?',
      'Le dépôt Git et ses fichiers resteront intacts. Si GitHub est aussi relié, le projet restera disponible.',
    );
    if (!confirmed) return;
    try {
      await ref.read(managedProjectsProvider.notifier).disconnect(project.id);
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(_message(error))));
      }
    }
  }

  Future<void> _disconnectGitHub(BuildContext context, WidgetRef ref) async {
    final confirmed = await _confirm(
      context,
      'D\u00e9connecter GitHub de ${project.name} ?',
      'Seule la source GitHub sera retir\u00e9e. Le dossier local restera connect\u00e9 lorsqu\u2019il existe.',
    );
    if (!confirmed) return;
    try {
      await ref
          .read(managedProjectsProvider.notifier)
          .disconnectGitHub(project.id);
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(_message(error))));
      }
    }
  }

  Future<void> _update(
    BuildContext context,
    WidgetRef ref, {
    String? name,
    bool? isDefault,
    bool? isArchived,
  }) async {
    try {
      await ref
          .read(managedProjectsProvider.notifier)
          .updateProject(
            projectId: project.id,
            name: name,
            isDefault: isDefault,
            isArchived: isArchived,
          );
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(_message(error))));
      }
    }
  }
}

class _CapabilityChip extends StatelessWidget {
  const _CapabilityChip({required this.label, required this.available});
  final String label;
  final bool available;

  @override
  Widget build(BuildContext context) => Chip(
    avatar: Icon(
      available ? Icons.check_circle_outline : Icons.remove_circle_outline,
    ),
    label: Text('$label ${available ? 'disponible' : 'indisponible'}'),
  );
}

String _surfaceLocation(ManagedProjectRecord project, [String? surface]) =>
    '/project/${Uri.encodeComponent(project.name)}${surface == null ? '' : '/$surface'}'
    '?runnerProjectId=${Uri.encodeComponent(project.id)}';

String? _defaultProjectId(List<ManagedProjectRecord> projects) {
  for (final project in projects) {
    if (project.isDefault && !project.isArchived) return project.id;
  }
  return null;
}

Future<bool> _confirm(BuildContext context, String title, String body) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    ) ??
    false;

String _message(Object error) => error is ManagedRunnerException
    ? error.message
    : 'Impossible de terminer cette action.';

class GitHubSetupReturnScreen extends ConsumerStatefulWidget {
  const GitHubSetupReturnScreen({
    required this.installationId,
    required this.state,
    super.key,
  });

  final int? installationId;
  final String? state;

  @override
  ConsumerState<GitHubSetupReturnScreen> createState() =>
      _GitHubSetupReturnScreenState();
}

class _GitHubSetupReturnScreenState
    extends ConsumerState<GitHubSetupReturnScreen> {
  String? _error;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _complete());
  }

  Future<void> _complete() async {
    final installationId = widget.installationId;
    final state = widget.state;
    if (installationId == null || state == null || state.isEmpty) {
      setState(
        () => _error = 'Le retour GitHub est incomplet. Relancez la connexion.',
      );
      return;
    }
    try {
      await ref
          .read(managedGitHubSetupActionsProvider)
          .complete(installationId: installationId, state: state);
      if (mounted) setState(() => _completed = true);
    } catch (error) {
      if (mounted) setState(() => _error = _message(error));
    }
  }

  @override
  Widget build(BuildContext context) => ShipGlowsScaffold(
    title: 'Connexion GitHub',
    body: Center(
      child: _error != null
          ? _ErrorState(message: _error!, onRetry: _complete)
          : _completed
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle_outline_rounded),
                const Text('GitHub App est connect\u00e9e.'),
                FilledButton(
                  onPressed: () => context.go('/projects'),
                  child: const Text('Choisir un repository'),
                ),
              ],
            )
          : const CircularProgressIndicator(),
    ),
  );
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = AppTheme.tokensOf(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(message),
          SizedBox(height: tokens.spacing.sm),
          OutlinedButton(onPressed: onRetry, child: const Text('Réessayer')),
        ],
      ),
    );
  }
}
