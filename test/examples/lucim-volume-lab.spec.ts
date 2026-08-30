// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import VolumeLabAnimationLoopTemplate from '../../examples/experimental/lucim-volume-lab/app';
import {makeVolumeLabDataset} from '../../examples/experimental/lucim-volume-lab/volume-lab-data';

describe('LuCIM Volume Lab', () => {
  test('segments a synthetic volume and renders resident tri-planar overlays', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;

    const width = 96;
    const height = 42;
    const host = document.createElement('div');
    host.id = 'example-panel-host';
    const canvas = document.createElement('canvas');
    document.body.append(host, canvas);
    const framebuffer = device.createFramebuffer({
      id: 'lucim-volume-lab-test-framebuffer',
      width,
      height,
      colorAttachments: [device.preferredColorFormat],
      depthStencilAttachment: 'depth24plus'
    });
    const canvasContext = device.getDefaultCanvasContext();
    const currentFramebuffer = vi
      .spyOn(canvasContext, 'getCurrentFramebuffer')
      .mockReturnValue(framebuffer);
    let viewer: VolumeLabAnimationLoopTemplate | null = null;
    try {
      device.handle.pushErrorScope('validation');
      viewer = new VolumeLabAnimationLoopTemplate({
        ...makeAnimationProps(device, width, height),
        dataset: makeVolumeLabDataset([24, 24, 16])
      });
      viewer.onRender(makeAnimationProps(device, width, height));
      device.submit();
      await device.handle.queue.onSubmittedWorkDone();

      const status = await viewer.engine.readStatus();
      expect(status.converged).toBe(true);
      expect(status.iterationCount).toBeGreaterThan(0);
      expect(status.iterationCount).toBeLessThanOrEqual(viewer.engine.maximumComponentIterations);
      expect(status.regionOverflow).toBe(false);
      expect(viewer.engine.nodeCount).toBeGreaterThan(30);

      const labels = await viewer.engine.componentLabels.readAsync();
      const labelValues = new Uint32Array(
        labels.buffer,
        labels.byteOffset,
        viewer.dataset.values.length
      );
      expect(labelValues.some(label => label !== 0)).toBe(true);
      expect(await device.handle.popErrorScope()).toBeNull();
    } finally {
      viewer?.onFinalize();
      currentFramebuffer.mockRestore();
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
    tock: 16,
    time: 16,
    width,
    height,
    aspect: width / height,
    _mousePosition: [0, 0],
    _mousePositionRaw: [0, 0],
    _mousePositionDevicePixels: [0, 0]
  } as AnimationProps;
}
