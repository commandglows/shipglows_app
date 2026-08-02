import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/project.dart';
import '../../providers/providers.dart' show availableProjectsProvider;

final managedRunnerProjectIdProvider = Provider.family<String?, String>(
  (ref, displayName) => resolveManagedRunnerProjectId(
    displayName,
    ref.watch(availableProjectsProvider),
  ),
);

String? resolveManagedRunnerProjectId(
  String displayName,
  Iterable<Project> projects,
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
