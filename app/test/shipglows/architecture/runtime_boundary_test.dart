import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('the active ShipGlows runtime cannot import dormant runtime roots', () {
    final activeFiles = <File>[
      File('lib/main.dart'),
      ...Directory('lib/shipglows')
          .listSync(recursive: true)
          .whereType<File>()
          .where((file) => file.path.endsWith('.dart')),
    ];

    const forbiddenImports = <String>[
      'providers/providers.dart',
      'data/services/api_service.dart',
      'package:shipglows_app/router.dart',
    ];

    for (final file in activeFiles) {
      final source = file.readAsStringSync();
      for (final forbiddenImport in forbiddenImports) {
        expect(
          source,
          isNot(contains(forbiddenImport)),
          reason: '${file.path} imports dormant runtime code: $forbiddenImport',
        );
      }
    }
  });

  test('the removed alternate route graph stays absent', () {
    expect(File('lib/router.dart').existsSync(), isFalse);
  });
}
