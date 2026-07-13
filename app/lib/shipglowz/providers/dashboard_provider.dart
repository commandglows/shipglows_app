import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/shipglowz_sources/parsers/shipglowz_sources_parser.dart';
import '../../data/shipglowz_sources/source_file_reader.dart';
import '../../data/shipglowz_sources/source_path_policy.dart';
import '../../domain/project_health/project_health_builder.dart';
import '../../domain/project_health/project_health_models.dart';

final sourcePathPolicyProvider = Provider<SourcePathPolicy>(
  (ref) => SourcePathPolicy.defaultPolicy(),
);

final sourceFileReaderProvider = Provider<SourceFileReader>(
  (ref) => SourceFileReader(pathPolicy: ref.watch(sourcePathPolicyProvider)),
);

final shipglowzSourcesParserProvider = Provider<ShipGlowzSourcesParser>(
  (ref) => ShipGlowzSourcesParser(),
);

final projectHealthBuilderProvider = Provider<ProjectHealthBuilder>(
  (ref) => ProjectHealthBuilder(),
);

final dashboardProvider =
    AsyncNotifierProvider<DashboardNotifier, DashboardModel>(
      DashboardNotifier.new,
    );

class DashboardNotifier extends AsyncNotifier<DashboardModel> {
  @override
  Future<DashboardModel> build() => _load();

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_load);
  }

  Future<DashboardModel> _load() async {
    final policy = ref.read(sourcePathPolicyProvider);
    final reader = ref.read(sourceFileReaderProvider);
    final parser = ref.read(shipglowzSourcesParserProvider);
    final builder = ref.read(projectHealthBuilderProvider);

    final snapshot = await reader.load();
    final parsed = parser.parse(snapshot);
    return builder.build(
      parsedData: parsed,
      allowlistedRoots: policy.allowedRoots,
      generatedAt: snapshot.loadedAt,
    );
  }
}
