String? diagnosticExcerptForLine(
  String text,
  int line, {
  int radius = 1,
  int maxLineLength = 240,
}) {
  if (line < 1) {
    return null;
  }

  final lines = text.split('\n');
  if (line > lines.length) {
    return null;
  }

  final start = (line - radius - 1).clamp(0, lines.length - 1).toInt();
  final end = (line + radius - 1).clamp(0, lines.length - 1).toInt();
  return [
    for (var index = start; index <= end; index += 1)
      '${index + 1}: ${truncateDiagnosticValue(lines[index], maxLineLength)}',
  ].join('\n');
}

int diagnosticLineForOffset(String text, int offset) {
  final safeOffset = offset.clamp(0, text.length).toInt();
  return '\n'.allMatches(text.substring(0, safeOffset)).length + 1;
}

Map<String, String> diagnosticDetails(Map<String, Object?> values) {
  final details = <String, String>{};
  for (final entry in values.entries) {
    final value = entry.value;
    if (value == null) {
      continue;
    }
    final normalized = truncateDiagnosticValue('$value'.trim(), 500);
    if (normalized.isNotEmpty) {
      details[entry.key] = normalized;
    }
  }
  return details;
}

String diagnosticCause(Object error) {
  return truncateDiagnosticValue(
    error
        .toString()
        .replaceFirst(RegExp(r'^(Exception|FormatException):\s*'), ''),
    1000,
  );
}

String truncateDiagnosticValue(String value, int maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return '${value.substring(0, maxLength - 3)}...';
}
