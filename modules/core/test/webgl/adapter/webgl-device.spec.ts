// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgl2Adapter} from '@luma.gl/core/webgl';
import {expect, it, vi} from 'vitest';

it('WebGLDevice sets signed and unsigned integer constants with fewer than four components', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});
  const {gl} = device;

  try {
    device.setConstantAttributeWebGL(0, new Int32Array([-12, 3]));
    expect(gl.getError()).toBe(gl.NO_ERROR);
    expect(gl.getVertexAttrib(0, gl.CURRENT_VERTEX_ATTRIB)).toEqual(new Int32Array([-12, 3, 0, 1]));

    device.setConstantAttributeWebGL(1, new Uint32Array([0xffffffff]));
    expect(gl.getError()).toBe(gl.NO_ERROR);
    expect(gl.getVertexAttrib(1, gl.CURRENT_VERTEX_ATTRIB)).toEqual(
      new Uint32Array([0xffffffff, 0, 0, 1])
    );
  } finally {
    device.destroy();
  }
});

// TODO - duplicates core spec?
it('WebGLDevice#lost (Promise)', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  // Wrap in a promise to make sure tape waits for us
  await new Promise<void>(resolve => {
    setTimeout(() => {
      void device.lost.then(cause => {
        expect(cause.reason, `Context lost: ${cause.message}`).toBe('destroyed');
        resolve();
      });
    }, 0);
    device.loseDevice();
  });

  device.destroy();
});

it('WebGLDevice#loseDevice marks the wrapper lost before native context loss', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});
  const loseContext = vi.fn();
  device.extensions.WEBGL_lose_context = {loseContext, restoreContext: () => {}};

  try {
    expect(device.loseDevice()).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
    expect(device.gl.isContextLost(), 'native context remains active').toBe(false);
    expect(device.isLost, 'wrapper reports loss synchronously').toBe(true);
    await expect(device.lost).resolves.toMatchObject({reason: 'destroyed'});
  } finally {
    device.destroy();
  }
});

it('WebGLDevice#loseDevice remains lost after a simulated context restoration', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});
  const extension = device.gl.getExtension('WEBGL_lose_context');
  expect(extension).not.toBeNull();

  try {
    expect(device.loseDevice(), 'native context loss was requested').toBe(true);
    expect(device.isLost, 'wrapper reports loss synchronously').toBe(true);
    await expect(device.lost).resolves.toMatchObject({reason: 'destroyed'});

    // Simulate native restoration independently of browser-specific restoration timing.
    const isContextLost = vi.spyOn(device.gl, 'isContextLost').mockReturnValue(false);
    device.canvasContext.canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(device.isLost, 'device remains lost after restoration').toBe(true);
    isContextLost.mockRestore();
  } finally {
    device.destroy();
  }
});

it('WebGLDevice#loseDevice marks the wrapper lost without WEBGL_lose_context', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});
  device.extensions.WEBGL_lose_context = null;

  expect(device.isLost, 'device starts active').toBe(false);
  expect(device.loseDevice(), 'native context loss was unavailable').toBe(false);
  expect(device.isLost, 'loseDevice synchronously marks the wrapper lost').toBe(true);
  await expect(device.lost).resolves.toMatchObject({reason: 'destroyed'});
  expect(device.gl.isContextLost(), 'native context remains usable').toBe(false);
  const buffer = device.createBuffer({byteLength: 16});
  buffer.destroy();

  device.destroy();
});

it('WebGLDevice#lost classifies external context loss as unknown', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  device.canvasContext.canvas.dispatchEvent(new Event('webglcontextlost'));

  await expect(device.lost).resolves.toMatchObject({reason: 'unknown'});
  device.destroy();
});

it('WebGLDevice#destroy marks the device lost', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});

  expect(device.isLost, 'device starts active').toBe(false);
  device.destroy();
  expect(device.isLost, 'destroy synchronously marks the device lost').toBe(true);
});

it('WebGLDevice rejects resource creation while its context is lost', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, debug: false});
  const resourceCounts = device.statsManager.getStats('Resource Counts');
  const resourcesBeforeLoss = resourceCounts.get('Resources Active').count;

  try {
    const extension = device.gl.getExtension('WEBGL_lose_context');
    expect(extension).not.toBeNull();
    extension!.loseContext();
    await device.lost;

    const createResources = [
      () => device.createBuffer({byteLength: 16}),
      () => device.createTexture({width: 1, height: 1}),
      () => device.createSampler({}),
      () =>
        device.createShader({
          stage: 'vertex',
          source: 'void main() { gl_Position = vec4(0.0); }'
        })
    ];

    for (const createResource of createResources) {
      expect(createResource).toThrowError('WebGL context is lost');
      expect(resourceCounts.get('Resources Active').count).toBe(resourcesBeforeLoss);
    }
  } finally {
    device.destroy();
  }
});

it('preserves a borrowed context and releases an explicitly owned attachment', async () => {
  const gl = document.createElement('canvas').getContext('webgl2')!;
  const borrowed = await webgl2Adapter.attach(gl);
  expect(borrowed.ownsHandle).toBe(false);
  borrowed.destroy();
  borrowed.destroy();
  expect(gl.isContextLost()).toBe(false);

  const owned = await webgl2Adapter.attach(gl, {ownsHandle: true});
  expect(owned.ownsHandle).toBe(true);
  owned.destroy();
  owned.destroy();
  expect(gl.isContextLost()).toBe(true);
});

it('lets the owner destroy an explicitly owned reusable device', async () => {
  const canvas = document.createElement('canvas');
  const props = {ownsHandle: true, _reuseDevices: true, createCanvasContext: {canvas}};
  const device = await webgl2Adapter.create(props);
  expect(await webgl2Adapter.create(props)).toBe(device);
  device.destroy();
  expect(device.gl.isContextLost()).toBe(true);
});

it('detaches an exclusive wrapper when explicit context loss is unavailable', async () => {
  const canvas = document.createElement('canvas');
  const device = await webgl2Adapter.create({
    createCanvasContext: {canvas},
    ownsHandle: true
  });
  const gl = device.gl;
  const getExtension = vi.spyOn(device, 'getExtension').mockReturnValue({});
  device.destroy();
  expect(getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
  expect(device.isLost).toBe(true);
  expect(gl.isContextLost()).toBe(false);
  const replacement = await webgl2Adapter.attach(gl);
  replacement.destroy();
  gl.getExtension('WEBGL_lose_context')?.loseContext();
});

it('snapshots native WebGL state and avoids wrapping setters again after reattachment', async () => {
  const gl = document.createElement('canvas').getContext('webgl2')!;
  const read = gl.getParameter.bind(gl);
  const setDepthMask = gl.depthMask.bind(gl);
  setDepthMask(false);
  const first = await webgl2Adapter.attach(gl);
  gl.depthMask(true);
  expect(read(gl.DEPTH_WRITEMASK)).toBe(true);
  first.destroy();

  setDepthMask(true);
  const second = await webgl2Adapter.attach(gl);
  gl.depthMask(false);
  expect(read(gl.DEPTH_WRITEMASK)).toBe(false);
  second.destroy();
  gl.getExtension('WEBGL_lose_context')?.loseContext();
});

it('reports no ownership for implicit WebGL device reuse', async () => {
  const device = await webgl2Adapter.create({createCanvasContext: true, _reuseDevices: true});
  expect(device.ownsHandle).toBe(false);
  device.destroy();
  expect(device.isLost).toBe(false);
  device.loseDevice();
});
