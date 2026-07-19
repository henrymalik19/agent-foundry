import { createInterface, type Interface } from 'node:readline/promises';
import type Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import { runAgent } from './agent.ts';

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
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  while (true) {
    let userInput: string;
    try {
      userInput = await rl.question(chalk.green('you › '));
    } catch {
      // stdin closed (e.g. piped input reached EOF) - not a live terminal,
      // exit gracefully instead of crashing.
      break;
    }

    if (
      userInput.trim().toLowerCase() === 'exit' ||
      userInput.trim().toLowerCase() === 'quit'
    ) {
      break;
    }

    const result = await runAgent(messages, userInput, (toolName, input) =>
      requestApproval(rl, toolName, input),
    );
    messages = result.messages;
    console.log(chalk.cyan('agent ›'), result.reply, '\n');
  }

  rl.close();
}
