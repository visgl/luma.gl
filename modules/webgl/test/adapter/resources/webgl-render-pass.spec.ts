// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {GL} from '@luma.gl/constants';
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
