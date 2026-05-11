export type Workflow = {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  summary: string;
  problem: string;
  outcome: string;
  founder_angle: string;
  when_to_use: string[];
  what_you_give: string[];
  what_you_get: string[];
  examples: string[];
  limits: string[];
  related: string[];
};

export const workflowCatalog: Workflow[] = [
  {
    slug: "entry",
    title: "Entry & Onboarding",
    category: "Plan & Decide",
    tagline: "Authenticate, bootstrap, and select workspace.",
    summary: "A consistent startup path keeps project context and identity available without drift.",
    problem: "Users cannot operate quickly when state is inconsistent between sessions.",
    outcome: "Predictable launch with active workspace, synced user session, and clear next step.",
    founder_angle: "Operators avoid friction in the first 30 seconds.",
    when_to_use: [
      "On first launch",
      "After a restart or deployment context change",
      "When switching between projects"
    ],
    what_you_give: ["Account session", "workspace intent", "project context"],
    what_you_get: ["Clean app state", "immediate route visibility", "reliable resume behavior"],
    examples: ["Sign in with Clerk", "Load workspace", "Resume last active project"],
    limits: ["External channel publishing not handled in this flow", "Some backend states still require manual checks"],
    related: ["planning", "resilience"]
  },
  {
    slug: "planning",
    title: "Planning",
    category: "Build & Fix",
    tagline: "Turn ideas into coherent content work.",
    summary: "Ideas, personas, angles, and project context stay connected in one workflow.",
    problem: "Planning tools fragment context and lose intent over time.",
    outcome: "Reusable content plans with explicit review status and ownership.",
    founder_angle: "Teams ship more reliably when idea signals stay attached to schedule.",
    when_to_use: ["At campaign start", "Before drafting", "When aligning team direction"],
    what_you_give: ["Idea definitions", "persona context", "angle strategy"],
    what_you_get: ["Structured content backlog", "clear editorial direction", "visible next actions"],
    examples: ["Create a campaign idea", "Attach an angle", "Prepare editor tasks"],
    limits: ["No channel-level post-formatting logic", "No fully autonomous content generation promise"],
    related: ["entry", "review", "diagnostics"]
  },
  {
    slug: "review",
    title: "Review & Status",
    category: "Operate & Ship",
    tagline: "Keep editorial decisions explicit and reversible.",
    summary: "Drafts and statuses transition through clear states for team review.",
    problem: "Unclear review status creates stale drafts and confusion on publish readiness.",
    outcome: "Actionable queue and status visibility for each content item.",
    founder_angle: "Small teams gain leverage from one consistent review model.",
    when_to_use: ["After drafting", "Before scheduling", "When quality signals are needed"],
    what_you_give: ["Draft state", "review request", "status metadata"],
    what_you_get: ["clear approval path", "history per item", "less ambiguity"],
    examples: ["Mark draft for review", "Track approval state", "Close an item and move to next step"],
    limits: ["No guarantee of external publish acceptance", "No replacement for manual brand policy checks"],
    related: ["planning", "diagnostics", "scheduling"]
  },
  {
    slug: "scheduling",
    title: "Scheduling & Drip",
    category: "Research & Grow",
    tagline: "Prepare reliable release timing and recurring flows.",
    summary: "Scheduling stays readable with resilient operations around pending and completed actions.",
    problem: "Timing and sequencing lose quality when managed across many disconnected tools.",
    outcome: "A single schedule model across calendar and drip surfaces.",
    founder_angle: "Predictability gives operators confidence on delivery cadence.",
    when_to_use: ["Before campaign launch", "For recurring content", "When sequencing matters"],
    what_you_give: ["Calendar constraints", "drip templates", "timing intent"],
    what_you_get: ["clear execution windows", "reconcilable queue", "consistent cadence"],
    examples: ["Create drip plan", "Set publish window", "Adjust sequence timing"],
    limits: ["No universal channel mapping for every provider", "No guaranteed external retry for all integrations"],
    related: ["planning", "resilience", "review"]
  },
  {
    slug: "resilience",
    title: "Resilience & Sync",
    category: "Meta & Setup",
    tagline: "Keep useful behavior during degraded connectivity.",
    summary: "Offline cache, queued writes, and reconciliation states reduce interruption.",
    problem: "Transient failures break linear workflows and confuse operators.",
    outcome: "Recoverable actions and explicit sync state across sessions.",
    founder_angle: "Continuity beats feature velocity when backend stability is uneven.",
    when_to_use: ["When API is unavailable", "During reconnects", "On unstable networks"],
    what_you_give: ["Cached reads", "queued writes", "retry visibility"],
    what_you_get: ["continuous work", "cleaner failure recovery", "traceable sync gaps"],
    examples: ["Queue a supported action", "Resume after reconnect", "Inspect sync state"],
    limits: ["Not all actions are queueable", "Read paths may degrade by feature"],
    related: ["entry", "diagnostics", "scheduling"]
  },
  {
    slug: "diagnostics",
    title: "Diagnostics & Feedback",
    category: "Audit & Improve",
    tagline: "Make state transparent before changing workflow.",
    summary: "Visibility surfaces for uptime, activity, performance, and feedback loops.",
    problem: "Without telemetry, operators cannot triage issues confidently.",
    outcome: "Fast diagnosis plus direct paths to next action.",
    founder_angle: "Trust increases when status and impact are visible.",
    when_to_use: ["After a workflow stalls", "Before release", "When onboarding looks off"],
    what_you_give: ["Health metrics", "activity feed", "feedback submissions"],
    what_you_get: ["faster debugging", "auditable operations", "better operator confidence"],
    examples: ["Open uptime screen", "Review activity feed", "Capture feedback case"],
    limits: ["Diagnostics are scoped to repository and workflow services", "Feedback categories are defined, not auto-triaged"],
    related: ["review", "resilience", "entry"]
  }
];
