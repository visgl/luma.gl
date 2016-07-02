import {WebGLRenderingContext} from '../../src/webgl/webgl-types';
import {createGLContext, Buffer} from '../../src/webgl';
import test from 'tape-catch';
import headlessGL from 'gl';

const fixture = {
  gl: createGLContext({headlessGL, debug: true})
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

  t.end();
});

test('WebGL#Buffer data/subData', t => {
  const {gl} = fixture;

  let buffer;

  buffer = new Buffer(gl)
    .setData({
      target: gl.ARRAY_BUFFER,
      data: new Float32Array([1, 2, 3])
    })
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer,
    'Buffer.setData(ARRAY_BUFFER) successful');

  // TODO- buffer could check for integer ARRAY_ELEMENT_BUFFER types
  buffer = new Buffer(gl)
    .setData({
      target: gl.ARRAY_ELEMENT_BUFFER,
      data: new Float32Array([1, 2, 3])
    })
    .bind()
    .unbind()
    .delete();
  t.ok(buffer instanceof Buffer,
    'Buffer.setData(ARRAY_ELEMENT_BUFFER) successful');

  t.end();
});
