import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import { Parameters } from '@luma.gl/core';
import { GL, GLParameters } from '@luma.gl/constants';
import { setDeviceParameters, getGLParameters, resetGLParameters, WebGLDevice } from '@luma.gl/webgl';

// const stringify = (v) => JSON.stringify(ArrayBuffer.isView(v) ? Array.apply([], v) : v);

const getGLParameter = (gl: WebGL2RenderingContext, parameter: keyof GLParameters): any => {
  const parameters = getGLParameters(gl, [parameter]);
  return parameters[parameter];
};
test('setDeviceParameters#cullMode', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gl = webglDevice.gl;
  resetGLParameters(gl);
  expect(getGLParameter(gl, GL.CULL_FACE), 'got expected value').toEqual(false);
  setDeviceParameters(webglDevice, {
    cullMode: 'front'
  });
  expect(getGLParameter(gl, GL.CULL_FACE), 'got expected value').toEqual(true);
  expect(getGLParameter(gl, GL.CULL_FACE_MODE), 'got expected value').toEqual(GL.FRONT);
  setDeviceParameters(webglDevice, {
    cullMode: 'back'
  });
  expect(getGLParameter(gl, GL.CULL_FACE), 'got expected value').toEqual(true);
  expect(getGLParameter(gl, GL.CULL_FACE_MODE), 'got expected value').toEqual(GL.BACK);
  setDeviceParameters(webglDevice, {
    cullMode: 'none'
  });
  expect(getGLParameter(gl, GL.CULL_FACE), 'got expected value').toEqual(false);
});
test('setDeviceParameters#frontFace', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gl = webglDevice.gl;
  resetGLParameters(gl);
  expect(getGLParameter(gl, GL.FRONT_FACE), 'got expected value').toEqual(GL.CCW);
  setDeviceParameters(webglDevice, {
    frontFace: 'cw'
  });
  expect(getGLParameter(gl, GL.FRONT_FACE), 'got expected value').toEqual(GL.CW);
  setDeviceParameters(webglDevice, {
    frontFace: 'ccw'
  });
  expect(getGLParameter(gl, GL.FRONT_FACE), 'got expected value').toEqual(GL.CCW);
});
test('setDeviceParameters#depthWriteEnabled', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gl = webglDevice.gl;
  resetGLParameters(gl);
  expect(getGLParameter(gl, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(true);
  setDeviceParameters(webglDevice, {
    depthWriteEnabled: false
  });
  expect(getGLParameter(gl, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(false);
  setDeviceParameters(webglDevice, {
    depthWriteEnabled: true
  });
  expect(getGLParameter(gl, GL.DEPTH_WRITEMASK), 'got expected value').toEqual(true);
});

// type TestClause = {check: GLParameters} | {set: Parameters};
type TestClause = {
  check?: GLParameters;
  set?: Parameters;
};
function testClauses(t: typeof expect, device: WebGLDevice, name: string, clauses: TestClause[]): void {
  const gl = device.gl;
  resetGLParameters(device.gl);
  for (const clause of clauses) {
    if (clause.check) {
      const values = getGLParameters(gl, clause.check);
      for (const [key, value] of Object.entries(clause.check)) {
        t.deepEqual(values[key], value, `got expected value for ${name}`);
      }
    }
    if (clause.set) {
      setDeviceParameters(device, clause.set);
    }
  }
}
test('setDeviceParameters#depthWriteEnabled', async () => {
  const webglDevice = await getWebGLTestDevice();
  testClauses(expect, webglDevice, 'depthWriteEnabled', [{
    check: {
      [GL.DEPTH_WRITEMASK]: true
    }
  }, {
    set: {
      depthWriteEnabled: false
    }
  }, {
    check: {
      [GL.DEPTH_WRITEMASK]: false
    }
  }, {
    set: {
      depthWriteEnabled: true
    }
  }, {
    check: {
      [GL.DEPTH_WRITEMASK]: true
    }
  }]);
});
test('setDeviceParameters#depthClearValue', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gl = webglDevice.gl;
  resetGLParameters(gl);
  expect(getGLParameter(gl, GL.DEPTH_CLEAR_VALUE), 'got expected clear depth').toEqual(1);
  setDeviceParameters(webglDevice, {
    clearDepth: 0
  });
  expect(getGLParameter(gl, GL.DEPTH_CLEAR_VALUE), 'set clear depth works').toEqual(0);
});
