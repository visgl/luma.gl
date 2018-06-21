import test from 'tape-catch';
import GL from 'luma.gl/constants';
import {createGLContext} from 'luma.gl';
import {VertexArray} from 'luma.gl';

const fixture = {
  gl: createGLContext()
};

test('WebGL#VertexArray construct/delete', t => {
  const {gl} = fixture;

  t.ok(VertexArray.isSupported(gl), 'VertexArray is supported');

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

test('WebGL#VertexAttributes#enable', t => {
  const gl = createGLContext();

  const vertexAttributes = VertexArray.getDefaultArray(gl);

  const MAX_ATTRIBUTES = VertexArray.getMaxAttributes(gl);
  t.ok(MAX_ATTRIBUTES >= 8, 'vertexAttributes.getMaxAttributes() >= 8');

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    t.equal(vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: i}), false,
      `vertex attribute ${i} should initially be disabled`);
  }

  /*
  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    vertexAttributes.enable(i);
  }

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    t.equal(vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: i}), true,
      `vertex attribute ${i} should now be enabled`);
  }

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    vertexAttributes.disable(i);
  }

  t.equal(vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: 0}), true,
    'vertex attribute 0 should **NOT** be disabled');

  for (let i = 1; i < MAX_ATTRIBUTES; i++) {
    t.equal(vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: i}), false,
      `vertex attribute ${i} should now be disabled`);
  }
  */

  t.end();
});

test('WebGL#vertexAttributes#WebGL2 support', t => {
  const gl = createGLContext({webgl2: true});

  t.ok(VertexArray.isSupported(gl), 'VertexArray is supported');

  const vertexAttributes = VertexArray.getDefaultArray(gl);

  const MAX_ATTRIBUTES = VertexArray.getMaxAttributes(gl);

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    t.equal(vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_DIVISOR, {location: i}), 0,
      `vertex attribute ${i} should have 0 divisor`);
  }

  t.end();
});
