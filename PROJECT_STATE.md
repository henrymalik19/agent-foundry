# Project State

**Last updated:** Module 2 complete and tagged (`module-2`) — Your First API
Call. Four sub-lessons done: 2.1 (Hello Claude, first live call), 2.2
(conversation history, real multi-turn memory proven), 2.3 (the
multi-conversation problem — a real felt gap: module-scope `messages` let two
independent conversations bleed into each other; fixed with explicit state,
`runAgent`/`sendMessage`, and a real permanent CLI at `src/repl.ts`), 2.4 (the
full response object — `stop_reason`/`usage`/content blocks surfaced via
`src/log.ts`, exercised through the CLI).
**Next up:** Module 3 — Tool Use. Grows the same `agent.ts` further: tool
definitions (3.1), two demo tools (3.2), the execution loop handling
possibly-multiple `tool_use` blocks per turn (3.3), approval gates (3.4, the
module's real design decision), then a comparison to Claude Code's actual
tool defs (3.5).

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
- **Local `.ts` imports use the real `.ts` extension, not the conventional `.js`.** Node's type-stripping doesn't rewrite import specifiers (no build step exists to do that remapping), so `src/index.ts` imports `./agent.ts` directly. `tsconfig.json` has `allowImportingTsExtensions: true` to make `tsc` accept this — safe because `noEmit: true` is already set. Discovered live at Module 2.1 (a real `ERR_MODULE_NOT_FOUND` crash, then a real `TS5097` crash) — now folded into `docs/course-outline.md`'s pinned constants.
- **Conversation state is an explicit parameter, never module-scope.** `agent.ts` has no `messages` array of its own — `runAgent(messages, userInput)` takes the conversation in and hands it back out. Fixed at 2.3 after a real multi-conversation collision. `src/repl.ts` — Project 1's actual, permanent CLI, built at 2.3 — is where conversation state actually lives now.
- **`chalk` is the one sanctioned dependency exception for a small helper.** Used in `src/repl.ts` (2.3) for real terminal styling, because it's Project 1's actual, permanent product surface — not a blanket exception for every small helper going forward.
- **Module 12.4's frontend will be plain client-side React/Vite, not Next.js**, once that module is built. Express (12.2) stays the sole backend; a full-stack framework's own API-route system would risk the orchestrator quietly getting reimplemented there instead of staying in the separate Express API. Locked in `docs/course-outline.md`'s Module 12.4 entry ahead of actually needing it, since the question came up in conversation early — not a deviation from just-in-time infra, just a design decision recorded before its module starts.

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
- **TypeScript execution:** Node runs `.ts` directly via type-stripping (`node --env-file=.env <file>.ts`) — no build step, no `ts-node`/`tsx` dependency, ever. Verified working at Module 0 (empty entry file) and again for real at Module 2.1 (a live API call, real output).
- **`sendMessage` logs `stop_reason`/`usage`/content blocks via a small `log()` helper (`src/log.ts`)** (Module 2.3) — teaching-grade visibility only, explicitly not real structured logging. Module 13.1 is where that gets built properly; don't mistake `log()` for the final design when extending `agent.ts` later — no timestamps, no log levels, no aggregator-parseable format.
- **TypeScript config:** `tsconfig.json` targets `ES2023`, `strict: true` + `noUncheckedIndexedAccess: true`, module/moduleResolution `nodenext` (matches Node's native ESM + `.ts` type-stripping), `allowImportingTsExtensions: true` (added at Module 2.1 — see architecture decisions above). `include` is `src/**/*.ts` only — `test/**/*.ts` gets added at Module 4 per `AGENTS.md`.
- **ESLint:** flat config (`eslint.config.js`), `@eslint/js` recommended + `typescript-eslint` recommended. No custom rules yet — add them if/when a real pattern earns one, not preemptively.
- **`@anthropic-ai/sdk` version: `0.112.3`**, added as a real `dependency` (not `devDependency`) at Module 2.1 — this is the first runtime dependency the project has, everything before it was dev tooling only.
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

- `package.json` — `type: module`, `engines.node: >=24`, `packageManager` pinned to the exact pnpm build. Scripts: `lint`, `typecheck`, `test`, `format`, `format:check`. One real dependency now (`@anthropic-ai/sdk`), plus devDependencies (`typescript`, `eslint` + `typescript-eslint` + `@eslint/js`, `prettier`, `@types/node`).
- `tsconfig.json` — strict, `ES2023`/`nodenext`, `noEmit` + `allowImportingTsExtensions` (Node runs `.ts` directly, no build step ever — local imports use the real `.ts` extension). `include: src/**/*.ts` only.
- `eslint.config.js` — flat config, recommended JS + typescript-eslint rules, ignores `node_modules`/`dist`.
- `.prettierrc.json` — singleQuote, semi, printWidth 90, trailingComma all.
- `.prettierignore` — excludes `node_modules`, `dist`, `pnpm-lock.yaml`, `lessons`, and all `*.md` (see architecture decision above — Prettier is code-only, not prose).
- `.gitignore` — `node_modules/`, `dist/`, `.env`, `*.log`, `.DS_Store`.
- `.env.example` — template with `ANTHROPIC_API_KEY=` (blank). Real `.env` is git-ignored; not created by Module 0 since no API call happens yet.
- `.nvmrc` — `24.18.0`, the exact Node patch used to build this repo.
- `pnpm-lock.yaml` — committed lockfile.
- `src/agent.ts` — Module 2's seed, now complete: a module-level `messages` array (`Anthropic.MessageParam[]`) + `sendMessage(userInput)`, which pushes the user turn, calls `client.messages.create`, logs `stop_reason`/`usage`/raw content blocks via `log()` (2.3 — teaching-grade only, see technical constants above), pushes the raw `response.content` back (not just extracted text — preserves room for `tool_use` blocks from Module 3), and returns just the text for now. `MODEL` pinned to `claude-sonnet-5`. This is the file every later module (3, 4, 8...) grows in place — nothing here gets rebuilt.
- `src/log.ts` — a small `log(label, data)` helper (Module 2.3): labels a block and pretty-prints it as JSON. Teaching-grade dev visibility only, explicitly not real structured logging (Module 13.1's job).
- `src/index.ts` — makes two real calls to `sendMessage` in sequence (Module 2.2): a fact stated in the first turn, asked back about in the second, as a real proof multi-turn memory works — no `agent.ts` logic changed to make this work, the module-scope array from 2.1 was already forward-compatible for it. Still the thin, permanent entry point — no logic of its own beyond the calls.
- `lessons/module-0/lesson-0.md` — the environment-scaffold module, one consolidated file (routine/mechanical, no per-sub-item split).
- `lessons/module-1/lesson-1.1.md` through `lesson-1.5.md` — How LLMs Actually Work: no code (deliberate, per the outline), one file per the outline's own sub-lesson numbering (per `AGENTS.md`'s "one `lesson-N.M.md` per sub-lesson, always, from Module 1 onward" rule — corrected mid-build after an initial pass wrongly bunched all five sections into one `lesson-1.md`). Each file is full textbook depth regardless of how fast the live pace moved: 1.1 sampling/temperature, 1.2 tokens and the context window's quadratic-attention-cost limit (the section the diagnostic showed as a real gap — deepest section in the module), 1.3 the API mental model, 1.4 model tier tradeoffs, 1.5 the LangChain connection (module-closing synthesis).
- `lessons/module-2/lesson-2.1.md` — Hello Claude: the first live API call, built with real reasoning attached piece by piece (client/model, module-scope `messages` array, `sendMessage`, `index.ts`). Originally written with the `.js`/`.ts` import-extension mismatch and the `TS5097`/`allowImportingTsExtensions` fix narrated as two live "real failures" — corrected after the fact into a single settled-design explanation (see architecture decisions above), since that was mechanical tooling friction, not a genuine felt gap.
- `lessons/module-2/lesson-2.2.md` — Conversation history: no `agent.ts` change, just a real caller proving the module-scope array from 2.1 actually carries memory across calls. Names the naive "fresh local array per call" alternative conceptually as the felt-gap framing, without claiming it was literally built and broken live (it wasn't — the correct design already existed from 2.1).
- `lessons/module-2/lesson-2.3.md` — The full response object: a small `log()` helper surfaces `stop_reason`/`usage`/content blocks, checked against a real run. Closes Module 2 with a real "What you can show now" beat per Lesson Shape, and pulls out the real payoff — 34→100 input tokens across two turns, the measured cost behind Module 6.9/9.5's later design problems.
- `docs/architecture-map.md` — updated through Module 2: a real diagram of `agent.ts`'s current shape (client, `MODEL`, `messages`, `sendMessage`'s five real steps), plus Module 1's placeholder entry (no architecture change, no code by design).
- `README.md` — human-facing, portfolio-readable. Distinct from this file:
  PROJECT_STATE.md is written for the next agent, README.md is written for a
  person. Keep both current; don't let one substitute for the other. Its
  "Start here" bootstrap section was deleted at Module 0, once the scaffold
  was actually built.

Verified working at Module 0 (`pnpm typecheck`, `pnpm lint`, `pnpm format:check` all pass clean; `node src/index.ts` runs with no errors against the empty file).

## Open gaps (intentional, not bugs)

None currently open for Module 0 — `lessons/module-0/lesson-0.md` is written (via the lesson-writer subagent) and README's "Start here" bootstrap section has been deleted. Module 0 is tagged.

## Deviations from the outline

None. (Prettier's code-only scope, discovered live during this session, has
since been folded into `docs/course-outline.md`'s Module 0 entry itself — see
its 0.6 note — so it's now the documented default, not a per-repo deviation.)

## Handoff note to next agent

Modules 0, 1, and 2 are all complete and tagged (`module-0`, `module-1`,
`module-2`). `docs/architecture-map.md` is current through Module 2. Next
session starts **Module 3 — Tool Use**, which grows the same `agent.ts`
further (tool definitions, two demo tools, the execution loop, approval
gates) — not a fresh file. Handoff Point A lands right after Module 3
(`git tag module-3`); don't build ahead into Module 4's real tools before
that boundary.

Three process rules got tightened this session, all now folded into
`docs/teaching-style-prompt.md` (and mirrored in `agent-foundry-template`,
this repo's separate template repo on disk at
`../agent-foundry-template` — same GitHub org, `henrymalik19/agent-foundry`
vs. `henrymalik19/agent-foundry-template`):
1. Diagnostic answers route *pace*, never *content* — a confident-sounding
   answer still gets the full explanation, just delivered briskly, because
   skipping content based on an answer "sounding right" risks an
   unknown-unknown slipping through unremarked.
2. "Brisk isn't passive" — watch the actual checkpoint reply, not just the
   diagnostic guess that preceded it, and drop into slower/fuller treatment
   mid-section if a reply reveals real confusion.
3. **Tell tooling friction apart from a real felt gap before deciding how to
   write a lesson up.** This one was learned the hard way on 2.1 itself:
   `lesson-2.1.md` was first written narrating the `.js`/`.ts` import
   mismatch and the `TS5097`/`allowImportingTsExtensions` fix as two live
   "real failure → real fix" moments, per the usual feel-it-first mechanic.
   That was wrong — it's mechanical scaffolding friction, not a conceptual
   gap the learner needs to *feel* to understand agent design, and got
   corrected into a single settled-design paragraph after the fact. Before
   writing up any real error hit live, ask: would a learner need to feel
   this to understand the actual agentic-design concept the section is
   teaching, or would they just need to know it to move on? Applied
   correctly on 2.2: the naive "fresh local array per call" alternative was
   named *conceptually*, not narrated as something actually built and broken
   this session (it wasn't — 2.1's design was already correct).

Apply all three from here on, not just to the sections that surfaced them.

Whenever a genuinely reusable fact or process rule gets discovered live in
this repo (like the two above, or the earlier Prettier-scope and
`.ts`-import-extension fixes), the working pattern established this session
is: edit the doc here, edit the identical spot in
`../agent-foundry-template`, confirm the two files diff-clean, fold the
template's edit into its single root commit (`git reset --soft <root> &&
git commit --amend`), then rewrite this repo's own root commit to match
(`git rebase -i --root`, `edit` the root, copy the template's file in, `git
commit --amend`, `git rebase --continue`) — stashing whatever module work is
mid-flight first, popping it back after. Push both with
`--force-with-lease`. This keeps the two repos' shared docs byte-identical at
the root commit, per the standing rule that this repo's root commit should
always match the template's.
