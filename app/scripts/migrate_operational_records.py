#!/usr/bin/env python3
"""Migration helper for traffic-first operational records.

The script now supports:
- dry-run summaries and deterministic proposal generation,
- write check mode,
- guarded write mode with explicit gates:
  - zero unmapped/ambiguous blocking rows,
  - required web-reader contract and fixture files present,
  - required tests passing,
  - deterministic per-file replacement plan.
"""

from __future__ import annotations

import argparse
import difflib
import os
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple


CANONICAL_PREFIX_RE = re.compile(r"^(?P<traffic>[🔴🟠🟡🟢✅]) ")
CANONICAL_RECORD_RE = re.compile(
    r"^(?P<traffic>[🔴🟠🟡🟢✅]) \[(?P<project>[^\[\]]+)\] (?P<kind>task|audit|spec): (?P<rest>.+)$"
)
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
VALID_TRAFFIC = {"🔴", "🟠", "🟡", "🟢"}
ROOT = Path(__file__).resolve().parents[1]
WEB_READER_CONTRACT_PATH = ROOT / "shipglowz_data/technical/operational-record-web-reader-contract.md"
WEB_READER_FIXTURE_PATH = ROOT / "test/data/shipglowz_sources/fixtures/operational_records_web_reader.md"
REQUIRED_TEST_COMMAND = [
    ["flutter", "test", "test/data/shipglowz_sources/parsers/operational_record_parser_test.dart"],
]
TUI_WORKDIR = Path("/home/claude/shipglowz/tui")
TUI_CHECK_COMMANDS = [
    ["bun", "test"],
    ["bun", "run", "typecheck"],
]

GENERIC_TASK_SECTIONS = {
    "audit",
    "audits",
    "backlog",
    "current active backlog",
    "dashboard",
    "done",
    "legacy tasks",
    "tasks",
}
LOCAL_TRACKER_SECTIONS_KEEP_HINT = {
    "backlog",
    "historical completed work",
}
LEGACY_STATUS_VALUES = {
    "archived",
    "archived done",
    "archivé",
    "closed",
    "done",
    "deprecated",
    "obsolete",
    "reviewed",
    "wont",
    "wont do",
}
MISSING_NEXT_STEP_VALUES = {"", "none", "n/a", "na", "nil", "null", "undefined"}
SPEC_REQUIRED_FIELDS = {"status", "path", "next"}
TASK_REQUIRED_FIELDS = {"status"}
AUDIT_REQUIRED_FIELDS = {"date", "overall", "issues"}
TASK_FIELD_ORDER = ["status", "area", "id"]
AUDIT_FIELD_ORDER = ["date", "overall", "issues", "scope", "id"]
SPEC_FIELD_ORDER = ["status", "path", "next", "id"]


@dataclass(frozen=True)
class Record:
    file_path: Path
    line_no: int
    source: str
    traffic: str
    project: str
    kind: str
    title: str
    fields: Dict[str, str]
    dedupe_key: Optional[str]
    ambiguous_reason: Optional[str] = None

    def to_line(self) -> str:
        parts = [
            f"{self.traffic} [{self.project}] {self.kind}: {escape_value(self.title)}",
        ]
        ordered = []
        if self.kind == "task":
            ordered.extend([f for f in TASK_FIELD_ORDER if f in self.fields])
            ordered.extend(
                sorted(k for k in self.fields.keys() if k not in set(TASK_FIELD_ORDER) and k not in {
                    "status",
                    "area",
                    "id",
                })
            )
        elif self.kind == "audit":
            ordered.extend([f for f in AUDIT_FIELD_ORDER if f in self.fields])
            ordered.extend(
                sorted(k for k in self.fields.keys() if k not in set(AUDIT_FIELD_ORDER) and k not in {
                    "date",
                    "overall",
                    "issues",
                    "scope",
                    "id",
                })
            )
        elif self.kind == "spec":
            ordered.extend([f for f in SPEC_FIELD_ORDER if f in self.fields])
            ordered.extend(
                sorted(k for k in self.fields.keys() if k not in set(SPEC_FIELD_ORDER) and k not in {
                    "status",
                    "path",
                    "next",
                    "id",
                })
            )
        for key in ordered:
            parts.append(f"{key}: {escape_value(self.fields[key])}")
        return " | ".join(parts)


