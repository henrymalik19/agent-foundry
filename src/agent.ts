import { exec } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import type Anthropic from '@anthropic-ai/sdk';
import { log } from './log.ts';

const execAsync = promisify(exec);

const MODEL = 'claude-sonnet-5';

const PROJECT_ROOT = process.cwd();

export function assertInBounds(userPath: string): void {
  const resolved = resolve(PROJECT_ROOT, userPath);
  if (resolved !== PROJECT_ROOT && !resolved.startsWith(PROJECT_ROOT + sep)) {
    throw new Error(`Path "${userPath}" is outside the project root.`);
  }
}

const SYSTEM_PROMPT = `You are a coding assistant with direct access to a real project's files and shell.

- Read a file before changing it if you haven't already seen its current contents in this conversation — don't guess at what's there.
- When you're not sure whether something worked, check with a tool instead of assuming. Prefer the project's own verification commands (lint, typecheck, tests) over your own judgment when they're available.
- Only make the changes actually asked for. Don't refactor, clean up, or expand scope unless asked.
- Explain what you're doing and why before a tool call that changes something, not just after.
- Be direct and concise. Skip the preamble.`;

export type AnthropicClient = {
  messages: {
    create: (
      params: Anthropic.MessageCreateParamsNonStreaming,
    ) => Promise<Anthropic.Message>;
  };
};

const tools: Anthropic.Tool[] = [
  {
    name: 'get_current_time',
    description: 'Returns the current date and time.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'calculate',
    description: 'Performs a single arithmetic operation on two numbers.',
    input_schema: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'The first number.' },
        b: { type: 'number', description: 'The second number.' },
        operator: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: 'Which operation to perform on a and b.',
        },
      },
      required: ['a', 'b', 'operator'],
    },
  },
  {
    name: 'remember_fact',
    description:
      'Stores a fact for later recall. Use this when the user asks you to remember something.',
    input_schema: {
      type: 'object',
      properties: {
        fact: { type: 'string', description: 'The fact to remember.' },
      },
      required: ['fact'],
    },
  },
  {
    name: 'read_file',
    description:
      'Reads the contents of a file at the given path, relative to the project root. Use this to see what a file actually contains before answering questions about it or making changes.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file, relative to the project root.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description:
      "Writes content to a file at the given path, relative to the project root. Creates the file (and any missing parent directories) if it does not exist, and completely overwrites it if it does. Use this to create new files or replace a file's entire contents.",
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file, relative to the project root.',
        },
        content: {
          type: 'string',
          description: 'The full contents to write to the file.',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_command',
    description:
      'Runs a shell command and returns its exit code, stdout, and stderr. Use this to run tests, check git status, install dependencies, or anything else a terminal command can do.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to run.',
        },
        cwd: {
          type: 'string',
          description:
            'Working directory to run the command in, relative to the project root. Defaults to the project root if omitted.',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'verify_project',
    description:
      "Runs the project's own lint, typecheck, test, and format checks and reports whether they all pass. Use this to check your own work after making a change, instead of assuming it worked.",
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

type ToolCapability = 'read' | 'mutate';

const toolCapabilities: Record<string, ToolCapability> = {
  get_current_time: 'read',
  calculate: 'read',
  remember_fact: 'mutate',
  read_file: 'read',
  write_file: 'mutate',
  run_command: 'mutate',
  verify_project: 'read',
};

const rememberedFacts: string[] = [];

type ToolHandler = (input: Record<string, unknown>) => unknown;

const toolHandlers: Record<string, ToolHandler> = {
  get_current_time: () => new Date().toString(),
  calculate: (input) => {
    const { a, b, operator } = input as { a: number; b: number; operator: string };
    switch (operator) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero');
        }
        return a / b;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  },
  remember_fact: (input) => {
    const { fact } = input as { fact: string };
    rememberedFacts.push(fact);
    return `Remembered: ${fact}`;
  },
  read_file: async (input) => {
    const { path } = input as { path: string };
    assertInBounds(path);
    return await readFile(path, 'utf-8');
  },
  write_file: async (input) => {
    const { path, content } = input as { path: string; content: string };
    assertInBounds(path);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf-8');
    return `Wrote ${path}`;
  },
  run_command: async (input) => {
    const { command, cwd } = input as { command: string; cwd?: string };
    if (cwd) {
      assertInBounds(cwd);
    }
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd ?? '.',
        timeout: 30_000,
      });
      return { exitCode: 0, stdout, stderr };
    } catch (error) {
      const execError = error as { code?: number; stdout?: string; stderr?: string };
      return {
        exitCode: execError.code ?? 1,
        stdout: execError.stdout ?? '',
        stderr: execError.stderr ?? '',
      };
    }
  },
  verify_project: async () => {
    try {
      const { stdout, stderr } = await execAsync(
        'pnpm lint && pnpm typecheck && pnpm test && pnpm format:check',
        { timeout: 60_000 },
      );
      return { passed: true, output: stdout + stderr };
    } catch (error) {
      const execError = error as { stdout?: string; stderr?: string };
      return {
        passed: false,
        output: (execError.stdout ?? '') + (execError.stderr ?? ''),
      };
    }
  },
};

export type ApprovalRequester = (toolName: string, input: unknown) => Promise<boolean>;

export type Mode = 'default' | 'plan' | 'accept-all';

async function sendMessage(
  client: AnthropicClient,
  messages: Anthropic.MessageParam[],
): Promise<Anthropic.Message> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
    tools,
  });

  log('response', {
    stop_reason: response.stop_reason,
    usage: response.usage,
    content: response.content,
  });

  messages.push({ role: 'assistant', content: response.content });

  return response;
}

export async function runAgent(
  client: AnthropicClient,
  messages: Anthropic.MessageParam[],
  userInput: string,
  requestApproval: ApprovalRequester,
  mode: Mode,
): Promise<{ reply: string; messages: Anthropic.MessageParam[] }> {
  messages.push({ role: 'user', content: userInput });

  let response = await sendMessage(client, messages);

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        try {
          const handler = toolHandlers[block.name];
          if (!handler) {
            throw new Error(`No handler for tool: ${block.name}`);
          }

          const capability = toolCapabilities[block.name];

          if (capability === 'mutate' && mode === 'plan') {
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content:
                'Denied: the session is in plan mode (read-only). No mutating tool calls are permitted right now.',
            };
          }

          if (capability === 'mutate' && mode === 'default') {
            const approved = await requestApproval(block.name, block.input);
            if (!approved) {
              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: 'The user denied this tool call.',
              };
            }
          }

          const result = await handler(block.input as Record<string, unknown>);
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          };
        } catch (error) {
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: error instanceof Error ? error.message : String(error),
            is_error: true,
          };
        }
      }),
    );

    log('toolResults', toolResults);
    messages.push({ role: 'user', content: toolResults });

    response = await sendMessage(client, messages);
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  return {
    reply: textBlock?.type === 'text' ? textBlock.text : '',
    messages,
  };
}
