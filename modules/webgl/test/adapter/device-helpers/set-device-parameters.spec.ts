import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { GL, GLParameters } from '@luma.gl/constants';
import { WebGLDevice, setDeviceParameters, getGLParameters, resetGLParameters } from '@luma.gl/webgl';

// Settings test, could be beneficial to not reuse a context

const getOrSkipWebGLTestDevice = async (t: {
  comment: (...messages: unknown[]) => void;
  end: () => void;
}): Promise<WebGLDevice | null> => {
  const device = await getWebGLTestDevice();
  if (!device || !device.gl || device.isLost) {
    t.comment('WebGL device not available');
    t.end();
    return null;
  }
  return device;
};

// const stringify = (v) => JSON.stringify(ArrayBuffer.isView(v) ? Array.apply([], v) : v);

const getGLParameter = (device: WebGLDevice, parameter: keyof GLParameters): any => {
  const parameters = getGLParameters(device.gl, [parameter]);
  return parameters[parameter];
};
test('setDeviceParameters#cullMode', async () => {
  const device = await getOrSkipWebGLTestDevice(expect);
  if (!device) {
    return;
  }
  resetGLParameters(device.gl);
  expect(getGLParameter(device, GL.CULL_FACE), 'got expected value').toEqual(false);
  setDeviceParameters(device, {
    cullMode: 'front'
  });
  expect(getGLParameter(device, GL.CULL_FACE), 'got expected value').toEqual(true);
  expect(getGLParameter(device, GL.CULL_FACE_MODE), 'got expected value').toEqual(GL.FRONT);
  setDeviceParameters(device, {
    cullMode: 'back'
  });
  expect(getGLParameter(device, GL.CULL_FACE), 'got expected value').toEqual(true);
  expect(getGLParameter(device, GL.CULL_FACE_MODE), 'got expected value').toEqual(GL.BACK);
  setDeviceParameters(device, {
    cullMode: 'none'
  });
  expect(getGLParameter(device, GL.CULL_FACE), 'got expected value').toEqual(false);
});
test('setDeviceParameters#frontFace', async () => {
  const device = await getOrSkipWebGLTestDevice(expect);
  if (!device) {
    return;
  }
  resetGLParameters(device.gl);
  expect(getGLParameter(device, GL.FRONT_FACE), 'got expected value').toEqual(GL.CCW);
  setDeviceParameters(device, {
    frontFace: 'cw'
  });
  expect(getGLParameter(device, GL.FRONT_FACE), 'got expected value').toEqual(GL.CW);
  setDeviceParameters(device, {
    frontFace: 'ccw'
  });
  expect(getGLParameter(device, GL.FRONT_FACE), 'got expected value').toEqual(GL.CCW);
});
test('setDeviceParameters#depthWriteEnabled', async () => {
  const device = await getOrSkipWebGLTestDevice(expect);
  if (!device) {
    return;
  }
  resetGLParameters(device.gl);
  expect(getGLParameter(device, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(true);
  setDeviceParameters(device, {
    depthWriteEnabled: false
  });
  expect(getGLParameter(device, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(false);
  setDeviceParameters(device, {
    depthWriteEnabled: true
  });
  expect(getGLParameter(device, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(true);
});
test('setDeviceParameters#blending', async () => {
  const device = await getOrSkipWebGLTestDevice(expect);
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
  expect(getGLParameter(device, GL.BLEND_EQUATION_RGB), 'GL.BLEND_EQUATION_RGB = GL.FUNC_ADD').toBe(GL.FUNC_ADD);
  expect(getGLParameter(device, GL.BLEND_EQUATION_ALPHA), 'GL.BLEND_EQUATION_ALPHA = GL.FUNC_SUBTRACT').toBe(GL.FUNC_SUBTRACT);
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
  expect(getGLParameter(device, GL.BLEND_EQUATION_RGB), 'GL.BLEND_EQUATION_RGB = GL.MAX').toBe(GL.MAX);
  expect(getGLParameter(device, GL.BLEND_EQUATION_ALPHA), 'GL.BLEND_EQUATION_ALPHA = GL.MIN').toBe(GL.MIN);
  expect(getGLParameter(device, GL.BLEND_SRC_RGB), 'GL.BLEND_SRC_RGB = GL.SRC_ALPHA').toBe(GL.SRC_ALPHA);
  expect(getGLParameter(device, GL.BLEND_DST_RGB), 'GL.BLEND_DST_RGB = GL.DST_ALPHA').toBe(GL.DST_ALPHA);
  expect(getGLParameter(device, GL.BLEND_SRC_ALPHA), 'GL.BLEND_SRC_ALPHA = GL.ZERO').toBe(GL.ZERO);
  expect(getGLParameter(device, GL.BLEND_DST_ALPHA), 'GL.BLEND_DST_ALPHA = GL.ONE').toBe(GL.ONE);
});
test('setDeviceParameters#depthCompare', async () => {
  const device = await getOrSkipWebGLTestDevice(expect);
  if (!device) {
    return;
  }
  resetGLParameters(device.gl);
  expect(getGLParameter(device, GL.DEPTH_TEST), 'GL.DEPTH_TEST = false').toBe(false);
  setDeviceParameters(device, {
    depthCompare: 'less'
  });
  expect(getGLParameter(device, GL.DEPTH_TEST), 'GL.DEPTH_TEST = true').toBe(true);
  expect(getGLParameter(device, GL.DEPTH_FUNC), 'GL.DEPTH_FUNC = GL.LESS').toBe(GL.LESS);
  setDeviceParameters(device, {
    depthCompare: 'always'
  });
  expect(getGLParameter(device, GL.DEPTH_TEST), 'GL.DEPTH_TEST = false').toBe(false);
  expect(getGLParameter(device, GL.DEPTH_FUNC), 'GL.DEPTH_FUNC = GL.ALWAYS').toBe(GL.ALWAYS);
});
test('setDeviceParameters#depthClearValue', async () => {
  const device = await getOrSkipWebGLTestDevice(expect);
  if (!device) {
    return;
  }
  const gl = device.gl;
  resetGLParameters(gl);
  expect(getGLParameter(device, GL.DEPTH_CLEAR_VALUE), 'got expected clear depth').toEqual(1);
  setDeviceParameters(device, {
    clearDepth: 0
  });
  expect(getGLParameter(device, GL.DEPTH_CLEAR_VALUE), 'set clear depth works').toEqual(0);
});
