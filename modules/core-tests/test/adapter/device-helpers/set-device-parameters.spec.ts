import test, {Test} from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';

import {Parameters} from '@luma.gl/core';
import {GL, GLParameters} from '@luma.gl/constants';
import {setDeviceParameters, getGLParameters, resetGLParameters} from '@luma.gl/webgl';

// import {createTestDevice} from '@luma.gl/test-utils';
// const webglDevice = createTestDevice({debug: true, webgl2: false});
// const webglDevice = createTestDevice({debug: true, webgl2: true, webgl1: false});

// Settings test, could be beneficial to not reuse a context
const {gl} = webglDevice;

// const stringify = (v) => JSON.stringify(ArrayBuffer.isView(v) ? Array.apply([], v) : v);

const getGLParameter = (parameter: keyof GLParameters): any => {
  const parameters = getGLParameters(gl, [parameter]);
  return parameters[parameter];
};

test('setDeviceParameters#cullMode', t => {
  resetGLParameters(gl);

  t.deepEqual(getGLParameter(GL.CULL_FACE), false, 'got expected value');

  setDeviceParameters(webglDevice, {cullMode: 'front'});
  t.deepEqual(getGLParameter(GL.CULL_FACE), true, 'got expected value');
  t.deepEqual(getGLParameter(GL.CULL_FACE_MODE), GL.FRONT, 'got expected value');

  setDeviceParameters(webglDevice, {cullMode: 'back'});
  t.deepEqual(getGLParameter(GL.CULL_FACE), true, 'got expected value');
  t.deepEqual(getGLParameter(GL.CULL_FACE_MODE), GL.BACK, 'got expected value');

  setDeviceParameters(webglDevice, {cullMode: 'none'});
  t.deepEqual(getGLParameter(GL.CULL_FACE), false, 'got expected value');

  t.end();
});

test('setDeviceParameters#frontFace', t => {
  resetGLParameters(gl);

  t.deepEqual(getGLParameter(GL.FRONT_FACE), GL.CCW, 'got expected value');

  setDeviceParameters(webglDevice, {frontFace: 'cw'});
  t.deepEqual(getGLParameter(GL.FRONT_FACE), GL.CW, 'got expected value');

  setDeviceParameters(webglDevice, {frontFace: 'ccw'});
  t.deepEqual(getGLParameter(GL.FRONT_FACE), GL.CCW, 'got expected value');

  t.end();
});

test('setDeviceParameters#depthWriteEnabled', t => {
  resetGLParameters(gl);

  t.deepEqual(getGLParameter(GL.DEPTH_WRITEMASK), true, 'got expected value');

  setDeviceParameters(webglDevice, {depthWriteEnabled: false});
  t.deepEqual(getGLParameter(GL.DEPTH_WRITEMASK), false, 'got expected value');

  setDeviceParameters(webglDevice, {depthWriteEnabled: true});
  t.deepEqual(getGLParameter(GL.DEPTH_WRITEMASK), true, 'got expected value');

  t.end();
});

test('setDeviceParameters#depthWriteEnabled', t => {
  testClauses(t, 'depthWriteEnabled', [
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

// HELPERS

// type TestClause = {check: GLParameters} | {set: Parameters};
type TestClause = {check?: GLParameters; set?: Parameters};

function testClauses(t: Test, name: string, clauses: TestClause[]): void {
  resetGLParameters(gl);

  for (const clause of clauses) {
    if (clause.check) {
      const values = getGLParameters(gl, clause.check);
      for (const [key, value] of Object.entries(clause.check)) {
        t.deepEqual(values[key], value, `got expected value for ${name}`);
      }
    }

    if (clause.set) {
      setDeviceParameters(webglDevice, clause.set);
    }
  }
}
