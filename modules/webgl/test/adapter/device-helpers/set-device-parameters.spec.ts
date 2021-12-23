import test from 'tape-promise/tape';
import {webgl1TestDevice, webgl2TestDevice} from '@luma.gl/test-utils';

import {Parameters} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {setDeviceParameters, GLParameters, getParameters, resetParameters} from '@luma.gl/webgl';

// import {createTestDevice} from '@luma.gl/test-utils';
// const webgl1TestDevice = createTestDevice({debug: true, webgl2: false});
// const webgl2TestDevice = createTestDevice({debug: true, webgl2: true, webgl1: false});

// Settings test, could be beneficial to not reuse a context
const fixture = {
  gl: webgl1TestDevice.gl,
  gl2: webgl2TestDevice?.gl2
};

const {gl} = fixture;

// const stringify = (v) => JSON.stringify(ArrayBuffer.isView(v) ? Array.apply([], v) : v);

const getGLParameter = (parameter: GL): any => {
  const parameters = getParameters(gl, [parameter]);
  return parameters[parameter];
}

test('setDeviceParameters#cullMode', (t) => {
  resetParameters(gl);

  t.deepEqual(getGLParameter(GL.CULL_FACE), false, `got expected value`);

  setDeviceParameters(webgl1TestDevice, {cullMode: 'front'});
  t.deepEqual(getGLParameter(GL.CULL_FACE), true, `got expected value`);
  t.deepEqual(getGLParameter(GL.CULL_FACE_MODE), GL.FRONT, `got expected value`);

  setDeviceParameters(webgl1TestDevice, {cullMode: 'back'});
  t.deepEqual(getGLParameter(GL.CULL_FACE), true, `got expected value`);
  t.deepEqual(getGLParameter(GL.CULL_FACE_MODE), GL.BACK, `got expected value`);

  setDeviceParameters(webgl1TestDevice, {cullMode: 'none'});
  t.deepEqual(getGLParameter(GL.CULL_FACE), false, `got expected value`);

  t.end();
});

test('setDeviceParameters#frontFace', (t) => {
  resetParameters(gl);

  t.deepEqual(getGLParameter(GL.FRONT_FACE), GL.CCW, `got expected value`);

  setDeviceParameters(webgl1TestDevice, {frontFace: 'cw'});
  t.deepEqual(getGLParameter(GL.FRONT_FACE), GL.CW, `got expected value`);

  setDeviceParameters(webgl1TestDevice, {frontFace: 'ccw'});
  t.deepEqual(getGLParameter(GL.FRONT_FACE), GL.CCW, `got expected value`);

  t.end();
});

test('setDeviceParameters#depthWriteEnabled', (t) => {
  resetParameters(gl);

  t.deepEqual(getGLParameter(GL.DEPTH_WRITEMASK), true, `got expected value`);

  setDeviceParameters(webgl1TestDevice, {depthWriteEnabled: false});
  t.deepEqual(getGLParameter(GL.DEPTH_WRITEMASK), false, `got expected value`);

  setDeviceParameters(webgl1TestDevice, {depthWriteEnabled: true});
  t.deepEqual(getGLParameter(GL.DEPTH_WRITEMASK), true, `got expected value`);

  t.end();
});

test('setDeviceParameters#depthWriteEnabled', (t) => {
  testClauses(t, 'depthWriteEnabled', [
    {check: {[GL.DEPTH_WRITEMASK]: true}},
    {set: {depthWriteEnabled: false}},
    {check: {[GL.DEPTH_WRITEMASK]: false}},
    {set: {depthWriteEnabled: true}},
    {check: {[GL.DEPTH_WRITEMASK]: true}},
  ]);

  t.end();
});


test.skip('setDeviceParameters#depthClearValue', (t) => {
  // let value = getParameters(gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  // t.is(value, 1, `got expected value ${stringify(value)}`);

  // // setDeviceParameters(gl, {[GL.DEPTH_CLEAR_VALUE]: -1});
  // value = getParameters(gl, [GL.DEPTH_CLEAR_VALUE])[GL.DEPTH_CLEAR_VALUE];
  // t.is(value, -1, `got expected value ${stringify(value)}`);

  // // @ts-expect-error
  // t.throws(() => setDeviceParameters({}), 'throws with non WebGL context');

  t.end();
});

// HELPERS

// type TestClause = {check: GLParameters} | {set: Parameters};
type TestClause = {check?: GLParameters, set?: Parameters};

function testClauses(t: test, name: string, clauses: TestClause[]): void {
  resetParameters(gl);

  for (const clause of clauses) {
    if (clause.check) {
      const values = getParameters(gl, clause.check);
      for (const [key, value] of Object.entries(clause.check)) {
        t.deepEqual(values[key], value, `got expected value for ${name}`);
      }
    }

    if (clause.set) {
      setDeviceParameters(webgl1TestDevice, clause.set);
    }
  }
}
