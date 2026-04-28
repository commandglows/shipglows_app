import 'package:flutter_test/flutter_test.dart';

import 'package:contentflow_app/core/openrouter_guard.dart';
import 'package:contentflow_app/data/services/api_service.dart';

void main() {
  group('AI runtime guard parsing', () {
    test(
      'does not classify business_conflict as OpenRouter credential error',
      () {
        const error = ApiException(
          ApiErrorType.server,
          'duplicate',
          statusCode: 409,
          responseBody:
              '{"detail":{"code":"content_duplicate_conflict","kind":"business_conflict"}}',
        );

        expect(requiresOpenRouterCredential(error), isFalse);
      },
    );

    test(
      'does not classify dependency errors as OpenRouter credential error',
      () {
        const error = ApiException(
          ApiErrorType.server,
          'dependency',
          statusCode: 503,
          responseBody:
              '{"detail":{"code":"newsletter_email_backend_missing","kind":"dependency"}}',
        );

        expect(requiresOpenRouterCredential(error), isFalse);
      },
    );

    test('keeps legacy fallback for old 409 OpenRouter messages', () {
      const error = ApiException(
        ApiErrorType.server,
        'OpenRouter credential missing.',
        statusCode: 409,
      );

      expect(requiresOpenRouterCredential(error), isTrue);
    });
  });
}
