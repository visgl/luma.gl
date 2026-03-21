// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';

import {GL} from '@luma.gl/webgl/constants';
import {WEBGLRenderPass} from '@luma.gl/webgl';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

test('WEBGLRenderPass#drawBuffers for framebuffer attachments', async t => {
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

  t.deepEqual(
    drawBufferCalls[0],
    [GL.COLOR_ATTACHMENT0, GL.COLOR_ATTACHMENT0 + 1],
    'uses framebuffer color attachments as draw buffers'
  );

  gl.drawBuffers = originalDrawBuffers;
  framebuffer.destroy();
  device.destroy();
  t.end();
});

test('WEBGLRenderPass#drawBuffers for default framebuffer', async t => {
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

  t.deepEqual(drawBufferCalls[0], [GL.BACK], 'draws to GL.BACK for default framebuffer');

  gl.drawBuffers = originalDrawBuffers;
  device.destroy();
  t.end();
});

test('WEBGLRenderPass#drawBuffers for explicit default framebuffer wrapper', async t => {
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

  t.deepEqual(drawBufferCalls[0], [GL.BACK], 'explicit default framebuffer still draws to GL.BACK');

  gl.drawBuffers = originalDrawBuffers;
  device.destroy();
  t.end();
});

test('WEBGLRenderPass flushes deferred default canvas resize', async t => {
  const device = await getWebGLTestDevice();
  const canvasContext = device.getDefaultCanvasContext();
  const canvas = canvasContext.canvas as HTMLCanvasElement;
  const {gl} = device;

  canvas.width = 300;
  canvas.height = 150;
  canvasContext.setDrawingBufferSize(640, 480);

  t.equal(canvas.width, 300, 'canvas width is unchanged before default render pass');
  t.equal(canvas.height, 150, 'canvas height is unchanged before default render pass');

  const renderPass = new WEBGLRenderPass(device, {});

  t.equal(canvas.width, 640, 'default render pass flushes deferred canvas width resize');
  t.equal(canvas.height, 480, 'default render pass flushes deferred canvas height resize');
  t.deepEqual(
    gl.getParameter(GL.VIEWPORT),
    new Int32Array([0, 0, 640, 480]),
    'viewport uses flushed drawing buffer size'
  );

  renderPass.end();
  device.destroy();
  t.end();
});
