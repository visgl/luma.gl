// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {startExclusiveExample} from '../../website/src/react-luma/utils/example-lifecycle';

describe('example lifecycle', () => {
  it('stops the active example before starting the next one', async () => {
    const events: string[] = [];
    const errors: unknown[] = [];
    const stopFirst = startExclusiveExample({
      start: () => {
        events.push('start first');
      },
      stop: () => {
        events.push('stop first');
      },
      onError: error => errors.push(error)
    });
    const stopSecond = startExclusiveExample({
      start: () => {
        events.push('start second');
      },
      stop: () => {
        events.push('stop second');
      },
      onError: error => errors.push(error)
    });

    await waitForLifecycleQueue();
    expect(events).toEqual(['start first', 'stop first', 'start second']);
    expect(errors).toEqual([]);

    stopFirst();
    stopSecond();
    await waitForLifecycleQueue();
    expect(events).toEqual(['start first', 'stop first', 'start second', 'stop second']);
  });

  it('does not start a session that is stopped while waiting', async () => {
    const events: string[] = [];
    let finishStart: (() => void) | undefined;
    const startBarrier = new Promise<void>(resolve => {
      finishStart = resolve;
    });
    const stopFirst = startExclusiveExample({
      start: async () => {
        events.push('start first');
        await startBarrier;
      },
      stop: () => {
        events.push('stop first');
      },
      onError: error => {
        throw error;
      }
    });
    const stopSecond = startExclusiveExample({
      start: () => {
        events.push('start second');
      },
      stop: () => {
        events.push('stop second');
      },
      onError: error => {
        throw error;
      }
    });
    stopSecond();

    await Promise.resolve();
    finishStart!();
    await waitForLifecycleQueue();
    expect(events).toEqual(['start first']);

    stopFirst();
    await waitForLifecycleQueue();
    expect(events).toEqual(['start first', 'stop first']);
  });

  it('reports startup errors before stopping the failed session', async () => {
    const events: string[] = [];
    startExclusiveExample({
      start: () => {
        events.push('start');
        throw new Error('startup failed');
      },
      stop: () => {
        events.push('stop');
      },
      onError: error => {
        events.push(`error: ${(error as Error).message}`);
      }
    });

    await waitForLifecycleQueue();
    expect(events).toEqual(['start', 'error: startup failed', 'stop']);
  });
});

async function waitForLifecycleQueue(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
}
