import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/managed_runner_api.dart';
import 'managed_projects_provider.dart';

final managedRunnerProjectIdProvider = Provider.family<String?, String>(
  (ref, displayName) => resolveManagedRunnerProjectId(
    displayName,
    ref.watch(managedProjectsProvider).value ?? const [],
  ),
);

String? resolveManagedRunnerProjectId(
  String displayName,
  Iterable<ManagedProjectRecord> projects,
) {
  final key = _normalize(displayName);
  final matches = projects.where((project) => _normalize(project.name) == key);
  final match = matches.length == 1 ? matches.single : null;
  return match?.id.trim().isEmpty == false ? match!.id : null;
}

String _normalize(String value) => value
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(RegExp(r'\s+'), '-');
