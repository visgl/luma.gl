import '../headless';
import {createGLContext, FramebufferObject} from '..';
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

test('WebGL#FramebufferObject construct/delete', t => {
  const {gl} = fixture;

  t.throws(
    () => new FramebufferObject(),
    /.*WebGLRenderingContext.*/,
    'FramebufferObject throws on missing gl context');

  const fbo = new FramebufferObject(gl);
  t.ok(fbo instanceof FramebufferObject,
    'FramebufferObject construction successful');

  fbo.delete();
  t.ok(fbo instanceof FramebufferObject,
      'FramebufferObject delete successful');

  fbo.delete();
  t.ok(fbo instanceof FramebufferObject,
    'FramebufferObject repeated delete successful');

  t.end();
});

test('WebGL#FramebufferObject buffer update', t => {
  const {gl} = fixture;

  const fbo = new FramebufferObject(gl, {fs: FS, vs: VS});
  t.ok(fbo instanceof FramebufferObject,
    'FramebufferObject construction successful');

  t.end();
});