@dataclass
class FileReport:
    file_path: Path
    canonical_count: int = 0
    legacy_count: int = 0
    proposed_count: int = 0
    duplicate_count: int = 0
    ambiguous_count: int = 0
    skipped_inactive_count: int = 0
    before_active_count: int = 0
    after_active_count: int = 0
    blocked_count: int = 0
    snippet: str = ""


@dataclass
class MigrationPlan:
    blocked: bool
    blockers: List[str] = field(default_factory=list)
    file_reports: List[FileReport] = field(default_factory=list)
    proposed_by_file: Dict[Path, List[Record]] = field(default_factory=dict)
    canonical_count: int = 0
    legacy_count: int = 0
    proposed_count: int = 0
    duplicate_count: int = 0
    ambiguous_count: int = 0
    blocked_count: int = 0
    skipped_inactive_count: int = 0
    missing_targets: int = 0
    changed_files: List[Path] = field(default_factory=list)


def normalize(text: str) -> str:
    return " ".join(text.strip().lower().split())


def normalize_path_rel_for_contract(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        try:
            return str(path.relative_to(Path("/home/claude")))
        except ValueError:
            return str(path)


def escape_value(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("|", "\\|")
        .replace("\n", "\\n")
        .replace("[", "\\[")
        .replace("]", "\\]")
    )


def unescape_value(text: str) -> str:
    return text.replace("\\n", "\n").replace("\\[", "[").replace("\\]", "]").replace("\\|", "|")


def is_legacy_inactive_reason(reason: Optional[str]) -> bool:
    return bool(reason and reason.startswith("legacy/inactive"))


def is_generic_task_section(section: str) -> bool:
    normalized = normalize(section)
    if not normalized:
        return False
    if normalized in GENERIC_TASK_SECTIONS:
        return True
    return bool(re.match(r"^(audit|audits|dashboard|legacy|phase|backlog)(\b|[-—].*)", normalized))


def is_local_tracker_section(section: str) -> bool:
    return normalize(section) in LOCAL_TRACKER_SECTIONS_KEEP_HINT


def is_missing_scalar(value: str) -> bool:
    return normalize(value) in MISSING_NEXT_STEP_VALUES


def split_unescaped(text: str, sep: str = "|") -> List[str]:
    out: List[str] = []
    current: List[str] = []
    escaped = False
    for ch in text:
        if escaped:
            current.append(ch)
            escaped = False
            continue
        if ch == "\\":
            current.append(ch)
            escaped = True
            continue
        if ch == sep:
            out.append("".join(current).strip())
            current = []
            continue
        current.append(ch)
    out.append("".join(current).strip())
    return out


def map_task_status(status_value: str) -> str:
    status_map = {"📋": "todo", "🔄": "in_progress", "⛔": "deferred", "💤": "deferred", "✅": "done"}
    normalized = normalize(status_value)
    return next((v for k, v in status_map.items() if status_value.startswith(k)), normalized or "todo")


def map_dashboard_status(status_value: str) -> str:
    normalized = status_value.lower()
    if "deferred" in normalized or "💤" in status_value:
        return "deferred"
    if "in progress" in normalized or normalized == "in_progress" or "🔄" in status_value:
        return "in_progress"
    if "done" in normalized or "ready" in normalized or "verified" in normalized or "✅" in status_value:
        return "done"
    if "todo" in normalized or "📋" in status_value:
        return "todo"
    if "blocked" in normalized or "failed" in normalized or "error" in normalized:
        return "deferred"
    return "todo"


def map_priority_to_traffic(priority_value: str) -> str:
    if "🔴" in priority_value or normalize(priority_value).startswith(("p0", "critical")):
        return "🔴"
    if "🟠" in priority_value or normalize(priority_value).startswith("p1"):
        return "🟠"
    if "🟢" in priority_value or "✅" in priority_value:
        return "🟢"
    return "🟡"


def canonical_key(kind: str, project: str, title: str, fields: Dict[str, str]) -> Optional[str]:
    project_n = normalize(project)
    if not project_n:
        return None
    rec_id = normalize(fields.get("id", ""))
    if kind == "task":
        if rec_id:
            return f"task|{project_n}|id|{rec_id}"
        area = normalize(fields.get("area", ""))
        title_n = normalize(title)
        if not title_n:
            return None
        return f"task|{project_n}|title|{title_n}|area|{area}"
    if kind == "audit":
        if rec_id:
            return f"audit|{project_n}|id|{rec_id}"
        date = normalize(fields.get("date", ""))
        overall = normalize(fields.get("overall", ""))
        scope_or_title = normalize(fields.get("scope", "")) or normalize(title)
        if not (date and overall and scope_or_title):
            return None
        return f"audit|{project_n}|date|{date}|overall|{overall}|scope|{scope_or_title}"
    if kind == "spec":
        if rec_id:
            return f"spec|{project_n}|id|{rec_id}"
        path = normalize(fields.get("path", ""))
        if path:
            return f"spec|{project_n}|path|{path}"
        title_n = normalize(title)
        if title_n:
            return f"spec|{project_n}|title|{title_n}"
    return None


def validate_fields(kind: str, fields: Dict[str, str], project: str, title: str) -> Optional[str]:
    required = {
        "task": TASK_REQUIRED_FIELDS,
        "audit": AUDIT_REQUIRED_FIELDS,
        "spec": SPEC_REQUIRED_FIELDS,
    }.get(kind)

    if not project:
        return "missing project"
    if not title:
        return "missing title"
    if not required:
        return f"unsupported kind {kind}"
    for field_name in required:
        value = fields.get(field_name, "")
        if not value or is_missing_scalar(value):
            return f"missing required field {field_name}"
    if kind == "audit" and not ISO_DATE_RE.match(fields.get("date", "")):
        return "invalid audit date"
    if kind == "spec":
        path_value = fields.get("path", "")
        if is_missing_scalar(path_value):
            return "missing required field path"
        if os.path.isabs(path_value):
            return "spec path must be repository-relative"
    return None


def parse_canonical_line(raw_line: str, file_path: Path, line_no: int) -> Optional[Record]:
    m = CANONICAL_RECORD_RE.match(raw_line.strip())
    if not m:
        return None

    raw_traffic = m.group("traffic")
    traffic = "🟢" if raw_traffic == "✅" else raw_traffic
    if traffic not in VALID_TRAFFIC:
        return None

    project = m.group("project").strip()
    kind = m.group("kind")
    segments = split_unescaped(m.group("rest"))
    if not segments:
        return None
    title = segments[0]
    fields: Dict[str, str] = {}
    for segment in segments[1:]:
        if ": " not in segment:
            continue
        key, value = segment.split(": ", 1)
        fields[key.strip()] = unescape_value(value.strip())
    key = canonical_key(kind, project, title, fields)
    ambiguous = validate_fields(kind, fields, project, title)
    return Record(file_path, line_no, "canonical", traffic, project, kind, title, fields, key, ambiguous)


def parse_markdown_table(lines: Sequence[str], start_idx: int) -> Tuple[int, List[Dict[str, str]]]:
    headers = [c.strip() for c in lines[start_idx].strip().strip("|").split("|")]
    rows: List[Dict[str, str]] = []
    idx = start_idx + 2
    while idx < len(lines):
        line = lines[idx]
        if not line.lstrip().startswith("|"):
            break
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != len(headers):
            idx += 1
            continue
        rows.append(dict(zip(headers, cells)))
        idx += 1
    return idx, rows


def has_operational_legacy_headers(headers: Sequence[str]) -> bool:
    lowered = [h.strip().lower() for h in headers]
    is_task = "task" in lowered and "status" in lowered
    is_task_dashboard = "project" in lowered and "status" in lowered and "top priority" in lowered
    is_audit = "date" in lowered and "overall" in lowered and "issues" in lowered
    is_audit_scope = "scope" in lowered and "overall" in lowered and "date" in lowered
    return bool(is_task or is_task_dashboard or is_audit or is_audit_scope)


def map_task_legacy_row(file_path: Path, line_no: int, row: Dict[str, str], project_hint: Optional[str]) -> Record:
    lower = {k.strip().lower(): v.strip() for k, v in row.items()}
    title = lower.get("task") or lower.get("title") or ""
    status = map_task_status(lower.get("status", ""))
    pri = lower.get("pri") or lower.get("priority") or ""
    traffic = "🟡"
    if "🔴" in pri:
        traffic = "🔴"
    elif "🟠" in pri:
        traffic = "🟠"
    elif "🟢" in pri or status == "done":
        traffic = "🟢"
    project = lower.get("project") or project_hint or ""
    fields = {"status": status}
    key = canonical_key("task", project, title, fields) if project and title else None
    ambiguous = None if (project and title and status) else "missing project/title in task legacy row"
    if title and status:
        validation = validate_fields("task", fields, project, title)
        if validation:
            ambiguous = validation
    return Record(file_path, line_no, "legacy", traffic, project, "task", title, fields, key, ambiguous)


def map_audit_legacy_row(file_path: Path, line_no: int, row: Dict[str, str], project_hint: Optional[str]) -> Record:
    lower = {k.strip().lower(): v.strip() for k, v in row.items()}
    project = lower.get("project") or project_hint or ""
    title = lower.get("scope") or "audit"
    date = lower.get("date", "")
    overall = lower.get("overall", "")
    issues = lower.get("issues", "")
    fields = {"date": date, "overall": overall, "issues": issues}
    traffic = "🟡"
    overall_n = normalize(overall)
    if overall_n.startswith("a"):
        traffic = "🟢"
    elif overall_n.startswith("b"):
        traffic = "🟡"
    elif overall_n.startswith("c"):
        traffic = "🟠"
    elif overall_n.startswith(("d", "f")):
        traffic = "🔴"
    key = canonical_key("audit", project, title, fields) if project else None
    ambiguous = None if project else "missing project in audit legacy row"
    validation = validate_fields("audit", fields, project, title)
    if validation:
        ambiguous = validation
    return Record(file_path, line_no, "legacy", traffic, project, "audit", title, fields, key, ambiguous)


def map_dashboard_legacy_row(file_path: Path, line_no: int, row: Dict[str, str], project_hint: Optional[str]) -> Record:
    lower = {k.strip().lower(): v.strip() for k, v in row.items()}
    top_priority = lower.get("top priority", "").strip()
    project = lower.get("project") or project_hint or ""
    title = top_priority
    status = map_dashboard_status(lower.get("status", ""))
    if is_missing_scalar(top_priority):
        return Record(
            file_path,
            line_no,
            "legacy",
            "🟡",
            project,
            "task",
            title,
            {"status": status},
            None,
            "legacy/inactive dashboard row missing top priority",
        )
    fields = {"status": status}
    key = canonical_key("task", project, title, fields) if project and title else None
    ambiguous = None if (project and title) else "missing project in dashboard task row"
    validation = validate_fields("task", fields, project, title)
    if validation:
        ambiguous = validation
    return Record(file_path, line_no, "legacy", map_priority_to_traffic(top_priority), project, "task", title, fields, key, ambiguous)


def parse_frontmatter(text: str) -> Dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}
    fm = text[4:end].splitlines()
    data: Dict[str, str] = {}
    for line in fm:
        if ": " not in line:
            continue
        key, value = line.split(": ", 1)
        data[key.strip()] = value.strip().strip('"')
    return data


