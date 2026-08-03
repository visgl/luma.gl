// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import VirtualGeometryCanyonAnimationLoopTemplate, {
  type VirtualGeometryCanyonExampleProps
} from '../../examples/experimental/virtual-geometry-canyon/app';

describe('Virtual Geometry Canyon', () => {
  test('selects a bounded GPU frontier and feeds one indexed indirect draw', async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) {
      return;
    }

    const width = 96;
    const height = 72;
    const host = document.createElement('div');
    host.id = 'example-panel-host';
    const canvas = document.createElement('canvas');
    document.body.append(host, canvas);
    const framebuffer = device.createFramebuffer({
      id: 'virtual-geometry-canyon-test-framebuffer',
      width,
      height,
      colorAttachments: [device.preferredColorFormat],
      depthStencilAttachment: 'depth24plus'
    });
    const canvasContext = device.getDefaultCanvasContext();
    const devicePixelSize = vi
      .spyOn(canvasContext, 'getDevicePixelSize')
      .mockReturnValue([width, height]);
    // The complete SwiftShader suite can outlive Dawn's external presentation instance. Keep the
    // real graph, selection, render bundle, indexed indirect draw, submit, and GPU readback while
    // routing this focused test through a test-owned offscreen framebuffer.
    const currentFramebuffer = vi
      .spyOn(canvasContext, 'getCurrentFramebuffer')
      .mockReturnValue(framebuffer);
    let viewer: VirtualGeometryCanyonAnimationLoopTemplate | null = null;
    try {
      viewer = new VirtualGeometryCanyonAnimationLoopTemplate({
        device,
        width,
        height,
        hierarchyOptions: {rootGridSize: 1, refinementDepth: 2, rootWorldSize: 512}
      } as VirtualGeometryCanyonExampleProps);
      await viewer.onInitialize({...makeAnimationProps(device, width, height), canvas});
      viewer.onRender(makeAnimationProps(device, width, height));
      device.submit();

      expect(viewer.hierarchy.nodeCount).toBe(21);
      expect(viewer.hierarchy.leafClusterCount).toBe(16);
      expect(viewer.drawCommands.type).toBe('draw-indexed');
      expect(viewer.drawCommands.capacity).toBe(1);
      const commandBytes = await viewer.drawCommands.buffer.readAsync();
      const command = new Uint32Array(
        commandBytes.buffer,
        commandBytes.byteOffset,
        commandBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(command[0]).toBe(640 * 3);
      expect(command[1]).toBeGreaterThan(0);
      expect(command[1]).toBeLessThanOrEqual(16);
    } finally {
      viewer?.onFinalize();
      currentFramebuffer.mockRestore();
      devicePixelSize.mockRestore();
      framebuffer.destroy();
      canvas.remove();
      host.remove();
    }
  }, 30_000);
});

function makeAnimationProps(
  device: AnimationProps['device'],
  width: number,
  height: number
): AnimationProps {
  return {
    device,
    animationLoop: {
      frameRate: {getSampleHz: () => 60},
      cpuTime: {getSampleAverageTime: () => 1},
      gpuTime: {getSampleAverageTime: () => 1}
    },
    tick: 60,
    time: 1000,
    width,
    height,
    aspect: width / height
  } as AnimationProps;
}
