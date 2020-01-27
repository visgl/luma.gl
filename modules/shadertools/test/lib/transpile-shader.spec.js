/* eslint-disable camelcase */
import {createTestContext} from '@luma.gl/test-utils';
import transpileShader from '@luma.gl/shadertools/lib/transpile-shader';
import test from 'tape-catch';

const fixture = {
  gl: createTestContext({webgl2: false, webgl1: true, throwOnError: true}),
  gl2: createTestContext({webgl2: true, webgl1: false})
};

// 300 version should use 'textureCube()'' instead of 'texture()'
const VS_GLSL_300 = `\
#version 300 es

in vec4 positions;
uniform sampler2D sampler;
uniform samplerCube sCube;
out vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vec4 texColor = texture(sampler, texCoord);
  vec4 texCubeColor = textureCube(sCube, cubeCoord);
  vec4 texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  vColor = vec4(1., 0., 0., 1.);
}
`;

// transpiled 300 version should have correct `texure()` syntax
const VS_GLSL_300_transpiled = `\
#version 300 es

in vec4 positions;
uniform sampler2D sampler;
uniform samplerCube sCube;
out vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vec4 texColor = texture(sampler, texCoord);
  vec4 texCubeColor = texture(sCube, cubeCoord);
  vec4 texLod = textureLod(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureLod(sCube, cubeCoord, 1.0);
  vColor = vec4(1., 0., 0., 1.);
}
`;

const VS_GLSL_100 = `\
#version 100

attribute vec4 positions;
uniform sampler2D sampler;
uniform samplerCube sCube;
varying vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vec4 texColor = texture2D(sampler, texCoord);
  vec4 texCubeColor = textureCube(sCube, cubeCoord);
  vec4 texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  vColor = vec4(1., 0., 0., 1.);
}
`;

// 300 version should use 'textureCube()'' instead of 'texture()'
const FS_GLSL_300 = `\
#version 300 es

precision highp float;

out vec4 fragmentColor;
uniform sampler2D sampler;
uniform samplerCube sCube;
in vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  vec4 texColor = texture(sampler, texCoord);
  vec4 texCubeColor = textureCube(sCube, cubeCoord);
  vec4 texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  fragmentColor = vColor;
}
`;

// transpiled 300 version should have correct `texure()` syntax
const FS_GLSL_300_transpiled = `\
#version 300 es

precision highp float;

out vec4 fragmentColor;
uniform sampler2D sampler;
uniform samplerCube sCube;
in vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  vec4 texColor = texture(sampler, texCoord);
  vec4 texCubeColor = texture(sCube, cubeCoord);
  vec4 texLod = textureLod(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureLod(sCube, cubeCoord, 1.0);
  fragmentColor = vColor;
}
`;

const FS_GLSL_100 = `\
#version 100

precision highp float;

uniform sampler2D sampler;
uniform samplerCube sCube;
varying vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  vec4 texColor = texture2D(sampler, texCoord);
  vec4 texCubeColor = textureCube(sCube, cubeCoord);
  vec4 texLod = texture2DLodEXT(sampler, texCoord, 1.0);
  vec4 texCubeLod = textureCubeLodEXT(sCube, cubeCoord, 1.0);
  gl_FragColor = vColor;
}
`;

const VS_GLSL_300_VALID = `\
#version 300 es

in vec4 positions;
uniform sampler2D sampler;
uniform samplerCube sCube;
out vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  gl_Position = positions;
  vec4 texColor = texture(sampler, vec2(1.0));
  vec4 texCubeColor = textureCube(sCube, vec3(1.0));
  vColor = vec4(1., 0., 0., 1.);
}
`;

const FS_GLSL_300_VALID = `\
#version 300 es

precision highp float;

out vec4 fragmentColor;
uniform sampler2D sampler;
uniform samplerCube sCube;
in vec4 vColor;

void f(out float a, in float b) {}

void main(void) {
  vec4 texColor = texture(sampler, vec2(1.0));
  vec4 texCubeColor = textureCube(sCube, vec3(1.0));
  fragmentColor = vColor;
}
`;

test('transpileShader#import', t => {
  t.ok(transpileShader !== undefined, 'transpileShader import successful');
  t.end();
});

test('transpileShader#versions', t => {
  let assembleResult;

  assembleResult = transpileShader(VS_GLSL_300, 100, true);
  t.equal(stripSpaces(assembleResult), stripSpaces(VS_GLSL_100), 'correctly transpiled');

  assembleResult = transpileShader(FS_GLSL_300, 100, false);
  t.equal(stripSpaces(assembleResult), stripSpaces(FS_GLSL_100), 'correctly transpiled');

  assembleResult = transpileShader(VS_GLSL_100, 300, true);
  t.equal(stripSpaces(assembleResult), stripSpaces(VS_GLSL_300_transpiled), 'correctly transpiled');

  // test 300 to 300 transpilation, textureCube() should be replaced with texture()

  assembleResult = transpileShader(VS_GLSL_300, 300, true);
  t.equal(stripSpaces(assembleResult), stripSpaces(VS_GLSL_300_transpiled), 'correctly transpiled');

  assembleResult = transpileShader(FS_GLSL_300, 300, false);
  t.equal(stripSpaces(assembleResult), stripSpaces(FS_GLSL_300_transpiled), 'correctly transpiled');

  t.throws(() => transpileShader(VS_GLSL_300, 400, true), /version/, 'unknown glsl version');

  t.end();
});

test('transpileShader#compilation', t => {
  const {gl, gl2} = fixture;

  const vs300_100 = transpileShader(VS_GLSL_300_VALID, 100, true);
  const fs300_100 = transpileShader(FS_GLSL_300_VALID, 100, false);
  const vs300_300 = transpileShader(VS_GLSL_300_VALID, 300, true);
  const fs300_300 = transpileShader(FS_GLSL_300_VALID, 300, false);

  let vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vs300_100);
  gl.compileShader(vShader);

  let fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fs300_100);
  gl.compileShader(fShader);

  let program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);

  gl.linkProgram(program);

  t.ok(gl.getProgramParameter(program, gl.LINK_STATUS), 'Transpile 300 to 100 valid program');

  gl.deleteShader(vShader);
  gl.deleteShader(fShader);
  gl.deleteProgram(program);

  if (gl2) {
    vShader = gl2.createShader(gl2.VERTEX_SHADER);
    gl2.shaderSource(vShader, vs300_300);
    gl2.compileShader(vShader);

    fShader = gl2.createShader(gl2.FRAGMENT_SHADER);
    gl2.shaderSource(fShader, fs300_300);
    gl2.compileShader(fShader);

    program = gl2.createProgram();
    gl2.attachShader(program, vShader);
    gl2.attachShader(program, fShader);

    gl2.linkProgram(program);

    t.ok(gl2.getProgramParameter(program, gl2.LINK_STATUS), 'Transpile 300 to 300 valid program');

    gl2.deleteShader(vShader);
    gl2.deleteShader(fShader);
    gl2.deleteProgram(program);
  }

  t.end();
});

function stripSpaces(text) {
  return text; // .replace(/\s+/g, '');
}