def normalize_spec_heading_title(title: str) -> str:
    title = title.strip()
    for prefix in ("SPEC —", "SPEC -", "PRD —", "PRD -"):
        if title.startswith(prefix):
            return title[len(prefix) :].strip()
    return title


def first_nonblank_after(lines: Sequence[str], start_idx: int) -> str:
    for idx in range(start_idx + 1, len(lines)):
        candidate = lines[idx].strip()
        if candidate:
            return candidate.strip("# ").strip()
    return ""


def find_spec_title(lines: Sequence[str]) -> str:
    for line in lines:
        if line.startswith("# Spec: "):
            return line[len("# Spec: ") :].strip()
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped in {"# Title", "## Title"}:
            return first_nonblank_after(lines, idx)
    for line in lines:
        if line.startswith("# "):
            title = line[2:].strip()
            if title and title != "Title":
                return normalize_spec_heading_title(title)
    return ""


def infer_project_from_path(path: Path) -> Optional[str]:
    rel = str(path)
    if "shipglowz_app" in rel:
        return "shipglowz_app"
    if "shipglowz_data" in rel:
        return "shipglowz_data"
    return None


def active_task_content_lines(lines: List[str], is_local_task_file: bool) -> List[str]:
    if not is_local_task_file:
        return lines
    for idx, line in enumerate(lines):
        if re.match(r"^#\s*Legacy Tasks\b", line.strip(), re.IGNORECASE):
            return lines[:idx]
    return lines


