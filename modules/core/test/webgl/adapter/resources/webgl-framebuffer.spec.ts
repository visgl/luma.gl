// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getWebGLTestDevice} from '@luma.gl/core/test-utils';
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

it('WEBGLFramebuffer destruction does not let popState restore its deleted handle', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const framebuffer = device.createFramebuffer({colorAttachments: ['rgba8unorm']});
  const otherFramebuffer = device.createFramebuffer({colorAttachments: ['rgba8unorm']});
  const boundHandles: Array<WebGLFramebuffer | null> = [];
  const originalBindFramebuffer = gl.bindFramebuffer;
  gl.bindFramebuffer = ((target: number, handle: WebGLFramebuffer | null) => {
    boundHandles.push(handle);
    return originalBindFramebuffer.call(gl, target, handle);
  }) as typeof gl.bindFramebuffer;
  try {
    // Bound before the state frame: deletion must not introduce a saved binding
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer.handle);
    device.pushState();
    framebuffer.destroy();
    device.popState();
    expect(gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING), 'deleted handle is not restored').toBe(
      null
    );

    // Saved by a binding inside the state frame, then deleted while not bound
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, otherFramebuffer.handle);
    device.pushState();
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    const deletedHandle = otherFramebuffer.handle;
    otherFramebuffer.destroy();
    device.popState();
    expect(gl.getParameter(gl.READ_FRAMEBUFFER_BINDING), 'deleted handle is not restored').toBe(
      null
    );

    expect(
      boundHandles.filter(handle => handle === framebuffer.handle || handle === deletedHandle),
      'deleted handles are only bound before deletion'
    ).toEqual([framebuffer.handle, deletedHandle]);
  } finally {
    gl.bindFramebuffer = originalBindFramebuffer;
    framebuffer.destroy();
    otherFramebuffer.destroy();
    device.destroy();
  }
});

it('native framebuffer deletion invalidates tracked state without queries or binds', async () => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const framebuffer = gl.createFramebuffer();
  const otherFramebuffer = gl.createFramebuffer();
  const originalGetParameter = gl.getParameter;
  const originalBindFramebuffer = gl.bindFramebuffer;
  try {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    device.pushState();
    gl.bindFramebuffer(gl.FRAMEBUFFER, otherFramebuffer);
    device.pushState();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    device.pushState();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Native deletion must not depend on reading back or explicitly unbinding state.
    gl.getParameter = () => {
      throw new Error('unexpected query during deletion');
    };
    gl.bindFramebuffer = () => {
      throw new Error('unexpected bind during deletion');
    };
    gl.deleteFramebuffer(framebuffer);
    gl.getParameter = originalGetParameter;
    gl.bindFramebuffer = originalBindFramebuffer;

    device.popState();
    expect(gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING)).toBe(null);
    expect(gl.getParameter(gl.READ_FRAMEBUFFER_BINDING)).toBe(null);
    device.popState();
    expect(gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING)).toBe(otherFramebuffer);
    expect(gl.getParameter(gl.READ_FRAMEBUFFER_BINDING)).toBe(otherFramebuffer);
    device.popState();
    expect(gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING)).toBe(null);
    expect(gl.getParameter(gl.READ_FRAMEBUFFER_BINDING)).toBe(null);
    // Bypass the cached getter to check that native and tracked bindings agree.
    expect(
      WebGL2RenderingContext.prototype.getParameter.call(gl, gl.DRAW_FRAMEBUFFER_BINDING)
    ).toBe(null);
    expect(
      WebGL2RenderingContext.prototype.getParameter.call(gl, gl.READ_FRAMEBUFFER_BINDING)
    ).toBe(null);
    expect(gl.getError()).toBe(gl.NO_ERROR);
  } finally {
    gl.getParameter = originalGetParameter;
    gl.bindFramebuffer = originalBindFramebuffer;
    gl.deleteFramebuffer(framebuffer);
    gl.deleteFramebuffer(otherFramebuffer);
    device.destroy();
  }
});
