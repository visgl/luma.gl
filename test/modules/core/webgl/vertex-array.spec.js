import test from 'tape-catch';
import GL from 'luma.gl/constants';
import {VertexArray, VertexArrayObject, Buffer} from 'luma.gl';

import {fixture} from 'luma.gl/test/setup';

const BUFFER_DATA = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);

test('WebGL#VertexArray construct/delete', t => {
  const {gl} = fixture;

  t.throws(() => new VertexArray(), 'VertexArray throws on missing gl context');

  const vao = new VertexArray(gl);
  t.ok(vao instanceof VertexArray, 'VertexArray construction successful');

  vao.delete();
  t.ok(vao instanceof VertexArray, 'VertexArray delete successful');

  vao.delete();
  t.ok(vao instanceof VertexArray, 'VertexArray repeated delete successful');

  t.end();
});

test('WebGL#VertexArray#enable', t => {
  const {gl} = fixture;

  const vertexArray = new VertexArray(gl);

  const MAX_ATTRIBUTES = VertexArrayObject.getMaxAttributes(gl);
  t.ok(MAX_ATTRIBUTES >= 8, 'vertexArray.getMaxAttributes() >= 8');

  for (let i = 1; i < MAX_ATTRIBUTES; i++) {
    const param = vertexArray.vertexArrayObject.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {
      location: i
    });
    t.equal(param, false, `vertex attribute ${i} should initially be disabled`);
  }

  t.end();
});

test('WebGL#VertexArray#setAttributes(unused)', t => {
  const {gl} = fixture;

  const vertexArray = new VertexArray(gl);
  vertexArray.setAttributes({
    unusedAttributeName: new Buffer(gl, {target: GL.ARRAY_BUFFER, data: BUFFER_DATA, size: 3})
  });
  t.ok(vertexArray instanceof VertexArray, 'VertexArray set buffers successful');

  t.end();
});
