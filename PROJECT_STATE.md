# Project State

**Last updated:** Module 5 is complete and tagged (`module-5`). No new
agent capability landed this module — every tool, gate, and check from
Module 4 is unchanged. The work was hardening the prompt and behavior
already there: seven sub-lessons (5.1–5.7), each with a real live test
against the actual agent, not a description of what a test would show.

The module's actual throughline, in order: 5.1 reframed `SYSTEM_PROMPT` as
a set of checkable contract clauses rather than a magic string, verified
against one clause holding on a real `write_file` call; 5.2 built a
fixture designed to bait scope creep (a real bug next to unrelated dead
code flagged for removal) and found a real, predictable failure — an
unambiguous request held the "stay in scope" clause, a deliberately
ambiguous one ("clean it up") didn't; 5.3 diagnosed that failure precisely
(the clause's own "unless asked" escape hatch handed the model a fuzzy
natural-language judgment call) and closed it for real, verified by
rerunning the identical adversarial request against the reworded clause;
5.4 compared asking for JSON in prose against forcing a tool call whose
`input_schema` is the contract — the naive call came back markdown-fenced
and broke `JSON.parse` on the first character, the forced call returned an
already-validated object; 5.5, the module's deep section, ran four real,
distinct live prompt-injection attacks against the actual agent (a
dramatic destructive override, an explicit human "let it through"
framing, and two realistic low-stakes asides through both `read_file` and
`run_command`'s stdout) — all four held on the model's training alone,
with nothing in `SYSTEM_PROMPT` addressing injection at all, and a real
structural defense (every `tool_result` wrapped in `<tool_output>` tags,
plus an explicit data-boundary rule) got built anyway, on principle, since
untested-but-lucky behavior isn't the same claim as a structural
guarantee — then re-verified across both tool-result code paths after the
fact; 5.6 named a discipline that was already being practiced without a
deliberate decision to practice it (this session's own two real
`SYSTEM_PROMPT` commits already stated the specific problem, the fix, and
the real evidence that confirmed it); 5.7 closed the module by comparing
its independently-reached decisions against published guidance on
reliable tool-using agents, and made "layered defense" concrete against
this project's actual three layers (the approval gate, `assertInBounds`,
and the new `<tool_output>` boundary) — correcting a real, precise
misconception live: none of the module's four injection attacks ever
routed through a path violation, so `assertInBounds` was never the
relevant layer for that specific threat model, attended or not.

**A real, closed gap, not just another hardening pass:**
`docs/course-outline.md`'s deferred-hardening map used to list
"Prompt-injection defense" with Module 5.5 as its home. That row is now
deleted — the defense actually landed (the `<tool_output>` tag + the new
`SYSTEM_PROMPT` rule), verified against real, live attacks before and
after it existed, not just built and assumed correct. `PROJECT_STATE.md`'s
own open-gaps list had this same line; it's removed below for the same
reason.

**Two real, incidental fixes also happened this session, worth carrying
forward honestly since neither was the actual lesson content:** first, a
`scratch/` directory (used throughout the course for live checkpoint
demos and, since 4.8, the test suite's own fixture) wasn't in `.gitignore`
or `eslint.config.js`'s ignores — a real gap once `scratch/` is treated as
a standing, general-purpose convention rather than a one-off. Both got
fixed and, since the convention is genuinely foundational (the same class
of thing as `node_modules/` or `dist/`, not a module-specific addition),
backdated into Module 0's own commit via a full history rewrite (rebase
from root, replay every subsequent commit, re-tag all five module tags,
force-push) rather than left as a later patch — see `AGENTS.md`'s own
rewrite-history rule, which this matches exactly (a real correctness
issue, fixed while the repo is still solo-authored, before any tag
stability commitment to external readers). Second, the Module 4.8 test
suite's own cleanup (`rmSync('scratch', { recursive: true })`) was deleting
the *entire* `scratch/` directory on every test run, not just its own
fixture — a real collision once `scratch/` became shared space. Patched
forward at the tip rather than rewritten into Module 4's tag, since this
was a design gap exposed by a later convention, not a factual error or
timeline contradiction in Module 4.8 itself: the test's own artifact now
lives in `scratch/test/`, and cleanup is scoped to that subdirectory only.

