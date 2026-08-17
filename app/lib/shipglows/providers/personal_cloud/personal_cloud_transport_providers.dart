import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/managed_runner_api.dart';
import '../../personal_cloud/personal_cloud_transports.dart';
import '../../personal_cloud/managed_personal_cloud_transports.dart';
import '../managed_runner_provider.dart';

final projectPreviewTransportProvider = Provider<ProjectPreviewTransport?>((
  ref,
) {
  final api = ref.watch(managedRunnerApiProvider);
  return api is ManagedRunnerApi ? ManagedProjectPreviewTransport(api) : null;
});

final remoteWorkspaceTransportProvider = Provider<RemoteWorkspaceTransport?>((
  ref,
) {
  final api = ref.watch(managedRunnerApiProvider);
  return api is ManagedRunnerApi ? ManagedRemoteWorkspaceTransport(api) : null;
});
