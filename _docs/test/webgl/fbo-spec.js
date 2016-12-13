import {createGLContext, FramebufferObject, Buffer} from '../../src/headless';
import shaders from '../../src/shaderlib';
import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};

const VS = `
attribute vec3 positions;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
}
`;

const FS = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const BUFFER_DATA = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);

test('WebGL#FramebufferObject construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new FramebufferObject(),
    /.*WebGLRenderingContext.*/,
    'FramebufferObject throws on missing gl context');

  const program = new FramebufferObject(gl, shaders);
  t.ok(program instanceof FramebufferObject,
    'FramebufferObject construction successful');

  program.delete();
  t.ok(program instanceof FramebufferObject,
      'FramebufferObject delete successful');

  program.delete();
  t.ok(program instanceof FramebufferObject,
    'FramebufferObject repeated delete successful');

  t.end();
});

test('WebGL#FramebufferObject buffer update', t => {
  const {gl} = fixture;

  let program = new FramebufferObject(gl, {fs: FS, vs: VS});
  t.ok(program instanceof FramebufferObject,
    'FramebufferObject construction successful');

  program = program.setBuffers({
    positions: new Buffer(gl).setData({data: BUFFER_DATA, size: 3}),
    unusedAttributeName: new Buffer(gl).setData({data: BUFFER_DATA, size: 3})
  });
  t.ok(program instanceof FramebufferObject,
      'FramebufferObject set buffers successful');

  program = program.delete();
  t.ok(program instanceof FramebufferObject,
    'FramebufferObject delete successful');

  t.end();
});
