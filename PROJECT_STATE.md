# Project State

**Last updated:** Module 4 is complete and tagged (`module-4`). `agent.ts`
became Project 1 for real this module: it now reads files, writes them,
runs shell commands, follows a real system prompt, recovers from its own
tool failures, refuses to leave the project directory, and has its first
automated tests running in CI on every push. Eight sub-lessons (4.1–4.8),
each with a real felt gap, a real design decision, and a real checkpoint —
no code changed without a live run proving it.

The module's actual throughline, in order: reading (4.1) and writing (4.2)
gave the agent hands with no real stakes attached yet; 4.3 is where the
binary approval gate from Module 3 grew into a real two-axis system
(per-tool capability × session-wide mode — `default`/`plan`/`accept-all`,
via a new `/mode` command, the CLI's first real command-parsing branch);
4.4 gave it a `run_command` tool and, alongside it, `verify_project` — a
fixed, structured self-check tool, not testing infrastructure, that needs
`run_command`'s exec pattern to exist at all; 4.5 replaced improvised,
non-reproducible "what are your rules" answers (proven genuinely
inconsistent across three fresh restarts of the identical question) with a
real, static system prompt; 4.6 made every tool failure — not just
`run_command`'s — surface as an honest, catchable `is_error` result instead
of crashing the session, which is what let the agent do a real three-step
investigate-and-retry recovery live; 4.7 built a real path-boundary check
after proving, with actual reverted code and a repeated identical request,
that the model's own judgment about staying in the project isn't even
self-consistent, let alone a guarantee; 4.8 closed the module by making the
Anthropic client injectable (finishing a pattern already used for
`messages`/`requestApproval`/`mode`) and writing the first real automated
tests — mocking only the actual external dependency, not the code under
test — plus minimal CI.

**A real correction happened mid-module, worth carrying forward honestly:**
`verify_project` and a `src/tools/` directory split were both originally
built (and taught) as part of 4.8, following a stray, never-actually-approved
note that had crept into a process doc. Neither belonged there on
reflection — `verify_project` isn't testing infrastructure, it's one more
real tool, and its actual home is 4.4, right alongside `run_command`; the
`src/tools/` split isn't testing-related at all, and pinning it to any
specific module number (8.2, then 4.8) was manufacturing a deadline rather
than responding to a felt need. Both got fixed properly before tagging:
`verify_project`'s code and lesson moved to 4.4 for real (its handler no
longer depends on `PROJECT_ROOT`, a constant that doesn't exist until 4.7 —
that dependency would have been a real timeline contradiction), and the
tools split is now documented as deliberately emergent, unscheduled, most
likely triggered by Module 6.4's memory tools landing on top of these seven,
but not guaranteed to be exactly then. See `docs/course-outline.md`'s
Project Architecture section and its Module 4 entries for the corrected,
current version — this note exists so the correction itself is understood,
not just its result.

**Next up:** Module 5 — Prompt Engineering. `agent.ts` gets no new
capabilities this module; the work is hardening what already exists —
prompt-as-contract discipline, failure modes, A/B testing, structured
output, and 5.5's live injection-testing pass against this actual Module 4
agent (the first stop on the deferred-hardening map, and a very real target
now that it can read, write, and run commands).

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

