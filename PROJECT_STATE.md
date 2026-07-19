# Project State

**Last updated:** Module 0 complete (environment scaffold). Module 1 not yet
started.
**Next up:** Module 1 — How LLMs Actually Work (no code, no live API call by
design — see the outline's Module 1 entry and `teaching-style-prompt.md`'s
"When there's nothing runnable yet").

## Learner profile

Intake run 2026-07-18, before Module 0 started.

1. **Engineering background:** senior/staff-level, very fluent — codes daily,
   comfortable in unfamiliar codebases and picking up new languages/frameworks
   quickly. No need to explain general programming/tooling fundamentals at any
   point in the course (per `teaching-style-prompt.md`'s "Probe, then route" —
   that was already the standing assumption for anyone this course is for).
2. **Prior LLM/agent experience:** has called LLM APIs directly (chat
   completions style) but has not built tool-calling loops, RAG pipelines, or
   multi-agent systems before. So: Module 1-2 territory (next-token
   prediction, tokens/context, the raw API request/response shape) is likely
   partial review, not brand new — but Module 3 onward (tool-use loops,
   approval gates, memory, RAG, fleets, orchestration) is genuinely new
   material and should get full depth, not assumed-known treatment. Don't
   pre-skip Module 1-2's diagnostic on this basis, per the per-module probe
   still being required — this is a prior, not a decision.
3. **Prior exposure to this course:** skimmed the outline only, never built
   any of it live. So the outline's shape (module order, project structure)
   may feel familiar when named, but no section has actually been taught or
   practiced yet — treat every module's own diagnostic as a real unknown, not
   a formality.
4. **Why now:** wants to get fluent in agentic systems fast enough to build
   real, production-legit projects with it — matches this course's stated
   audience exactly (`teaching-style-prompt.md`'s opening framing). No
   interview-prep or job-search framing to lean into; frame comparisons
   around "how you'd actually build/ship this," not "how you'd explain this
   in an interview."
5. **Known friction:** none flagged. No pacing complaints carried in from past
   learning experiences — default to the course's normal fast-through-routine,
   deep-on-real-decisions pacing without extra caution.

**Net calibration:** move fast through anything routine or already-adjacent
(API mechanics, mechanical setup, standard tool-calling wiring); slow down for
what's genuinely new: agentic design decisions (tool tiers/approval gates,
memory architecture, RAG tradeoffs, fleet/orchestration design, evals,
production observability for LLM systems). Skip programming-fundamentals
explanations entirely. Still run each module's own short diagnostic per
`docs/teaching-style-prompt.md` — this intake sets defaults, not per-section
routing.

## Architecture decisions locked so far

(One line each. Only decisions a new agent could plausibly get wrong by guessing.)

Real decisions, locked for this repo:

