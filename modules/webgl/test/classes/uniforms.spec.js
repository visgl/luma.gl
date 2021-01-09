/* eslint-disable no-inline-comments */
import test from 'tape-catch';
import {Program, Texture2D} from '@luma.gl/webgl';
import {isBrowser} from 'probe.gl/env';
import {equals} from '@math.gl/core';
import {
  checkUniformValues,
  parseUniformName,
  getUniformSetter
} from '@luma.gl/webgl/classes/uniforms';

import {fixture} from 'test/setup';

import {CACHING_TEST_CASES} from './uniform-cache-test-cases';

const MATRIX_2 = [1, 0, 0, 1];

const MATRIX_3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const MATRIX_4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const VERTEX_SHADER = `
precision highp float;

void main(void) {
  gl_Position = vec4(0., 0., 0., 0.);
}
`;

const WEBGL1_FRAGMENT_SHADER = `
precision highp float;

uniform float f;
uniform vec2 v2;
uniform vec3 v3;
uniform vec4 v4;
uniform vec4 v4Array[4];

uniform int i;
uniform ivec2 iv2;
uniform ivec3 iv3;
uniform ivec4 iv4;

uniform bool b;
uniform bvec2 bv2;
uniform bvec3 bv3;
uniform bvec4 bv4;

uniform mat2 m2;
uniform mat3 m3;
uniform mat4 m4;

uniform sampler2D s2d;
// uniform samplerCube sCube;

void main(void) {
  vec4 v = vec4(f) + vec4(v2, 0., 0.) + vec4(v3, 0.) + v4;

  // Note: Insructions added in a way to create dependecy between i, and iv* variables,
  // without this dependecy compiler can otimize the shader and remove these uniforms.
  ivec4 iv = ivec4(i, 0, 0, 0);
  iv = iv + ivec4(iv2, 0, 0);
  iv = iv + ivec4(iv3, 0);
  iv = iv + iv4;

  bvec4 bv = bv4;
  bv = bvec4(bv3, 0.);
  bv = bvec4(bv2, 0., 0.);
  bv = bvec4(b);

  // Note: Insructions added in a way to create dependecy between transform_v* variables,
  // without this dependecy compiler can otimize the shader and remove these uniforms.
  vec2 transform_v2 = m2 * v2;
  vec3 transform_v3 = m3 * v3;
  vec4 transform_v4 = m4 * v4;
  transform_v4 = vec4(transform_v2, 0., 0.) + vec4(transform_v3, 0.);

  for (int index = 0; index < 4; index++) {
    transform_v4 += v4Array[index];
  }

  v = texture2D(s2d, v2);

  gl_FragColor = vec4(transform_v2, 1.0, 1.0) + vec4(transform_v3, 1.0) + transform_v4;
}
`;

const WEBGL1_FRAGMENT_SHADER_ARRAY = `
precision highp float;
#define ARRAY_LENGTH 5

uniform float f[ARRAY_LENGTH];
uniform int i[ARRAY_LENGTH];
uniform bool b[ARRAY_LENGTH];

void main(void) {
  float fValue;
  for (int index = 0; index < ARRAY_LENGTH; index++) {
    fValue += f[index];
  }

  int iValue;
  for (int index = 0; index < ARRAY_LENGTH; index++) {
    iValue += i[index];
  }

  bool bValue;
  for (int index = 0; index < ARRAY_LENGTH; index++) {
    bValue = bValue && b[index];
  }


  gl_FragColor.xyz = vec3(fValue, float(iValue), float(bValue));
}
`;

