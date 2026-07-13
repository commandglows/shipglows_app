import '../source_diagnostic_helpers.dart';
import '../source_models.dart';
import 'parsed_models.dart';

class OperationalRecordParser {
  ParserOutput<OperationalRecord> parse({
    required String markdown,
    required String source,
  }) {
    final diagnostics = <SourceDiagnostic>[];
    final records = <OperationalRecord>[];
    final lines = markdown.split('\n');

    for (var index = 0; index < lines.length; index += 1) {
      final rawLine = lines[index];
      final trimmed = rawLine.trim();
      if (trimmed.isEmpty) {
        continue;
      }
      if (!_startsLikeOperationalRecord(trimmed)) {
        continue;
      }
      final parsed = _parseLine(
        line: trimmed,
        source: source,
        lineNumber: index + 1,
        fullMarkdown: markdown,
      );
      if (parsed.record != null) {
        records.add(parsed.record!);
      }
      diagnostics.addAll(parsed.diagnostics);
    }

    return ParserOutput(records: records, diagnostics: diagnostics);
  }

  bool _startsLikeOperationalRecord(String line) {
    return line.startsWith('🔴 ') ||
        line.startsWith('🟠 ') ||
        line.startsWith('🟡 ') ||
        line.startsWith('🟢 ') ||
        line.startsWith('✅ ');
  }

  _ParseLineResult _parseLine({
    required String line,
    required String source,
    required int lineNumber,
    required String fullMarkdown,
  }) {
    final diagnostics = <SourceDiagnostic>[];
    final traffic = _readTraffic(line);
    if (traffic == null) {
      return _ParseLineResult(
        diagnostics: [
          _diagnostic(
            source: source,
            line: lineNumber,
            markdown: fullMarkdown,
            message: 'Unsupported traffic marker in operational record.',
          ),
        ],
      );
    }
    final normalizedTraffic = traffic == '✅' ? '🟢' : traffic;
    if (!_isSupportedTraffic(traffic)) {
      diagnostics.add(
        _diagnostic(
          source: source,
          line: lineNumber,
          markdown: fullMarkdown,
          message: 'Unsupported traffic marker in operational record.',
          details: {'traffic': traffic},
        ),
      );
      return _ParseLineResult(diagnostics: diagnostics);
    }

    final projectStart = line.indexOf('[');
    final projectEnd = line.indexOf(']');
    final expectedProjectStart = traffic.length + 1;
    if (projectStart != expectedProjectStart || projectEnd <= projectStart + 1) {
      diagnostics.add(
        _diagnostic(
          source: source,
          line: lineNumber,
          markdown: fullMarkdown,
          message: 'Missing [project] token in operational record.',
        ),
      );
      return _ParseLineResult(diagnostics: diagnostics);
    }
    final project = line.substring(projectStart + 1, projectEnd).trim();
    if (project.contains('[') || project.contains(']') || project.isEmpty) {
      diagnostics.add(
        _diagnostic(
          source: source,
          line: lineNumber,
          markdown: fullMarkdown,
          message: 'Invalid project token in operational record.',
          details: {'project': project},
        ),
      );
      return _ParseLineResult(diagnostics: diagnostics);
    }

    final afterProject = line.substring(projectEnd + 1);
    if (!afterProject.startsWith(' ')) {
      diagnostics.add(
        _diagnostic(
          source: source,
          line: lineNumber,
          markdown: fullMarkdown,
          message: 'Malformed spacing after [project] token.',
        ),
      );
      return _ParseLineResult(diagnostics: diagnostics);
    }

    final kindAndRest = afterProject.trimLeft();
    final kindSplit = kindAndRest.indexOf(': ');
    if (kindSplit <= 0) {
      diagnostics.add(
        _diagnostic(
          source: source,
          line: lineNumber,
          markdown: fullMarkdown,
          message: 'Malformed operational record. Expected "<kind>: <title>".',
        ),
      );
      return _ParseLineResult(diagnostics: diagnostics);
    }
    final kind = kindAndRest.substring(0, kindSplit).trim();
    if (kind != 'task' && kind != 'audit' && kind != 'spec') {
      diagnostics.add(
        _diagnostic(
          source: source,
          line: lineNumber,
          markdown: fullMarkdown,
          message: 'Unknown operational record kind.',
          details: {'kind': kind},
        ),
      );
      return _ParseLineResult(diagnostics: diagnostics);
    }

    final rest = kindAndRest.substring(kindSplit + 2);
    final parts = _splitEscapedFields(rest);
    if (parts.isEmpty || parts.first.trim().isEmpty) {
      diagnostics.add(
        _diagnostic(
          source: source,
          line: lineNumber,
          markdown: fullMarkdown,
          message: 'Missing title in operational record.',
        ),
      );
      return _ParseLineResult(diagnostics: diagnostics);
    }

    final title = _unescape(parts.first);
    final fields = <String, String>{};
    for (var i = 1; i < parts.length; i += 1) {
      final field = parts[i];
      final pivot = field.indexOf(': ');
      if (pivot <= 0) {
        diagnostics.add(
          _diagnostic(
            source: source,
            line: lineNumber,
            markdown: fullMarkdown,
            message: 'Malformed field in operational record.',
            details: {'field': truncateDiagnosticValue(field, 120)},
          ),
        );
        return _ParseLineResult(diagnostics: diagnostics);
      }
      final key = field.substring(0, pivot).trim();
      final value = _unescape(field.substring(pivot + 2));
      if (key.isEmpty) {
        diagnostics.add(
          _diagnostic(
            source: source,
            line: lineNumber,
            markdown: fullMarkdown,
            message: 'Malformed field key in operational record.',
          ),
        );
        return _ParseLineResult(diagnostics: diagnostics);
      }
      fields[key] = value;
    }

    final dedupeKey = _dedupeKey(
      project: project,
      title: title,
      kind: kind,
      fields: fields,
    );

    return _ParseLineResult(
      record: OperationalRecord(
        traffic: normalizedTraffic,
        project: project,
        kind: kind,
        title: title,
        fields: fields,
        dedupeKey: dedupeKey,
        source: source,
        line: lineNumber,
        rawLine: line,
      ),
      diagnostics: diagnostics,
    );
  }

