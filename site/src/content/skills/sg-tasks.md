---
title: "sg-tasks"
slug: "sg-tasks"
tagline: "Keep the task list coherent after work moves, instead of letting tracking fall behind reality."
summary: "A task-management skill for updating `TASKS.md`, reflecting progress, and capturing the next sensible steps."
category: "Operate & Ship"
audience:
  - "Founders using task files as an operational surface"
  - "Teams that want tighter alignment between delivery and tracking"
problem: "Task tracking stops being useful when the list no longer reflects what was completed, what remains, or what changed in scope."
outcome: "You get a task file that stays closer to reality and is more useful for the next work cycle."
founder_angle: "This skill matters because stale tracking quietly recreates the same confusion as stale docs: you stop trusting the operating surface."
when_to_use:
  - "After meaningful implementation progress"
  - "When `TASKS.md` has drifted from reality"
  - "When you want a clearer next-step list for the next session"
what_you_give:
  - "The current task state and recent work context"
  - "Any relevant local `TASKS.md` surface"
what_you_get:
  - "A cleaner task list"
  - "Better visibility into completed and remaining work"
  - "A more useful handoff surface for future execution"
  - "Clearer Codex session names when you use the `sessions` mode"
  - "A status label that makes open, blocked, and completed conversations easier to scan"
  - "The current status visible directly in the Codex session name when you resume a previous session"
example_prompts:
  - "/sg-tasks"
  - "/sg-tasks update after skills rollout"
  - "/sg-tasks what remains for launch"
  - "/sg-tasks sessions /path/to/project"
  - "/sg-tasks sessions rename done"
argument_modes:
  - argument: "sessions <project-or-cwd>"
    effect: "The `309-sg-tasks` skill reviews Codex sessions for the selected project and renames their visible titles with the exact tracker statuses: `todo`, `doing`, `in_progress`, `blocked`, or `done`."
    consequence: "When you resume a previous session in Codex, its name shows the current status directly. The mode changes the session title only, not the conversation content. This is a status and naming layer, not a one-to-one merge of conversations into tasks; several sessions may relate to the same task, including forks."
  - argument: "sessions rename <status>"
    effect: "The `309-sg-tasks` skill renames only the current Codex conversation with `<STATUS> - <semantic work title>` using `todo`, `doing`, `in_progress`, `blocked`, or `done`."
    consequence: "The current session becomes recognizable at a glance without changing other sessions, forks, or `TASKS.md`. The command derives the work title from the visible conversation and requires the current project working directory to match exactly."
limits:
  - "It improves tracking discipline, not delivery speed by itself"
  - "If priorities are unclear, ordering still needs a separate judgment pass"
  - "The `sessions` mode only targets Codex sessions whose project working directory matches the selected project"
  - "The `sessions rename` mode targets only the current Codex conversation and does not update project task records"
  - "A directory without a task tracker can still be reviewed by exact working-directory path; the mode does not create project governance just for session cleanup"
  - "For duplicate subjects, only the most recently active conversation stays open; inactive non-current sessions older than 30 days are closed without changing linked task completion"
related_skills:
  - "sg-backlog"
  - "sg-priorities"
  - "sg-end"
featured: false
order: 370
---
