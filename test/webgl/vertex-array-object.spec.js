import test from 'tape-catch';
import {createGLContext} from 'luma.gl/headless';
import {VertexArrayObject} from 'luma.gl';

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

  const vao = new VertexArrayObject(gl);
  t.ok(vao instanceof VertexArrayObject, 'VertexArrayObject construction successful');

  vao.delete();
  t.ok(vao instanceof VertexArrayObject, 'VertexArrayObject delete successful');

  vao.delete();
  t.ok(vao instanceof VertexArrayObject, 'VertexArrayObject repeated delete successful');

  t.end();
});
