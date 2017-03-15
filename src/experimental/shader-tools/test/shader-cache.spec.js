import 'luma.gl/headless';
import {createGLContext, VertexShader, FragmentShader, Program} from 'luma.gl';
import {ShaderCache} from '..';

import test from 'tape-catch';

const fixture = {
  gl: createGLContext()
};

const VS1 = `
attribute vec3 positions;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
}
`;

const VS2 = `
attribute vec3 positions;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
}
`;

const VS3 = `
attribute vec3 positions;

uniform mat4 uPMatrix;

void main(void) {
  gl_Position = uPMatrix * vec4(positions, 1.0);
}
`;

const FS1 = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const FS2 = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const FS3 = `
void main(void) {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

test('Experimental#ShaderCache import', t => {
  t.ok(ShaderCache !== undefined, 'ShaderCache import successful');
  t.end();
});

test('Experimental#ShaderCache construct/delete', t => {
  let shaderCache = new ShaderCache();
  t.ok(shaderCache instanceof ShaderCache, 'ShaderCache construction successful');
  shaderCache = shaderCache.delete();
  t.ok(shaderCache instanceof ShaderCache, 'ShaderCache delete successful');
  t.end();
});

test('Experimental#ShaderCache get cached vertex shaders', t => {
  const {gl} = fixture;

  const shaderCache = new ShaderCache(gl);

  const vs1 = shaderCache.getVertexShader(gl, VS1);
  const vs2 = shaderCache.getVertexShader(gl, VS2);

  t.ok(vs1 instanceof VertexShader, 'Got good VertexShader from cache');
  t.ok(vs2 instanceof VertexShader, 'Got good VertexShader from cache');

  t.equal(vs1, vs2, 'Second VertexShader was cached');

  const vs3 = shaderCache.getVertexShader(gl, VS3);
  t.ok(vs3 instanceof VertexShader, 'Got good VertexShader from cache');

  t.notEqual(vs1, vs3, 'Third VertexShader was not cached');

  t.end();
});

test('Experimental#ShaderCache get cached fragment shaders', t => {
  const {gl} = fixture;

  const shaderCache = new ShaderCache(gl);

  const fs1 = shaderCache.getFragmentShader(gl, FS1);
  const fs2 = shaderCache.getFragmentShader(gl, FS2);

  t.ok(fs1 instanceof FragmentShader, 'Got good FragmentShader from cache');
  t.ok(fs2 instanceof FragmentShader, 'Got good FragmentShader from cache');

  t.equal(fs1, fs2, 'Second FragmentShader was cached');

  const fs3 = shaderCache.getFragmentShader(gl, FS3);
  t.ok(fs3 instanceof FragmentShader, 'Got good FragmentShader from cache');

  t.notEqual(fs1, fs3, 'Third FragmentShader was not cached');

  t.end();
});

test('Experimental#ShaderCache - construct Program from cached shaders', t => {
  const {gl} = fixture;

  const shaderCache = new ShaderCache();
  shaderCache.getVertexShader(gl, VS1);
  shaderCache.getFragmentShader(gl, FS1);

  let program = new Program(gl, {
    vs: shaderCache.getVertexShader(gl, VS1),
    fs: shaderCache.getFragmentShader(gl, FS1)
  });
  t.ok(program instanceof Program,
    'Program constructed from cached shaders successful ');

  program = program.delete();
  t.ok(program instanceof Program, 'Program delete successful');

  const program2 = new Program(gl, {
    vs: shaderCache.getVertexShader(gl, VS1),
    fs: shaderCache.getFragmentShader(gl, FS1)
  });
  t.ok(program2 instanceof Program,
    'Program constructed from cached shaders successful after delete of first program');

  t.end();
});
