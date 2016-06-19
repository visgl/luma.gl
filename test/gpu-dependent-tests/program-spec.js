import test from 'tape-catch';

import {WebGLRenderingContext} from '../../src/webgl/webgl-types';

import {createGLContext, Program} from '../../src/webgl';
import shaders from '../../shaderlib';

const fixture = {
  gl: createGLContext(null, {})
};

test('WebGL#Program construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new Program(),
    /.*WebGLRenderingContext.*/,
    'Program throws on missing gl context');

  const program = new Program(gl, shaders);
  t.ok(program instanceof Program, 'Program construction successful');

  program.delete();
  t.ok(program instanceof Program, 'Program delete successful');

  program.delete();
  t.ok(program instanceof Program, 'Program repeated delete successful');

  t.end();
});
