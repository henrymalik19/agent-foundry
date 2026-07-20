import { createInterface, type Interface } from 'node:readline/promises';
import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import { runAgent, type Mode } from './agent.ts';

const MODES: Mode[] = ['default', 'plan', 'accept-all'];

async function requestApproval(
  rl: Interface,
  toolName: string,
  input: unknown,
): Promise<boolean> {
  let answer: string;
  try {
    answer = await rl.question(
      `Approve tool call "${toolName}" with input ${JSON.stringify(input)}? (y/n) `,
    );
  } catch {
    // stdin closed before an answer arrived - fail closed (deny), never
    // fail open. A mutating tool call should never run just because we
    // couldn't get a real answer.
    return false;
  }
  return answer.trim().toLowerCase() === 'y';
}

export async function runRepl(): Promise<void> {
  console.log(chalk.bold.cyan('\nAgent Foundry — Project 1 CLI'));
  console.log(
    chalk.gray('Type a message and press enter. Type "exit" or "quit" to leave.\n'),
  );

  let messages: Anthropic.MessageParam[] = [];
  let mode: Mode = 'default';
  const client = new Anthropic();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  while (true) {
    let userInput: string;
    try {
      const promptLabel = mode === 'default' ? 'you › ' : `you (${mode}) › `;
      userInput = await rl.question(chalk.green(promptLabel));
    } catch {
      // stdin closed (e.g. piped input reached EOF) - not a live terminal,
      // exit gracefully instead of crashing.
      break;
    }

    const trimmed = userInput.trim();

    if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
      break;
    }

    if (trimmed === '/mode' || trimmed.startsWith('/mode ')) {
      const arg = trimmed.slice('/mode'.length).trim();
      if (arg === '') {
        console.log(chalk.gray(`Current mode: ${mode}`));
      } else if (arg === 'default' || arg === 'plan' || arg === 'accept-all') {
        mode = arg;
        console.log(chalk.gray(`Mode set to: ${mode}`));
      } else {
        console.log(
          chalk.gray(`Unknown mode "${arg}". Valid modes: ${MODES.join(', ')}.`),
        );
      }
      continue;
    }

    const result = await runAgent(
      client,
      messages,
      userInput,
      (toolName, input) => requestApproval(rl, toolName, input),
      mode,
    );
    messages = result.messages;
    console.log(chalk.cyan('agent ›'), result.reply, '\n');
  }

  rl.close();
}
