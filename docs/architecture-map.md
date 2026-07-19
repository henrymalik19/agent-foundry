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
