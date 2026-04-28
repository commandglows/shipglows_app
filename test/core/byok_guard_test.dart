import 'package:flutter_test/flutter_test.dart';

import 'package:contentflow_app/core/openrouter_guard.dart';
import 'package:contentflow_app/data/services/api_service.dart';

void main() {
  group('requiresOpenRouterCredential', () {
    test('returns true for ai_runtime openrouter missing envelope', () {
      const error = ApiException(
        ApiErrorType.server,
        'runtime error',
        statusCode: 409,
        responseBody:
            '{"detail":{"code":"ai_runtime_user_credential_missing","kind":"ai_runtime","provider":"openrouter"}}',
      );

      expect(requiresOpenRouterCredential(error), isTrue);
    });

    test('returns false for ai_runtime with non-openrouter provider', () {
      const error = ApiException(
        ApiErrorType.server,
        'runtime error',
        statusCode: 409,
        responseBody:
            '{"detail":{"code":"ai_runtime_user_credential_missing","kind":"ai_runtime","provider":"exa"}}',
      );

      expect(requiresOpenRouterCredential(error), isFalse);
    });

    test(
      'returns false for dependency/business envelopes and non-api errors',
      () {
        const serverError = ApiException(
          ApiErrorType.server,
          'dependency error',
          statusCode: 503,
          responseBody:
              '{"detail":{"code":"newsletter_email_backend_missing","kind":"dependency"}}',
        );

        expect(requiresOpenRouterCredential(serverError), isFalse);
        expect(requiresOpenRouterCredential(Exception('boom')), isFalse);
      },
    );
  });
}
