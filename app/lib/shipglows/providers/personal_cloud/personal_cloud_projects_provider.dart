import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/managed_runner_api.dart';
import '../../personal_cloud/personal_cloud_models.dart';
import '../managed_runner_provider.dart';

final personalCloudProjectsProvider =
    FutureProvider<List<PersonalCloudProject>>((ref) async {
      final client = ref.watch(managedRunnerApiProvider);
      if (client is! ManagedRunnerApi) return const [];
      return client.loadPersonalCloudProjects();
    });
