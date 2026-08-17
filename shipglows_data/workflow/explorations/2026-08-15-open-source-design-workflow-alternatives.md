---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: shipglows_app
created: "2026-08-15"
updated: "2026-08-15"
status: draft
source_skill: 700-sg-explore
scope: "Open-source alternatives to Figma for an award-caliber cross-platform design-to-code workflow"
owner: Diane
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - app/lib/shipglows/
  - runner/src/
  - site/
  - shipglows_data/technical/design-system-authority.md
  - shipglows_data/technical/managed-runner-foundation.md
  - "ShipGlows core interactive-3d-experience-contract"
depends_on: []
supersedes: []
evidence:
  - "Penpot official documentation: open file format, design tokens, CSS Grid/Flex layouts, prototyping, self-hosting, and MCP server."
  - "Figma official documentation: remote and desktop MCP availability and design-context capabilities."
  - "Onlook official documentation: visual editing of real React codebases, including Astro projects using React components."
  - "Webstudio official documentation: open-source builder and static HTML/CSS or dynamic Remix export."
  - "Rive official documentation: open-source runtimes for Web, Flutter, Android, and Apple platforms."
next_step: "Define the shipglows_app Visual Studio and Laboratory contract."
---

# Exploration Report: Open-Source Design Workflow Alternatives

## Topic And Trigger

The operator wants an award-caliber workflow that can turn sophisticated visual direction into faithful Astro sites, later support iOS and Android applications, and preserve animation, effects, and interactive 3D. A flat generated image has repeatedly proved insufficient because it does not encode responsive behavior, reusable components, product states, interaction rules, motion, or platform adaptations.

This exploration asks whether an open-source or alternative platform is a better central design source than Figma for that workflow.

## Outcome Sought

Select a durable design-production architecture that:

- retains ambitious art direction without reducing it to a screenshot;
- gives Codex structured, inspectable design context;
- maps one semantic identity into Astro and mobile applications;
- separates UI structure from production motion and 3D;
- keeps code, tokens, accessibility, performance, and responsive behavior authoritative;
- reduces proprietary lock-in and parallel design-system drift.

## Methods Used

- Reviewed current official product documentation and first-party repositories on 2026-08-15.
- Compared four credible workflow directions rather than feature-counting isolated tools.
- Evaluated openness, inspectability, design tokens, responsive layout semantics, agent integration, Astro fit, mobile fit, motion/3D coverage, collaboration maturity, and lock-in.
- Treated vendor-generated code claims as inputs requiring repository-native translation and rendered proof, not as production-readiness evidence.
- Performed no installation, account creation, MCP configuration, product trial, or implementation benchmark.

## Constraints Established

- Astro remains the intended website implementation surface.
- iOS and Android applications must remain possible without copying static web screenshots.
- The website should support meaningful motion, effects, and interactive 3D at an Awwwards-level craft benchmark.
- Cross-surface identity requires canonical semantic tokens or a proven mapping, not manually synchronized lookalike values.
- Advanced motion and 3D cannot be delegated to a static interface-design tool alone.
- Codex must translate design intent into project-native components and prove the result in rendered browsers and devices.

## Options Compared

### Option A: Figma-Centered Workflow

Use Figma as the design source, its variables and components as the design-language representation, and its MCP server as the structured handoff to Codex.

Why it fits:

- mature collaborative product-design environment;
- broad designer, template, plugin, and hiring ecosystem;
- official MCP can provide design context and create or modify native Figma content;
- strong choice when external agencies and designers already work in Figma.

What it changes:

- establishes a proprietary hosted platform as the primary design authority;
- introduces plan, seat, usage, and platform-policy dependencies into the workflow;
- still requires explicit mapping from Figma variables and components to repository tokens and components.

Hidden risk:

- ecosystem convenience can conceal design-code drift when the design file and implementation evolve independently;
- access and usage conditions can change over the lifetime of the workflow.

Evidence gap:

- no controlled Figma-to-Astro fidelity trial has been run in the ShipGlows environment.

### Option B: Penpot-Centered Open Workflow

Use Penpot as the structured design source, export or map its W3C-oriented design tokens into the repository authority, expose design structure through its official MCP server, and keep Astro and mobile code authoritative for behavior.

