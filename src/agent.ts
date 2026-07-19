import Anthropic from '@anthropic-ai/sdk';
import { log } from './log.ts';

const MODEL = 'claude-sonnet-5';

const client = new Anthropic();

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
];

type ToolCapability = 'read' | 'mutate';

const toolCapabilities: Record<string, ToolCapability> = {
  get_current_time: 'read',
  calculate: 'read',
  remember_fact: 'mutate',
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
};

export type ApprovalRequester = (toolName: string, input: unknown) => Promise<boolean>;

async function sendMessage(
  messages: Anthropic.MessageParam[],
): Promise<Anthropic.Message> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
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
  messages: Anthropic.MessageParam[],
  userInput: string,
  requestApproval: ApprovalRequester,
): Promise<{ reply: string; messages: Anthropic.MessageParam[] }> {
  messages.push({ role: 'user', content: userInput });

  let response = await sendMessage(messages);

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const handler = toolHandlers[block.name];
        if (!handler) {
          throw new Error(`No handler for tool: ${block.name}`);
        }

        if (toolCapabilities[block.name] === 'mutate') {
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
      }),
    );

    messages.push({ role: 'user', content: toolResults });

    response = await sendMessage(messages);
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  return {
    reply: textBlock?.type === 'text' ? textBlock.text : '',
    messages,
  };
}
