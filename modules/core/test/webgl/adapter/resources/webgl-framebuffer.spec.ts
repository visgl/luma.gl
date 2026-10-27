// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

it('WEBGLFramebuffer destroys its owned native handle exactly once', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const deletedHandles: Array<WebGLFramebuffer | null> = [];
  const originalDeleteFramebuffer = gl.deleteFramebuffer.bind(gl);
  gl.deleteFramebuffer = ((handle: WebGLFramebuffer | null) => {
    deletedHandles.push(handle);
    originalDeleteFramebuffer(handle);
  }) as typeof gl.deleteFramebuffer;

  try {
    const framebuffer = device.createFramebuffer({colorAttachments: ['rgba8unorm']});
    const nativeHandle = framebuffer.handle;

    framebuffer.destroy();
    framebuffer.destroy();

    expect(deletedHandles, 'owned framebuffer handle is deleted exactly once').toEqual([
      nativeHandle
    ]);
  } finally {
    gl.deleteFramebuffer = originalDeleteFramebuffer;
    device.destroy();
  }
});

it('WEBGLFramebuffer destruction clears only matching tracked framebuffer bindings', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const framebuffer = device.createFramebuffer({colorAttachments: ['rgba8unorm']});
  const otherFramebuffer = device.createFramebuffer({colorAttachments: ['rgba8unorm']});
  try {
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer.handle);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, otherFramebuffer.handle);
    framebuffer.destroy();
    expect(gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING)).toBe(null);
    expect(gl.getParameter(gl.READ_FRAMEBUFFER_BINDING)).toBe(otherFramebuffer.handle);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, otherFramebuffer.handle);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, otherFramebuffer.handle);
    otherFramebuffer.destroy();
    expect(gl.getParameter(gl.READ_FRAMEBUFFER_BINDING)).toBe(null);
    expect(gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING)).toBe(null);
  } finally {
    framebuffer.destroy();
    otherFramebuffer.destroy();
    device.destroy();
  }
});
