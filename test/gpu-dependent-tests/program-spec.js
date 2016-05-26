import test from 'tape-catch';

import {WebGLRenderingContext} from '../../src/webgl/webgl-types';

import {createGLContext, Program} from '../../src/webgl';
import shaders from '../../shaderlib';

test('WebGL#Program constructor', t => {
  const gl = createGLContext(null, {});
  t.ok(gl instanceof WebGLRenderingContext, 'Created gl context');

  t.throws(
    () => new Program(),
    /.*WebGLRenderingContext.*/,
    'Program throws on missing gl context');

  const program = new Program(gl, shaders);
  t.ok(program instanceof Program, 'Program construction successful');
  t.end();
});