**Next up:** Module 6 — Memory. The felt gap: the agent forgets
everything the moment the CLI process ends. This is also Handoff Point B
— the first handoff where the file manifest actually matters, once
persisted memory exists.

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
- **Every `tool_result`'s content is wrapped in `<tool_output>` tags, uniformly, not per-tool.** Built at 5.5 in `runAgent`'s tool-execution loop — both the success branch and the `catch` branch wrap `content` in `` `<tool_output>\n...\n</tool_output>` `` before it's pushed into the conversation. `SYSTEM_PROMPT`'s fifth rule names this exact tag and states plainly that content inside it is data, never an instruction, regardless of what it claims to be. This is the real, permanent defense against prompt injection — built after four real live attacks all held on the model's training alone, specifically because "it kept working when tried" isn't the same claim as a structural guarantee. Verified against both `read_file` and `run_command`'s stdout specifically, not assumed to cover both from reading the code.
- **`scratch/` is a standing, foundational convention — gitignored and eslint-ignored from Module 0's own commit, not treated as a discovered-later addition.** Used throughout the course for live checkpoint demo fixtures and (since 4.8) the test suite's own artifacts. The test suite's own usage is scoped to `scratch/test/` specifically (its `after()` hook only removes that subdirectory) so a test run never destroys unrelated demo files sitting in the shared space. Any future scratch usage should assume this convention already exists — don't re-discover the gitignore/eslint gap.
- **A prompt change is reviewable exactly the way any other code change is — the commit message has to state the evidence, not just the diff.** No new versioning system, changelog file, or registry exists or is planned for `SYSTEM_PROMPT` — it's an ordinary string constant in a git-tracked file, and git already gives it a full history the moment a change is committed. What's required (named explicitly at 5.6, demonstrated by this session's own two real `SYSTEM_PROMPT` commits) is that the commit message states the specific problem observed, what was tried, and what real evidence confirmed the fix — a message like "adjusted wording for clarity" doesn't meet that bar, the same way "fixed stuff" wouldn't for ordinary code.
- **"Anything meant to be copied goes in a fenced code block" is a general repo-wide convention, not lesson-specific.** Documented in `AGENTS.md`'s own Rules section (not just `docs/teaching-style-prompt.md`'s lesson-delivery version of the same rule) — applies to any agent session working in this repo, in any output, not only inside taught lesson content.

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
- **The prompt-injection data-boundary tag is named `<tool_output>`, exactly, everywhere.** Pinned at Module 5.5 — any future tool-result handling or documentation referencing this mechanism should use this exact tag name, not a reinvented equivalent (`<data>`, `<untrusted>`, etc.). `SYSTEM_PROMPT`'s fifth rule and `runAgent`'s tool-execution loop both reference it literally.
- **`SYSTEM_PROMPT` is six rules as of Module 5** (was five through Module 4): read-before-write, verify-don't-assume, stay-in-scope (reworded at 5.3), explain-before-acting, the `<tool_output>` data-boundary rule (new at 5.5), be-direct-and-concise. Read the actual current text directly from `src/agent.ts` rather than re-deriving it from this note — it's the real source of truth and this file doesn't duplicate it verbatim.
- ...

## File manifest

(Folder or file → one-line purpose. Not a full tree dump — only things a new agent
needs to know exist before it starts, so it extends instead of re-creates.)

**Repo structure:** single package until Module 15.0, using pnpm since Module 0.
No workspace _tooling_ before 15.0. At 15.0 this becomes a pnpm-workspace
monorepo: `packages/agent-core`, `apps/code-assistant`, `apps/email-agent`.

