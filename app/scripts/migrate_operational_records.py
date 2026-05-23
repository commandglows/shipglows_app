#!/usr/bin/env python3
"""Dry-run migration helper for traffic-first operational records."""

from __future__ import annotations

import argparse
import difflib
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple


CANONICAL_RE = re.compile(r"^(?P<traffic>[🔴🟠🟡🟢✅]) \[(?P<project>[^\[\]]+)\] (?P<kind>task|audit|spec): (?P<rest>.+)$")
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
VALID_TRAFFIC = {"🔴", "🟠", "🟡", "🟢"}
ROOT = Path(__file__).resolve().parents[1]
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
        parts = [f"{self.traffic} [{self.project}] {self.kind}: {escape_value(self.title)}"]
        for key in sorted(self.fields.keys()):
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
    legacy_inactive_count: int = 0
    snippets: List[str] = field(default_factory=list)


def normalize(text: str) -> str:
    return " ".join(text.strip().lower().split())


def escape_value(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("|", "\\|")
        .replace("\n", "\\n")
        .replace("[", "\\[")
        .replace("]", "\\]")
    )


def is_legacy_inactive_reason(reason: Optional[str]) -> bool:
    return bool(reason and reason.startswith("legacy/inactive"))


def is_generic_task_section(section: str) -> bool:
    normalized = normalize(section)
    if not normalized:
        return False
    if normalized in GENERIC_TASK_SECTIONS:
        return True
    return bool(
        re.match(r"^(audit|audits|dashboard|legacy|phase|backlog)(\b|[-—].*)", normalized)
    )


def is_local_tracker_section(section: str) -> bool:
    return normalize(section) in LOCAL_TRACKER_SECTIONS_KEEP_HINT


def is_missing_scalar(value: str) -> bool:
    return normalize(value) in MISSING_NEXT_STEP_VALUES


def active_task_content_lines(lines: List[str], is_local_task_file: bool) -> List[str]:
    if not is_local_task_file:
        return lines
    for idx, line in enumerate(lines):
        if re.match(r"^#\s*Legacy Tasks\b", line.strip(), re.IGNORECASE):
            return lines[:idx]
    return lines


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


def split_unescaped(text: str, sep: str = "|") -> List[str]:
    out: List[str] = []
    cur: List[str] = []
    escaped = False
    for ch in text:
        if escaped:
            cur.append(ch)
            escaped = False
            continue
        if ch == "\\":
            cur.append(ch)
            escaped = True
            continue
        if ch == sep:
            out.append("".join(cur).strip())
            cur = []
            continue
        cur.append(ch)
    out.append("".join(cur).strip())
    return out


def canonical_key(kind: str, project: str, title: str, fields: Dict[str, str]) -> Optional[str]:
    project_n = normalize(project)
    if not project_n:
        return None
    rec_id = normalize(fields.get("id", ""))
    if kind == "task":
        if rec_id:
            return f"task|{project_n}|id|{rec_id}"
        area = normalize(fields.get("area", ""))
        if not normalize(title):
            return None
        return f"task|{project_n}|title|{normalize(title)}|area|{area}"
    if kind == "audit":
        if rec_id:
            return f"audit|{project_n}|id|{rec_id}"
        date = normalize(fields.get("date", ""))
        overall = normalize(fields.get("overall", ""))
        scope_or_title = normalize(fields.get("scope", "")) or normalize(title)
        if not date or not overall or not scope_or_title:
            return None
        return f"audit|{project_n}|date|{date}|overall|{overall}|scope|{scope_or_title}"
    if kind == "spec":
        if rec_id:
            return f"spec|{project_n}|id|{rec_id}"
        path = normalize(fields.get("path", ""))
        if path:
            return f"spec|{project_n}|path|{path}"
        if normalize(title):
            return f"spec|{project_n}|title|{normalize(title)}"
    return None


def parse_canonical_line(raw_line: str, file_path: Path, line_no: int) -> Optional[Record]:
    m = CANONICAL_RE.match(raw_line.strip())
    if not m:
        return None
    traffic = "🟢" if m.group("traffic") == "✅" else m.group("traffic")
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
        fields[key.strip()] = value.strip()
    key = canonical_key(kind, project, title, fields)
    ambiguous = None
    if kind == "audit" and "date" in fields and not ISO_DATE_RE.match(fields["date"]):
        ambiguous = "invalid audit date"
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
    ambiguous = None if (project and title) else "missing project/title in task legacy row"
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
    ambiguous = None
    if not project:
        ambiguous = "missing project in audit legacy row"
    elif not ISO_DATE_RE.match(date):
        ambiguous = "invalid/missing audit date"
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
    traffic = map_priority_to_traffic(top_priority)
    fields = {"status": status}
    key = canonical_key("task", project, title, fields) if project and title else None
    ambiguous = None if (project and title) else "missing project in dashboard task row"
    return Record(file_path, line_no, "legacy", traffic, project, "task", title, fields, key, ambiguous)


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
    if "shipflow_app" in rel:
        return "shipflow_app"
    return None


