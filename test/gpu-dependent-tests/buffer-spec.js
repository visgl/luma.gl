import {WebGLRenderingContext} from '../../src/webgl/webgl-types';

import {createGLContext, Buffer} from '../../src/webgl';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext(null, {})
};

test('WebGL#Buffer constructor/delete', t => {
  const {gl} = fixture;
  t.ok(gl instanceof WebGLRenderingContext, 'Created gl context');

  t.throws(
    () => new Buffer(),
    /.*WebGLRenderingContext.*/,
    'Buffer throws on missing gl context');

  const buffer = new Buffer(gl);
  t.ok(buffer instanceof Buffer, 'Buffer construction successful');

  buffer.delete();
  t.ok(buffer instanceof Buffer, 'Buffer delete successful');

  buffer.delete();
  t.ok(buffer instanceof Buffer, 'Buffer repeated delete successful');

  t.end();
});

test('WebGL#Buffer bind/unbind', t => {
  const {gl} = fixture;

  let buffer;

  buffer = new Buffer(gl)
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer bind/unbind successful');

  buffer = new Buffer(gl, {bufferType: gl.ARRAY_BUFFER})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer bind/unbind successful');

  buffer = new Buffer(gl, {bufferType: gl.ARRAY_ELEMENT_BUFFER})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer bind/unbind successful');

  buffer = new Buffer(gl, {bufferType: gl.STATIC_DRAW});
  t.throws(
    () => buffer.bind().unbind(),
    /.*WebGL invalid enumerated argument.*/,
    'Buffer bind fails on bad bufferType');
  buffer.delete();

  t.end();
});
