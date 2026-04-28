String? normalizeOptionalText(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return normalized;
}

bool isValidGithubRepositoryUrl(String value) {
  final normalized = normalizeOptionalText(value);
  if (normalized == null) {
    return false;
  }

  if (!isValidProjectSourceUrl(normalized)) {
    return false;
  }

  final uri = Uri.tryParse(normalized);
  if (uri == null) {
    return false;
  }

  final host = uri.host.toLowerCase();
  if (host != 'github.com' && host != 'www.github.com') {
    return false;
  }

  final pathSegments = uri.pathSegments
      .where((segment) => segment.trim().isNotEmpty)
      .toList();
  return pathSegments.length >= 2;
}

bool isValidProjectSourceUrl(String value) {
  final normalized = normalizeOptionalText(value);
  if (normalized == null) {
    return false;
  }

  final uri = Uri.tryParse(normalized);
  if (uri == null ||
      !uri.hasScheme ||
      (uri.scheme != 'http' && uri.scheme != 'https') ||
      uri.host.isEmpty) {
    return false;
  }
  return true;
}

String? extractGithubRepositoryName(String value) {
  final normalized = normalizeOptionalText(value);
  if (normalized == null) {
    return null;
  }

  final uri = Uri.tryParse(normalized);
  if (uri == null) {
    return null;
  }

  final host = uri.host.toLowerCase();
  if (host != 'github.com' && host != 'www.github.com') {
    return null;
  }

  final pathSegments = uri.pathSegments
      .where((segment) => segment.trim().isNotEmpty)
      .toList();
  if (pathSegments.length < 2) {
    return null;
  }

  final repoName = Uri.decodeComponent(
    pathSegments[1],
  ).replaceFirst(RegExp(r'\.git$'), '').trim();
  if (repoName.isEmpty) {
    return null;
  }
  return repoName;
}

String extractApiDetailMessage(Object? detail) {
  if (detail is String && detail.trim().isNotEmpty) {
    return detail.trim();
  }

  if (detail is List) {
    final messages = detail
        .map(_formatApiDetailEntry)
        .whereType<String>()
        .where((message) => message.isNotEmpty)
        .toList();
    if (messages.isNotEmpty) {
      return messages.join('\n');
    }
  }

  return '';
}

String? _formatApiDetailEntry(Object? entry) {
  if (entry is String && entry.trim().isNotEmpty) {
    return entry.trim();
  }

  if (entry is! Map) {
    return null;
  }

  final rawMessage = entry['msg'];
  if (rawMessage is! String || rawMessage.trim().isEmpty) {
    return null;
  }

  final location = _formatApiDetailLocation(entry['loc']);
  if (location.isEmpty) {
    return rawMessage.trim();
  }

  return '$location: ${rawMessage.trim()}';
}

String _formatApiDetailLocation(Object? location) {
  if (location is! List) {
    return '';
  }

  final segments = location
      .whereType<Object>()
      .map((segment) => segment.toString().trim())
      .where((segment) => segment.isNotEmpty)
      .where(
        (segment) =>
            segment != 'body' && segment != 'query' && segment != 'path',
      )
      .map((segment) => segment.replaceAll('_', ' '))
      .toList();

  return segments.join('.');
}