const WEBGL1_GOOD_UNIFORMS = {
  f: 1.0,
  v2: new Float32Array([1, 2]), // FLOAT_VEC2  0x8B50
  v3: new Float32Array([1, 2, 3]), // FLOAT_VEC3  0x8B51
  v4: new Float32Array([1, 2, 3, 4]), // FLOAT_VEC4  0x8B52
  v4Array: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), // FLOAT_VEC4  0x8B52

  i: -1,
  iv2: new Int32Array([1, 2]), // INT_VEC2  0x8B53
  iv3: new Int32Array([1, 2, 3]), // INT_VEC3  0x8B54
  iv4: new Int32Array([1, 2, 3, 4]), // INT_VEC4  0x8B55

  b: true, // BOOL  0x8B56
  // @ts-ignore
  bv2: new Int32Array([false, true]), // BOOL_VEC2 0x8B57
  // @ts-ignore
  bv3: new Int32Array([false, true, false]), // BOOL_VEC3 0x8B58
  // @ts-ignore
  bv4: new Int32Array([false, true, false, true]), // BOOL_VEC4 0x8B59

  m2: new Float32Array(MATRIX_2), // FLOAT_MAT2  0x8B5A
  m3: new Float32Array(MATRIX_3), // FLOAT_MAT3  0x8B5B
  m4: new Float32Array(MATRIX_4), // FLOAT_MAT4  0x8B5C

  s2d: new Texture2D(fixture.gl) // SAMPLER_2D  0x8B5E
};

const ARRAY_UNIFORM_SIZE = {
  v4Array: 4
};

const WEBGL1_GOOD_UNIFORMS_ARRAY = {
  f: new Float32Array([1.1, 2.4, 6.5, -10.4, 25]),
  i: new Int32Array([40, -103, 34, 87, 26]),
  b: [false, false, true, true, false]
};
test('WebGL#Uniforms pre verify uniforms', t => {
  // @ts-ignore
  t.ok(checkUniformValues(WEBGL1_GOOD_UNIFORMS), 'Uniform values are well formed');

  t.end();
});

test('WebGL#Uniforms Program uniform locations', t => {
  const {gl} = fixture;

  const program = new Program(gl, {
    vs: VERTEX_SHADER,
    fs: WEBGL1_FRAGMENT_SHADER
  });

  for (const uniformName in WEBGL1_GOOD_UNIFORMS) {
    // @ts-ignore
    t.ok(program._uniformSetters[uniformName], `Program found uniform setter ${uniformName}`);
  }

  t.end();
});

const getExpectedUniformValues = () => {
  const result = {};

  for (const uniformName in WEBGL1_GOOD_UNIFORMS) {
    const value = WEBGL1_GOOD_UNIFORMS[uniformName];

    if (ARRAY_UNIFORM_SIZE[uniformName]) {
      if (!isBrowser()) {
        // headless gl does not handle uniform arrays
        continue; // eslint-disable-line
      }

      // array uniform, need to check each item
      const uniformSize = ARRAY_UNIFORM_SIZE[uniformName];
      const arrayLen = value.length / uniformSize;

      for (let i = 0; i < arrayLen; i++) {
        result[`${uniformName}[${i}]`] = value.slice(uniformSize * i, uniformSize * (i + 1));
      }
    } else if (uniformName.startsWith('bv')) {
      result[uniformName] = Array.from(value).map(Boolean);
    } else {
      result[uniformName] = value;
    }
  }

  return result;
};

const getExpectedUniformValuesScalarArray = () => {
  const result = {};
  if (!isBrowser()) {
    // headless gl does not handle uniform arrays
    return result; // eslint-disable-line
  }

  for (const uniformName in WEBGL1_GOOD_UNIFORMS_ARRAY) {
    const value = WEBGL1_GOOD_UNIFORMS_ARRAY[uniformName];

    for (const i in value) {
      result[`${uniformName}[${i}]`] = value[i];
    }
  }

  return result;
};

const getUniformValue = (program, locationName) => {
  const location = program.gl.getUniformLocation(program.handle, locationName);
  return program.gl.getUniform(program.handle, location);
};

const setUniformAndCheck = (program, input, expected, t) => {
  program.setUniforms(input);
  t.pass('Set uniforms successful');

  for (const uniformName in expected) {
    let expectedValue = expected[uniformName];
    let value = getUniformValue(program, uniformName);

    if (expectedValue instanceof Texture2D) {
      // @ts-ignore
      expectedValue = expectedValue.textureUnit;
    } else if (expectedValue.length) {
      expectedValue = Array.from(expectedValue);
      value = Array.from(value);
    }

    t.ok(equals(value, expectedValue), `${uniformName} set correctly`);
  }
};

