// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GL} from '@luma.gl/webgl/constants';
import {WEBGLRenderPass} from '@luma.gl/webgl';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

it('WEBGLRenderPass#drawBuffers for framebuffer attachments', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;

  const drawBufferCalls: number[][] = [];
  const originalDrawBuffers = gl.drawBuffers.bind(gl);
  gl.drawBuffers = ((buffers: number[]) => {
    drawBufferCalls.push([...buffers]);
    return originalDrawBuffers(buffers as any);
  }) as typeof gl.drawBuffers;

  const framebuffer = device.createFramebuffer({colorAttachments: ['rgba8unorm', 'rgba8unorm']});

  const renderPass = new WEBGLRenderPass(device, {framebuffer});
  renderPass.end();

  expect(drawBufferCalls[0], 'uses framebuffer color attachments as draw buffers').toEqual([
    GL.COLOR_ATTACHMENT0,
    GL.COLOR_ATTACHMENT0 + 1
  ]);

  gl.drawBuffers = originalDrawBuffers;
  framebuffer.destroy();
  device.destroy();
});

it('WEBGLRenderPass#drawBuffers for default framebuffer', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;

  const drawBufferCalls: number[][] = [];
  const originalDrawBuffers = gl.drawBuffers.bind(gl);
  gl.drawBuffers = ((buffers: number[]) => {
    drawBufferCalls.push([...buffers]);
    return originalDrawBuffers(buffers as any);
  }) as typeof gl.drawBuffers;

  const renderPass = new WEBGLRenderPass(device, {});
  renderPass.end();

  expect(drawBufferCalls[0], 'draws to GL.BACK for default framebuffer').toEqual([GL.BACK]);

  gl.drawBuffers = originalDrawBuffers;
  device.destroy();
});

it('WEBGLRenderPass#drawBuffers for explicit default framebuffer wrapper', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;

  const drawBufferCalls: number[][] = [];
  const originalDrawBuffers = gl.drawBuffers.bind(gl);
  gl.drawBuffers = ((buffers: number[]) => {
    drawBufferCalls.push([...buffers]);
    return originalDrawBuffers(buffers as any);
  }) as typeof gl.drawBuffers;

  const framebuffer = device.getDefaultCanvasContext().getCurrentFramebuffer();
  const renderPass = new WEBGLRenderPass(device, {framebuffer});
  renderPass.end();

  expect(drawBufferCalls[0], 'explicit default framebuffer still draws to GL.BACK').toEqual([
    GL.BACK
  ]);

  gl.drawBuffers = originalDrawBuffers;
  device.destroy();
});

it('WEBGLRenderPass#drawBuffers for wrapped external WebGLFramebuffer', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;

  const drawBufferCalls: number[][] = [];
  const originalDrawBuffers = gl.drawBuffers.bind(gl);
  gl.drawBuffers = ((buffers: number[]) => {
    drawBufferCalls.push([...buffers]);
    return originalDrawBuffers(buffers as any);
  }) as typeof gl.drawBuffers;

  // Simulate wrapping an external WebGLFramebuffer (e.g. from Google Maps interleaved rendering).
  // Attach a color renderbuffer so gl.clear() doesn't error on an incomplete FBO.
  const externalFbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(GL.FRAMEBUFFER, externalFbo);
  const rb = gl.createRenderbuffer()!;
  gl.bindRenderbuffer(GL.RENDERBUFFER, rb);
  gl.renderbufferStorage(GL.RENDERBUFFER, gl.RGBA8, 64, 64);
  gl.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.RENDERBUFFER, rb);
  gl.bindFramebuffer(GL.FRAMEBUFFER, null);

  const framebuffer = device.createFramebuffer({handle: externalFbo, width: 64, height: 64});

  // Should not crash accessing colorAttachments.map() on wrapped external framebuffer
  const renderPass = new WEBGLRenderPass(device, {framebuffer});
  expect(renderPass, 'does not crash on wrapped external WebGLFramebuffer').toBeTruthy();
  renderPass.end();

  expect(
    drawBufferCalls.length,
    'does not call drawBuffers for wrapped external WebGLFramebuffer'
  ).toBe(0);

  gl.drawBuffers = originalDrawBuffers;
  framebuffer.destroy();
  gl.deleteRenderbuffer(rb);
  gl.deleteFramebuffer(externalFbo);
  device.destroy();
});

it('WEBGLRenderPass flushes deferred default canvas resize', async () => {
  const device = await getWebGLTestDevice();
  const canvasContext = device.getDefaultCanvasContext();
  const canvas = canvasContext.canvas as HTMLCanvasElement;
  const {gl} = device;

  canvas.width = 300;
  canvas.height = 150;
  canvasContext.setDrawingBufferSize(640, 480);

  expect(canvas.width, 'canvas width is unchanged before default render pass').toBe(300);
  expect(canvas.height, 'canvas height is unchanged before default render pass').toBe(150);

  const renderPass = new WEBGLRenderPass(device, {});

  expect(canvas.width, 'default render pass flushes deferred canvas width resize').toBe(640);
  expect(canvas.height, 'default render pass flushes deferred canvas height resize').toBe(480);
  expect(
    Array.from(gl.getParameter(GL.VIEWPORT)),
    'viewport uses flushed drawing buffer size'
  ).toEqual([0, 0, 640, 480]);

  renderPass.end();
  device.destroy();
});
