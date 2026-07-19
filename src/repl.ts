import { createInterface } from 'node:readline/promises';
import type Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import { runAgent } from './agent.ts';

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

    const result = await runAgent(messages, userInput);
    messages = result.messages;
    console.log(chalk.cyan('agent ›'), result.reply, '\n');
  }

  rl.close();
}