def build_spec_record(path: Path, text: str, line_no: int = 1) -> Record:
    lines = text.splitlines()
    fm = parse_frontmatter(text)
    title = find_spec_title(lines)
    project = fm.get("project", "").strip('"').strip() or infer_project_from_path(path) or ""
    status = fm.get("status", "").strip()
    next_step = fm.get("next_step", "").strip()
    fields = {"status": status, "path": normalize_path_rel_for_contract(path), "next": next_step}
    traffic = "🟢" if normalize(status) in {"ready", "done"} else "🟡"
    if normalize(status) in {"blocked"}:
        traffic = "🔴"
    elif normalize(status) in {"reviewed", "review"}:
        traffic = "🟠"
    ambiguous = validate_fields("spec", fields, project, title)
    key = canonical_key("spec", project, title, fields) if project and title else None
    return Record(path, line_no, "legacy_spec_frontmatter", traffic, project, "spec", title, fields, key, ambiguous)


def parse_file_records(path: Path) -> Tuple[List[Record], List[Record]]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    canonical: List[Record] = []
    legacy: List[Record] = []
    is_local_task_file = path == ROOT / "shipglowz_data/workflow/TASKS.md"
    body_lines = active_task_content_lines(lines, is_local_task_file=is_local_task_file)
    project_hint = infer_project_from_path(path)

    for idx, raw in enumerate(body_lines, start=1):
        rec = parse_canonical_line(raw, path, idx)
        if rec:
            canonical.append(rec)

    if path.name == "TASKS.md" or path.name == "AUDIT_LOG.md":
        i = 0
        current_project_hint = project_hint
        while i < len(body_lines) - 1:
            heading_match = re.match(r"^(#{2,6})\s+(.+)$", body_lines[i].strip())
            if heading_match:
                section = heading_match.group(2).strip()
                if len(heading_match.group(1)) == 1:
                    current_project_hint = project_hint
                elif len(heading_match.group(1)) == 2:
                    if is_local_task_file and is_local_tracker_section(section):
                        current_project_hint = project_hint
                    else:
                        current_project_hint = section if not is_generic_task_section(section) else None
                i += 1
                continue

            if body_lines[i].lstrip().startswith("|") and body_lines[i + 1].lstrip().startswith("|"):
                if "---" not in body_lines[i + 1]:
                    i += 1
                    continue
                next_i, rows = parse_markdown_table(body_lines, i)
                headers = [h.strip().lower() for h in body_lines[i].strip().strip("|").split("|")]
                for row_idx, row in enumerate(rows, start=i + 3):
                    if "project" in headers and "status" in headers and "top priority" in headers:
                        legacy.append(map_dashboard_legacy_row(path, row_idx, row, current_project_hint))
                    elif "task" in headers and "status" in headers:
                        legacy.append(map_task_legacy_row(path, row_idx, row, current_project_hint or project_hint))
                    elif "date" in headers and "overall" in headers and "issues" in headers:
                        legacy.append(map_audit_legacy_row(path, row_idx, row, project_hint))
                i = next_i
                continue

            i += 1

    if path.parent.name == "specs" and path.suffix == ".md":
        legacy.append(build_spec_record(path, text, line_no=1))

    return canonical, legacy


