// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {getWebGLTestDevice} from '@luma.gl/core/test-utils';

it.each([
  'renderbuffer',
  'vertex array'
] as const)('%s deletion clears current and saved bindings without queries or binds', async resourceType => {
  const device = await getWebGLTestDevice();
  const {gl} = device;
  const isRenderbuffer = resourceType === 'renderbuffer';
  const create = () => (isRenderbuffer ? gl.createRenderbuffer() : gl.createVertexArray());
  const bind = (handle: WebGLRenderbuffer | WebGLVertexArrayObject | null) => {
    if (isRenderbuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, handle);
    } else {
      gl.bindVertexArray(handle);
    }
  };
  const destroy = (handle: WebGLRenderbuffer | WebGLVertexArrayObject | null) => {
    if (isRenderbuffer) {
      gl.deleteRenderbuffer(handle);
    } else {
      gl.deleteVertexArray(handle);
    }
  };
  const binding = isRenderbuffer ? gl.RENDERBUFFER_BINDING : gl.VERTEX_ARRAY_BINDING;
  const resource = create();
  const otherResource = create();
  let stackDepth = 0;
  try {
    bind(resource);
    device.pushState();
    stackDepth++;
    bind(otherResource);
    device.pushState();
    stackDepth++;
    bind(resource);
    device.pushState();
    stackDepth++;
    bind(null);
    bind(resource);

    const querySpy = vi.spyOn(gl, 'getParameter');
    const bindSpy = isRenderbuffer
      ? vi.spyOn(gl, 'bindRenderbuffer')
      : vi.spyOn(gl, 'bindVertexArray');
    try {
      destroy(resource);
      expect(querySpy).not.toHaveBeenCalled();
      expect(bindSpy).not.toHaveBeenCalled();
    } finally {
      querySpy.mockRestore();
      bindSpy.mockRestore();
    }
    expect(gl.getParameter(binding)).toBe(null);
    expect(WebGL2RenderingContext.prototype.getParameter.call(gl, binding)).toBe(null);
    device.popState();
    stackDepth--;
    expect(gl.getParameter(binding)).toBe(null);
    device.popState();
    stackDepth--;
    expect(gl.getParameter(binding)).toBe(otherResource);
    device.popState();
    stackDepth--;
    expect(gl.getParameter(binding)).toBe(null);
    expect(WebGL2RenderingContext.prototype.getParameter.call(gl, binding)).toBe(null);
    expect(gl.getError()).toBe(gl.NO_ERROR);
  } finally {
    while (stackDepth-- > 0) {
      device.popState();
    }
    destroy(resource);
    destroy(otherResource);
    device.destroy();
  }
});