Why it fits:

- Penpot is open source under MPL-2.0 and can be self-hosted;
- `.penpot` files are ZIP archives containing inspectable JSON metadata and media rather than an opaque-only format;
- native tokens follow the W3C Design Tokens Community Group format direction;
- layout primitives explicitly model CSS Grid and Flex concepts that translate naturally to web layout;
- the official MCP server supports read/write access to pages, layers, components, styles, and tokens, plus design-to-code and code-to-design workflows;
- Penpot documents Codex-compatible MCP configuration and offers hosted or local/self-hosted paths.

What it changes:

- makes open, inspectable design data the preferred upstream source;
- enables a more direct design-token and agent workflow;
- requires building our own disciplined component naming, token mapping, and proof loop instead of relying on Figma's larger ecosystem.

Hidden risk:

- Penpot's collaboration ecosystem and advanced prototyping depth may be less mature for some professional design teams;
- its prototype transitions cover useful navigation and overlay behavior but do not replace production motion choreography, Rive state machines, GSAP, or WebGL;
- an MCP credential grants design-file access and requires deliberate secret handling and least-privilege operating rules.

Evidence gap:

- official capability is documented, but no representative Penpot-to-Codex-to-Astro pilot has measured translation fidelity, token drift, or iteration time.

### Option C: Code-First Visual Editing With Onlook

Use the real React repository and component library as the visual canvas, with Onlook writing visual changes directly into code.

Why it fits:

- removes a large portion of the mockup-to-code handoff;
- keeps real components and repository tokens as the source of truth;
- officially lists Astro projects when the editable components are React components;
- supports responsive editing and common React styling systems.

What it changes:

- shifts design work downstream into implementation rather than maintaining a platform-neutral design source;
- encourages React components or islands inside Astro.

Hidden risk:

- it does not cover native `.astro` components as a general promise and provides no common visual source for Flutter;
- adopting it as the central workflow could distort the architecture toward React for the convenience of the editor;
- current service availability, pricing, and product maturity remain operational dependencies even though the project is open source.

Evidence gap:

- no current Astro repository has been imported and edited to confirm boundaries around native Astro files, animations, and project-specific tokens.

### Option D: Web Production Through Webstudio

Use Webstudio as the visual builder and export a static HTML/CSS site or its dynamic application output.

Why it fits:

- builder is open source under AGPL;
- visually exposes web-native CSS concepts;
- static export can produce dependency-light HTML, CSS, and JavaScript;
- useful for bounded marketing sites where the exported output itself is acceptable.

What it changes:

- replaces the intended Astro authoring workflow with generated static output or a Remix-oriented dynamic application;
- creates a second platform source for site structure.

Hidden risk:

- exported output can become a generated branch that is difficult to evolve through project-native Astro components;
- it does not solve mobile application design or shared cross-platform interaction intent;
- self-hosting the builder for production is documented as possible but not currently recommended by Webstudio.

Evidence gap:

- no export has been assessed for Astro conversion cost, semantic quality, advanced animation ownership, or long-term maintainability.

## Comparative Decision Matrix

| Criterion | Figma | Penpot | Onlook | Webstudio |
| --- | --- | --- | --- | --- |
| Open source and self-hostable | No | Strong | Strong project, service varies | Strong builder/project |
| Inspectable portable design source | Proprietary platform | Strong open `.penpot` format | Code repository | Exported site/project |
| Native design-token direction | Strong variables | Strong W3C-oriented tokens | Reuses repository tokens | Web-oriented variables/styles |
| Structured agent integration | Official MCP | Official open MCP, read/write | AI operates on real React code | Visual builder and MCP-oriented workflow |
| Pure Astro fit | Structured handoff only | Structured handoff with web-native layouts | Limited to Astro using React components | Export requires translation or replaces Astro |
| Flutter/iOS/Android design source | Platform-neutral mockups | Platform-neutral mockups and tokens | Weak | Weak |
| Advanced production motion/3D | External tools required | External tools required | Implemented in web code | Web-specific implementation |
| External designer ecosystem | Strongest | Growing | Developer-centric | Web-builder-centric |
| Lock-in exposure | High | Lowest | Medium | Medium |