def build_targets() -> List[Path]:
    targets: List[Path] = [
        ROOT / "shipglowz_data/workflow/TASKS.md",
        ROOT / "shipglowz_data/workflow/AUDIT_LOG.md",
    ]
    targets.extend(sorted((ROOT / "shipglowz_data/workflow/specs").glob("*.md")))
    targets.append(Path("/home/claude/shipglowz_data/TASKS.md"))
    targets.append(Path("/home/claude/shipglowz_data/AUDIT_LOG.md"))
    return targets


def should_remove_legacy_table(headers_line: str, line_ahead: str) -> bool:
    if not (headers_line.lstrip().startswith("|") and line_ahead.lstrip().startswith("|")):
        return False
    if "---" not in line_ahead:
        return False
    headers = [h.strip().lower() for h in headers_line.strip().strip("|").split("|")]
    return has_operational_legacy_headers(headers)


def remove_legacy_table_blocks(lines: Sequence[str]) -> Tuple[List[str], int]:
    out: List[str] = []
    i = 0
    removed = 0
    while i < len(lines):
        if (
            i + 1 < len(lines)
            and should_remove_legacy_table(lines[i], lines[i + 1])
        ):
            removed += 2
            i += 2
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                removed += 1
                i += 1
            continue
        out.append(lines[i])
        i += 1
    return out, removed