def parse_file_records(path: Path) -> Tuple[List[Record], List[Record]]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    canonical: List[Record] = []
    legacy: List[Record] = []
    is_local_task_file = path == ROOT / "shipflow_data/workflow/TASKS.md"
    lines = active_task_content_lines(lines, is_local_task_file=is_local_task_file)
    project_hint = infer_project_from_path(path)
    for idx, raw in enumerate(lines, start=1):
        rec = parse_canonical_line(raw, path, idx)
        if rec:
            canonical.append(rec)
    if path.name == "TASKS.md" or path.name == "AUDIT_LOG.md":
        i = 0
        current_project_hint = project_hint
        while i < len(lines) - 1:
            heading_match = re.match(r"^(#{2,6})\s+(.+)$", lines[i].strip())
            if heading_match:
                level = len(heading_match.group(1))
                section = heading_match.group(2).strip()
                if level == 1:
                    current_project_hint = project_hint
                elif level == 2:
                    if is_local_task_file and is_local_tracker_section(section):
                        current_project_hint = project_hint
                    else:
                        current_project_hint = section if not is_generic_task_section(section) else None
                i += 1
                continue
            if lines[i].lstrip().startswith("|") and lines[i + 1].lstrip().startswith("|"):
                if "---" not in lines[i + 1]:
                    i += 1
                    continue
                next_i, rows = parse_markdown_table(lines, i)
                headers_n = [h.strip().lower() for h in lines[i].strip().strip("|").split("|")]
                for row_idx, row in enumerate(rows, start=i + 3):
                    if "project" in headers_n and "status" in headers_n and "top priority" in headers_n:
                        legacy.append(
                            map_dashboard_legacy_row(
                                path,
                                row_idx,
                                row,
                                current_project_hint,
                            )
                        )
                    if "task" in headers_n and "status" in headers_n:
                        legacy.append(map_task_legacy_row(path, row_idx, row, current_project_hint or project_hint))
                    elif "date" in headers_n and "overall" in headers_n and "issues" in headers_n:
                        legacy.append(map_audit_legacy_row(path, row_idx, row, project_hint))
                i = next_i
                continue
            i += 1
    if path.parent.name == "specs" and path.suffix == ".md":
        fm = parse_frontmatter(text)
        title = find_spec_title(lines)
        project = fm.get("project", "").strip('"').strip() or project_hint or ""
        status = fm.get("status", "").strip()
        next_step = fm.get("next_step", "").strip()
        fields = {"status": status, "path": str(path.relative_to(ROOT)), "next": next_step}
        traffic = "🟡"
        status_n = normalize(status)
        if status_n in {"ready", "done"}:
            traffic = "🟢"
        elif status_n in {"blocked"}:
            traffic = "🔴"
        elif status_n in {"reviewed", "review"}:
            traffic = "🟠"
        has_next_step = not is_missing_scalar(next_step)
        key = canonical_key("spec", project, title, fields) if project and title else None
        ambiguous = None
        if not (project and title and status and has_next_step):
            if project and title and status and not has_next_step and status_n in LEGACY_STATUS_VALUES:
                ambiguous = "legacy/inactive spec frontmatter missing next_step"
            else:
                ambiguous = "incomplete spec frontmatter/title for summary proposal"
        legacy.append(Record(path, 1, "legacy_spec_frontmatter", traffic, project, "spec", title, fields, key, ambiguous))
    return canonical, legacy


def build_targets() -> List[Path]:
    targets: List[Path] = [
        ROOT / "shipflow_data/workflow/TASKS.md",
        ROOT / "shipflow_data/workflow/AUDIT_LOG.md",
    ]
    targets.extend(sorted((ROOT / "shipflow_data/workflow/specs").glob("*.md")))
    targets.append(Path("/home/claude/shipflow_data/TASKS.md"))
    targets.append(Path("/home/claude/shipflow_data/AUDIT_LOG.md"))
    return targets


def make_snippet(path: Path, records: Sequence[Record]) -> str:
    proposed = "\n".join(r.to_line() for r in records) + "\n"
    diff = difflib.unified_diff(
        [],
        proposed.splitlines(keepends=True),
        fromfile=f"{path} (legacy-only before)",
        tofile=f"{path} (proposed canonical snippet)",
        lineterm="",
    )
    return "\n".join(diff)