- **Project 1 is one continuous file, `src/agent.ts`, starting at Module 2** — not isolated Module 0–3 exercises that get thrown away and rebuilt at Module 4. Module 2 seeds it minimal (messages array + send loop); Module 3 adds tool use/execution loop/approval gate in place; Module 4 grows it into the real code assistant. No `hello.ts`, no `conversation.ts` — nothing gets built then deleted. See outline's Project Architecture section + Module 2/3/4 entries. Stays **flat** at `src/` root — no pre-built `src/agents/` directory for a fleet that doesn't exist yet, and (new this module) no pre-built `src/tools/` directory either, for the same reason. `src/agents/` moves at Module 8.2, once a real second specialist file earns it. `src/tools/` is a *different* justification (file-size/readability of a single growing file, not multi-file sharing) and is deliberately **not** pinned to a module number — see the Project Architecture section's "On `src/tools/`" note. Treat it the same way CLI polish is treated: add it whichever module first makes the tool list genuinely unwieldy, likely (not guaranteed) around 6.4's memory tools.
- **`src/index.ts` is the thin, permanent entry point, present from Module 0.** Created empty at Module 0 (also solves `tsc`'s "no inputs found" against an otherwise-empty `src/`), stays minimal for the whole course — imports and invokes the agent, no CLI framework, no business logic of its own. Since Module 2.3, its one permanent line is `import { runRepl } from './repl.ts'; await runRepl();` — it will not change again for the rest of the course. See outline's Project Architecture section.
- **Module 0 never calls the API.** No smoke-test script that touches the network. `src/index.ts` exists empty from Module 0 but calls nothing until Module 2.1 wires it to the agent — the first live request is still Module 2.1's lesson, not a pre-lesson infra check.
- **Prettier is scoped to code only, not prose docs.** `.prettierignore` excludes all `*.md` (README, AGENTS.md, docs/, lessons/, PROJECT_STATE.md itself) — running Prettier's default formatter over hand-authored reference prose (course outline, teaching-style prompt, handoff docs) produces noisy, unwanted diffs (emphasis-style rewrites, list re-indentation) unrelated to code quality. `pnpm format`/`format:check` only touch `.ts`/`.js`/`.json` etc. This was discovered live at Module 0 — an earlier pass ran Prettier across the whole repo and had to be reverted.
- **Local `.ts` imports use the real `.ts` extension, not the conventional `.js`.** Node's type-stripping doesn't rewrite import specifiers (no build step exists to do that remapping), so `src/index.ts` imports `./agent.ts`/`./repl.ts` directly. `tsconfig.json` has `allowImportingTsExtensions: true` to make `tsc` accept this — safe because `noEmit: true` is already set. Discovered live at Module 2.1 (a real `ERR_MODULE_NOT_FOUND` crash, then a real `TS5097` crash) — now folded into `docs/course-outline.md`'s pinned constants.
- **Conversation state is an explicit parameter, never module-scope.** `agent.ts` has no `messages` array of its own — `runAgent` takes the conversation in and hands it back out, `{ reply, messages }`. This replaced an earlier module-scope design once a real multi-conversation collision (2.3) showed two independent conversations bleeding into each other. `src/repl.ts` — Project 1's actual, permanent CLI, built at 2.3 — is now where conversation state actually lives, scoped to one `runRepl()` invocation. **Module 4 extended this same discipline to the Anthropic client itself:** `client` is now `runAgent`'s first parameter, not a module-level constant, the last piece of state that hadn't already been made explicit. `repl.ts` constructs the one real client and passes it in, same as it already does for `mode`.
- **Approval is dependency-injected, not hardcoded inside `agent.ts`.** `agent.ts` exports an `ApprovalRequester` type (`(toolName, input) => Promise<boolean>`) and takes one as a `runAgent` parameter — it never creates its own `readline.Interface`. `repl.ts` defines the real, concrete approval prompt, reusing the *same* `readline.Interface` the main CLI loop already owns (discovered live at 3.4: a self-contained `requestApproval` with its own interface crashed the main loop with `ERR_USE_AFTER_CLOSE` the moment an approval fired — two interfaces can't safely share one `stdin`). The approval function fails *closed* (denies) if it can't get a real answer back, never open.
- **The Anthropic client is typed narrowly, not as the full SDK class.** `AnthropicClient` (exported from `agent.ts`) describes only the one method actually called — `messages.create` — mirroring `ApprovalRequester`'s own narrow-function-type-over-full-class pattern. This is what makes a test double trivial: a plain object with a `messages.create` method satisfies the type, no need to fake an entire SDK surface. Built at 4.8 specifically so the approval gate and mode logic could be tested against real `runAgent` calls without hitting the real API — mocking the one genuinely external, non-deterministic dependency, not the code under test.
- **Approval/mode gating is a function of two independent things, not one.** `toolCapabilities` stays a simple `'read' | 'mutate'` map, decided once per tool at definition time (unchanged since 3.4). What's new at 4.3 is a second, independent axis — session-wide `Mode` (`'default' | 'plan' | 'accept-all'`), owned by `repl.ts` as local state, threaded into `runAgent` as an explicit parameter. `plan` denies a mutating call *before* `requestApproval` is ever invoked (a hard guarantee, not "ask but lean no"); `accept-all` needs no dedicated code branch — it's exactly the case where neither the plan-mode guard nor the default-mode guard fires, so the handler runs unconditionally, the same path a `read`-capability tool already takes. `/mode` is the CLI's first real command-parsing branch (recognizing a line as an instruction to the loop, not a message to the model) — future commands (`/model`, eventually) reuse this same branch rather than inventing a new one.
- **Every tool call is wrapped in one `try`/`catch`, not per-handler error handling.** The entire body that resolves a tool call — handler lookup, mode/approval gating, the handler call itself — sits inside a single `try` per tool-use block in `runAgent`'s execution loop (built at 4.6). Any failure, from any cause (a missing handler, a thrown filesystem error, a thrown "division by zero"), becomes a `tool_result` with `is_error: true` and a real message, never an uncaught exception that kills the session. This is what makes self-correction possible at all — the model can only reason about a failure it's actually told about.
- **Path safety is one shared function, not per-tool logic.** `assertInBounds` (exported from `agent.ts`, built at 4.7) resolves a given path against a `PROJECT_ROOT` captured once at module load (`process.cwd()`), then checks whether the *resolved* destination — not the raw string — lands inside the root, comparing against `PROJECT_ROOT + sep` specifically to avoid a sibling-directory-with-a-shared-prefix false positive. Called from `read_file` and `write_file` unconditionally, and from `run_command`'s optional `cwd`. Deliberately does not, and structurally cannot, inspect `run_command`'s free-text `command` string — that remains a real, permanently open gap, not solved here.
- **`verify_project` lives at Module 4.4, capability `'read'`, no input schema.** One fixed command (`pnpm lint && pnpm typecheck && pnpm test && pnpm format:check`), not a parameterized wrapper around `run_command` — the point is that it always checks the real thing, not whatever string the model constructs. No `cwd` option in its handler; `execAsync` already runs in the process's own working directory, which is always the project root the CLI was started from, so there's no dependency on `PROJECT_ROOT` (a constant that doesn't exist until 4.7, three sections later — see the correction note above).
- **Tests mock the Anthropic client, not the agent's own logic, and observe real side effects, not exported internals.** `test/agent.test.ts` (Module 4.8) drives real `runAgent` calls against a scripted fake `AnthropicClient`; `toolHandlers` stays private, so approval-gate tests check `write_file`'s actual file on disk rather than exporting internal state just to make it inspectable. `assertInBounds` is tested directly with no mocking at all, since it's already a pure function. This pattern — mock only the genuinely external, non-deterministic boundary — is the one to extend for any future test, not a per-module special case.
- **CI is intentionally minimal.** `.github/workflows/ci.yml` (Module 4.8, the home 0.7 deferred it to) runs exactly `pnpm install --frozen-lockfile` then `pnpm test` — no lint/typecheck/format in CI, since that's what `verify_project` is for on demand, not what this workflow's scope covers. No secrets required; the fake-client tests never touch the network.
- **Module 12.4's frontend will be plain client-side React/Vite, not Next.js**, once that module is built. Express (12.2) stays the sole backend; a full-stack framework's own API-route system would risk the orchestrator quietly getting reimplemented there instead of staying in the separate Express API. Locked in `docs/course-outline.md`'s Module 12.4 entry ahead of actually needing it.
- **`chalk` is the one sanctioned dependency exception for a small helper.** `src/repl.ts` uses it for real terminal styling because it's Project 1's actual, permanent product surface. `src/log.ts` deliberately does *not* reach for it — plain ANSI escape codes are already the complete, simplest correct version for purely internal dev-facing output.
- **`README.md` holds stable content only, never per-module status.** No "Status: not yet built (starts Module N)" annotations on anything — that's exactly what this file already tracks, and a second copy in `README.md` goes stale the moment the module it names actually starts. Discovered and fixed live this module (both repos' `README.md` had this pattern from the start); documented in `docs/course-outline.md`'s "README vs. PROJECT_STATE.md" section so it doesn't drift back.

Format example only — not yet decided _in this repo's history_, shown so future entries match the style (though the substance of these two happens to already be true per `docs/course-outline.md`):

- e.g. "Job queue is Postgres FOR UPDATE SKIP LOCKED, not Redis/BullMQ — see 11.5"
- e.g. "Approval notifications are Discord webhooks, not Slack — no workspace admin available"

## Technical constants (pin here, don't re-derive)

(Facts, not decisions — model IDs, SDK quirks, exact versions. The kind of
thing a session would otherwise waste time rediscovering, or worse, pick
differently from the last session and silently break continuity. Add a line
the moment something like this is settled; don't leave it to prose buried in
a session's narrative.)

- **Model for `agent.ts` exercises: `claude-sonnet-5`.** Pinned in `docs/course-outline.md`'s "Pinned technical constants" section, not a per-repo live decision. Modules that deliberately use a different tier name their own model and aren't affected by this pin.
- **Node version: 24.18.0**, pinned exactly in `.nvmrc`.
- **Package manager: pnpm 11.15.0, from Module 0.** `packageManager` field in `package.json` is the source of truth. No mid-course switch. Workspace *tooling* specifically still waits for Module 15.0.
- **TypeScript execution:** Node runs `.ts` directly via type-stripping (`node --env-file=.env <file>.ts`) — no build step, no `ts-node`/`tsx` dependency, ever.
- **`sendMessage` logs `stop_reason`/`usage`/content blocks via `log()` (`src/log.ts`)** — teaching-grade visibility only. Module 4.4 added a second call site: `runAgent`'s execution loop now also logs the real `toolResults` array right before pushing it to `messages`, closing the same gap on the result side that 2.4 already closed on the response side (every tool result had been invisible in the console since Module 3's execution loop first built one — nobody noticed because the original demo tools' results were too trivial to care about). Still not real structured logging — Module 13.1's job. A `read_file` call against a genuinely large file will dump its whole contents to the console right along with everything else; a real, known, left-open limitation, not solved with truncation logic that has no felt need yet.
- **`chalk` version `5.6.2`**, from Module 2.3 — the one sanctioned dependency exception. Not used anywhere else.
- **Real API responses with `tools` attached include two fields this course doesn't teach toward:** a `"thinking"` content block and a `"caller": {"type": "direct"}` field on each `tool_use` block. Observed live at Module 3.2. Don't be surprised by them in later modules' real output.
- **TypeScript config:** `tsconfig.json` targets `ES2023`, `strict: true` + `noUncheckedIndexedAccess: true`, module/moduleResolution `nodenext`, `allowImportingTsExtensions: true`. `include` is now `["src/**/*.ts", "test/**/*.ts"]` — the `test/**/*.ts` entry was added at Module 4.8, the course's first real tests.
- **ESLint:** flat config (`eslint.config.js`), `@eslint/js` recommended + `typescript-eslint` recommended. No custom rules yet.
- **`@anthropic-ai/sdk` version: `0.112.3`**, added as a real `dependency` at Module 2.1.
- **Test discovery: `node --test`, no framework dependency.** `test/agent.test.ts` uses `node:test` (`describe`/`test`/`after`) and `node:assert/strict` — both built into Node, no new `devDependency`. Real run at Module 4.8: 9 tests, ~90ms, no network.
- **CI action versions pinned in `.github/workflows/ci.yml`:** `actions/checkout@v4`, `pnpm/action-setup@v4` (reads the exact pnpm version from `package.json`'s `packageManager` field automatically, no separate version pin needed there), `actions/setup-node@v4` with `node-version-file: '.nvmrc'` and `cache: 'pnpm'`.
- ...

## File manifest

(Folder or file → one-line purpose. Not a full tree dump — only things a new agent
needs to know exist before it starts, so it extends instead of re-creates.)

**Repo structure:** single package until Module 15.0, using pnpm since Module 0.
No workspace _tooling_ before 15.0. At 15.0 this becomes a pnpm-workspace
monorepo: `packages/agent-core`, `apps/code-assistant`, `apps/email-agent`.

- `package.json` — `type: module`, `engines.node: >=24`, `packageManager` pinned. Scripts: `lint`, `typecheck`, `test`, `format`, `format:check`. Same two real dependencies as before (`@anthropic-ai/sdk`, `chalk`) — Module 4 added no new dependencies, everything new is built on Node's own `node:child_process`, `node:path`, `node:test`, `node:assert`.
- `tsconfig.json` — strict, `ES2023`/`nodenext`, `noEmit` + `allowImportingTsExtensions`. `include: ["src/**/*.ts", "test/**/*.ts"]` — the test path added at 4.8.
- `eslint.config.js` — flat config, recommended JS + typescript-eslint rules.
- `.prettierrc.json` / `.prettierignore` — code only, prose docs excluded.
- `.gitignore` — `node_modules/`, `dist/`, `.env`, `*.log`, `.DS_Store`.
- `.env.example` — template with `ANTHROPIC_API_KEY=` (blank).
- `.nvmrc` — `24.18.0`.
- `pnpm-lock.yaml` — committed lockfile.
- `.github/workflows/ci.yml` — **new at Module 4.8**, the workflow 0.7 deferred. Runs `pnpm install --frozen-lockfile` then `pnpm test` on every push and pull request. No lint/typecheck/format step, no secrets.
- `src/agent.ts` — Project 1's real code assistant as of Module 4. Seven tools: `get_current_time`, `calculate`, `remember_fact` (the three Module 3 demo tools, still present, unchanged), `read_file`, `write_file`, `run_command`, `verify_project` (Module 4's real ones). `toolCapabilities` unchanged in shape (`'read' | 'mutate'`, decided once per tool). `assertInBounds` (exported) is the shared path-boundary check, called from `read_file`/`write_file`/`run_command`'s `cwd`. `SYSTEM_PROMPT` is a static module-level constant (5 rules: read before writing, verify instead of assuming, stay in scope, explain before acting, stay concise), passed as `system` in the one `client.messages.create` call. `AnthropicClient` (exported) is the narrow structural type for the injectable client. `ApprovalRequester` and `Mode` (both exported) are unchanged in shape from 3.4/4.3. `sendMessage(client, messages)` and `runAgent(client, messages, userInput, requestApproval, mode)` both take `client` as an explicit first parameter now — no module-level `Anthropic` instance anymore. The tool-execution loop wraps each tool call's entire resolution (lookup, mode/approval gating, handler call) in one `try`/`catch`, converting any failure into an honest `tool_result` with `is_error: true`. Logs both the model's `response` and the real `toolResults` array via `log()`. This is the file every later module (8, 15...) grows in place — nothing here gets rebuilt.
- `src/repl.ts` — Project 1's permanent CLI. Owns the one `readline.Interface`, the one `messages` array, and (new at 4.3) the one `mode: Mode` local variable, plus (new at 4.8) the one real `Anthropic` client, constructed once and passed into every `runAgent` call. Recognizes `/mode` (with no argument, a valid mode, or an invalid one) as its own command, handled locally without ever reaching the model — the CLI's first real command-parsing branch. The prompt label itself changes to show the current mode whenever it isn't `default` (`you (plan) › `), a real safety-relevant status indicator, not decoration.
- `src/log.ts` — unchanged since 2.4. Teaching-grade visibility only.
- `src/index.ts` — unchanged, permanent, two lines.
- `test/agent.test.ts` — **new at Module 4.8**. `describe('assertInBounds', ...)`: four direct cases (in-project relative path, `..`-containing path that resolves back inside, relative escape, absolute escape). `describe('the approval gate', ...)`: five cases through real `runAgent` calls against a fake, scripted `AnthropicClient` — a read tool never triggers approval; default mode asks exactly once and the answer determines the outcome (approve → file exists with right content; deny → file never appears); plan mode denies with zero approval calls (not one denied call — the suite distinguishes "never asked" from "asked and refused" by counting callback invocations, not just checking the end state); accept-all runs with zero approval calls. Approval-gate tests verify via `write_file`'s real filesystem side effect in a `scratch/` directory, cleaned up in an `after()` hook — never exported internals.
- `lessons/module-0/lesson-0.md` through `lessons/module-3/lesson-3.5.md` — unchanged since the last handoff; see prior state for detail if ever needed (all preserved, not re-summarized here to keep this file from re-accumulating detail that doesn't change).
- `lessons/module-4/lesson-4.1.md` — Give it eyes (reading files). Felt gap: honest "I don't have access" refusal, no hallucination. `read_file` built, capability `'read'`. Two gaps named and left open on purpose (no boundary check, no error handling) — both later closed for real (4.7, 4.6).
- `lessons/module-4/lesson-4.2.md` — Give it hands (writing files). `write_file` built, capability `'mutate'` — the first tool where that tier protects something real. Includes the "how the real tool does it" comparison to Claude Code's `Write` vs `Edit` (full-overwrite-only is a deliberate, permanent simplification here, not a deferred gap).
- `lessons/module-4/lesson-4.3.md` — Stay in control. The module's first real design-decision section: the binary approval gate grows into capability × session-wide `Mode`, `/mode` becomes the CLI's first real command. Real live proof: all three modes tested against `write_file` in one session (ask/approve, deny-without-asking in `plan`, silent run in `accept-all`).
- `lessons/module-4/lesson-4.4.md` — Let it act (running commands), **and `verify_project`**, added here properly (moved from an earlier, incorrect 4.8 placement — see the correction note above). `run_command`'s two real design decisions: uniform `'mutate'` tagging with no attempt at command-string risk classification (a keyword blocklist would be worse than no attempt at all — named and explained, not built), and structured `{ exitCode, stdout, stderr }` results instead of throwing on a nonzero exit, since a failing command is the normal shape of running commands, not a malformed input. `verify_project` follows directly: one fixed command, capability `'read'`, no `cwd` dependency. Real checkpoint: a genuine fail (an actual formatting mismatch), a fix, a genuine pass — not staged.
- `lessons/module-4/lesson-4.5.md` — Its standing rules (the system prompt). Genuinely subtle felt gap: asked "what rules do you follow," the agent gave two *different*, both-plausible, fully improvised answers across two fresh restarts of the identical question — proving a good-sounding answer isn't the same as a real, fixed one. Real system prompt built; a third restart's answer then mapped directly onto its actual content.
- `lessons/module-4/lesson-4.6.md` — Let it recover (self-correction). Felt gap was dramatic: an uncaught `ENOENT` crashed the entire process, full stack trace to a dead shell prompt — not a graceful failure. Fix: the whole tool-execution loop wrapped in one `try`/`catch`, `is_error: true` results, plus `calculate`'s missing divide-by-zero check. Real checkpoint: a genuine three-step recovery (typo'd filename → investigate with `run_command`'s `find` → corrected retry → success), not a scripted demo.
- `lessons/module-4/lesson-4.7.md` — Keep it in bounds. The module's richest section. Felt gap evolved live: the model refused `/etc/passwd` on its own judgment (looked like a boundary, wasn't one) — then, testing the *identical* plain request again against the *identical* unprotected code (a real, deliberate revert-and-retest), it complied instead, proving the model's own judgment isn't even self-consistent, not just imperfect. `assertInBounds` built: resolve-then-check, not a `..`-string blocklist (which would wrongly reject a harmless path like `src/../src/agent.ts`). Real checkpoint proves both directions with real code-level rejections (not assumed ones) plus the safe-path success case.
- `lessons/module-4/lesson-4.8.md` — First real tests + CI, the module's closing section. Names directly why hand-verification and "ask the real model" are both wrong ways to test the approval gate (the previous section's own finding), lands on mocking the one genuinely external dependency, walks the injectable-client refactor and the two testing strategies (`assertInBounds` direct, approval gate via real side effects), and closes with the actual CI file. Real checkpoint: 9/9 passing, ~90ms, no network.
- `docs/architecture-map.md` — updated through Module 4 (all seven tools, the mode system, the system prompt, self-correction, the boundary check, the test suite, CI).
- `README.md` — human-facing. Now holds stable content only, no per-module status (see architecture decisions above).

Verified working: `pnpm lint`, `pnpm typecheck`, `pnpm test` (9/9), `pnpm format:check` all pass clean at the point of tagging. Both `agent-foundry` and `agent-foundry-template`'s shared docs (`AGENTS.md`, `CLAUDE.md`, `docs/course-outline.md`, `docs/teaching-style-prompt.md`) are byte-identical at their respective root commits.

## Open gaps (intentional, not bugs)

- **`run_command`'s command string is completely unconstrained.** The boundary check (4.7) covers structured path arguments (`read_file`/`write_file`'s `path`, `run_command`'s `cwd`) but cannot, and doesn't try to, inspect the free-text shell command itself — `cat ../../etc/passwd` typed as the command sails straight through. Named honestly at 4.4 and again at 4.7; no module currently scheduled to close it. A naive fix (keyword blocklist) was considered and explicitly rejected as worse than no attempt at all.
- **`write_file` is full-overwrite-only, permanently.** No targeted `Edit`-style (`old_string`/`new_string`) tool exists or is planned — a deliberate, permanent scope simplification named at 4.2, not a deferred gap.
- **`src/tools/` split is unbuilt and deliberately unscheduled.** See the architecture decisions section above. Likely trigger: Module 6.4's memory tools. Not guaranteed to be exactly then — don't force it just because a module number passes.
- **Transient Anthropic API failures (429s, timeouts) have no retry logic.** Named at 4.6, closed for real at 13.10. `sendMessage` still has no retry of its own — a real failure there is an exception, not a `tool_result`.
- **Console tool-result logging doesn't scale to large output.** A `read_file` call against a genuinely large file dumps its full contents to the console via `log()`. No truncation logic exists; none is planned until there's a felt need for it.
- **The concurrent-approval-prompt race from Module 3.4 is unchanged.** Two mutating tool calls in the same turn would still race on the one shared `readline.Interface`. Hasn't surfaced in any real demo scenario yet (never more than one mutating call per turn so far); Module 11.3's Discord-based approval mechanism won't have this problem at all once it exists.
- **Prompt-injection defense doesn't exist yet.** Named as Module 5.5's job specifically — the first stop on the deferred-hardening map, and now a real target with real file/command tools to attack, not a hypothetical one.

## Deviations from the outline

None as of this tag. (The `verify_project`/`src/tools/` misplacement described in the "Last updated" note above was caught and corrected *before* this tag — `docs/course-outline.md` and the actual code now agree, so it's not a live deviation, just worth remembering it happened and why.)

## Handoff note to next agent

Modules 0 through 4 are all built, lessoned, and tagged (`module-0`
through `module-4`). Module 4's eight sub-lessons are real, individually
checkpointed live sessions, not narrated summaries — including one section
(4.3) that got fully rebuilt live after an early attempt skipped the actual
interactive back-and-forth, and one section (4.7) whose lesson was rewritten
twice: once to get real, unforced proof of the boundary check instead of an
assumption, and once to reframe the whole section around the actual
strongest finding (the same request producing two different outcomes on
identical code) instead of a weaker, hedged version of it.

**No handoff point lands exactly here** — per `docs/course-outline.md`'s
Handoff Points table, Handoff Point A already landed after Module 3, and
Handoff Point B is after Module 6 (once persisted memory exists). Module 4
ending is still a clean, low-risk place to stop — a whole module boundary,
just not one of the specially-marked points — and this session is stopping
here deliberately, not defaulting to it because nothing better was
available.

**Module 5 — Prompt Engineering — is next.** No new agent capabilities;
the work is hardening what Module 4 built. 5.1–5.4 are routine (prompts as
contracts, failure modes, A/B testing, structured output); 5.5 is the deep
one — a real, live injection-testing attempt against this actual agent, not
a description of what an attack would look like, and the first row closed
on the deferred-hardening map. 5.6 extends 5.3's A/B discipline to
versioning; 5.7 is the module's "how the real tools do it" close.

**Process rules tightened this session, live**, in
`docs/teaching-style-prompt.md` and `AGENTS.md` (both mirrored in
`agent-foundry-template`) — not restated here to avoid a second, driftable
copy, but worth knowing they exist before assuming the rules are unchanged
from the last handoff:

- Lessons (written *and* live-delivered) read as one continuous narrative, not a citation trail — sparing callbacks, no internal-doc references, no citation-stacking.
- Live delivery can use real markdown structure (headers, lists) when it helps legibility — reversed from an earlier, stricter "flowing prose only" rule once it became clear the actual problem was citation-stacking, not structure itself.
- Anything meant to be copied (a CLI prompt, a command) goes in a fenced code block, not bold — the chat surface only renders a copy affordance for code blocks.
- A tempting-but-not-worth-building naive approach (a security half-measure, for instance) can be argued through in prose instead of actually built and run, when building it would itself be poor practice.
- A sub-lesson with multiple substantial, separately-reasoned pieces (a refactor plus a new capability plus tests, for instance) gets a real stop per piece, not narration-while-batching followed by one combined check at the end.
- A planning-doc detail (a specific file path, a module assignment) written before the relevant code existed needs re-verifying against the code's real current shape before being executed, not treated as settled just because it was written down once — this is exactly what caught and fixed the `verify_project`/`src/tools/` misplacement described above.
- Use the agent for real engineering work on its own codebase (a refactor it's now capable of doing, not just the feature currently being taught) wherever that's a genuine opportunity, not forced.

The template-sync workflow (root-commit rewrite via `git rebase -i --root`,
re-tag, `--force-with-lease` push, done separately for each of `AGENTS.md`,
`CLAUDE.md`, `docs/course-outline.md`, `docs/teaching-style-prompt.md`) got
real, repeated practice this session — seven full sync passes, including one
that required manually resolving a real conflict (a doc-only commit whose
content was already folded into the amended root). `README.md` is
explicitly **not** part of that byte-identical-root mechanism — it
intentionally diverges (the template keeps a "Start here" bootstrap banner
this repo deleted once Module 0 was actually built).
