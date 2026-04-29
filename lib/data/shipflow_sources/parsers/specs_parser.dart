import 'package:yaml/yaml.dart';

import '../source_models.dart';
import '../source_diagnostic_helpers.dart';
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
    if (frontmatter.map == null) {
      diagnostics.add(
        SourceDiagnostic(
          code: DiagnosticCode.parseError,
          severity: DiagnosticSeverity.warning,
          message: frontmatter.found
              ? 'Invalid YAML frontmatter in spec.'
              : 'Missing YAML frontmatter in spec.',
          source: path,
          line: 1,
          cause: frontmatter.error,
          excerpt: diagnosticExcerptForLine(markdown, 1, radius: 6),
          details: diagnosticDetails({
            'expectedFrontmatter': '--- + yaml metadata + ---',
          }),
          suggestedCommand: '/sf-ready $path',
        ),
      );
      return ParserOutput(records: const [], diagnostics: diagnostics);
    }
    final metadata = frontmatter.map!;

    final title =
        _extractTitle(markdown) ?? (metadata['project']?.toString() ?? path);
    final status = metadata['status']?.toString() ?? 'unknown';
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

  _FrontmatterParseResult _extractFrontmatter(String markdown) {
    final match = RegExp(
      r'^---\s*\n([\s\S]*?)\n---',
      multiLine: false,
    ).firstMatch(markdown);
    if (match == null) {
      return const _FrontmatterParseResult(found: false);
    }
    final raw = match.group(1) ?? '';
    try {
      final yaml = loadYaml(raw);
      if (yaml is YamlMap) {
        return _FrontmatterParseResult(
          found: true,
          map: Map<String, dynamic>.from(yaml),
        );
      }
      return const _FrontmatterParseResult(
        found: true,
        error: 'YAML frontmatter is not a map.',
      );
    } catch (error) {
      return _FrontmatterParseResult(
        found: true,
        error: diagnosticCause(error),
      );
    }
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

class _FrontmatterParseResult {
  const _FrontmatterParseResult({
    required this.found,
    this.map,
    this.error,
  });

  final bool found;
  final Map<String, dynamic>? map;
  final String? error;
}
