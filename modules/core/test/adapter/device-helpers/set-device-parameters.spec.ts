// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {Parameters} from '@luma.gl/core';
import {GL, GLParameters} from '@luma.gl/constants';
import {setDeviceParameters, getGLParameters, resetGLParameters, WebGLDevice} from '@luma.gl/webgl';

// const stringify = (v) => JSON.stringify(ArrayBuffer.isView(v) ? Array.apply([], v) : v);

const getGLParameter = (gl: WebGL2RenderingContext, parameter: keyof GLParameters): any => {
  const parameters = getGLParameters(gl, [parameter]);
  return parameters[parameter];
};

test('setDeviceParameters#cullMode', async t => {
  const webglDevice = await getWebGLTestDevice();
  const gl = webglDevice.gl;

  resetGLParameters(gl);

  t.deepEqual(getGLParameter(gl, GL.CULL_FACE), false, 'got expected value');

  setDeviceParameters(webglDevice, {cullMode: 'front'});
  t.deepEqual(getGLParameter(gl, GL.CULL_FACE), true, 'got expected value');
  t.deepEqual(getGLParameter(gl, GL.CULL_FACE_MODE), GL.FRONT, 'got expected value');

  setDeviceParameters(webglDevice, {cullMode: 'back'});
  t.deepEqual(getGLParameter(gl, GL.CULL_FACE), true, 'got expected value');
  t.deepEqual(getGLParameter(gl, GL.CULL_FACE_MODE), GL.BACK, 'got expected value');

  setDeviceParameters(webglDevice, {cullMode: 'none'});
  t.deepEqual(getGLParameter(gl, GL.CULL_FACE), false, 'got expected value');

  t.end();
});

test('setDeviceParameters#frontFace', async t => {
  const webglDevice = await getWebGLTestDevice();
  const gl = webglDevice.gl;

  resetGLParameters(gl);

  t.deepEqual(getGLParameter(gl, GL.FRONT_FACE), GL.CCW, 'got expected value');

  setDeviceParameters(webglDevice, {frontFace: 'cw'});
  t.deepEqual(getGLParameter(gl, GL.FRONT_FACE), GL.CW, 'got expected value');

  setDeviceParameters(webglDevice, {frontFace: 'ccw'});
  t.deepEqual(getGLParameter(gl, GL.FRONT_FACE), GL.CCW, 'got expected value');

  t.end();
});

test('setDeviceParameters#depthWriteEnabled', async t => {
  const webglDevice = await getWebGLTestDevice();
  const gl = webglDevice.gl;

  resetGLParameters(gl);

  t.deepEqual(getGLParameter(gl, GL.DEPTH_WRITEMASK), true, 'got expected value');

  setDeviceParameters(webglDevice, {depthWriteEnabled: false});
  t.deepEqual(getGLParameter(gl, GL.DEPTH_WRITEMASK), false, 'got expected value');

  setDeviceParameters(webglDevice, {depthWriteEnabled: true});
  t.deepEqual(getGLParameter(gl, GL.DEPTH_WRITEMASK), true, 'got expected value');

  t.end();
});

// type TestClause = {check: GLParameters} | {set: Parameters};
type TestClause = {check?: GLParameters; set?: Parameters};

function testClauses(t: Test, device: WebGLDevice, name: string, clauses: TestClause[]): void {
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

test('setDeviceParameters#depthWriteEnabled', async t => {
  const webglDevice = await getWebGLTestDevice();

  testClauses(t, webglDevice, 'depthWriteEnabled', [
    {check: {[GL.DEPTH_WRITEMASK]: true}},
    {set: {depthWriteEnabled: false}},
    {check: {[GL.DEPTH_WRITEMASK]: false}},
    {set: {depthWriteEnabled: true}},
    {check: {[GL.DEPTH_WRITEMASK]: true}}
  ]);

  t.end();
});

test.skip('setDeviceParameters#depthClearValue', t => {
  // let value = getGLParameters(gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  // t.is(value, 1, `got expected value ${stringify(value)}`);

  // // setDeviceParameters(gl, {[GL.DEPTH_CLEAR_VALUE]: -1});
  // value = getGLParameters(gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  // t.is(value, -1, `got expected value ${stringify(value)}`);

  // // @ts-expect-error
  // t.throws(() => setDeviceParameters({}), 'throws with non WebGL context');

  t.end();
});
