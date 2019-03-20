import test from 'tape-catch';
import {Program, Buffer, VertexArray} from '@luma.gl/webgl';

import {fixture} from 'test/setup';

const vs = `
attribute vec3 positions;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
varying vec3 vPosition;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vPosition = positions;
}
`;

const fs = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const BUFFER_DATA = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);

test('WebGL#Program construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new Program(),
    /.*WebGLRenderingContext.*/,
    'Program throws on missing gl context'
  );

  t.throws(() => new Program(gl), 'Program throws on missing shader');

  const program = new Program(gl, {vs, fs});
  t.ok(program instanceof Program, 'Program construction successful');

  program.delete();
  t.ok(program instanceof Program, 'Program delete successful');

  program.delete();
  t.ok(program instanceof Program, 'Program repeated delete successful');

  t.end();
});

test('WebGL#Program draw', t => {
  const {gl} = fixture;

  const program = new Program(gl, {fs, vs});

  const vertexArray = new VertexArray(gl, {program});
  vertexArray.setAttributes({
    positions: new Buffer(gl, {data: BUFFER_DATA, accessor: {size: 3}}),
    unusedAttributeName: new Buffer(gl, {data: BUFFER_DATA, accessor: {size: 3}})
  });
  t.ok(vertexArray instanceof VertexArray, 'VertexArray set buffers successful');

  program.draw({vertexArray, vertexCount: 3});
  t.ok(program instanceof Program, 'Program draw successful');

  program.draw({vertexArray, vertexCount: 3, parameters: {blend: true}});
  t.ok(program instanceof Program, 'Program draw with parameters is successful');

  t.end();
});

test('WebGL#Program caching', t => {
  const {gl} = fixture;

  const program = new Program(gl, {fs, vs});

  program._isCached = true;
  program.delete();
  t.ok(program._handle, 'Program should not be deleted');

  program._isCached = false;
  program.delete();
  t.ok(!program._handle, 'Program should be deleted');

  t.end();
});