- `package.json` — `type: module`, `engines.node: >=24`, `packageManager` pinned. Scripts: `lint`, `typecheck`, `test`, `format`, `format:check`. Same two real dependencies as before (`@anthropic-ai/sdk`, `chalk`) — Module 4 added no new dependencies, everything new is built on Node's own `node:child_process`, `node:path`, `node:test`, `node:assert`.
- `tsconfig.json` — strict, `ES2023`/`nodenext`, `noEmit` + `allowImportingTsExtensions`. `include: ["src/**/*.ts", "test/**/*.ts"]` — the test path added at 4.8.
- `eslint.config.js` — flat config, recommended JS + typescript-eslint rules. `ignores` includes `scratch/**` (added this session, same reasoning as the `.gitignore` entry).
- `.prettierrc.json` / `.prettierignore` — code only, prose docs excluded.
- `.gitignore` — `node_modules/`, `dist/`, `.env`, `*.log`, `.DS_Store`, `scratch/` (the last entry backdated into Module 0's own commit this session — see the "Last updated" note above).
- `.env.example` — template with `ANTHROPIC_API_KEY=` (blank).
- `.nvmrc` — `24.18.0`.
- `pnpm-lock.yaml` — committed lockfile.
- `.github/workflows/ci.yml` — **new at Module 4.8**, the workflow 0.7 deferred. Runs `pnpm install --frozen-lockfile` then `pnpm test` on every push and pull request. No lint/typecheck/format step, no secrets.
- `src/agent.ts` — Project 1's real code assistant, unchanged in tool count since Module 4 (still seven: `get_current_time`, `calculate`, `remember_fact`, `read_file`, `write_file`, `run_command`, `verify_project`). `toolCapabilities` unchanged in shape (`'read' | 'mutate'`, decided once per tool). `assertInBounds` (exported) is the shared path-boundary check, called from `read_file`/`write_file`/`run_command`'s `cwd` — see the architecture note above on exactly what threat model it does and doesn't cover. `SYSTEM_PROMPT` is now **six rules** (was five through Module 4): read before writing, verify instead of assuming, a reworded stay-in-scope rule (5.3 — closes the "unless asked" ambiguity that let "clean it up" read as authorization for unrelated changes), explain before acting, a new fifth rule naming the `<tool_output>` tag as the prompt-injection data boundary (5.5), and stay concise. `AnthropicClient` (exported) is the narrow structural type for the injectable client. `ApprovalRequester` and `Mode` (both exported) are unchanged in shape from 3.4/4.3. `sendMessage(client, messages)` and `runAgent(client, messages, userInput, requestApproval, mode)` both take `client` as an explicit first parameter, unchanged since 4.8. The tool-execution loop wraps each tool call's entire resolution (lookup, mode/approval gating, handler call) in one `try`/`catch`, converting any failure into an honest `tool_result` with `is_error: true` — and now (5.5) wraps every `tool_result`'s `content`, in both the success and `catch` branches, in `<tool_output>` tags before pushing it into the conversation. Logs both the model's `response` and the real `toolResults` array via `log()`. This is the file every later module (8, 15...) grows in place — nothing here gets rebuilt.
- `src/repl.ts` — Project 1's permanent CLI. Owns the one `readline.Interface`, the one `messages` array, and (new at 4.3) the one `mode: Mode` local variable, plus (new at 4.8) the one real `Anthropic` client, constructed once and passed into every `runAgent` call. Recognizes `/mode` (with no argument, a valid mode, or an invalid one) as its own command, handled locally without ever reaching the model — the CLI's first real command-parsing branch. The prompt label itself changes to show the current mode whenever it isn't `default` (`you (plan) › `), a real safety-relevant status indicator, not decoration.
- `src/log.ts` — unchanged since 2.4. Teaching-grade visibility only.
- `src/index.ts` — unchanged, permanent, two lines.
- `test/agent.test.ts` — from Module 4.8, unchanged in test count (9/9) since. `describe('assertInBounds', ...)`: four direct cases (in-project relative path, `..`-containing path that resolves back inside, relative escape, absolute escape). `describe('the approval gate', ...)`: five cases through real `runAgent` calls against a fake, scripted `AnthropicClient` — a read tool never triggers approval; default mode asks exactly once and the answer determines the outcome (approve → file exists with right content; deny → file never appears); plan mode denies with zero approval calls (not one denied call — the suite distinguishes "never asked" from "asked and refused" by counting callback invocations, not just checking the end state); accept-all runs with zero approval calls. **Changed this session:** the suite's own fixture now lives at `scratch/test/test-write.txt`, and the `after()` hook's cleanup is scoped to `rmSync('scratch/test', ...)` specifically, not the whole `scratch/` tree — the old blanket cleanup was silently deleting unrelated demo files any time a test ran, a real collision discovered live once `scratch/` became shared, general-purpose space. Approval-gate tests still verify via `write_file`'s real filesystem side effect, never exported internals.
- `scratch/` — throwaway, gitignored, eslint-ignored space used for live checkpoint demo fixtures and (in its own `scratch/test/` subdirectory) the test suite's own artifacts. Not part of the shipped codebase; nothing here should ever be assumed to exist across sessions or referenced from `src/`.
- `lessons/module-0/lesson-0.md` through `lessons/module-4/lesson-4.8.md` — unchanged since the last handoff; see prior state for detail if ever needed (all preserved, not re-summarized here to keep this file from re-accumulating detail that doesn't change).
- `lessons/module-5/lesson-5.1.md` — Prompts as contracts. Reframes `SYSTEM_PROMPT` as checkable clauses rather than a magic string — enforced-by-nothing versus enforced-by-a-compiler is the actual distinction. Real checkpoint: the "explain before acting" clause verified against one real `write_file` call.
- `lessons/module-5/lesson-5.2.md` — Failure modes. Builds a fixture designed to bait scope creep and runs two real rounds: an unambiguous request holds the stay-in-scope clause; a deliberately ambiguous one ("clean it up") doesn't. Precise about *why* it failed — the clause's own conditional escape hatch, not the model ignoring an instruction.
- `lessons/module-5/lesson-5.3.md` — A/B testing prompts. Diagnoses the failure, rewords the clause to remove the ambiguous reading (not just discourage it), and proves the fix by rerunning the identical adversarial request. The new wording is the real, permanent `SYSTEM_PROMPT` text now, not a reverted experiment.
- `lessons/module-5/lesson-5.4.md` — Structured output. A naive "respond in JSON" call breaks `JSON.parse` on a markdown-fenced, truncated response; a forced tool call with a real `input_schema` returns an already-validated object. Frames the distinction as categorical (schema enforced before the response returns), not "usually more reliable."
- `lessons/module-5/lesson-5.5.md` — Injection testing (live), the module's deep section. Four real, distinct live attacks against the actual agent, all held on the model's training alone; the real `<tool_output>` defense got built anyway, on principle, and was re-verified across both tool-result code paths. Closes the course's first deferred-hardening row for real.
- `lessons/module-5/lesson-5.6.md` — Prompt versioning and change review. Names a discipline already being practiced without a deliberate decision to practice it — this session's own two real `SYSTEM_PROMPT` commits already state the problem, the fix, and the evidence, without any special process forcing that shape.
- `lessons/module-5/lesson-5.7.md` — How the real tools do it, the module's close. Compares the module's decisions against published guidance on reliable agents, then gets precise about which of the project's three real layers (approval gate, path-boundary check, `<tool_output>` boundary) answers which question — correcting a real misconception live rather than confirming a guess.
- `docs/architecture-map.md` — updated through Module 5 (the two real `SYSTEM_PROMPT` changes, the `<tool_output>` wrapping, what was actually tested versus just built).
- `README.md` — human-facing. Now holds stable content only, no per-module status (see architecture decisions above).

Verified working: `pnpm lint`, `pnpm typecheck`, `pnpm test` (9/9), `pnpm format:check` all pass clean at the point of tagging. Both `agent-foundry` and `agent-foundry-template`'s shared docs (`AGENTS.md`, `CLAUDE.md`, `docs/course-outline.md`, `docs/teaching-style-prompt.md`) are byte-identical at their respective root commits.

## Open gaps (intentional, not bugs)

- **`run_command`'s command string is completely unconstrained.** The boundary check (4.7) covers structured path arguments (`read_file`/`write_file`'s `path`, `run_command`'s `cwd`) but cannot, and doesn't try to, inspect the free-text shell command itself — `cat ../../etc/passwd` typed as the command sails straight through. Named honestly at 4.4 and again at 4.7; no module currently scheduled to close it. A naive fix (keyword blocklist) was considered and explicitly rejected as worse than no attempt at all.
- **`write_file` is full-overwrite-only, permanently.** No targeted `Edit`-style (`old_string`/`new_string`) tool exists or is planned — a deliberate, permanent scope simplification named at 4.2, not a deferred gap.
- **`src/tools/` split is unbuilt and deliberately unscheduled.** See the architecture decisions section above. Likely trigger: Module 6.4's memory tools. Not guaranteed to be exactly then — don't force it just because a module number passes.
- **Transient Anthropic API failures (429s, timeouts) have no retry logic.** Named at 4.6, closed for real at 13.10. `sendMessage` still has no retry of its own — a real failure there is an exception, not a `tool_result`.
- **Console tool-result logging doesn't scale to large output.** A `read_file` call against a genuinely large file dumps its full contents to the console via `log()`. No truncation logic exists; none is planned until there's a felt need for it.
- **The concurrent-approval-prompt race from Module 3.4 is unchanged.** Two mutating tool calls in the same turn would still race on the one shared `readline.Interface`. Hasn't surfaced in any real demo scenario yet (never more than one mutating call per turn so far); Module 11.3's Discord-based approval mechanism won't have this problem at all once it exists.

## Deviations from the outline

None as of this tag. Module 5 followed the outline's lesson structure and ordering exactly (5.1–5.7, in order). The `scratch/` gitignore backdate and the test-cleanup scoping fix described in the "Last updated" note above are repo-hygiene corrections, not deviations from the taught module content — `docs/course-outline.md` and the actual code agree.

## Handoff note to next agent

Modules 0 through 5 are all built, lessoned, and tagged (`module-0`
through `module-5`). Module 5's seven sub-lessons are real, individually
checkpointed live sessions against the actual running agent, not narrated
summaries — including 5.2's two-round adversarial fixture design, 5.5's
four real live attack rounds (the module's deep section), and 5.7's live
correction of a real, precise misconception about which safety layer
matters once a human checkpoint is removed.

**This is Handoff Point B** — per `docs/course-outline.md`'s Handoff
Points table, this is the first handoff where the file manifest actually
matters (Project 1 v0.1 exists: single agent, four core tools, and —
starting next module — persisted memory). Module 5 ending is a genuine,
deliberate stop here, not a default because nothing better was available.

**Module 6 — Memory — is next.** The felt gap: the agent forgets
everything the instant the CLI process exits. 6.3 (in-context vs.
persisted memory) is the module's real design decision and gets full
depth; 6.1, 6.2, 6.4–6.6, 6.9 are the surrounding build. Per the outline's
own note, 6.6 (cross-session preference learning) should be made real
against this actual project, not hypothetical — e.g. telling the agent to
always run `verify_project` before calling a task done, restarting the
CLI, and confirming it applies that preference unprompted, read back from
persisted memory rather than retyped.

**A real, closed gap, not a deferred one:** prompt-injection defense
(named at Module 5.5's outset as the first stop on the deferred-hardening
map) is now actually closed — the `<tool_output>` tag plus its
`SYSTEM_PROMPT` rule, verified against four real live attacks before and
after the defense existed. Don't re-open this or re-test it as if it were
still an open question; the remaining, still-open gaps are listed above,
and this isn't one of them anymore.

**A real git-history rewrite happened this session, worth understanding
before touching tags or `.gitignore`/`eslint.config.js`:** `scratch/`
wasn't gitignored or eslint-ignored, which surfaced as a real problem once
it started holding live checkpoint demo fixtures rather than just the test
suite's own artifact. Since `scratch/` is now a standing, foundational
convention (not a module-specific pattern discovered along the way), both
fixes were backdated into Module 0's own commit via a full rebase-from-root
rewrite — every subsequent commit replayed, all five module tags
(`module-0` through `module-4` at the time) re-pointed, branch and tags
force-pushed to `origin`. This matches `AGENTS.md`'s own rewrite-history
rule exactly (a real correctness issue, fixed while still solo-authored,
before any external tag-stability commitment) — it's not a one-off
exception to that rule, it's the rule actually being followed. If a future
session needs to do this again, `git rev-list --max-parents=0 HEAD` finds
the true root; `.gitignore` first gets real content at the *Module 0*
commit specifically (tagged `module-0`), one commit after the true root.

**Two unrelated corrections were also made live, both worth knowing about
rather than rediscovering:** the fenced-code-block-for-copyable-content
rule is now a general `AGENTS.md` convention (not just
`docs/teaching-style-prompt.md`'s lesson-specific version) — it was
initially saved as a personal memory about the user's preferences and
then correctly redirected into the course's own docs, since it's a
project convention, not something specific to one person. Separately, the
Module 4.8 test suite's cleanup was scoped down from wiping all of
`scratch/` to just its own `scratch/test/` subdirectory, patched forward
at the tip rather than rewritten into Module 4's tag (a design gap exposed
by a later convention, not a factual error in Module 4.8 itself — see the
"Last updated" note above for the reasoning on why this one didn't get the
history-rewrite treatment the `.gitignore` fix did).

**Process rules from the previous handoff are unchanged and still in
effect** (lessons read as continuous narrative not a citation trail; live
delivery can use real markdown structure; anything copy-paste-relevant
goes in a fenced code block; a not-worth-building naive approach can be
argued through in prose instead of built; a multi-piece sub-lesson gets a
real stop per piece; a planning-doc detail gets re-verified against the
code's real shape before being executed; use the agent for real work on
its own codebase when a genuine opportunity arises) — not restated in full
here to avoid a second, driftable copy of what `docs/teaching-style-prompt.md`
and `AGENTS.md` already say.
