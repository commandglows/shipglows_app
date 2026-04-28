import 'dart:convert';

import '../data/services/api_service.dart';

Map<String, dynamic>? _extractErrorEnvelope(Object error) {
  if (error is! ApiException) {
    return null;
  }
  final raw = error.responseBody;
  if (raw == null || raw.isEmpty) {
    return null;
  }
  try {
    final decoded = jsonDecode(raw);
    if (decoded is Map<String, dynamic>) {
      final detail = decoded['detail'];
      if (detail is Map<String, dynamic>) {
        return detail;
      }
      return decoded;
    }
  } catch (_) {
    // ignore malformed payloads and fall back to legacy heuristics
  }
  return null;
}

bool _looksLikeOpenRouterLegacyError(ApiException error) {
  if (error.statusCode != 409) {
    return false;
  }
  final loweredMessage = error.message.toLowerCase();
  final loweredBody = (error.responseBody ?? '').toLowerCase();
  return loweredMessage.contains('openrouter') ||
      loweredBody.contains('openrouter');
}

bool requiresOpenRouterCredential(Object error) {
  if (error is! ApiException) {
    return false;
  }

  final envelope = _extractErrorEnvelope(error);
  if (envelope != null) {
    final kind = envelope['kind']?.toString();
    final code = envelope['code']?.toString();
    final provider = envelope['provider']?.toString();
    if (kind == 'ai_runtime' &&
        provider == 'openrouter' &&
        (code == 'ai_runtime_user_credential_missing' ||
            code == 'ai_runtime_user_credential_invalid')) {
      return true;
    }
    return false;
  }

  return _looksLikeOpenRouterLegacyError(error);
}