def rewrite_tracker_file(path: Path, original: Sequence[str], records: Sequence[Record], is_spec: bool) -> str:
    if not records:
        return "\n".join(original) + "\n" if original else ""

    lines = list(original)
    # Remove any canonical lines in place
    lines = [
        line
        for line in lines
        if not CANONICAL_PREFIX_RE.match(line.strip())
    ]

    lines, _ = remove_legacy_table_blocks(lines)

    canonical_lines = [r.to_line() for r in records]

    if is_spec:
        return rewrite_spec_file(path, lines, canonical_lines)

    insert_index = len(lines)
    if lines:
        for idx, line in enumerate(lines):
            if idx == 0:
                continue
            if line.startswith("##"):
                insert_index = idx
                break
            if line.startswith("# ") and line.startswith("# ") and not line.startswith("## ") and idx > 0:
                continue
    if not lines:
        insert_index = 0
    elif lines[0].startswith("#") and insert_index == len(lines):
        # no secondary heading found; place near top after intro heading and one blank line block
        insert_index = 2 if len(lines) >= 2 else len(lines)

    before = lines[:insert_index]
    after = lines[insert_index:]
    while before and before[-1] == "":
        before.pop()
    while after and after[0] == "":
        after.pop(0)

    deduped_lines = before + ["", *canonical_lines, ""] + after
    return "\n".join(deduped_lines).rstrip("\n") + "\n"


def rewrite_spec_file(path: Path, original: Sequence[str], canonical_lines: Sequence[str]) -> str:
    lines = list(original)
    frontmatter_end = 0
    if lines and lines[0] == "---":
        for idx in range(1, len(lines)):
            if lines[idx] == "---":
                frontmatter_end = idx + 1
                break

    body = lines[frontmatter_end:]
    body = [line for line in body if not CANONICAL_RECORD_RE.match(line.strip())]

    # Ensure a '# Spec:' line exists and capture insertion position for summary.
    spec_title_idx: Optional[int] = None
    spec_title = find_spec_title(body)

    for idx, line in enumerate(body):
        if line.startswith("# Spec: "):
            spec_title_idx = idx
            spec_title = line[len("# Spec: ") :].strip() or spec_title
            break

    if spec_title_idx is None and spec_title:
        spec_line = f"# Spec: {spec_title}"
        body.insert(0, spec_line)
        spec_title_idx = 0

    if spec_title_idx is None:
        spec_title_idx = 0
        body.insert(0, "# Spec: Untitled Spec")

    insert_idx = spec_title_idx + 1
    for idx in range(spec_title_idx + 1, len(body)):
        if body[idx].startswith("## Title"):
            insert_idx = idx
            break

    # Keep at most one canonical summary line for specs in the final position.
    if canonical_lines:
        body = body[:insert_idx] + [canonical_lines[0]] + body[insert_idx:]
    return "\n".join(lines[:frontmatter_end] + body).rstrip("\n") + "\n"


def normalize_source(path: Path) -> str:
    return str(path)


def run_command(cmd: Sequence[str], cwd: Path) -> Tuple[int, str]:
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            check=False,
        )
        return proc.returncode, proc.stdout.strip()
    except FileNotFoundError as exc:
        return 1, f"command not found: {exc}"


