// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {GL, GLParameters} from '@luma.gl/webgl/constants';
import {WebGLDevice, setDeviceParameters, getGLParameters, resetGLParameters} from '@luma.gl/webgl';

// Settings test, could be beneficial to not reuse a context

const getOrSkipWebGLTestDevice = async (): Promise<WebGLDevice | null> => {
  const device = await getWebGLTestDevice();
  if (!device || !device.gl || device.isLost) {
    void 0;
    void 0;
    return null;
  }
  return device;
};

// const stringify = (v) => JSON.stringify(ArrayBuffer.isView(v) ? Array.apply([], v) : v);

const getGLParameter = (device: WebGLDevice, parameter: keyof GLParameters): any => {
  const parameters = getGLParameters(device.gl, [parameter]);
  return parameters[parameter];
};

it('setDeviceParameters#cullMode', async () => {
  const device = await getOrSkipWebGLTestDevice();
  if (!device) {
    return;
  }

  resetGLParameters(device.gl);

  expect(getGLParameter(device, GL.CULL_FACE), 'got expected value').toEqual(false);

  setDeviceParameters(device, {cullMode: 'front'});
  expect(getGLParameter(device, GL.CULL_FACE), 'got expected value').toEqual(true);
  expect(getGLParameter(device, GL.CULL_FACE_MODE), 'got expected value').toEqual(GL.FRONT);

  setDeviceParameters(device, {cullMode: 'back'});
  expect(getGLParameter(device, GL.CULL_FACE), 'got expected value').toEqual(true);
  expect(getGLParameter(device, GL.CULL_FACE_MODE), 'got expected value').toEqual(GL.BACK);

  setDeviceParameters(device, {cullMode: 'none'});
  expect(getGLParameter(device, GL.CULL_FACE), 'got expected value').toEqual(false);

  void 0;
});

it('setDeviceParameters#frontFace', async () => {
  const device = await getOrSkipWebGLTestDevice();
  if (!device) {
    return;
  }

  resetGLParameters(device.gl);

  expect(getGLParameter(device, GL.FRONT_FACE), 'got expected value').toEqual(GL.CCW);

  setDeviceParameters(device, {frontFace: 'cw'});
  expect(getGLParameter(device, GL.FRONT_FACE), 'got expected value').toEqual(GL.CW);

  setDeviceParameters(device, {frontFace: 'ccw'});
  expect(getGLParameter(device, GL.FRONT_FACE), 'got expected value').toEqual(GL.CCW);

  void 0;
});

