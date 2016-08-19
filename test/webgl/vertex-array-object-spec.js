/* eslint-disable max-len */
import {createGLContext} from '../../src/headless';
import {VertexArrayObject} from '../../src/webgl2';
import shaders from '../../shaderlib';

import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};

test('WebGL#VertexArrayObject construct/delete', t => {
  const {gl} = fixture;

  if (!VertexArrayObject.isSupported(gl)) {
    t.comment('- VertexArrayObject not supported, skipping tests');
    t.end();
    return;
  }

  t.throws(
    () => new VertexArrayObject(),
    /.*WebGLRenderingContext.*/,
    'VertexArrayObject throws on missing gl context');

  const program = new VertexArrayObject(gl, shaders);
  t.ok(program instanceof VertexArrayObject, 'VertexArrayObject construction successful');

  program.delete();
  t.ok(program instanceof VertexArrayObject, 'VertexArrayObject delete successful');

  program.delete();
  t.ok(program instanceof VertexArrayObject, 'VertexArrayObject repeated delete successful');

  t.end();
});