def run_migration_plan(targets: Sequence[Path]) -> MigrationPlan:
    plan = MigrationPlan(blocked=False)

    winners: Dict[str, Record] = {}
    all_records: Dict[Path, List[Record]] = {path: [] for path in targets}
    pending_legacy: List[Record] = []
    parsed_by_path: Dict[Path, Tuple[List[Record], List[Record]]] = {}

    for path in targets:
        report = FileReport(file_path=path)
        if not path.exists():
            plan.missing_targets += 1
            plan.file_reports.append(report)
            continue

        parsed_by_path[path] = parse_file_records(path)
        canonical, legacy = parsed_by_path[path]
        report.canonical_count = len(canonical)
        report.legacy_count = len(legacy)
        plan.canonical_count += report.canonical_count
        plan.legacy_count += report.legacy_count

        for rec in canonical:
            if rec.ambiguous_reason:
                report.ambiguous_count += 1
                plan.ambiguous_count += 1
                plan.blocked = True
                plan.blockers.append(
                    f"blocking canonical invalid record {path}:{rec.line_no} reason={rec.ambiguous_reason}"
                )
                report.blocked_count += 1
                plan.blocked_count += 1
                continue
            if rec.dedupe_key is None:
                report.ambiguous_count += 1
                plan.ambiguous_count += 1
                plan.blocked = True
                plan.blockers.append(
                    f"blocking canonical record {path}:{rec.line_no} reason=missing dedupe key"
                )
                report.blocked_count += 1
                plan.blocked_count += 1
                continue
            if rec.dedupe_key in winners:
                report.duplicate_count += 1
                plan.duplicate_count += 1
                continue
            winners[rec.dedupe_key] = rec

        pending_legacy.extend(legacy)
        plan.file_reports.append(report)

    for rec in pending_legacy:
        report = next((x for x in plan.file_reports if x.file_path == rec.file_path), None)
        if report is None:
            continue

        if rec.ambiguous_reason:
            if is_legacy_inactive_reason(rec.ambiguous_reason):
                report.skipped_inactive_count += 1
                plan.skipped_inactive_count += 1
                continue
            report.ambiguous_count += 1
            plan.ambiguous_count += 1
            plan.blocked = True
            plan.blockers.append(f"blocking legacy invalid record {rec.file_path}:{rec.line_no} reason={rec.ambiguous_reason}")
            report.blocked_count += 1
            plan.blocked_count += 1
            continue

        if rec.dedupe_key is None:
            report.ambiguous_count += 1
            plan.ambiguous_count += 1
            plan.blocked = True
            plan.blockers.append(
                f"blocking legacy record {rec.file_path}:{rec.line_no} reason=missing dedupe key"
            )
            report.blocked_count += 1
            plan.blocked_count += 1
            continue

        if rec.dedupe_key in winners:
            report.duplicate_count += 1
            plan.duplicate_count += 1
            continue

        winners[rec.dedupe_key] = rec

    for rec in winners.values():
        all_records[rec.file_path].append(rec)

    for path in targets:
        report = next((x for x in plan.file_reports if x.file_path == path), None)
        if report is None:
            continue
        accepted = all_records.get(path, [])
        if not path.exists():
            continue
        parsed = parsed_by_path.get(path)
        if parsed:
            report.before_active_count = len(parsed[0]) + len(parsed[1])
        report.proposed_count = len(accepted)
        report.after_active_count = report.proposed_count
        plan.proposed_count += report.proposed_count

    if not plan.blocked:
        for path, proposed in all_records.items():
            if not proposed:
                continue
            if isinstance(path, Path):
                original = path.read_text(encoding="utf-8").splitlines()
                is_spec = path.parent.name == "specs" and path.suffix == ".md"
                proposed_content = rewrite_tracker_file(path, original, proposed, is_spec=is_spec)
                current = path.read_text(encoding="utf-8").splitlines()
                if proposed_content != "\n".join(current).rstrip("\n") + "\n":
                    plan.changed_files.append(path)
                    plan.proposed_by_file[path] = proposed
                    report = next((x for x in plan.file_reports if x.file_path == path), None)
                    if report:
                        old = path.read_text(encoding="utf-8")
                        diff = difflib.unified_diff(
                            old.splitlines(keepends=True),
                            proposed_content.splitlines(keepends=True),
                            fromfile=f"{path} (before)",
                            tofile=f"{path} (after)",
                            lineterm="",
                        )
                        report.snippet = "\n".join(diff)

    return plan


def print_plan(plan: MigrationPlan) -> None:
    print("== Migration Plan: traffic-first operational records ==")
    print(f"Repository root: {ROOT}")
    print(f"Web-reader contract: {WEB_READER_CONTRACT_PATH} ({'present' if WEB_READER_CONTRACT_PATH.exists() else 'missing'})")
    print(f"Web-reader fixture: {WEB_READER_FIXTURE_PATH} ({'present' if WEB_READER_FIXTURE_PATH.exists() else 'missing'})")
    print("")
    print("Targets considered:")
    for report in plan.file_reports:
        marker = "present" if report.file_path.exists() else "missing"
        print(f"- {report.file_path}: {marker}")
    print("")
    print("Summary counts:")
    print(f"- canonical record count: {plan.canonical_count}")
    print(f"- legacy row count: {plan.legacy_count}")
    print(f"- proposed canonical record count: {plan.proposed_count}")
    print(f"- duplicate/suppressed count: {plan.duplicate_count}")
    print(f"- ambiguous/unmapped count: {plan.ambiguous_count}")
    print(f"- skipped legacy/inactive count: {plan.skipped_inactive_count}")
    print(f"- missing target files: {plan.missing_targets}")
    print(f"- live migration blocker: {'yes' if plan.blocked else 'no'}")
    print("")

    if plan.blockers:
        print("Blocking conditions:")
        for blocker in plan.blockers[:80]:
            print(f"- {blocker}")
        if len(plan.blockers) > 80:
            print(f"- ... truncated after 80 of {len(plan.blockers)} blockers")
    else:
        print("Blocking conditions: none")

    print("")
    print("Per-file summary:")
    for report in plan.file_reports:
        print(
            f"- {report.file_path}: canonical={report.canonical_count} legacy={report.legacy_count} "
            f"before={report.before_active_count} after={report.proposed_count} "
            f"duplicates={report.duplicate_count} ambiguous={report.ambiguous_count} "
            f"inactive={report.skipped_inactive_count}"
        )

    print("\nPlanned changed files:")
    if plan.changed_files:
        for path in plan.changed_files:
            print(f"- {path}")
    else:
        print("- none")

    print("\nProposed unified diffs:")
    for report in plan.file_reports:
        if report.snippet:
            print("")
            print(report.snippet)
    print("")


