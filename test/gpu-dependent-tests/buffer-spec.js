/* global document */
import {WebGLRenderingContext} from '../../src/webgl/webgl-types';

import {createGLContext, Buffer} from '../../src/webgl';
import test from 'tape-catch';

test('WebGL#Buffer constructor', t => {
  const canvas = document.createElement('canvas');
  const gl = createGLContext(canvas);
  t.ok(gl instanceof WebGLRenderingContext, 'Created gl context');

  t.throws(
    () => new Buffer(),
    /.*WebGLRenderingContext.*/,
    'Program throws on missing gl context');

  t.throws(
    () => new Buffer(gl),
    /.*data.*/,
    'Program throws on missing data');

  const program = new Buffer(gl, {data: new Float32Array(1)});
  t.ok(program instanceof Buffer, 'Buffer construction successful');
  t.end();
});
