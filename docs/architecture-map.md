# Architecture Map — living diagram

Human-facing: what exists in the system so far, one piece added per module.
Not a full tree dump — see `PROJECT_STATE.md`'s "File manifest" for that.
Updated at the end of every module, per `AGENTS.md`'s "Before ending a
session."

## Module 0 — Environment scaffold

No agent architecture yet — this module is tooling only, nothing the agent
itself is built from.

```
agent-foundry/
├── src/
│   └── index.ts        (empty — the permanent thin entry point;
│                         Module 2.1 wires it to agent.ts)
├── lessons/
│   └── module-0/
│       └── lesson-0.md
├── package.json         (pnpm, TypeScript, ESLint, Prettier — devDeps only)
├── tsconfig.json         (strict, ES2023/nodenext, no build step)
├── eslint.config.js      (flat config)
├── .prettierrc.json / .prettierignore  (code only — prose docs excluded)
├── .env.example          (ANTHROPIC_API_KEY= — blank, no key used yet)
└── .nvmrc                (24.18.0)
```

**What you can show now:** `node src/index.ts` runs cleanly with zero build
step, and `pnpm lint`/`typecheck`/`format:check`/`test` all pass — the
tooling foundation every later module builds on, verified working before any
agent code exists.

**Next piece to land here:** Module 2.1 puts real content in `src/index.ts`
and creates `src/agent.ts` — the first thing this diagram will show as an
actual agent, not just scaffold.

## Module 1 — How LLMs Actually Work

