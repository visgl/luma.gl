import test from 'tape-catch';
import GL from '@luma.gl/constants';
import {VertexArrayObject} from '@luma.gl/webgl';

import {fixture} from 'test/setup';

test('WebGL#VertexArrayObject (default)#enable', t => {
  const {gl} = fixture;

  const vertexAttributes = VertexArrayObject.getDefaultArray(gl);

  const MAX_ATTRIBUTES = VertexArrayObject.getMaxAttributes(gl);
  t.ok(MAX_ATTRIBUTES >= 8, 'vertexAttributes.getMaxAttributes() >= 8');

  for (let i = 1; i < MAX_ATTRIBUTES; i++) {
    t.equal(
      vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: i}),
      false,
      `vertex attribute ${i} should initially be disabled`
    );
  }

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    vertexAttributes.enable(i);
  }

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    t.equal(
      vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: i}),
      true,
      `vertex attribute ${i} should now be enabled`
    );
  }

  for (let i = 1; i < MAX_ATTRIBUTES; i++) {
    vertexAttributes.enable(i, false);
  }

  // t.equal(vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: 0}), true,
  //   'vertex attribute 0 should **NOT** be disabled');

  for (let i = 1; i < MAX_ATTRIBUTES; i++) {
    t.equal(
      vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_ENABLED, {location: i}),
      false,
      `vertex attribute ${i} should now be disabled`
    );
  }

  t.end();
});

test('WebGL#VertexArrayObject construct/delete', t => {
  const {gl} = fixture;

  if (!VertexArrayObject.isSupported(gl)) {
    t.comment('VertexArrayObjects not supported, skipping tests');
    t.end();
    return;
  }

  t.throws(() => new VertexArrayObject(), 'VertexArrayObject throws on missing gl context');

  const vao = new VertexArrayObject(gl);
  t.ok(vao instanceof VertexArrayObject, 'VertexArrayObject construction successful');

  vao.delete();
  t.ok(vao instanceof VertexArrayObject, 'VertexArrayObject delete successful');

  vao.delete();
  t.ok(vao instanceof VertexArrayObject, 'VertexArrayObject repeated delete successful');

  t.end();
});

test('WebGL#vertexArrayObject#WebGL2 support', t => {
  const {gl2: gl} = fixture;

  if (!gl) {
    t.comment('VertexArrayObjects not supported, skipping tests');
    t.end();
    return;
  }

  t.ok(VertexArrayObject.isSupported(gl), 'VertexArrayObject is supported');

  const vertexAttributes = VertexArrayObject.getDefaultArray(gl);

  const MAX_ATTRIBUTES = VertexArrayObject.getMaxAttributes(gl);

  for (let i = 0; i < MAX_ATTRIBUTES; i++) {
    t.equal(
      vertexAttributes.getParameter(GL.VERTEX_ATTRIB_ARRAY_DIVISOR, {location: i}),
      0,
      `vertex attribute ${i} should have 0 divisor`
    );
  }

  t.end();
});

test('WebGL#VertexArrayObject#getConstantBuffer', t => {
  const {gl} = fixture;

  const vertexAttributes = VertexArrayObject.getDefaultArray(gl);

  let buffer = vertexAttributes.getConstantBuffer(100, new Float32Array([5, 4, 3]));

  t.equal(buffer.byteLength, 1200, 'byteLength should match');
  t.equal(buffer.bytesUsed, 1200, 'bytesUsed should match');

  buffer = vertexAttributes.getConstantBuffer(5, new Float32Array([5, 3, 2]));
  t.equal(buffer.byteLength, 1200, 'byteLength should be unchanged');
  t.equal(buffer.bytesUsed, 60, 'bytesUsed should have changed');

  const {gl2} = fixture;

  if (gl2) {
    const vertexAttributes2 = VertexArrayObject.getDefaultArray(gl2);
    buffer = vertexAttributes2.getConstantBuffer(5, new Float32Array([5, 3, 2]));
    t.equal(buffer.byteLength, 60, 'byteLength should be unchanged');
    t.equal(buffer.bytesUsed, 60, 'bytesUsed should have changed');
    const data = buffer.getData();
    t.deepEqual(
      data,
      new Float32Array([5, 3, 2, 5, 3, 2, 5, 3, 2, 5, 3, 2, 5, 3, 2]),
      'Constant buffer was correctly set'
    );
    t.comment(JSON.stringify(data));
  }

  t.end();
});