- **Project 1 is one continuous file, `src/agent.ts`, starting at Module 2** — not isolated Module 0–3 exercises that get thrown away and rebuilt at Module 4. Module 2 seeds it minimal (messages array + send loop); Module 3 adds tool use/execution loop/approval gate in place; Module 4 grows it into the real code assistant. No `hello.ts`, no `conversation.ts` — nothing gets built then deleted. See outline's Project Architecture section + Module 2/3/4 entries. Stays **flat** at `src/` root through Module 7 — no pre-built `src/agents/` directory for a fleet that doesn't exist yet (that would be the same premature-abstraction mistake the outline rejects for early workspace tooling). The move into `src/agents/` (with renaming) happens at Module 8.2, when a real second specialist file makes the directory earn its place — see that module's entry.
- **`src/index.ts` is the thin, permanent entry point, present from Module 0.** Created empty at Module 0 (also solves `tsc`'s "no inputs found" against an otherwise-empty `src/`), stays minimal for the whole course — imports and invokes the agent, no CLI framework, no business logic of its own. See outline's Project Architecture section.
- **Module 0 never calls the API.** No smoke-test script that touches the network. `src/index.ts` exists empty from Module 0 but calls nothing until Module 2.1 wires it to the agent — the first live request is still Module 2.1's lesson, not a pre-lesson infra check.
- **Prettier is scoped to code only, not prose docs.** `.prettierignore` excludes all `*.md` (README, AGENTS.md, docs/, lessons/, PROJECT_STATE.md itself) — running Prettier's default formatter over hand-authored reference prose (course outline, teaching-style prompt, handoff docs) produces noisy, unwanted diffs (emphasis-style rewrites, list re-indentation) unrelated to code quality. `pnpm format`/`format:check` only touch `.ts`/`.js`/`.json` etc. This was discovered live at Module 0 — an earlier pass ran Prettier across the whole repo and had to be reverted.

Format example only — not yet decided _in this repo's history_, shown so future entries match the style (though the substance of these three happens to already be true per `docs/course-outline.md`):

- e.g. "Job queue is Postgres FOR UPDATE SKIP LOCKED, not Redis/BullMQ — see 11.5"
- e.g. "Approval notifications are Discord webhooks, not Slack — no workspace admin available"
- e.g. "No master coordinator across Project 1 / Project 2 — see outline's Architecture Decision section"

## Technical constants (pin here, don't re-derive)

(Facts, not decisions — model IDs, SDK quirks, exact versions. The kind of
thing a session would otherwise waste time rediscovering, or worse, pick
differently from the last session and silently break continuity. Add a line
the moment something like this is settled; don't leave it to prose buried in
a session's narrative.)

- **Model for `agent.ts` exercises: `claude-sonnet-5`.** Pinned in `docs/course-outline.md`'s "Pinned technical constants" section, not a per-repo live decision — see that section for the retirement/update clause. Modules that deliberately use a different tier (9's Haiku-classification cost lesson, 9's bounded multi-model swap) name their own model and aren't affected by this pin.
- **Node version: 24.18.0**, pinned exactly in `.nvmrc` (major version 24 was already pinned in the outline; this is the live per-machine patch chosen at Module 0 build time).
- **Package manager: pnpm 11.15.0, from Module 0.** Installed via `corepack enable && corepack use pnpm@latest`, which also wrote the exact version + integrity hash into `package.json`'s `packageManager` field — that field is the source of truth, not this line; update both together if pnpm is ever bumped. No mid-course switch. What _does_ wait for Module 15.0 is workspace tooling specifically (`pnpm-workspace.yaml`, the `packages/`/`apps/` split) — the package manager and the workspace feature are separate decisions; only the second is gated by just-in-time.
- **TypeScript execution:** Node runs `.ts` directly via type-stripping (`node --env-file=.env <file>.ts`) — no build step, no `ts-node`/`tsx` dependency, ever. Verified working at Module 0 (`node src/index.ts` runs clean against the empty entry file).
- **TypeScript config:** `tsconfig.json` targets `ES2023`, `strict: true` + `noUncheckedIndexedAccess: true`, module/moduleResolution `nodenext` (matches Node's native ESM + `.ts` type-stripping). `include` is `src/**/*.ts` only — `test/**/*.ts` gets added at Module 4 per `AGENTS.md`.
- **ESLint:** flat config (`eslint.config.js`), `@eslint/js` recommended + `typescript-eslint` recommended. No custom rules yet — add them if/when a real pattern earns one, not preemptively.
- ...

## File manifest

(Folder or file → one-line purpose. Not a full tree dump — only things a new agent
needs to know exist before it starts, so it extends instead of re-creates. Update
this list's _shape_ as the course progresses — most of it won't exist yet in early
sessions; that's expected, not an error.)

**Repo structure:** single package until Module 15.0, using pnpm since Module 0
(not npm — see "Technical constants" above). No workspace _tooling_ before
15.0 — introducing `pnpm-workspace.yaml`/the `packages`+`apps` split early is
premature plumbing with no consumer yet. At 15.0 this becomes a pnpm-workspace
monorepo: `packages/agent-core`, `apps/code-assistant`, `apps/email-agent`.
Not three separate repos — see the outline's "Repo structure" note for why.

- `package.json` — `type: module`, `engines.node: >=24`, `packageManager` pinned to the exact pnpm build. Scripts: `lint`, `typecheck`, `test`, `format`, `format:check`. No dependencies yet, only devDependencies (`typescript`, `eslint` + `typescript-eslint` + `@eslint/js`, `prettier`, `@types/node`) — the Anthropic SDK lands at Module 2.
- `tsconfig.json` — strict, `ES2023`/`nodenext`, `noEmit` (Node runs `.ts` directly, no build step ever). `include: src/**/*.ts` only.
- `eslint.config.js` — flat config, recommended JS + typescript-eslint rules, ignores `node_modules`/`dist`.
- `.prettierrc.json` — singleQuote, semi, printWidth 90, trailingComma all.
- `.prettierignore` — excludes `node_modules`, `dist`, `pnpm-lock.yaml`, `lessons`, and all `*.md` (see architecture decision above — Prettier is code-only, not prose).
- `.gitignore` — `node_modules/`, `dist/`, `.env`, `*.log`, `.DS_Store`.
- `.env.example` — template with `ANTHROPIC_API_KEY=` (blank). Real `.env` is git-ignored; not created by Module 0 since no API call happens yet.
- `.nvmrc` — `24.18.0`, the exact Node patch used to build this repo.
- `pnpm-lock.yaml` — committed lockfile.
- `src/index.ts` — exists, currently empty. The permanent thin entry point; stays this way until Module 2.1 wires it to `agent.ts`.
- `lessons/` — exists, empty except a `.gitkeep` (no lesson files yet — Module 1 has no code so its lesson is plain-language + prediction exercises per the outline; Module 0 itself doesn't get a build-teaching lesson since the learner intake + scaffold above happened as this session's direct work, not a taught felt-gap sequence — see Open gaps below for the one thing this leaves unwritten).
- `README.md` — human-facing, portfolio-readable. Distinct from this file:
  PROJECT_STATE.md is written for the next agent, README.md is written for a
  person. Keep both current; don't let one substitute for the other. **Still
  has its "Start here" bootstrap section** — not yet deleted (see Open gaps).

Verified working at Module 0 (`pnpm typecheck`, `pnpm lint`, `pnpm format:check` all pass clean; `node src/index.ts` runs with no errors against the empty file).

## Open gaps (intentional, not bugs)

None currently open for Module 0 — `lessons/module-0/lesson-0.md` is written (via the lesson-writer subagent) and README's "Start here" bootstrap section has been deleted. Module 0 is tagged.

## Deviations from the outline

None. (Prettier's code-only scope, discovered live during this session, has
since been folded into `docs/course-outline.md`'s Module 0 entry itself — see
its 0.6 note — so it's now the documented default, not a per-repo deviation.)

## Handoff note to next agent

Module 0 is fully complete and tagged (`module-0`): scaffold built and verified (`pnpm install`/`lint`/`typecheck`/`format:check` all pass; Node runs `src/index.ts` directly), `lessons/module-0/lesson-0.md` written by the lesson-writer subagent, README's "Start here" section deleted. Next up is Module 1 (How LLMs Actually Work) — it has no code and no live API call by design (see the outline's Module 1 entry); teach it via plain-language explanation + estimation/prediction exercises per `teaching-style-prompt.md`'s "When there's nothing runnable yet," closing each section with a direct question rather than a run-this checkpoint, and don't force a fabricated run. Offer the learner the diagnostic-vs-move-fast choice per "Probe, then route" before starting.
