/* eslint-disable no-inline-comments */
import test from 'tape-catch';
import {Program, Texture2D} from 'luma.gl';
import 'luma.gl/headless';
import {checkUniformValues} from 'luma.gl/webgl/uniforms';

import {fixture} from '../setup';

const MATRIX_2 = [
  1, 0,
  0, 1
];

const MATRIX_3 = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
];
const MATRIX_4 = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

const VERTEX_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

void main(void) {
  gl_Position = vec4(0., 0., 0., 0.);
}
`;

const WEBGL1_FRAGMENT_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

uniform float f;
uniform int i;
uniform bool b;
uniform vec2 v2;
uniform vec3 v3;
uniform vec4 v4;
// int vectors
// bool vectors
uniform mat2 m2;
uniform mat3 m3;
uniform mat4 m4;

uniform sampler2D s2d;
// uniform samplerCube sCube;

void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const WEBGL1_GOOD_UNIFORMS = {
  f: 1.0,
  i: 1,
  b: true,
  v2: new Float32Array([1, 2]), // FLOAT_VEC2  0x8B50
  v3: new Float32Array([1, 2, 3]), // FLOAT_VEC3  0x8B51
  v4: new Float32Array([1, 2, 3, 4]), // FLOAT_VEC4  0x8B52
  // INT_VEC2  0x8B53
  // INT_VEC3  0x8B54
  // INT_VEC4  0x8B55
  // BOOL  0x8B56
  // BOOL_VEC2 0x8B57
  // BOOL_VEC3 0x8B58
  // BOOL_VEC4 0x8B59
  m2: new Float32Array(MATRIX_2), // FLOAT_MAT2  0x8B5A
  m3: new Float32Array(MATRIX_3), // FLOAT_MAT3  0x8B5B
  m4: new Float32Array(MATRIX_4), // FLOAT_MAT4  0x8B5C

  s2d: new Texture2D(fixture.gl)    // SAMPLER_2D  0x8B5E
  // sCube: new TextureCube(gl) // SAMPLER_CUBE  0x8B60
};

// const WEBGL1_ARRAYS_FRAGMENT_SHADER = `
// #ifdef GL_ES
// precision highp float;
// #endif

// uniform float f[3];
// uniform int i[3];
// uniform bool b[3];
// uniform vec2 v2[3];
// uniform vec3 v3[3];
// uniform vec4 v4[3];
// // int vectors
// // bool vectors
// uniform mat2 m2[3];
// uniform mat3 m3[3];
// uniform mat4 m4[3];

// uniform sampler2D s2d[5];
// // uniform samplerCube sCube;

// void main(void) {
//   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
// }
// `;

// const WEBGL1_ARRAYS_GOOD_UNIFORMS = {
//   f: 1.0,
//   i: 1,
//   b: true,
//   v2: new Float32Array([...[1, 2], ...[1, 2], ...[1, 2]]),
//   v3: new Float32Array([...[1, 2, 3], ...[1, 2, 3], ...[1, 2, 3]]),
//   v4: new Float32Array([...[1, 2, 3, 4], ...[1, 2, 3, 4], ...[1, 2, 3, 4]]),
//   // INT_VEC2  0x8B53
//   // INT_VEC3  0x8B54
//   // INT_VEC4  0x8B55
//   // BOOL  0x8B56
//   // BOOL_VEC2 0x8B57
//   // BOOL_VEC3 0x8B58
//   // BOOL_VEC4 0x8B59
//   m2: new Float32Array([...MATRIX_2, ...MATRIX_2, ...MATRIX_2]),
//   m3: new Float32Array([...MATRIX_3, ...MATRIX_3, ...MATRIX_3]),
//   m4: new Float32Array([...MATRIX_4, ...MATRIX_4, ...MATRIX_4]),

//   s2d: [new Texture2D(gl), new Texture2D(gl), new Texture2D(gl)]
//   // sCube: new TextureCube(gl) // SAMPLER_CUBE  0x8B60
// };

// const WEBGL2_FRAGMENT_SHADER = `
// #ifdef GL_ES
// precision highp float;
// #endif
// uniform sampler1D;
// uniform sampler3D;

// void main(void) {
//   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
// }
// `;

// const WEBGL2_GOOD_UNIFORMS = {
//   s1d: 2, // SAMPLER_1D  0x8B5E
//   s3d: 3  // SAMPLER_3D  0x8B60
// };

// const BUFFER_DATA = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);

test('WebGL#Uniforms pre verify uniforms', t => {
  t.ok(checkUniformValues(WEBGL1_GOOD_UNIFORMS,
    'Uniform values are well formed'));

  // t.throws()

  t.end();
});

test('WebGL#Uniforms Program construct/delete', t => {
  const {gl} = fixture;

  const program = new Program(gl, {
    vs: VERTEX_SHADER,
    fs: WEBGL1_FRAGMENT_SHADER
  });
  t.ok(program instanceof Program, 'Program construction successful');

  t.end();
});