No architecture change — this module is conceptual only, no code and no
live API call by design (see the outline's Module 1 entry). The diagram
picks back up at Module 2.

## Module 2 — Your First API Call

The first real agent exists now — a genuine call to Claude, not a mock. By
the end of the module, conversation state has moved out of `agent.ts`
entirely and into a real, permanent CLI.

```
agent-foundry/
├── src/
│   ├── agent.ts         (the permanent, growing agent file — starts here,
│   │                     never rebuilt, only extended by every later module)
│   │   ├── client = new Anthropic()          (reads ANTHROPIC_API_KEY from env)
│   │   ├── MODEL = 'claude-sonnet-5'         (pinned per 1.4)
│   │   └── sendMessage(messages)             (private — one API call)
│   │       ├── calls client.messages.create({ model, max_tokens, messages })
│   │       ├── logs stop_reason + usage + raw content blocks (2.4 —
│   │       │   teaching-grade visibility only; real structured logging
│   │       │   is Module 13.1's job)
│   │       ├── pushes response.content back onto the messages array passed
│   │       │   in (raw blocks, not just text — already forward-compatible
│   │       │   for Module 3's tool_use blocks)
│   │       └── returns the full response
│   ├── repl.ts          (Project 1's actual, permanent CLI, built at 2.3 —
│   │                     the second of two real interfaces this project will
│   │                     have, Module 12.4's web frontend being the other)
│   │   ├── runRepl()
│   │   │   ├── owns messages: MessageParam[] = []  (local to one CLI
│   │   │   │   session — the real fix for the multi-conversation bug: no
│   │   │   │   more module-scope state in agent.ts for two conversations
│   │   │   │   to collide over)
│   │   │   ├── owns the one readline.Interface for the whole session
│   │   │   ├── loops: rl.question('you › ') → sendMessage(messages) →
│   │   │   │   print reply via chalk
│   │   │   └── exits gracefully (not a crash) on piped-stdin EOF
│   ├── log.ts           (small log(label, data) helper, 2.4 — plain ANSI,
│   │                     no dependency, teaching-grade only)
│   └── index.ts         (permanent, two lines: import { runRepl } from
│                          './repl.ts'; await runRepl(); — will not change
│                          again for the rest of the course)
└── (rest of scaffold unchanged since Module 0)
```

**What you can show now:** `node --env-file=.env src/index.ts` starts a real,
open-ended CLI session — type a message, get a real reply, watch the full
response object (`stop_reason`/`usage`/`content`) get logged above it, type
`exit` to leave cleanly. Real multi-turn memory (a fact stated in one message
is correctly recalled later in the same session), full visibility into what
the API actually sends back on every turn, and conversation state that's
explicitly owned by the CLI session rather than smeared across module scope
— the design that survives a second, independent conversation without either
one leaking into the other.

**Next piece to land here:** Module 3 adds tool definitions, the execution
loop, and approval gates to this same `agent.ts` — the first `tool_use`
content blocks will actually appear in the array `sendMessage` already logs.

## Module 3 — Tool Use (through 3.4)

The agent can now act, not just talk and remember — with a real approval
gate standing between a model's request and anything that actually mutates
state.

```
agent-foundry/
├── src/
│   ├── agent.ts
│   │   ├── tools: Anthropic.Tool[]           (3.1 schema, 3.2 real tools:
│   │   │                                      get_current_time, calculate;
│   │   │                                      3.4 adds remember_fact)
│   │   ├── toolCapabilities: Record<string,
│   │   │     'read' | 'mutate'>              (3.4 — a separate map from the
│   │   │                                      tools array; capability is a
│   │   │                                      property of the tool, decided
│   │   │                                      once, not judged per call)
│   │   ├── rememberedFacts: string[]          (3.4 — trivial in-memory state
│   │   │                                      for the one demo mutating tool)
│   │   ├── toolHandlers: Record<string,
│   │   │     ToolHandler>                    (3.3 — real functions behind
│   │   │                                      every schema)
│   │   ├── export type ApprovalRequester =
│   │   │     (toolName, input) => Promise<boolean>  (3.4 — agent.ts declares
│   │   │                                      only the shape; never creates
│   │   │                                      its own readline.Interface)
│   │   ├── sendMessage(messages)              (unchanged shape from Module 2
│   │   │                                      — one API call, now with
│   │   │                                      tools attached)
│   │   └── export runAgent(messages, userInput, requestApproval)  (3.3 —
│   │       the execution loop, new this module)
│   │       ├── pushes the user turn
│   │       ├── while (response.stop_reason === 'tool_use'):
│   │       │   ├── filters tool_use blocks (a turn can hold more than one)
│   │       │   ├── gates mutating calls through the injected
│   │       │   │   requestApproval before running the handler — denial
│   │       │   │   returns an honest tool_result, never a thrown error or
│   │       │   │   silence
│   │       │   ├── runs approved/read handlers via Promise.all
│   │       │   ├── pushes tool_results keyed by tool_use_id
│   │       │   └── calls sendMessage again
│   │       └── returns { reply, messages } once stop_reason isn't tool_use
│   └── repl.ts
│       ├── requestApproval(rl, toolName, input)  (3.4 — reuses the CLI's
│       │     one readline.Interface; fails closed if rl.question throws)
│       └── passes it into runAgent as a closure over the one rl it owns
└── (rest of scaffold unchanged since Module 2)
```

**What you can show now:** `node --env-file=.env src/index.ts`, then type a
message that needs both a read-only tool and a mutating one — e.g. "what
time is it, and please remember that my favorite color is teal." Both tools
get requested in one turn; `get_current_time` runs immediately with no
prompt; `remember_fact` genuinely pauses the CLI with a real
`(y/n)` prompt, and the final answer honestly reflects whichever way that
prompt was answered — including a real "I wasn't able to remember that"
when denied, not a false claim of success.

**Known, named, not fixed:** two mutating tool calls in the same turn would
race on the one shared `readline.Interface` — doesn't surface in today's
demo scenario (only ever one mutating call per turn), and Module 11.3's
Discord-based approval mechanism won't have this problem at all once it
exists.

**Module 3.5** compared this design to Claude Code's actual tool permission
system — no code change (a comparison lesson): auto-allowed reads match,
but a configurable per-project gate, per-command gradation inside a single
tool, and session-wide modes are all real axes the binary `toolCapabilities`
map doesn't have. Confirmed as the right simplification for now, with a
real, already-planned place it gets revisited (Module 4.3's least-privilege
tiers), not an invented one. Module 3 is complete and tagged (`module-3`).

**Next piece to land here:** Module 4 is where this same gate starts
protecting real file writes and shell commands instead of a toy
`remember_fact`, and where the binary classification grows into real
least-privilege tiers (4.3).

## Module 4 — Building the Code Assistant

`agent.ts` becomes a real code assistant this module — it reads and writes
real files, runs real shell commands, follows a static system prompt
instead of improvising its own rules, recovers from its own tool failures
instead of crashing, and refuses to leave the project directory. The
binary approval gate from Module 3 grows a second, independent axis
(session-wide mode), and the whole thing gets its first automated tests
and CI.

```
agent-foundry/
├── src/
│   ├── agent.ts
│   │   ├── PROJECT_ROOT = process.cwd()       (4.7 — captured once at
│   │   │                                      module load)
│   │   ├── export assertInBounds(userPath)    (4.7 — resolve-then-check,
│   │   │                                      not a `..`-string blocklist;
│   │   │                                      compares against
│   │   │                                      PROJECT_ROOT + sep so a
│   │   │                                      sibling dir with a shared
│   │   │                                      prefix isn't a false positive)
│   │   ├── SYSTEM_PROMPT                      (4.5 — static module-level
│   │   │                                      constant, passed as `system`
│   │   │                                      in the one create() call;
│   │   │                                      replaced improvised,
│   │   │                                      restart-to-restart
│   │   │                                      inconsistent answers about
│   │   │                                      the agent's own rules)
│   │   ├── export type AnthropicClient        (4.8 — narrow structural
│   │   │                                      type, one method:
│   │   │                                      messages.create; makes a
│   │   │                                      scripted test double trivial)
│   │   ├── tools: Anthropic.Tool[]            (4.1 read_file, 4.2
│   │   │                                      write_file, 4.4 run_command
│   │   │                                      + verify_project added to
│   │   │                                      the Module 3 three)
│   │   ├── toolCapabilities                   ('read'/'mutate' extended:
│   │   │                                      read_file/verify_project →
│   │   │                                      read; write_file/run_command
│   │   │                                      → mutate)
│   │   ├── toolHandlers
│   │   │   ├── read_file                      (4.1 — assertInBounds, then
│   │   │   │                                  readFile)
│   │   │   ├── write_file                     (4.2 — assertInBounds, mkdir
│   │   │   │                                  recursive, full-overwrite
│   │   │   │                                  writeFile; no targeted-edit
│   │   │   │                                  variant, ever, by design)
│   │   │   ├── run_command                    (4.4 — assertInBounds on an
│   │   │   │                                  optional cwd; the command
│   │   │   │                                  string itself is never
│   │   │   │                                  inspected; returns
│   │   │   │                                  { exitCode, stdout, stderr }
│   │   │   │                                  instead of throwing on a
│   │   │   │                                  nonzero exit)
│   │   │   └── verify_project                 (4.4 — one fixed command,
│   │   │                                      no input schema, no cwd
│   │   │                                      dependency)
│   │   ├── export sendMessage(client, messages)  (4.8 — client is now an
│   │   │                                      explicit parameter, no
│   │   │                                      module-level Anthropic
│   │   │                                      instance)
│   │   └── export runAgent(client, messages,
│   │         userInput, requestApproval, mode)
│   │       ├── while (stop_reason === 'tool_use'):
│   │       │   └── each tool_use block resolves inside one try/catch
│   │       │       (4.6 — handler lookup, mode/approval gating, and the
│   │       │       handler call all share one boundary; any failure
│   │       │       becomes an honest tool_result with is_error: true,
│   │       │       never an uncaught crash)
│   │       │       ├── capability === 'mutate' && mode === 'plan' →
│   │       │       │   denied before requestApproval is ever called (4.3)
│   │       │       ├── capability === 'mutate' && mode === 'default' →
│   │       │       │   requestApproval, same as Module 3.4
│   │       │       └── capability === 'mutate' && mode === 'accept-all' →
│   │       │           no dedicated branch; falls through to the same
│   │       │           unconditional run a 'read' tool already takes
│   │       └── logs the real toolResults array via log() (4.4 — closes
│   │           the same visibility gap 2.4 closed on the response side)
│   └── repl.ts
│       ├── mode: Mode = 'default'             (4.3 — local state, owned
│       │                                      by the CLI same as messages)
│       ├── client = new Anthropic()           (4.8 — constructed once
│       │                                      here, passed into every
│       │                                      runAgent call)
│       ├── /mode [default|plan|accept-all]    (4.3 — the CLI's first real
│       │                                      command-parsing branch;
│       │                                      handled locally, never
│       │                                      reaches the model)
│       └── prompt label shows the active mode when it isn't 'default'
│           (e.g. "you (plan) › " — a real status indicator, not
│           decoration)
├── test/
│   └── agent.test.ts                          (4.8 — new. describe
│       ├── assertInBounds: 4 direct cases      ('assertInBounds', ...):
│       └── the approval gate: 5 cases through   4 direct cases; describe
│           real runAgent calls against a        ('the approval gate', ...):
│           scripted fake AnthropicClient,       5 cases via real runAgent
│           observing write_file's real          calls, verified via
│           filesystem side effect, not          write_file's real
│           exported internals                   filesystem side effect
└── .github/
    └── workflows/
        └── ci.yml                              (4.8 — pnpm install
                                                 --frozen-lockfile, then
                                                 pnpm test, on every push
                                                 and pull request)
```

**A real correction, worth keeping visible here too:** `verify_project` and
a `src/tools/` directory split were both originally built as part of 4.8,
following a process-doc note that had crept in without ever being approved.
Neither belonged there — `verify_project` is one more real tool, not test
infrastructure, so it moved to 4.4 alongside `run_command` (and its handler
was fixed to not depend on `PROJECT_ROOT`, which doesn't exist until 4.7 —
that would have been a real timeline contradiction). The `src/tools/` split
isn't testing-related at all, and pinning it to a module number was
manufacturing a deadline rather than responding to a felt need; it's now
documented as deliberately emergent and unscheduled, most likely (not
guaranteed) around Module 6.4's memory tools. See `PROJECT_STATE.md`'s
"Last updated" note and `docs/course-outline.md`'s Project Architecture
section for the full detail.

**What you can show now:** `node --env-file=.env src/index.ts`, then a real
end-to-end sequence — ask the agent to read a file, change something in it,
run the project's own checks via `verify_project`, and watch it report
honestly whether they passed. Try `/mode plan` and ask for a file write:
denied instantly, no prompt. Try asking it to read a file outside the
project (e.g. `../../etc/passwd`): a real, code-level rejection, not the
model's own judgment call. Separately, `pnpm test` runs the full suite
(9/9 passing) with zero network calls, and the same command runs in CI on
every push.

**Known, named, not fixed:** `run_command`'s command string is completely
unconstrained — the boundary check covers structured path arguments
(`path`, `cwd`) but cannot, and doesn't try to, inspect free text run
through a shell. A keyword blocklist was considered and explicitly
rejected as worse than no attempt at all. Module 5.5 is the first
scheduled attempt at hardening around this class of problem, not a fix
for this specific gap.

Module 4 is complete and tagged (`module-4`).

**Next piece to land here:** Module 5 adds no new capability to `agent.ts`
— it's a hardening module. The one piece that will show up here is 5.5's
live injection-testing pass against this real agent, the first row closed
on the deferred-hardening map.
