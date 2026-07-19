# Project State

**Last updated:** Module 3 is complete and tagged (`module-3`, for the
first time). 3.5 closed the module: a real, honest comparison of `agent.ts`'s
binary `toolCapabilities` gate against how Claude Code's actual tool
permission system works (auto-allowed reads match; the gate itself being
configurable per project/session, per-command gradation inside a single
tool like `Bash`, and session-wide modes like plan mode are all real
axes `agent.ts`'s binary doesn't have). The binary was confirmed as the
right simplification for where the course is right now, not a limitation
to fix immediately — with a real, already-planned place it gets revisited
(Module 4.3's "least-privilege tool tiers," per `docs/course-outline.md`),
not invented after the fact to make the comparison land. No code changed
this section — it's a comparison lesson, per the outline's own framing.

Module 3 as a whole (3.1 through 3.5) was squashed into one commit this
session, same as `module-0`/`module-1`/`module-2` — all four module tags now
point at a single clean commit each, no leftover per-lesson history to carry
forward. The squash-before-tagging rule (`AGENTS.md`) starts applying live
at Module 4.

**Next up:** Module 4 — Building the Code Assistant (Single Agent).
`agent.ts` becomes Project 1 for real here: reading files (4.1), writing
files (4.2, plus how Claude Code's real Edit vs. Write compares), staying
in control before it changes anything (4.3 — this is where `toolCapabilities`
stops being a binary and becomes real least-privilege tiers, the thing 3.5
just confirmed was correctly deferred), running commands (4.4), a real
system prompt (4.5), self-correction (4.6), staying in bounds (4.7), and
first real tests + CI (4.8). Handoff Point A (after Module 3) has now
landed — this is a clean place a session could also choose to stop.

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
   pre-skip Module 1-2's material on this basis — the optional check-in, if
   offered, is still real routing, not a formality.
3. **Prior exposure to this course:** skimmed the outline only, never built
   any of it live. So the outline's shape (module order, project structure)
   may feel familiar when named, but no section has actually been taught or
   practiced yet — treat every module as a real unknown, not a formality.
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
explanations entirely. Per `docs/teaching-style-prompt.md`'s current "Probe,
then route": every module still defaults to slow regardless of this intake,
with an optional check-in offered (not administered) when a module is dense
enough to warrant it — this intake sets overall tone/calibration, not
per-section routing or an excuse to skip straight to a faster tier.

## Architecture decisions locked so far

(One line each. Only decisions a new agent could plausibly get wrong by guessing.)

Real decisions, locked for this repo:

- **Project 1 is one continuous file, `src/agent.ts`, starting at Module 2** — not isolated Module 0–3 exercises that get thrown away and rebuilt at Module 4. Module 2 seeds it minimal (messages array + send loop); Module 3 adds tool use/execution loop/approval gate in place; Module 4 grows it into the real code assistant. No `hello.ts`, no `conversation.ts` — nothing gets built then deleted. See outline's Project Architecture section + Module 2/3/4 entries. Stays **flat** at `src/` root through Module 7 — no pre-built `src/agents/` directory for a fleet that doesn't exist yet (that would be the same premature-abstraction mistake the outline rejects for early workspace tooling). The move into `src/agents/` (with renaming) happens at Module 8.2, when a real second specialist file makes the directory earn its place — see that module's entry.
- **`src/index.ts` is the thin, permanent entry point, present from Module 0.** Created empty at Module 0 (also solves `tsc`'s "no inputs found" against an otherwise-empty `src/`), stays minimal for the whole course — imports and invokes the agent, no CLI framework, no business logic of its own. Since Module 2.3, its one permanent line is `import { runRepl } from './repl.ts'; await runRepl();` — it will not change again for the rest of the course. See outline's Project Architecture section.
- **Module 0 never calls the API.** No smoke-test script that touches the network. `src/index.ts` exists empty from Module 0 but calls nothing until Module 2.1 wires it to the agent — the first live request is still Module 2.1's lesson, not a pre-lesson infra check.
- **Prettier is scoped to code only, not prose docs.** `.prettierignore` excludes all `*.md` (README, AGENTS.md, docs/, lessons/, PROJECT_STATE.md itself) — running Prettier's default formatter over hand-authored reference prose (course outline, teaching-style prompt, handoff docs) produces noisy, unwanted diffs (emphasis-style rewrites, list re-indentation) unrelated to code quality. `pnpm format`/`format:check` only touch `.ts`/`.js`/`.json` etc. This was discovered live at Module 0 — an earlier pass ran Prettier across the whole repo and had to be reverted.
- **Local `.ts` imports use the real `.ts` extension, not the conventional `.js`.** Node's type-stripping doesn't rewrite import specifiers (no build step exists to do that remapping), so `src/index.ts` imports `./agent.ts`/`./repl.ts` directly. `tsconfig.json` has `allowImportingTsExtensions: true` to make `tsc` accept this — safe because `noEmit: true` is already set. Discovered live at Module 2.1 (a real `ERR_MODULE_NOT_FOUND` crash, then a real `TS5097` crash) — now folded into `docs/course-outline.md`'s pinned constants.
- **Conversation state is an explicit parameter, never module-scope.** `agent.ts` has no `messages` array of its own — `runAgent(messages, userInput, requestApproval)` takes the conversation in and hands it back out, `{ reply, messages }`. This replaced an earlier module-scope design once a real multi-conversation collision (2.3) showed two independent conversations bleeding into each other. `src/repl.ts` — Project 1's actual, permanent CLI, built at 2.3 — is now where conversation state actually lives (`let messages: Anthropic.MessageParam[] = []`, scoped to one `runRepl()` invocation).
- **Approval is dependency-injected, not hardcoded inside `agent.ts`.** `agent.ts` exports an `ApprovalRequester` type (`(toolName, input) => Promise<boolean>`) and takes one as `runAgent`'s third parameter — it never creates its own `readline.Interface`. `repl.ts` defines the real, concrete approval prompt, reusing the *same* `readline.Interface` the main CLI loop already owns (discovered live at 3.4: a self-contained `requestApproval` with its own interface crashed the main loop with `ERR_USE_AFTER_CLOSE` the moment an approval fired — two interfaces can't safely share one `stdin`). The approval function fails *closed* (denies) if it can't get a real answer back, never open.
- **Module 12.4's frontend will be plain client-side React/Vite, not Next.js**, once that module is built. Express (12.2) stays the sole backend; a full-stack framework's own API-route system would risk the orchestrator quietly getting reimplemented there instead of staying in the separate Express API. Locked in `docs/course-outline.md`'s Module 12.4 entry ahead of actually needing it, since the question came up in conversation early — not a deviation from just-in-time infra, just a design decision recorded before its module starts.
- **`chalk` is the one sanctioned dependency exception for a small helper.** `src/repl.ts` uses it for real terminal styling (`you ›`/`agent ›`, the banner) because it's Project 1's actual, permanent product surface. `src/log.ts` deliberately does *not* reach for it — plain ANSI escape codes are already the complete, simplest correct version for purely internal dev-facing output. The distinction is what each file is *for*, not a blanket rule either way.

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
- **`sendMessage` logs `stop_reason`/`usage`/content blocks via a small `log()` helper (`src/log.ts`)** (Module 2.4) — teaching-grade visibility only, explicitly not real structured logging. Module 13.1 is where that gets built properly; don't mistake `log()` for the final design when extending `agent.ts` later — no timestamps, no log levels, no aggregator-parseable format.
- **`chalk` version `5.6.2`**, added as a real dependency at Module 2.3 — the one sanctioned dependency exception for `src/repl.ts`'s terminal styling (see architecture decisions above). Not used anywhere else.
- **Real API responses with `tools` attached include two fields this course doesn't teach toward:** a `"thinking"` content block (Claude's extended-thinking/reasoning-trace feature — appeared with an empty `thinking` string + a `signature` field) and a `"caller": {"type": "direct"}` field on each `tool_use` block (ties to an `allowed_callers` option on the SDK's `Tool` type — looks like a newer server-side/sandboxed tool-execution feature). Observed live at Module 3.2, named honestly in that lesson without inventing confident specifics on either. Don't be surprised by them in later modules' real output; no need to build around them unless a later module's outline entry explicitly calls for it.
- **TypeScript config:** `tsconfig.json` targets `ES2023`, `strict: true` + `noUncheckedIndexedAccess: true`, module/moduleResolution `nodenext` (matches Node's native ESM + `.ts` type-stripping), `allowImportingTsExtensions: true` (added at Module 2.1 — see architecture decisions above). `include` is `src/**/*.ts` only — `test/**/*.ts` gets added at Module 4 per `AGENTS.md`.
- **ESLint:** flat config (`eslint.config.js`), `@eslint/js` recommended + `typescript-eslint` recommended. No custom rules yet — add them if/when a real pattern earns one, not preemptively.
- **`@anthropic-ai/sdk` version: `0.112.3`**, added as a real `dependency` (not `devDependency`) at Module 2.1 — the first runtime dependency the project has, everything before it was dev tooling only. `chalk` (above) is the second.
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

- `package.json` — `type: module`, `engines.node: >=24`, `packageManager` pinned to the exact pnpm build. Scripts: `lint`, `typecheck`, `test`, `format`, `format:check`. Two real dependencies now (`@anthropic-ai/sdk`, `chalk`), plus devDependencies (`typescript`, `eslint` + `typescript-eslint` + `@eslint/js`, `prettier`, `@types/node`).
- `tsconfig.json` — strict, `ES2023`/`nodenext`, `noEmit` + `allowImportingTsExtensions` (Node runs `.ts` directly, no build step ever — local imports use the real `.ts` extension). `include: src/**/*.ts` only.
- `eslint.config.js` — flat config, recommended JS + typescript-eslint rules, ignores `node_modules`/`dist`.
- `.prettierrc.json` — singleQuote, semi, printWidth 90, trailingComma all.
- `.prettierignore` — excludes `node_modules`, `dist`, `pnpm-lock.yaml`, `lessons`, and all `*.md` (see architecture decision above — Prettier is code-only, not prose).
- `.gitignore` — `node_modules/`, `dist/`, `.env`, `*.log`, `.DS_Store`.
- `.env.example` — template with `ANTHROPIC_API_KEY=` (blank). Real `.env` is git-ignored; not created by Module 0 since no API call happens yet.
- `.nvmrc` — `24.18.0`, the exact Node patch used to build this repo.
- `pnpm-lock.yaml` — committed lockfile.
- `src/agent.ts` — Module 2's seed, now with a real execution loop and approval gate (Module 3): `tools: Anthropic.Tool[]` (`get_current_time`, `calculate`, `remember_fact`), `toolCapabilities: Record<string, 'read' | 'mutate'>` (separate map, decided once per tool at definition time — not guessed per-call; the boundary Module 4's real tools and Module 15's send/delete gate both inherit), `toolHandlers` giving all three schemas real implementations, `ApprovalRequester` type (exported — the approval mechanism is injected, never hardcoded; see architecture decisions above), a private `sendMessage(messages)` doing exactly one `client.messages.create` call plus `log()` visibility, and the exported `runAgent(messages, userInput, requestApproval)` built around `while (response.stop_reason === 'tool_use')` — takes the conversation array as an explicit parameter (no module-scope state), filters `tool_use` blocks, gates mutating ones through the injected `requestApproval` before running, runs approved/read handlers via `Promise.all`, pushes `tool_result`s keyed by `tool_use_id` (denial produces its own informative result, not a thrown error or silence), loops until the model stops requesting tools, returns `{ reply, messages }`. `MODEL` pinned to `claude-sonnet-5`. This is the file every later module (4, 8...) grows in place — nothing here gets rebuilt. Known, named-not-fixed gaps: the concurrent-approval-prompt race is in `docs/architecture-map.md`; the `calculate` divide-by-zero and unhandled-tool-name crash are in `docs/course-outline.md`'s deferred-hardening table (both closed at 4.6) — not repeated here.
- `src/repl.ts` — Project 1's actual, permanent CLI (Module 2.3), and the second real interface alongside Module 12.4's eventual web frontend. `runRepl()` owns the one `readline.Interface` for the whole session and the one `messages` array (local to this invocation — the actual fix for the multi-conversation bug), loops on `rl.question('you › ')`, calls `runAgent`, prints replies via `chalk`. Its own `requestApproval(rl, toolName, input)` reuses that same interface and fails closed (denies) if `rl.question` throws. Exits gracefully (not a crash) if stdin closes mid-session (piped input reaching EOF).
- `src/log.ts` — a small `log(label, data)` helper (Module 2.4): labels a block and pretty-prints it as JSON via plain ANSI escape codes, no dependency. Teaching-grade dev visibility only, explicitly not real structured logging (Module 13.1's job).
- `src/index.ts` — permanent, two lines: `import { runRepl } from './repl.ts'; await runRepl();` (Module 2.3). Will not change again for the rest of the course.
- `lessons/module-0/lesson-0.md` — the environment-scaffold module, one consolidated file (routine/mechanical, no per-sub-item split; its own standing exception to the per-sub-lesson shape, not bound by the numbered lesson-shape rhythm the rest of the course uses).
- `lessons/module-1/lesson-1.1.md` through `lesson-1.5.md` — How LLMs Actually Work: no code (deliberate, per the outline), one file per the outline's own sub-lesson numbering. Reformatted into the standard lesson shape with Module 1's own standing exception: `## The Exercise` replaces `## The Build` throughout (no code exists anywhere in this module, not just one paused section), and 1.5 (module-closing) uses `## What You Can Show Now` in place of Looking Ahead. Real diagnostic exchanges and prediction guesses preserved: 1.1 sampling/temperature, 1.2 tokens and the context window's quadratic-attention-cost limit (the section the diagnostic showed as a real gap — deepest section in the module), 1.3 the API mental model, 1.4 model tier tradeoffs (delivered fast at the learner's own request, no separate diagnostic that section — named honestly in the lesson itself), 1.5 the LangChain connection.
- `lessons/module-2/lesson-2.1.md` — Hello Claude: the first live API call, built with real reasoning attached piece by piece (client/model, module-scope `messages` array as it existed *then*, `sendMessage`, `index.ts`). Originally written with the `.js`/`.ts` import-extension mismatch and the `TS5097`/`allowImportingTsExtensions` fix narrated as two live "real failures" — corrected after the fact into a single settled-design explanation (see architecture decisions above), since that was mechanical tooling friction, not a genuine felt gap. Reformatted into the standard lesson shape.
- `lessons/module-2/lesson-2.2.md` — Conversation history: no `agent.ts` change, just a real caller proving the module-scope array from 2.1 actually carries memory across calls. Names the naive "fresh local array per call" alternative conceptually as the felt-gap framing, without claiming it was literally built and broken live (it wasn't — the correct design already existed from 2.1). Reformatted into the standard lesson shape.
- `lessons/module-2/lesson-2.3.md` — **New this pass:** The multi-conversation problem — the real felt gap (two independent conversations bleeding into each other against the module-scope design 2.1/2.2 used), demonstrated with a real broken run before the fix. The fix: explicit state (`runAgent(messages, userInput)`, no module-scope array), the `sendMessage`/`runAgent` rename (matching Module 8.3's already-planned name), and `src/repl.ts` built here as Project 1's actual permanent CLI (`chalk`, the one sanctioned dependency exception for it).
- `lessons/module-2/lesson-2.4.md` — **Renumbered from the old 2.3.** The full response object: `src/log.ts` surfaces `stop_reason`/`usage`/content blocks, checked against a real CLI run (`input_tokens: 25`, `output_tokens: 69`, `stop_reason: "end_turn"`). Closes Module 2 with a real "What You Can Show Now" beat.
- `lessons/module-3/lesson-3.1.md` — Tool definitions: the `Anthropic.Tool` schema (name/description/input_schema), with real weight on why `description` is persuasive text aimed at the model's judgment, not a docstring. No code — schema-only; `## The Build` states plainly that nothing gets built this section, per the standard shape's rule that the heading always appears. Real checkpoint exchange preserved (learner correctly predicted the model can call multiple tools per turn with no disambiguation mechanism).
- `lessons/module-3/lesson-3.2.md` — Two demo tools: `get_current_time` and `calculate` (the `enum`-constrained `operator` field named as the one real design choice) wired into the existing `sendMessage`'s `client.messages.create` call — `runAgent` doesn't exist yet at this point in the rebuilt history. Real run (through the CLI) confirms multi-tool-call output, `stop_reason: "tool_use"`, and honestly names two unexpected real fields (a `"thinking"` content block, a `"caller"` field on `tool_use` blocks) as real SDK behavior outside this course's taught scope, not glossed over. Ends with the conversation genuinely stuck inside a live CLI session — the felt gap 3.3 exists to close.
- `lessons/module-3/lesson-3.3.md` — The execution loop: why three pieces were missing (handler map, list-aware execution, feeding results back) and why a `while` loop not a single round. Introduces `runAgent` itself (not a rename of an extracted `callClaude` — `sendMessage` was already its own function since Module 2). Names the real unchecked-cast trust boundary in `calculate`'s handler honestly (schema constrains what the model generates, not what TypeScript can verify on receipt). Real run (through the CLI) proves the 3.2 stuck state now resolves, with the 601→856 input-token jump as the concrete proof that tool calls/results still get resent in full every round.
- `lessons/module-3/lesson-3.4.md` — Approval gates, the module's real design decision, full depth. Why capability is a property of the tool decided once (not a per-call risk judgment), why the capability map is separate from the `tools` schema array, why denial needs an informative `tool_result` instead of a thrown error or silence. **Also carries the real readline-conflict bug and its fix** (see architecture decisions above) as a genuine feel-it-first moment: the naive self-contained `requestApproval` shown first, the real `ERR_USE_AFTER_CLOSE` crash it caused against `repl.ts`'s main loop, then the dependency-injected fix. Both real checkpoint runs (approve, then deny), through the CLI, preserved with honest analysis; names the concurrent-approval-prompt limitation plainly without fixing it.
- `lessons/module-3/lesson-3.5.md` — How the real tools do it, closing out the module. No code — a real, honest comparison of `agent.ts`'s binary `toolCapabilities` gate against Claude Code's actual graduated permission system (auto-allowed reads match; configurable per-project gates, per-command gradation inside `Bash`, and session-wide modes are all real axes the binary doesn't have). Confirms the binary as the right call for now, with a real, already-planned place it gets revisited (Module 4.3), not an invented one.
- `docs/architecture-map.md` — updated through Module 3 (explicit state, `repl.ts`, `chalk`, tools, execution loop, approval gate, the readline fix).
- `README.md` — human-facing, portfolio-readable. Distinct from this file:
  PROJECT_STATE.md is written for the next agent, README.md is written for a
  person. Keep both current; don't let one substitute for the other. Its
  "Start here" bootstrap section was deleted at Module 0, once the scaffold
  was actually built.

Verified working at Module 0 (`pnpm typecheck`, `pnpm lint`, `pnpm format:check` all pass clean; `node src/index.ts` runs with no errors against the empty file). `pnpm format:check` re-verified clean after this session's full reformat pass.

## Open gaps (intentional, not bugs)

None currently. `module-1`'s tag was fixed too — the lesson-shape reformat is now threaded back into its own historical commits (the redundant "drop 'of N'" commit was folded into the split-into-files commit and dropped, since its content was already applied). `docs/architecture-map.md` is current through Module 3 (tools, execution loop, approval gate, the readline fix). The retroactive git-history surgery for Modules 1–3 is done — every historical commit through 3.4 now matches the lesson that describes it, and `module-0`/`module-1`/`module-2` all check out to genuinely working, correctly-shaped states.

## Deviations from the outline

None. (Prettier's code-only scope, discovered live during this session, has
since been folded into `docs/course-outline.md`'s Module 0 entry itself — see
its 0.6 note — so it's now the documented default, not a per-repo deviation.)

## Handoff note to next agent

Modules 0 through 3 are all built, lessoned, and tagged (`module-0`
through `module-3`). Module 2.3 (the multi-conversation fix) sits at its
correct historical point right after old 2.2; the old full-response-object
lesson is renumbered to 2.4; the readline-conflict bug and its fix are
their own real commit, positioned right after 3.4's naive approval-gate
code and before 3.4's lesson. `docs/architecture-map.md` is current
through Module 3.

**Handoff Point A has landed** (right after Module 3, per
`docs/course-outline.md`'s Handoff Points table — chosen because nothing
project-specific exists yet beyond the tool-use core). This is a clean,
low-risk place a session could stop. **Module 4 is next** — Building the
Code Assistant (Single Agent): `agent.ts` becomes Project 1 for real,
growing the same file with file reads (4.1), file writes (4.2, plus how
Claude Code's real `Edit` vs. `Write` compares), the approval gate
graduating from 3.4's binary into real least-privilege tiers (4.3 — the
exact thing 3.5 confirmed was correctly deferred, not forgotten), running
commands (4.4), a real system prompt (4.5), self-correction (4.6), staying
in bounds (4.7), and the course's first real tests + CI (4.8).

Process rules tightened this session live in `docs/teaching-style-prompt.md`
and `AGENTS.md`'s "Before ending a session" section (both mirrored in
`agent-foundry-template` at `../agent-foundry-template`) — not restated here
to avoid keeping a second, driftable copy. See those files directly for the
full list (the pacing/diagnostic changes, the lesson-shape rules, the
squash-before-tagging and rewrite-history-for-real-fixes rules, the
template-sync workflow, and the clean-up-before-committing rule).
