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

