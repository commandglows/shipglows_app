import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/data/shipglows_sources/parsers/specs_parser.dart';

void main() {
  group('SpecsParser', () {
    test('emits diagnostics for summary conflicts with frontmatter', () {
      const path = 'shipglows_data/workflow/specs/sample.md';
      const markdown = '''
---
status: ready
---
# Spec: Sample
🟠 [shipglows_app] spec: Sample | status: draft | path: shipglows_data/workflow/specs/other.md | next: /sf-start Sample
## Title
Sample
''';

      final output = SpecsParser().parseMany(specFiles: {path: markdown});
      expect(output.records.length, 1);
      expect(output.records.single.status, 'ready');
      expect(
        output.diagnostics.where((d) => d.message.contains('status mismatch')).isNotEmpty,
        isTrue,
      );
      expect(
        output.diagnostics.where((d) => d.message.contains('path mismatch')).isNotEmpty,
        isTrue,
      );
    });
  });
}
