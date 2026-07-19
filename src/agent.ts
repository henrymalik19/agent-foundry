import Anthropic from '@anthropic-ai/sdk';
import { log } from './log.ts';

const MODEL = 'claude-sonnet-5';

const client = new Anthropic();

async function sendMessage(
  messages: Anthropic.MessageParam[],
): Promise<Anthropic.Message> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages,
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
  messages: Anthropic.MessageParam[],
  userInput: string,
): Promise<{ reply: string; messages: Anthropic.MessageParam[] }> {
  messages.push({ role: 'user', content: userInput });

  const response = await sendMessage(messages);

  const textBlock = response.content.find((block) => block.type === 'text');
  return {
    reply: textBlock?.type === 'text' ? textBlock.text : '',
    messages,
  };
}
