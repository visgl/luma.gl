// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {DepthTextureCopy} from '@luma.gl/anari';
import {ANARIDevice} from '@luma.gl/anari';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it, vi} from 'vitest';
import {makeChartMotionScene} from '../../../examples/anari/scenes/chart-baseline';
import {ChartLabels, getChartLabelPositions} from '../../../examples/anari/scenes/chart-labels';
import {createANARIJSONScene} from '../../../examples/anari/scenes/playground-scene';

it('animated chart labels render glyphs, reject occluded fragments and retain moving picks', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const graphics = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(256, 256)},
    debug: true
  });
  const errors: Error[] = [];
  const errorReporting = vi.spyOn(graphics, 'reportError').mockImplementation(error => {
    errors.push(error);
    return () => {};
  });
  const color = graphics.createTexture({
    width: 256,
    height: 256,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = graphics.createFramebuffer({
    width: 256,
    height: 256,
    colorAttachments: [color],
    depthStencilAttachment: 'depth32float'
  });
  const presentation = vi
    .spyOn(graphics.getCanvasContext(), 'getCurrentFramebuffer')
    .mockReturnValue(framebuffer);
  const device = new ANARIDevice(graphics);
  const scene = createANARIJSONScene(device, makeChartMotionScene());
  const labels = new ChartLabels(graphics);
  const depthCopy = new DepthTextureCopy(graphics);
  scene.frame.setParameter('size', [256, 256]).commitParameters();
  const countWhitePixels = async () => {
    const buffer = graphics.createBuffer({
      byteLength: color.computeMemoryLayout().byteLength,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });
    try {
      color.readBuffer({}, buffer);
      const pixels = await buffer.readAsync();
      let count = 0;
      for (let index = 0; index < pixels.length; index += 4)
        if (pixels[index] > 240 && pixels[index + 1] > 240 && pixels[index + 2] > 240) count++;
      return count;
    } finally {
      buffer.destroy();
    }
  };
  const pickDelta = async () => {
    const positions = getChartLabelPositions(scene, 256, 256, 0);
    const offset = 3 * 4;
    const horizontal = (positions[offset] / positions[offset + 3] + 1) * 128;
    const vertical = (1 - positions[offset + 1] / positions[offset + 3]) * 128;
    return scene.frame.pick(horizontal, vertical);
  };
  try {
    scene.update(0);
    scene.frame.render();
    graphics.submit();
    const initialPick = await pickDelta();
    expect(initialPick?.instance).toBe(
      Array.from(scene.instanceIdentifiers).find(
        ([, identifier]) => identifier === 'point-delta'
      )?.[0]
    );
    const channels = scene.frame.captureChannels()!;
    try {
      let pass = graphics.beginRenderPass({framebuffer, clearColor: false, clearDepth: 1});
      depthCopy.draw(pass, {depthTexture: channels.projectedDepthTexture});
      labels.draw(pass, scene, 256, 256);
      pass.end();
      graphics.submit();
      expect(await countWhitePixels()).toBeGreaterThan(20);
      pass = graphics.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1], clearDepth: 0});
      labels.draw(pass, scene, 256, 256);
      pass.end();
      graphics.submit();
      expect(await countWhitePixels()).toBe(0);
    } finally {
      channels.destroy();
    }
    scene.update(1);
    scene.frame.render();
    graphics.submit();
    expect((await pickDelta())?.placementId).toBe(initialPick?.placementId);
    expect(errors).toEqual([]);
  } finally {
    labels.destroy();
    depthCopy.destroy();
    scene.destroy();
    device.destroy();
    presentation.mockRestore();
    errorReporting.mockRestore();
    framebuffer.destroy();
    color.destroy();
    graphics.destroy();
  }
}, 120000);
