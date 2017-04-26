import {GL, createGLContext, Buffer, isWebGLContext} from 'luma.gl';
import 'luma.gl/headless';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext({debug: true})
};

test('WebGL#Buffer constructor/delete', t => {
  const {gl} = fixture;
  t.ok(isWebGLContext(gl), 'Created gl context');

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

  const buffer = new Buffer(gl)
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer bind/unbind successful');

  t.end();
});

test('WebGL#Buffer construction', t => {
  const {gl} = fixture;

  let buffer;

  buffer = new Buffer(gl, {data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer(ARRAY_BUFFER) successful');

  // TODO - buffer could check for integer ELEMENT_ARRAY_BUFFER types
  buffer = new Buffer(gl, {
    target: GL.ELEMENT_ARRAY_BUFFER,
    data: new Float32Array([1, 2, 3])
  })
  .bind()
  .unbind()
  .delete();
  t.ok(buffer instanceof Buffer, 'Buffer(ELEMENT_ARRAY_BUFFER) successful');

  t.end();
});

test('WebGL#Buffer setData/subData', t => {
  const {gl} = fixture;

  let buffer;

  buffer = new Buffer(gl, {target: GL.ARRAY_BUFFER})
    .setData({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer.subData(ARRAY_BUFFER) successful');

  buffer = new Buffer(gl, {target: GL.ARRAY_BUFFER, data: new Float32Array([1, 2, 3])})
    .setData({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer.subData(ARRAY_BUFFER) successful');

  // TODO- buffer could check for integer ELEMENT_ARRAY_BUFFER types
  buffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER})
    .setData({data: new Float32Array([1, 2, 3])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer.setData(ELEMENT_ARRAY_BUFFER) successful');

  // TODO- buffer could check for integer ARRAY_ELEMENT_BUFFER types
  buffer = new Buffer(gl, {target: GL.ARRAY_ELEMENT_BUFFER})
    .setData({data: new Float32Array([1, 2, 3])})
    .subData({data: new Float32Array([1, 1, 1])})
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer, 'Buffer.subData(ARRAY_ELEMENT_BUFFER) successful');

  t.end();
});
