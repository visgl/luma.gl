import test from 'tape-catch';
import {GL, Program, Buffer} from 'luma.gl';
import 'luma.gl/headless';

import {fixture} from '../setup';

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
    'Program throws on missing gl context');

  t.throws(
    () => new Program(gl),
    /.*shader*/,
    'Program throws on missing shader');

  const program = new Program(gl, {vs, fs});
  t.ok(program instanceof Program, 'Program construction successful');

  program.delete();
  t.ok(program instanceof Program, 'Program delete successful');

  program.delete();
  t.ok(program instanceof Program, 'Program repeated delete successful');

  t.end();
});

test('WebGL#Program buffer update', t => {
  const {gl} = fixture;

  let program = new Program(gl, {fs, vs});
  t.ok(program instanceof Program, 'Program construction successful');

  program = program.setBuffers({
    positions: new Buffer(gl, {target: GL.ARRAY_BUFFER, data: BUFFER_DATA, size: 3}),
    unusedAttributeName: new Buffer(gl, {target: GL.ARRAY_BUFFER, data: BUFFER_DATA, size: 3})
  });
  t.ok(program instanceof Program, 'Program set buffers successful');

  program = program.delete();
  t.ok(program instanceof Program, 'Program delete successful');

  t.end();
});

test('WebGL#Program draw', t => {
  const {gl} = fixture;

  let program = new Program(gl, {fs, vs});

  program = program.setBuffers({
    positions: new Buffer(gl, {target: GL.ARRAY_BUFFER, data: BUFFER_DATA, size: 3}),
    unusedAttributeName: new Buffer(gl, {target: GL.ARRAY_BUFFER, data: BUFFER_DATA, size: 3})
  });

  program.draw({vertexCount: 3});
  t.ok(program instanceof Program, 'Program draw successful');

  program.draw({vertexCount: 3, parameters: {blend: true}});
  t.ok(program instanceof Program, 'Program draw with parameters is successful');

  t.end();
});

test('WebGL#Program varyingMap', t => {
  const {gl2} = fixture;

  if (!gl2) {
    t.comment('WebGL2 not available, skipping tests');
    t.end();
    return;
  }

  let program = new Program(gl2, {fs, vs, varyings: ['vPosition', 'gl_Position']});
  t.deepEqual(program.varyingMap.vPosition, 0);
  t.deepEqual(program.varyingMap.gl_Position, 1);

  program = new Program(gl2, {fs, vs, varyings: ['vPosition', 'gl_Position'], bufferMode: GL.INTERLEAVED_ATTRIBS});
  t.deepEqual(program.varyingMap.vPosition, 0);
  t.deepEqual(program.varyingMap.gl_Position, 0);
  t.end();
});
