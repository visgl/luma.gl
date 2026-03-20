// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {WebGLCanvasContext} from '@luma.gl/webgl';

test('WebGLDevice#canvas context creation', async t => {
  t.ok(WebGLCanvasContext, 'WebGLCanvasContext defined');
  const webGLTestDevice = await getWebGLTestDevice();
  t.ok(
    webGLTestDevice.getDefaultCanvasContext() instanceof WebGLCanvasContext,
    'Default context creation ok'
  );
  t.end();
});

test('WebGPU default canvas context reuses framebuffer wrappers', async t => {
  const webGPUDevice = await getWebGPUTestDevice();
  if (!webGPUDevice) {
    t.pass('WebGPU unavailable, skipped default canvas wrapper reuse test');
    t.end();
    return;
  }

  const canvasContext = webGPUDevice.getDefaultCanvasContext() as any;
  const firstFramebuffer = canvasContext.getCurrentFramebuffer();
  const secondFramebuffer = canvasContext.getCurrentFramebuffer();

  t.equal(
    secondFramebuffer,
    firstFramebuffer,
    'WebGPU canvas context reuses its framebuffer wrapper'
  );
  t.equal(
    secondFramebuffer.colorAttachments[0],
    firstFramebuffer.colorAttachments[0],
    'WebGPU canvas context reuses its texture view wrapper'
  );
  t.equal(
    secondFramebuffer.colorAttachments[0].texture,
    firstFramebuffer.colorAttachments[0].texture,
    'WebGPU canvas context reuses its texture wrapper'
  );

  t.end();
});
