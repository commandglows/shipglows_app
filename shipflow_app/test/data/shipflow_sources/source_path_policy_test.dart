import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipflow_app/data/shipflow_sources/source_models.dart';
import 'package:shipflow_app/data/shipflow_sources/source_path_policy.dart';

void main() {
  setUp(() {
    debugDefaultTargetPlatformOverride = TargetPlatform.linux;
  });

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
  });

  group('SourcePathPolicy', () {
    test('allows paths inside allowlisted root', () async {
      final root = await Directory.systemTemp.createTemp(
        'shipflow_policy_root_',
      );
      addTearDown(() => root.delete(recursive: true));
      final file = File('${root.path}/data/file.md')
        ..createSync(recursive: true);
      file.writeAsStringSync('ok');

      final policy = SourcePathPolicy(allowedRoots: [root.path]);
      final result = policy.checkPath(file.path);

      expect(result.allowed, isTrue);
      expect(result.diagnostic, isNull);
    });

    test('denies paths outside allowlisted roots', () async {
      final root = await Directory.systemTemp.createTemp(
        'shipflow_policy_root_',
      );
      final outside = await Directory.systemTemp.createTemp(
        'shipflow_policy_outside_',
      );
      addTearDown(() async {
        await root.delete(recursive: true);
        await outside.delete(recursive: true);
      });
      final file = File('${outside.path}/secret.md')
        ..createSync(recursive: true);
      file.writeAsStringSync('nope');

      final policy = SourcePathPolicy(allowedRoots: [root.path]);
      final result = policy.checkPath(file.path);

      expect(result.allowed, isFalse);
      expect(result.diagnostic?.code, DiagnosticCode.pathDenied);
    });

    test('redacts sensitive segments', () {
      final policy = SourcePathPolicy(allowedRoots: const ['/tmp']);
      final redacted = policy.redactPath(
        '/home/claude/project/.env/secrets/token.txt',
      );
      expect(redacted.contains('...'), isTrue);
    });
  });
}