it('setDeviceParameters#depthWriteEnabled', async () => {
  const device = await getOrSkipWebGLTestDevice();
  if (!device) {
    return;
  }

  resetGLParameters(device.gl);

  expect(getGLParameter(device, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(true);

  setDeviceParameters(device, {depthWriteEnabled: false});
  expect(getGLParameter(device, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(false);

  setDeviceParameters(device, {depthWriteEnabled: true});
  expect(getGLParameter(device, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(true);

  void 0;
});

it('setDeviceParameters#blending', async () => {
  const device = await getOrSkipWebGLTestDevice();
  if (!device) {
    return;
  }

  resetGLParameters(device.gl);

  expect(getGLParameter(device, GL.BLEND), 'blending disabled').toBe(false);

  setDeviceParameters(device, {
    blend: true,
    blendColorOperation: 'add',
    blendAlphaOperation: 'subtract'
  });

  expect(getGLParameter(device, GL.BLEND), 'GL.BLEND = true').toBe(true);
  expect(getGLParameter(device, GL.BLEND_EQUATION_RGB), 'GL.BLEND_EQUATION_RGB = GL.FUNC_ADD').toBe(
    GL.FUNC_ADD
  );
  expect(
    getGLParameter(device, GL.BLEND_EQUATION_ALPHA),
    'GL.BLEND_EQUATION_ALPHA = GL.FUNC_SUBTRACT'
  ).toBe(GL.FUNC_SUBTRACT);
  expect(getGLParameter(device, GL.BLEND_SRC_RGB), 'GL.BLEND_SRC_RGB = GL.ONE').toBe(GL.ONE);
  expect(getGLParameter(device, GL.BLEND_DST_RGB), 'GL.BLEND_DST_RGB = GL.ZERO').toBe(GL.ZERO);
  expect(getGLParameter(device, GL.BLEND_SRC_ALPHA), 'GL.BLEND_SRC_ALPHA = GL.ONE').toBe(GL.ONE);
  expect(getGLParameter(device, GL.BLEND_DST_ALPHA), 'GL.BLEND_DST_ALPHA = GL.ZERO').toBe(GL.ZERO);

  setDeviceParameters(device, {
    blend: true,
    blendColorOperation: 'max',
    blendAlphaOperation: 'min',
    blendColorSrcFactor: 'src-alpha',
    blendColorDstFactor: 'dst-alpha',
    blendAlphaSrcFactor: 'zero',
    blendAlphaDstFactor: 'one'
  });

  expect(getGLParameter(device, GL.BLEND), 'GL.BLEND = true').toBe(true);
  expect(getGLParameter(device, GL.BLEND_EQUATION_RGB), 'GL.BLEND_EQUATION_RGB = GL.MAX').toBe(
    GL.MAX
  );
  expect(getGLParameter(device, GL.BLEND_EQUATION_ALPHA), 'GL.BLEND_EQUATION_ALPHA = GL.MIN').toBe(
    GL.MIN
  );
  expect(getGLParameter(device, GL.BLEND_SRC_RGB), 'GL.BLEND_SRC_RGB = GL.SRC_ALPHA').toBe(
    GL.SRC_ALPHA
  );
  expect(getGLParameter(device, GL.BLEND_DST_RGB), 'GL.BLEND_DST_RGB = GL.DST_ALPHA').toBe(
    GL.DST_ALPHA
  );
  expect(getGLParameter(device, GL.BLEND_SRC_ALPHA), 'GL.BLEND_SRC_ALPHA = GL.ZERO').toBe(GL.ZERO);
  expect(getGLParameter(device, GL.BLEND_DST_ALPHA), 'GL.BLEND_DST_ALPHA = GL.ONE').toBe(GL.ONE);

  void 0;
});

it('setDeviceParameters#depthCompare', async () => {
  const device = await getOrSkipWebGLTestDevice();
  if (!device) {
    return;
  }
  resetGLParameters(device.gl);

  expect(getGLParameter(device, GL.DEPTH_TEST), 'GL.DEPTH_TEST = false').toBe(false);

  setDeviceParameters(device, {depthCompare: 'less'});
  expect(getGLParameter(device, GL.DEPTH_TEST), 'GL.DEPTH_TEST = true').toBe(true);
  expect(getGLParameter(device, GL.DEPTH_FUNC), 'GL.DEPTH_FUNC = GL.LESS').toBe(GL.LESS);

  setDeviceParameters(device, {depthCompare: 'always'});
  expect(getGLParameter(device, GL.DEPTH_TEST), 'GL.DEPTH_TEST = false').toBe(false);
  expect(getGLParameter(device, GL.DEPTH_FUNC), 'GL.DEPTH_FUNC = GL.ALWAYS').toBe(GL.ALWAYS);

  void 0;
});

it('setDeviceParameters#depthClearValue', async () => {
  const device = await getOrSkipWebGLTestDevice();
  if (!device) {
    return;
  }
  const gl = device.gl;

  resetGLParameters(gl);
  expect(getGLParameter(device, GL.DEPTH_CLEAR_VALUE), 'got expected clear depth').toEqual(1);

  setDeviceParameters(device, {clearDepth: 0});
  expect(getGLParameter(device, GL.DEPTH_CLEAR_VALUE), 'set clear depth works').toEqual(0);

  void 0;
});

it.each([
  ['stencilPassOperation', GL.KEEP, GL.KEEP, GL.REPLACE],
  ['stencilFailOperation', GL.REPLACE, GL.KEEP, GL.KEEP],
  ['stencilDepthFailOperation', GL.KEEP, GL.REPLACE, GL.KEEP]
] as const)('setDeviceParameters#%s defaults omitted operations on both faces', async (operation, expectedFail, expectedDepthFail, expectedPass) => {
  const device = await getOrSkipWebGLTestDevice();
  if (!device) {
    return;
  }

  resetGLParameters(device.gl);
  try {
    // Seed all operations so the assertions also check that omitted values reset to keep.
    setDeviceParameters(device, {
      stencilPassOperation: 'invert',
      stencilFailOperation: 'invert',
      stencilDepthFailOperation: 'invert'
    });
    setDeviceParameters(device, {[operation]: 'replace'});

    for (const [fail, depthFail, pass] of [
      [GL.STENCIL_FAIL, GL.STENCIL_PASS_DEPTH_FAIL, GL.STENCIL_PASS_DEPTH_PASS],
      [GL.STENCIL_BACK_FAIL, GL.STENCIL_BACK_PASS_DEPTH_FAIL, GL.STENCIL_BACK_PASS_DEPTH_PASS]
    ] as const) {
      expect(getGLParameter(device, fail)).toBe(expectedFail);
      expect(getGLParameter(device, depthFail)).toBe(expectedDepthFail);
      expect(getGLParameter(device, pass)).toBe(expectedPass);
    }
  } finally {
    resetGLParameters(device.gl);
  }
});

it('setDeviceParameters#stencilCompare always keeps stencil operations enabled', async () => {
  const device = await getOrSkipWebGLTestDevice();
  if (!device) {
    return;
  }

  resetGLParameters(device.gl);
  try {
    expect(getGLParameter(device, GL.STENCIL_TEST)).toBe(false);
    setDeviceParameters(device, {stencilCompare: 'always', stencilPassOperation: 'replace'});
    expect(getGLParameter(device, GL.STENCIL_TEST)).toBe(true);
    expect(getGLParameter(device, GL.STENCIL_FUNC)).toBe(GL.ALWAYS);
    expect(getGLParameter(device, GL.STENCIL_BACK_FUNC)).toBe(GL.ALWAYS);
    expect(getGLParameter(device, GL.STENCIL_PASS_DEPTH_PASS)).toBe(GL.REPLACE);
    expect(getGLParameter(device, GL.STENCIL_BACK_PASS_DEPTH_PASS)).toBe(GL.REPLACE);

    setDeviceParameters(device, {stencilCompare: 'never'});
    expect(getGLParameter(device, GL.STENCIL_TEST)).toBe(true);
    expect(getGLParameter(device, GL.STENCIL_FUNC)).toBe(GL.NEVER);
    expect(getGLParameter(device, GL.STENCIL_BACK_FUNC)).toBe(GL.NEVER);

    setDeviceParameters(device, {stencilCompare: 'always'});
    expect(getGLParameter(device, GL.STENCIL_TEST)).toBe(true);
    expect(getGLParameter(device, GL.STENCIL_FUNC)).toBe(GL.ALWAYS);
    expect(getGLParameter(device, GL.STENCIL_BACK_FUNC)).toBe(GL.ALWAYS);
    expect(getGLParameter(device, GL.STENCIL_PASS_DEPTH_PASS)).toBe(GL.REPLACE);
    expect(getGLParameter(device, GL.STENCIL_BACK_PASS_DEPTH_PASS)).toBe(GL.REPLACE);
  } finally {
    resetGLParameters(device.gl);
  }
});
