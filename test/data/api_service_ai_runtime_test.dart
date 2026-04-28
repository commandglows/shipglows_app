import 'package:contentflow_app/data/models/ai_runtime.dart';
import 'package:contentflow_app/data/models/app_settings.dart';
import 'package:contentflow_app/data/services/api_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AIRuntimeSettings model', () {
    test('parses runtime settings payload', () {
      final payload = {
        'mode': 'platform',
        'availableModes': [
          {'mode': 'byok', 'enabled': true},
          {
            'mode': 'platform',
            'enabled': false,
            'reasonCode': 'platform_not_entitled',
          },
        ],
        'providers': [
          {
            'provider': 'openrouter',
            'kind': 'llm',
            'usedBy': ['newsletter.generate'],
            'byok': {'configured': true, 'validationStatus': 'valid'},
            'platform': {'configured': true, 'available': false},
          },
        ],
      };

      final settings = AIRuntimeSettings.fromJson(payload);

      expect(settings.mode, 'platform');
      expect(settings.availableModes.length, 2);
      expect(
        settings.modeAvailability('platform')?.reasonCode,
        'platform_not_entitled',
      );
      expect(settings.providers.single.provider, 'openrouter');
      expect(settings.providers.single.byok.configured, isTrue);
      expect(settings.providers.single.platform.available, isFalse);
    });
  });

  group('ApiService AI runtime endpoints', () {
    test('returns fallback runtime payload in demo mode', () async {
      final api = ApiService(
        baseUrl: 'http://localhost:8000',
        allowDemoData: true,
      );

      final runtime = await api.fetchAiRuntimeSettings();
      final providerStatus = await api.fetchProviderCredentialStatus('exa');

      expect(runtime.mode, 'byok');
      expect(
        runtime.providers.map((entry) => entry.provider).toList(),
        containsAll(['openrouter', 'exa', 'firecrawl']),
      );
      expect(providerStatus.provider, 'exa');
      expect(providerStatus.configured, isFalse);
    });
  });

  group('AppSettings AI runtime', () {
    test('defaults to byok when aiRuntime payload is missing', () {
      final settings = AppSettings.fromJson({
        'id': 's1',
        'userId': 'u1',
        'theme': 'system',
        'emailNotifications': true,
      });

      expect(settings.aiRuntimeMode, 'byok');
    });

    test('reads robotSettings.aiRuntime.mode', () {
      final settings = AppSettings.fromJson({
        'id': 's1',
        'userId': 'u1',
        'theme': 'system',
        'emailNotifications': true,
        'robotSettings': {
          'aiRuntime': {'mode': 'platform'},
        },
      });

      expect(settings.aiRuntimeMode, 'platform');
    });
  });
}
