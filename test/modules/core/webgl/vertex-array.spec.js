import test from 'tape-catch';
import GL from 'luma.gl/constants';
import {createGLContext, VertexArray, VertexArrayObject} from 'luma.gl';

import {fixture} from 'luma.gl/test/setup';

test('WebGL#VertexArray construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new VertexArray(),
    'VertexArray throws on missing gl context');

  const vao = new VertexArray(gl);
  t.ok(vao instanceof VertexArray, 'VertexArray construction successful');

  vao.delete();
  t.ok(vao instanceof VertexArray, 'VertexArray delete successful');

  vao.delete();
  t.ok(vao instanceof VertexArray, 'VertexArray repeated delete successful');

  t.end();
});

test('WebGL#VertexArray#enable', t => {
  const gl = createGLContext();

  const vertexArray = new VertexArray(gl);

  const MAX_ATTRIBUTES = VertexArrayObject.getMaxAttributes(gl);
  t.ok(MAX_ATTRIBUTES >= 8, 'vertexArray.getMaxAttributes() >= 8');

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    const param = vertexArray.vertexArrayObject.getParameter(
      GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: i}
    );
    t.equal(param, false, `vertex attribute ${i} should initially be disabled`);
  }

  t.end();
});
