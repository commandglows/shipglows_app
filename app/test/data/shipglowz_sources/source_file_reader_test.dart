import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglowz_app/data/shipglowz_sources/source_file_reader.dart';
import 'package:shipglowz_app/data/shipglowz_sources/source_models.dart';
import 'package:shipglowz_app/data/shipglowz_sources/source_path_policy.dart';

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
          'shipglowz_reader_root_',
        );
        addTearDown(() => root.delete(recursive: true));

        final shipglowzData = Directory('${root.path}/shipglowz_data')
          ..createSync(recursive: true);
        final shipglowz = Directory('${root.path}/shipglowz')
          ..createSync(recursive: true);
        final specsDir = Directory(
          '${shipglowz.path}/shipglowz_data/workflow/specs',
        )..createSync(recursive: true);
        final projectDir = Directory('${root.path}/projects/demo app')
          ..createSync(recursive: true);
        final projectWorkflowDir = Directory(
          '${projectDir.path}/shipglowz_data/workflow',
        )..createSync(recursive: true);

        File('${shipglowzData.path}/PROJECTS.md').writeAsStringSync('''
# Projects Registry
| Name | Path | Stack |
|------|------|-------|
| demo-app | ${projectDir.path} | Flutter |
''');
        File(
          '${shipglowzData.path}/AUDIT_LOG.md',
        ).writeAsStringSync('# Audit Log\n');
        File('${shipglowzData.path}/TASKS.md').writeAsStringSync('# Tasks\n');
        File(
          '${shipglowzData.path}/OPERATIONS_LOG.md',
        ).writeAsStringSync('# Ops\n');
        File(
          '${shipglowzData.path}/DEPENDENCY_LOG.md',
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
          shipglowzDataRoot: shipglowzData.path,
          shipglowzRoot: shipglowz.path,
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
                path.endsWith('/demo app/shipglowz_data/workflow/TASKS.md'),
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
