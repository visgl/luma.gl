import test from 'tape-catch';
import {GL, createGLContext, Program, Buffer} from 'luma.gl';
import 'luma.gl/headless';

const fixture = {
  gl: createGLContext()
};

const vs = `
attribute vec3 positions;
uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
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
