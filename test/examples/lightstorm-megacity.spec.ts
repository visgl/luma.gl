// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import LightstormMegacityAnimationLoopTemplate from '../../examples/showcase/lightstorm-megacity/app';

describe('Lightstorm Megacity', () => {
  test('compacts visible city records into an indirect draw', async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'example-panel-host';
    document.body.append(host);
    let viewer: LightstormMegacityAnimationLoopTemplate | null = null;
    try {
      viewer = new LightstormMegacityAnimationLoopTemplate({
        device,
        lightstormCapacity: 2048
      } as AnimationProps & {lightstormCapacity: number});
      const state = viewer as unknown as {
        resources: {
          compiled: {stats: {nodeOrder: string[]}};
          drawCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
        };
      };
      const nodeOrder = state.resources.compiled.stats.nodeOrder;
      expect(nodeOrder).toContain('visible-city-records-identity');
      expect(
        nodeOrder.some(identifier => identifier.startsWith('visible-city-records-compact'))
      ).toBe(true);

      viewer.onRender({
        device,
        time: 1000,
        width: 800,
        height: 600,
        animationLoop: {
          frameRate: {getSampleHz: () => 60},
          cpuTime: {getSampleAverageTime: () => 1},
          gpuTime: {getSampleAverageTime: () => 1}
        }
      } as unknown as AnimationProps);
      device.submit();

      const bytes = await state.resources.drawCommands.buffer.readAsync();
      const command = new Uint32Array(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(command[1]).toBeGreaterThan(0);
      expect(command[1]).toBeLessThanOrEqual(2048);
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);
});
