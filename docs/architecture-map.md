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