def run_dry(targets: Sequence[Path]) -> int:
    reports: Dict[Path, FileReport] = {}
    winners: Dict[str, Record] = {}
    pending_legacy: List[Record] = []
    ambiguous_records: List[Record] = []
    skipped_inactive_records: List[Record] = []
    missing = 0
    for path in targets:
        reports[path] = FileReport(file_path=path)
        if not path.exists():
            missing += 1
            continue
        canonical, legacy = parse_file_records(path)
        rep = reports[path]
        rep.canonical_count = len(canonical)
        rep.legacy_count = len(legacy)
        for rec in canonical:
            if rec.ambiguous_reason or not rec.dedupe_key:
                if rec.ambiguous_reason and is_legacy_inactive_reason(rec.ambiguous_reason):
                    rep.legacy_inactive_count += 1
                    skipped_inactive_records.append(rec)
                else:
                    rep.ambiguous_count += 1
                    ambiguous_records.append(rec)
                continue
            if rec.dedupe_key in winners:
                rep.duplicate_count += 1
                continue
            winners[rec.dedupe_key] = rec
        pending_legacy.extend(legacy)
    proposed_by_file: Dict[Path, List[Record]] = {}
    for rec in pending_legacy:
        rep = reports[rec.file_path]
        if rec.ambiguous_reason or not rec.dedupe_key:
            if rec.ambiguous_reason and is_legacy_inactive_reason(rec.ambiguous_reason):
                rep.legacy_inactive_count += 1
                skipped_inactive_records.append(rec)
            else:
                rep.ambiguous_count += 1
                ambiguous_records.append(rec)
            continue
        if rec.dedupe_key in winners:
            rep.duplicate_count += 1
            continue
        winners[rec.dedupe_key] = rec
        rep.proposed_count += 1
        proposed_by_file.setdefault(rec.file_path, []).append(rec)

    print("== Migration Dry-Run: traffic-first operational records ==")
    print(f"Repository root: {ROOT}")
    print("")
    print("Targets considered:")
    for path in targets:
        marker = "present" if path.exists() else "missing"
        print(f"- {path}: {marker}")
    print("")
    total_c = sum(r.canonical_count for r in reports.values())
    total_l = sum(r.legacy_count for r in reports.values())
    total_p = sum(r.proposed_count for r in reports.values())
    total_d = sum(r.duplicate_count for r in reports.values())
    total_a = sum(r.ambiguous_count for r in reports.values())
    total_inactive = sum(r.legacy_inactive_count for r in reports.values())
    print("Summary counts:")
    print(f"- canonical record count: {total_c}")
    print(f"- legacy row/proposal source count: {total_l}")
    print(f"- proposed canonical record count: {total_p}")
    print(f"- duplicate/suppressed count: {total_d}")
    print(f"- ambiguous/skipped count: {total_a}")
    print(f"- skipped legacy/inactive count: {total_inactive}")
    print(f"- live migration blocker: {'yes' if total_a else 'no'}")
    print(f"- missing target files: {missing}")
    print("")
    print("Per-file summary:")
    for path in targets:
        r = reports[path]
        print(
            f"- {path}: canonical={r.canonical_count} legacy={r.legacy_count} "
            f"proposed={r.proposed_count} duplicates={r.duplicate_count} ambiguous={r.ambiguous_count} "
            f"legacy_inactive={r.legacy_inactive_count}"
        )
    print("")
    print("Ambiguous / blocking records:")
    if ambiguous_records:
        for rec in ambiguous_records[:80]:
            project = rec.project or "-"
            title = rec.title or "-"
            reason = rec.ambiguous_reason or "missing dedupe key"
            print(
                f"- {rec.file_path}:{rec.line_no} source={rec.source} kind={rec.kind} "
                f"project={project} title={title} reason={reason}"
            )
        if len(ambiguous_records) > 80:
            print(f"- ... truncated after 80 of {len(ambiguous_records)} records")
    else:
        print("- none")
    print("")
    print("Skipped legacy / inactive records:")
    print(f"- count: {total_inactive}")
    if skipped_inactive_records:
        for rec in skipped_inactive_records[:40]:
            project = rec.project or "-"
            title = rec.title or "-"
            reason = rec.ambiguous_reason or "legacy/inactive"
            print(
                f"- {rec.file_path}:{rec.line_no} source={rec.source} kind={rec.kind} "
                f"project={project} title={title} reason={reason}"
            )
        if len(skipped_inactive_records) > 40:
            print(f"- ... truncated after 40 of {len(skipped_inactive_records)} records")
    else:
        print("- none")
    print("")
    print("Proposed replacement snippets (reviewable unified diff):")
    emitted = 0
    for path in targets:
        recs = proposed_by_file.get(path, [])
        if not recs:
            continue
        emitted += 1
        print("")
        print(make_snippet(path, recs))
    if emitted == 0:
        print("- none")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Dry-run migration for traffic-first operational records.")
    parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (default behavior).")
    parser.add_argument(
        "--write",
        action="store_true",
        help="Not implemented in this batch; script stays read-only.",
    )
    args = parser.parse_args()
    if args.write:
        print("ERROR: --write is not implemented in this batch. This tool is read-only.")
        return 2
    return run_dry(build_targets())


if __name__ == "__main__":
    raise SystemExit(main())
