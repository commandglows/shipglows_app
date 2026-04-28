import 'package:yaml/yaml.dart';

import '../source_models.dart';
import 'parsed_models.dart';

class SpecsParser {
  ParserOutput<SpecChantier> parseMany({
    required Map<String, String> specFiles,
  }) {
    final diagnostics = <SourceDiagnostic>[];
    final results = <SpecChantier>[];

    for (final entry in specFiles.entries) {
      final parsed = _parseOne(path: entry.key, markdown: entry.value);
      results.addAll(parsed.records);
      diagnostics.addAll(parsed.diagnostics);
    }

    return ParserOutput(records: results, diagnostics: diagnostics);
  }

  ParserOutput<SpecChantier> _parseOne({
    required String path,
    required String markdown,
  }) {
    final diagnostics = <SourceDiagnostic>[];
    final frontmatter = _extractFrontmatter(markdown);
    if (frontmatter == null) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.parseError,
          severity: DiagnosticSeverity.warning,
          message: 'Missing YAML frontmatter in spec.',
          source: path,
        ),
      );
      return ParserOutput(records: const [], diagnostics: diagnostics);
    }

    final title =
        _extractTitle(markdown) ?? (frontmatter['project']?.toString() ?? path);
    final status = frontmatter['status']?.toString() ?? 'unknown';
    final sfStartStatus = _extractFlowStatus(markdown, 'sf-start');
    final sfVerifyStatus = _extractFlowStatus(markdown, 'sf-verify');

    return ParserOutput(
      records: [
        SpecChantier(
          path: path,
          title: title,
          status: status,
          sfStartStatus: sfStartStatus,
          sfVerifyStatus: sfVerifyStatus,
        ),
      ],
      diagnostics: diagnostics,
    );
  }

  Map<String, dynamic>? _extractFrontmatter(String markdown) {
    final match = RegExp(
      r'^---\s*\n([\s\S]*?)\n---',
      multiLine: false,
    ).firstMatch(markdown);
    if (match == null) {
      return null;
    }
    final raw = match.group(1) ?? '';
    try {
      final yaml = loadYaml(raw);
      if (yaml is YamlMap) {
        return Map<String, dynamic>.from(yaml);
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  String? _extractTitle(String markdown) {
    final match = RegExp(
      r'^#\s+Spec:\s+(.+)$',
      multiLine: true,
    ).firstMatch(markdown);
    return match?.group(1)?.trim();
  }

  String _extractFlowStatus(String markdown, String key) {
    final match = RegExp(
      r'^\s*-\s*' + RegExp.escape(key) + r':\s*(.+)$',
      multiLine: true,
    ).firstMatch(markdown);
    return match?.group(1)?.trim() ?? 'not launched';
  }
}
