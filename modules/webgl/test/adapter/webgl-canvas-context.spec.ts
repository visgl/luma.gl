// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {WebGLCanvasContext} from '@luma.gl/webgl';
import {expect, it} from 'vitest';

it('WebGLDevice#canvas context creation', async () => {
  expect(WebGLCanvasContext, 'WebGLCanvasContext defined').toBeTruthy();
  const webGLTestDevice = await getWebGLTestDevice();
  expect(
    webGLTestDevice.getDefaultCanvasContext() instanceof WebGLCanvasContext,
    'Default context creation ok'
  ).toBe(true);
});

it('WebGLCanvasContext#default framebuffer tracks externally resized canvas', async () => {
  const webGLTestDevice = await getWebGLTestDevice();
  const canvasContext = webGLTestDevice.getDefaultCanvasContext();
  const {canvas} = canvasContext;
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  const originalDrawingBufferSize = canvasContext.getDrawingBufferSize();

  try {
    const framebuffer = canvasContext.getCurrentFramebuffer();

    // Simulate an external owner of canvas sizing, e.g. a base map in deck.gl's interleaved mode
    canvas.width = originalWidth + 64;
    canvas.height = originalHeight + 32;

    const resizedFramebuffer = canvasContext.getCurrentFramebuffer();

    expect(resizedFramebuffer, 'canvas context reuses its framebuffer wrapper').toBe(framebuffer);
    expect(
      [resizedFramebuffer.width, resizedFramebuffer.height],
      'default framebuffer wrapper follows an externally resized canvas'
    ).toEqual([canvas.width, canvas.height]);
    expect(
      canvasContext.getDrawingBufferSize(),
      'tracked drawing buffer size follows an externally resized canvas'
    ).toEqual([canvas.width, canvas.height]);
  } finally {
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    canvasContext.setDrawingBufferSize(...originalDrawingBufferSize);
    canvasContext.getCurrentFramebuffer();
  }
});

it('WebGPU default canvas context reuses framebuffer wrappers', async () => {
  const webGPUDevice = await getWebGPUTestDevice();
  if (!webGPUDevice) {
    return;
  }

  const canvasContext = webGPUDevice.getDefaultCanvasContext() as any;
  const firstFramebuffer = canvasContext.getCurrentFramebuffer();
  const secondFramebuffer = canvasContext.getCurrentFramebuffer();

  expect(secondFramebuffer, 'WebGPU canvas context reuses its framebuffer wrapper').toBe(
    firstFramebuffer
  );
  expect(
    secondFramebuffer.colorAttachments[0],
    'WebGPU canvas context reuses its texture view wrapper'
  ).toBe(firstFramebuffer.colorAttachments[0]);
  expect(
    secondFramebuffer.colorAttachments[0].texture,
    'WebGPU canvas context reuses its texture wrapper'
  ).toBe(firstFramebuffer.colorAttachments[0].texture);
});
