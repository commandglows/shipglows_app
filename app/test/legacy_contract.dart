/// Legacy migration contract for tests.
///
/// These symbols are intentionally kept in a dedicated export surface so
/// legacy test suites can pin dependencies explicitly while migration
/// boundaries evolve.
library;

export 'package:shipglows_app/providers/providers.dart';
export 'package:shipglows_app/presentation/screens/feed/feed_screen.dart';
export 'package:shipglows_app/presentation/screens/projects/projects_screen.dart';
export 'package:shipglows_app/presentation/screens/settings/integrations_screen.dart';
export 'package:shipglows_app/presentation/widgets/project_picker_action.dart';
