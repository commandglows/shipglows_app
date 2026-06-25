import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipflow_app/data/shipflow_sources/source_file_reader.dart';
import 'package:shipflow_app/data/shipflow_sources/source_models.dart';
import 'package:shipflow_app/data/shipflow_sources/source_path_policy.dart';

void main() {
  setUp(() {
    debugDefaultTargetPlatformOverride = TargetPlatform.linux;
  });

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
  });

  group('SourceFileReader', () {
    test(
      'loads core sources and project-local docs from PROJECTS.md',
      () async {
        final root = await Directory.systemTemp.createTemp(
          'shipflow_reader_root_',
        );
        addTearDown(() => root.delete(recursive: true));

        final shipflowData = Directory('${root.path}/shipflow_data')
          ..createSync(recursive: true);
        final shipflow = Directory('${root.path}/shipflow')
          ..createSync(recursive: true);
        final specsDir = Directory(
          '${shipflow.path}/shipflow_data/workflow/specs',
        )..createSync(recursive: true);
        final projectDir = Directory('${root.path}/projects/demo app')
          ..createSync(recursive: true);
        final projectWorkflowDir = Directory(
          '${projectDir.path}/shipflow_data/workflow',
        )..createSync(recursive: true);

        File('${shipflowData.path}/PROJECTS.md').writeAsStringSync('''
# Projects Registry
| Name | Path | Stack |
|------|------|-------|
| demo-app | ${projectDir.path} | Flutter |
''');
        File(
          '${shipflowData.path}/AUDIT_LOG.md',
        ).writeAsStringSync('# Audit Log\n');
        File('${shipflowData.path}/TASKS.md').writeAsStringSync('# Tasks\n');
        File(
          '${shipflowData.path}/OPERATIONS_LOG.md',
        ).writeAsStringSync('# Ops\n');
        File(
          '${shipflowData.path}/DEPENDENCY_LOG.md',
        ).writeAsStringSync('# Deps\n');
        File('${specsDir.path}/demo.md').writeAsStringSync('# Spec: Demo\n');
        File(
          '${projectWorkflowDir.path}/TASKS.md',
        ).writeAsStringSync('# Local Tasks\n');

        final policy = SourcePathPolicy(
          allowedRoots: [root.path],
          maxFileBytes: 1024 * 1024,
          maxTotalBytes: 5 * 1024 * 1024,
        );
        final reader = SourceFileReader(
          pathPolicy: policy,
          shipflowDataRoot: shipflowData.path,
          shipflowRoot: shipflow.path,
        );

        final snapshot = await reader.load();

        expect(
          snapshot.documents.keys.any((path) => path.endsWith('/PROJECTS.md')),
          isTrue,
        );
        expect(
          snapshot.documents.keys.any((path) => path.endsWith('/demo.md')),
          isTrue,
        );
        expect(
          snapshot.documents.keys.any(
            (path) =>
                path.endsWith('/demo app/shipflow_data/workflow/TASKS.md'),
          ),
          isTrue,
        );
        expect(
          snapshot.diagnostics
              .where((diag) => diag.code == DiagnosticCode.sourceGap)
              .isNotEmpty,
          isTrue,
        );
        final missingSource = snapshot.diagnostics.firstWhere(
          (diag) => diag.code == DiagnosticCode.sourceGap,
        );
        expect(missingSource.details['resolvedPath'], isNotEmpty);
        expect(missingSource.suggestedCommand, isNotNull);
      },
    );
  });
}
