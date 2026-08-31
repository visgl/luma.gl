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