## Recommendation

Adopt **Penpot as the leading candidate**, not yet as a permanently verified replacement for Figma.

The recommended architecture is:

```text
Image generation and art direction
  -> Penpot boards, components, flows, states, and semantic tokens
  -> explicit token/component mapping into the repository
  -> Codex translation into Astro and mobile-native component systems
  -> Rive for reusable interactive vector motion
  -> GSAP or native web animation only when justified for web choreography
  -> Three.js/WebGL for genuine spatial experiences
  -> rendered browser and device comparison until accepted fidelity is reached
```

Penpot is a better strategic fit than Figma when the priority is open design data, self-hosting, standardized tokens, Codex interoperability, and low vendor lock-in. Figma remains the stronger compatibility option when collaboration with the established professional design market is the dominant concern.

Onlook should be evaluated later as an optional code-canvas for React-heavy Astro surfaces, never as a reason to convert native Astro architecture to React. Webstudio should remain a bounded production option for sites whose exported architecture is intentionally accepted, not the cross-platform design authority.

## Proposed Pilot Before Adoption

A later approved pilot should use one representative award-caliber hero and one reusable interactive component to compare the workflow rather than comparing marketing claims.

Minimum evidence:

- desktop, intermediate, and mobile compositions;
- default, hover/focus, expanded, loading, and reduced-motion states where relevant;
- semantic color, typography, spacing, radius, elevation, and motion tokens;
- one Rive or equivalent interactive motion asset;
- Penpot MCP extraction into a Codex session;
- implementation in native Astro patterns without local token drift;
- rendered comparison through Playwright;
- a documented mapping into Flutter theme/component concepts;
- measured iteration time, material mismatch count, accessibility result, and performance budget impact.

The pilot should compare Penpot against a direct image-reference workflow first. A full Figma bake-off is useful only if professional ecosystem compatibility remains a material alternative after that result.

## Risks And Unknowns

- Tool documentation establishes supported capabilities, not achieved fidelity in this repository.
- MCP-produced code may be structurally useful while still requiring substantial architectural, accessibility, and responsive correction.
- Penpot self-hosting introduces maintenance, update, backup, authentication, and availability responsibilities; hosted Penpot avoids much of that burden.
- Remote MCP credentials and design-file access require a separate security and configuration decision.
- A platform-neutral visual source cannot make web and mobile interfaces pixel-identical without weakening platform conventions.
- Rive runtimes are open source, but editor features, account tiers, renderer support, and platform feature parity require freshness checks at adoption time.
- Advanced Awwwards craft depends on art direction, typography, narrative, motion discipline, performance, and iteration quality; no design tool can guarantee an award.

## Evidence

### Penpot

- [Penpot source repository and MPL-2.0 license](https://github.com/penpot/penpot)
- [Penpot MCP server](https://help.penpot.app/mcp/)
- [Open `.penpot` file format](https://help.penpot.app/user-guide/export-import/penpot-file-format/)
- [Design Tokens](https://help.penpot.app/user-guide/design-systems/design-tokens/)
- [CSS Grid and Flex Layout](https://penpot.app/design/layout)
- [Prototyping](https://help.penpot.app/user-guide/prototyping-testing/prototyping/)
- [Self-hosting guide](https://help.penpot.app/technical-guide/getting-started/)

### Other Compared Tools

- [Figma MCP server guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Onlook for React and Astro with React](https://www.onlook.com/for/react)
- [Webstudio open-source feature and export overview](https://webstudio.is/features)
- [Webstudio self-hosting and export boundaries](https://docs.webstudio.is/university/self-hosting)
- [Rive open-source runtimes and platform coverage](https://rive.app/docs/runtimes/getting-started)

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: none
- Redactions applied: none required
- Notes: No credentials, MCP keys, private design files, screenshots, logs, or account data were accessed or persisted.

## Recommended Next Owner

- Recommended next route: `100-sg-spec` for a bounded Penpot-to-Astro workflow pilot only after operator approval.
- Why: the exploration identifies a preferred candidate, but adoption still requires implementation evidence from a representative visual target.
- Implementation proof included in this report: none.
