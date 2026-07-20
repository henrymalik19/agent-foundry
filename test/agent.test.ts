import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import type Anthropic from '@anthropic-ai/sdk';
import {
  assertInBounds,
  runAgent,
  type AnthropicClient,
  type ApprovalRequester,
  type Mode,
} from '../src/agent.ts';

function toolUseMessage(toolName: string, input: unknown): Anthropic.Message {
  return {
    id: 'msg_test_tool_use',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    container: null,
    stop_details: null,
    stop_sequence: null,
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 'toolu_test', name: toolName, input }],
    usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as Anthropic.Message;
}

function textMessage(text: string): Anthropic.Message {
  return {
    id: 'msg_test_text',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    container: null,
    stop_details: null,
    stop_sequence: null,
    stop_reason: 'end_turn',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as Anthropic.Message;
}

function fakeClient(responses: Anthropic.Message[]): AnthropicClient {
  let index = 0;
  return {
    messages: {
      create: async () => {
        const response = responses[index];
        index += 1;
        if (!response) {
          throw new Error('fakeClient: no more responses queued');
        }
        return response;
      },
    },
  };
}

function countingApproval(answer: boolean): {
  requester: ApprovalRequester;
  calls: number[];
} {
  const calls: number[] = [];
  const requester: ApprovalRequester = async () => {
    calls.push(1);
    return answer;
  };
  return { requester, calls };
}

const SCRATCH_PATH = 'scratch/test-write.txt';

after(() => {
  rmSync('scratch', { recursive: true, force: true });
});

describe('assertInBounds', () => {
  test('allows a plain in-project relative path', () => {
    assert.doesNotThrow(() => assertInBounds('src/agent.ts'));
  });

  test('allows a path with ".." that resolves back inside the project', () => {
    assert.doesNotThrow(() => assertInBounds('src/../src/agent.ts'));
  });

  test('rejects a relative path that escapes the project', () => {
    assert.throws(() => assertInBounds('../etc/passwd'), /outside the project root/);
  });

  test('rejects an absolute path outside the project', () => {
    assert.throws(() => assertInBounds('/etc/passwd'), /outside the project root/);
  });
});

describe('the approval gate', () => {
  test('a read-capability tool never asks for approval', async () => {
    const client = fakeClient([
      toolUseMessage('get_current_time', {}),
      textMessage('It is now.'),
    ]);
    const { requester, calls } = countingApproval(true);

    await runAgent(client, [], 'what time is it?', requester, 'default');

    assert.equal(calls.length, 0);
  });

  test('default mode asks exactly once, and approval lets the write happen', async () => {
    const client = fakeClient([
      toolUseMessage('write_file', { path: SCRATCH_PATH, content: 'approved' }),
      textMessage('Done.'),
    ]);
    const { requester, calls } = countingApproval(true);

    await runAgent(client, [], 'write it', requester, 'default');

    assert.equal(calls.length, 1);
    assert.equal(existsSync(SCRATCH_PATH), true);
    assert.equal(readFileSync(SCRATCH_PATH, 'utf-8'), 'approved');
  });

  test('default mode asks exactly once, and denial blocks the write', async () => {
    rmSync(SCRATCH_PATH, { force: true });
    const client = fakeClient([
      toolUseMessage('write_file', { path: SCRATCH_PATH, content: 'denied' }),
      textMessage('Okay, not writing it.'),
    ]);
    const { requester, calls } = countingApproval(false);

    await runAgent(client, [], 'write it', requester, 'default');

    assert.equal(calls.length, 1);
    assert.equal(existsSync(SCRATCH_PATH), false);
  });

  test('plan mode denies without ever asking, and blocks the write', async () => {
    const client = fakeClient([
      toolUseMessage('write_file', { path: SCRATCH_PATH, content: 'plan mode' }),
      textMessage('Can’t write in plan mode.'),
    ]);
    const { requester, calls } = countingApproval(true);

    await runAgent(client, [], 'write it', requester, 'plan' as Mode);

    assert.equal(calls.length, 0);
    assert.equal(existsSync(SCRATCH_PATH), false);
  });

  test('accept-all mode runs the write without asking', async () => {
    const client = fakeClient([
      toolUseMessage('write_file', { path: SCRATCH_PATH, content: 'accept-all' }),
      textMessage('Written.'),
    ]);
    const { requester, calls } = countingApproval(true);

    await runAgent(client, [], 'write it', requester, 'accept-all' as Mode);

    assert.equal(calls.length, 0);
    assert.equal(existsSync(SCRATCH_PATH), true);
    assert.equal(readFileSync(SCRATCH_PATH, 'utf-8'), 'accept-all');
  });
});