def assert_write_gates() -> List[str]:
    blockers: List[str] = []
    if not WEB_READER_CONTRACT_PATH.exists():
        blockers.append(f"missing required contract: {WEB_READER_CONTRACT_PATH}")
    if not WEB_READER_FIXTURE_PATH.exists():
        blockers.append(f"missing required fixture: {WEB_READER_FIXTURE_PATH}")

    for command in REQUIRED_TEST_COMMAND:
        code, output = run_command(command, cwd=ROOT)
        if code != 0:
            blockers.append(f"required parser tests failed: {' '.join(command)}\n{output[:2000]}")
    for shell_cmd in TUI_CHECK_COMMANDS:
        if shell_cmd:
            try:
                code, output = run_command(shell_cmd, cwd=TUI_WORKDIR)
                if code != 0:
                    blockers.append(
                        f"required tui checks failed: {' '.join(shell_cmd)} in {TUI_WORKDIR}\n{output[:2000]}"
                    )
            except FileNotFoundError as exc:
                blockers.append(f"required tui checks unavailable: {exc}")
    return blockers


def run_dry(targets: Sequence[Path]) -> int:
    plan = run_migration_plan(targets)
    print_plan(plan)
    return 1 if plan.blocked else 0


def run_check_only(targets: Sequence[Path]) -> int:
    gate_blockers = assert_write_gates()
    if gate_blockers:
        print("ERROR: write mode is blocked by required gates:")
        for blocker in gate_blockers:
            print(f"- {blocker}")
        return 2

    plan = run_migration_plan(targets)
    print_plan(plan)
    return 1 if plan.blocked else 0


def write_plan(plan: MigrationPlan) -> int:
    if not plan.changed_files:
        print("No changes required.")
        return 0

    temp_files: List[Tuple[Path, Path]] = []
    backups: List[Tuple[Path, str]] = []

    try:
        for path in plan.changed_files:
            proposed = plan.proposed_by_file.get(path)
            if not proposed:
                continue
            original = path.read_text(encoding="utf-8")
            backups.append((path, original))

            temp_path = path.with_suffix(path.suffix + ".migrate.tmp")
            temp_text = rewrite_tracker_file(
                path,
                original.splitlines(),
                proposed,
                is_spec=path.parent.name == "specs",
            )
            temp_path.write_text(temp_text, encoding="utf-8")
            temp_files.append((path, temp_path))

        for path, temp_path in temp_files:
            temp_path.replace(path)
        print("Write completed.")
        return 0
    except Exception as exc:
        print(f"ERROR writing migration output: {exc}")
        for path, backup in backups:
            path.write_text(backup, encoding="utf-8")
        return 3
    finally:
        for _, temp_path in temp_files:
            if temp_path.exists():
                temp_path.unlink()


def run_write(targets: Sequence[Path], check_only: bool) -> int:
    gate_blockers = assert_write_gates()
    if gate_blockers:
        print("ERROR: write mode is blocked by required gates:")
        for blocker in gate_blockers:
            print(f"- {blocker}")
        return 2

    plan = run_migration_plan(targets)
    if plan.blocked:
        print("ERROR: write mode is blocked by migration validation. Resolve blockers first:")
        print_plan(plan)
        return 1

    if check_only:
        print("Check-only mode complete. No files were written.")
        print_plan(plan)
        return 0

    print("Proceeding to write mode with deterministic plan:")
    print_plan(plan)
    return write_plan(plan)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Migrate legacy operational tracker rows to traffic-first canonical records."
    )
    parser.add_argument("--dry-run", action="store_true", help="Show migration plan and canonical diffs (no write).")
    parser.add_argument("--write", action="store_true", help="Run validation gates and write canonical outputs.")
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Build and validate write plan without writing files. Requires --write.",
    )
    args = parser.parse_args()

    targets = build_targets()

    if args.write:
        if args.dry_run:
            return run_check_only(targets)
        return run_write(targets, check_only=args.check_only)
    return run_dry(targets)


if __name__ == "__main__":
    raise SystemExit(main())
