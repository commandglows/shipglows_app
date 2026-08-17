import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shipglows_app/presentation/theme/app_theme.dart';
import 'package:shipglows_app/shipglows/presentation/widgets/safe_error_view.dart';

void main() {
  test('error report rejects non-identifier diagnostic input', () {
    final report = SafeDiagnosticReport.forError(
      code: 'Bearer secret@example.com',
      scope: 'https://private.example/C:/Users/Shadow/repo',
      generatedAt: DateTime.utc(2026, 8, 17, 12),
    );

    expect(report, contains('Code: unknown'));
    expect(report, contains('Scope: unknown'));
    for (final forbidden in [
      'Bearer',
      'secret@example.com',
      'https://',
      'C:/Users',
      'Shadow',
      'token',
      'credential',
      'Exception',
    ]) {
      expect(report, isNot(contains(forbidden)));
    }
  });

  test('summary is bounded and includes only stable codes and levels', () {
    final report = SafeDiagnosticReport.forSummary(
      diagnostics: List.generate(
        200,
        (index) => SafeDiagnosticSummary(
          code: index == 0 ? 'https://private.example/repo' : 'parse_error',
          severity: SafeDiagnosticSeverity.error,
        ),
      ),
      sourceGeneratedAt: DateTime.utc(2026, 8, 17, 11),
      generatedAt: DateTime.utc(2026, 8, 17, 12),
    );

    expect(report, contains('Included diagnostics: 50'));
    expect(report, contains('error: unknown'));
    expect(report, isNot(contains('https://')));
    expect(report.length, lessThan(6000));
  });

  testWidgets('safe error offers a working retry without raw exception input', (
    tester,
  ) async {
    var retries = 0;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.buildForTesting(Brightness.light),
        home: Scaffold(
          body: SafeErrorView(
            code: 'dashboard.load_failed',
            scope: 'diagnostics.screen',
            message: 'Diagnostics are temporarily unavailable.',
            onRetry: () => retries += 1,
          ),
        ),
      ),
    );

    expect(
      find.text('Diagnostics are temporarily unavailable.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Retry'));
    expect(retries, 1);
  });
}