const testSetUniform = (gl, t) => {
  const program = new Program(gl, {
    vs: VERTEX_SHADER,
    fs: WEBGL1_FRAGMENT_SHADER
  });

  const expectedValues = getExpectedUniformValues();

  let uniforms = Object.assign({}, WEBGL1_GOOD_UNIFORMS);

  t.comment('Test setting typed arrays');
  setUniformAndCheck(program, uniforms, expectedValues, t);

  // @ts-ignore
  uniforms = {};
  for (const uniformName in WEBGL1_GOOD_UNIFORMS) {
    const value = WEBGL1_GOOD_UNIFORMS[uniformName];
    if (value.length) {
      // Convert to plain array
      uniforms[uniformName] = Array.from(value);
    }
  }

  t.comment('Test setting plain arrays');
  setUniformAndCheck(program, uniforms, expectedValues, t);

  // @ts-ignore
  uniforms = {};
  for (const uniformName in WEBGL1_GOOD_UNIFORMS) {
    const value = WEBGL1_GOOD_UNIFORMS[uniformName];
    if (value.length) {
      // Convert to wrong typed array
      uniforms[uniformName] =
        value instanceof Float32Array ? new Int32Array(value) : new Float32Array(value);
    }
  }

  t.comment('Test setting malformed typed arrays');
  setUniformAndCheck(program, uniforms, expectedValues, t);

  t.end();
};

// Tests setting uniform scalar arrays
const testSetUniformScalarArray = (gl, t) => {
  const program = new Program(gl, {
    vs: VERTEX_SHADER,
    fs: WEBGL1_FRAGMENT_SHADER_ARRAY
  });

  const expectedValues = getExpectedUniformValuesScalarArray();

  const uniforms = Object.assign({}, WEBGL1_GOOD_UNIFORMS_ARRAY);

  t.comment('Test setting uniform arrays');
  setUniformAndCheck(program, uniforms, expectedValues, t);

  t.end();
};

test('WebGL#Uniforms Program setUniforms', t => {
  const {gl} = fixture;

  testSetUniform(gl, t);
});

test('WebGL2#Uniforms Program setUniforms', t => {
  const {gl2} = fixture;

  if (gl2) {
    testSetUniform(gl2, t);
  } else {
    t.end();
  }
});

test('WebGL2#Uniforms Program setUniforms for scalar arrays', t => {
  const {gl2} = fixture;

  if (gl2) {
    testSetUniformScalarArray(gl2, t);
  } else {
    t.end();
  }
});

test('WebGL#Uniforms parseUniformName', t => {
  const regularUniform = parseUniformName('position');
  t.equal(regularUniform.name, 'position');
  t.ok(!regularUniform.isArray);

  const arrayUniform = parseUniformName('position[0]');
  t.equal(arrayUniform.name, 'position');
  t.ok(arrayUniform.isArray);

  const structArrayUniform = parseUniformName('lights[0].color');
  t.equal(structArrayUniform.name, 'lights[0].color');
  t.ok(!structArrayUniform.isArray);
  t.end();
});

test('WebGL#Uniforms caching', t => {
  let called = false;

  const setCalled = () => {
    called = true;
  };

  const checkCalled = (expected, fn) => {
    called = false;
    fn();
    t.ok(expected === called, 'Uniform setter was correctly cached.');
  };

  const glStub = {};

  CACHING_TEST_CASES.forEach(testCase => {
    if (!glStub[testCase.function]) {
      glStub[testCase.function] = getUniformStub(t, testCase.arrayType, setCalled);
    }
  });

  CACHING_TEST_CASES.forEach(testCase => {
    const setter = getUniformSetter(glStub, null, {type: testCase.glType});

    checkCalled(true, () => setter(testCase.data1));
    checkCalled(false, () => setter(testCase.data1));
    checkCalled(true, () => setter(testCase.data2));
  });

  t.end();
});

function getUniformStub(t, arrayType, called) {
  return (location, transpose, value) => {
    if (value === undefined) {
      // Not matrix
      value = transpose;
    }

    if (arrayType) {
      t.equals(arrayType, value.constructor, 'Value is correct type.');
    } else {
      t.ok(!(Array.isArray(value) || ArrayBuffer.isView(value)), 'Value is not array');
    }

    called();
  };
}
