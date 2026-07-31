// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import GPUFrustumCullingAnimationLoopTemplate from '../../examples/experimental/gpu-frustum-culling/app';

describe('GPU frustum culling', () => {
  test('uses the reusable visibility workflow for indirect rendering', async () => {
    const device = await getWebGPUTestDevice('core');
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      Boolean(device.info.fallback)
    ) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'example-panel-host';
    document.body.append(host);
    let viewer: GPUFrustumCullingAnimationLoopTemplate | null = null;
    try {
      viewer = new GPUFrustumCullingAnimationLoopTemplate({
        device,
        cullingCapacity: 4096
      } as AnimationProps & {cullingCapacity: number});
      const state = viewer as unknown as {
        resources: {
          compiled: {stats: {nodeOrder: string[]}};
          drawCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
        };
      };
      const nodeOrder = state.resources.compiled.stats.nodeOrder;
      expect(nodeOrder).toContain('visible-instances-identity');
      expect(nodeOrder.some(id => id.startsWith('visible-instances-compact'))).toBe(true);

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
      expect(command[1]).toBeLessThanOrEqual(4096);
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);
});