  String? _readTraffic(String line) {
    for (final marker in const ['🔴', '🟠', '🟡', '🟢', '✅']) {
      if (line.startsWith('$marker ')) {
        return marker;
      }
    }
    return null;
  }

  bool _isSupportedTraffic(String traffic) {
    return traffic == '🔴' ||
        traffic == '🟠' ||
        traffic == '🟡' ||
        traffic == '🟢' ||
        traffic == '✅';
  }

  List<String> _splitEscapedFields(String text) {
    final parts = <String>[];
    final current = StringBuffer();
    for (var i = 0; i < text.length; i += 1) {
      final char = text[i];
      if (char == r'\') {
        current.write(char);
        if (i + 1 < text.length) {
          i += 1;
          current.write(text[i]);
        }
        continue;
      }
      if (char == '|' &&
          i > 0 &&
          i + 1 < text.length &&
          text[i - 1] == ' ' &&
          text[i + 1] == ' ') {
        final part = current.toString();
        if (part.endsWith(' ')) {
          parts.add(part.substring(0, part.length - 1));
        } else {
          parts.add(part);
        }
        current.clear();
        i += 1;
        continue;
      }
      current.write(char);
    }
    parts.add(current.toString());
    return parts;
  }

  String _dedupeKey({
    required String project,
    required String title,
    required String kind,
    required Map<String, String> fields,
  }) {
    final projectKey = _normalize(project);
    if (projectKey.isEmpty || _normalize(title).isEmpty) {
      return '';
    }

    final id = _normalize(fields['id'] ?? '');
    if (kind == 'task') {
      if (id.isNotEmpty) {
        return 'task|$projectKey|id|$id';
      }
      final area = _normalize(fields['area'] ?? '');
      return 'task|$projectKey|title|${_normalize(title)}|area|$area';
    }

    if (kind == 'audit') {
      final date = _normalize(fields['date'] ?? '');
      final overall = _normalize(fields['overall'] ?? '');
      final scope = _normalize(fields['scope'] ?? '');
      if (id.isNotEmpty) {
        return 'audit|$projectKey|id|$id';
      }
      if (date.isNotEmpty && overall.isNotEmpty && (scope.isNotEmpty || _normalize(title).isNotEmpty)) {
        final dedupeScope = scope.isNotEmpty ? scope : _normalize(title);
        return 'audit|$projectKey|date|$date|overall|$overall|scope|$dedupeScope';
      }
      return '';
    }

    if (kind == 'spec') {
      final path = _normalize(fields['path'] ?? '');
      if (id.isNotEmpty) {
        return 'spec|$projectKey|id|$id';
      }
      if (path.isNotEmpty) {
        return 'spec|$projectKey|path|$path';
      }
      return 'spec|$projectKey|title|${_normalize(title)}';
    }

    return '';
  }

  String _normalize(String value) {
    return value.trim().toLowerCase().replaceAll(RegExp(r'\s+'), ' ');
  }

  String _unescape(String value) {
    final out = StringBuffer();
    for (var i = 0; i < value.length; i += 1) {
      final char = value[i];
      if (char != r'\' || i + 1 >= value.length) {
        out.write(char);
        continue;
      }
      final next = value[i + 1];
      if (next == '|' || next == r'\' || next == 'n' || next == '[' || next == ']') {
        if (next == 'n') {
          out.write('\n');
        } else {
          out.write(next);
        }
        i += 1;
      } else {
        out.write(char);
      }
    }
    return out.toString();
  }

  SourceDiagnostic _diagnostic({
    required String source,
    required int line,
    required String markdown,
    required String message,
    Map<String, Object?> details = const {},
  }) {
    return SourceDiagnostic(
      code: DiagnosticCode.parseError,
      severity: DiagnosticSeverity.warning,
      message: message,
      source: source,
      line: line,
      excerpt: diagnosticExcerptForLine(markdown, line),
      details: diagnosticDetails(details),
      suggestedCommand: '/sf-verify ShipGlowz operational records',
    );
  }
}

class _ParseLineResult {
  const _ParseLineResult({this.record, required this.diagnostics});

  final OperationalRecord? record;
  final List<SourceDiagnostic> diagnostics;
}
