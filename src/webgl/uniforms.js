import Texture from './texture';
import {formatValue} from '../utils';
import assert from 'assert';

// Local constants, will be "collapsed" during minification

// WebGL1

const GL_FLOAT = 0x1406;
const GL_FLOAT_VEC2 = 0x8B50;
const GL_FLOAT_VEC3 = 0x8B51;
const GL_FLOAT_VEC4 = 0x8B52;

const GL_INT = 0x1404;
const GL_INT_VEC2 = 0x8B53;
const GL_INT_VEC3 = 0x8B54;
const GL_INT_VEC4 = 0x8B55;

const GL_BOOL = 0x8B56;
const GL_BOOL_VEC2 = 0x8B57;
const GL_BOOL_VEC3 = 0x8B58;
const GL_BOOL_VEC4 = 0x8B59;

const GL_FLOAT_MAT2 = 0x8B5A;
const GL_FLOAT_MAT3 = 0x8B5B;
const GL_FLOAT_MAT4 = 0x8B5C;

const GL_SAMPLER_2D = 0x8B5E;
const GL_SAMPLER_CUBE = 0x8B60;

// WebGL2

const GL_UNSIGNED_INT = 0x1405;
const GL_UNSIGNED_INT_VEC2 = 0x8DC6;
const GL_UNSIGNED_INT_VEC3 = 0x8DC7;
const GL_UNSIGNED_INT_VEC4 = 0x8DC8;

/* eslint-disable camelcase */
const GL_FLOAT_MAT2x3 = 0x8B65;
const GL_FLOAT_MAT2x4 = 0x8B66;
const GL_FLOAT_MAT3x2 = 0x8B67;
const GL_FLOAT_MAT3x4 = 0x8B68;
const GL_FLOAT_MAT4x2 = 0x8B69;
const GL_FLOAT_MAT4x3 = 0x8B6A;

const GL_SAMPLER_3D = 0x8B5F;
const GL_SAMPLER_2D_SHADOW = 0x8B62;
const GL_SAMPLER_2D_ARRAY = 0x8DC1;
const GL_SAMPLER_2D_ARRAY_SHADOW = 0x8DC4;
const GL_SAMPLER_CUBE_SHADOW = 0x8DC5;
const GL_INT_SAMPLER_2D = 0x8DCA;
const GL_INT_SAMPLER_3D = 0x8DCB;
const GL_INT_SAMPLER_CUBE = 0x8DCC;
const GL_INT_SAMPLER_2D_ARRAY = 0x8DCF;
const GL_UNSIGNED_INT_SAMPLER_2D = 0x8DD2;
const GL_UNSIGNED_INT_SAMPLER_3D = 0x8DD3;
const GL_UNSIGNED_INT_SAMPLER_CUBE = 0x8DD4;
const GL_UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;

/* TODO - create static Float32...Arrays and copy into those instead of minting new ones?
const arrays = {};
function getTypedArray(type, data) {
  if (flatArrayLength > 1) {
    setter = val => {
      if (!(val instanceof TypedArray)) {
        const typedArray = new TypedArray(flatArrayLength);
        typedArray.set(val);
        val = typedArray;
      }
      assert(val.length === flatArrayLength);
    };
  }
}
// TODO - handle array uniforms
*/

const UNIFORM_SETTERS = {

  // WEBGL1

  /* eslint-disable max-len */
  [GL_FLOAT]: (gl, location, value) => gl.uniform1f(location, value),
  [GL_FLOAT_VEC2]: (gl, location, value) => gl.uniform2fv(location, new Float32Array(value)),
  [GL_FLOAT_VEC3]: (gl, location, value) => gl.uniform3fv(location, new Float32Array(value)),
  [GL_FLOAT_VEC4]: (gl, location, value) => gl.uniform4fv(location, new Float32Array(value)),

  [GL_INT]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_INT_VEC2]: (gl, location, value) => gl.uniform2iv(location, new Int32Array(value)),
  [GL_INT_VEC3]: (gl, location, value) => gl.uniform3iv(location, new Int32Array(value)),
  [GL_INT_VEC4]: (gl, location, value) => gl.uniform4iv(location, new Int32Array(value)),

  [GL_BOOL]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_BOOL_VEC2]: (gl, location, value) => gl.uniform2iv(location, new Int32Array(value)),
  [GL_BOOL_VEC3]: (gl, location, value) => gl.uniform3fv(location, new Int32Array(value)),
  [GL_BOOL_VEC4]: (gl, location, value) => gl.uniform4iv(location, new Int32Array(value)),

  // uniformMatrix(false): don't transpose the matrix
  [GL_FLOAT_MAT2]: (gl, location, value) => gl.uniformMatrix2fv(location, false, new Float32Array(value)),
  [GL_FLOAT_MAT3]: (gl, location, value) => gl.uniformMatrix3fv(location, false, new Float32Array(value)),
  [GL_FLOAT_MAT4]: (gl, location, value) => gl.uniformMatrix4fv(location, false, new Float32Array(value)),

  [GL_SAMPLER_2D]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_SAMPLER_CUBE]: (gl, location, value) => gl.uniform1i(location, value),

  // WEBGL2 - unsigned integers, irregular matrices, additional texture samplers

  [GL_UNSIGNED_INT]: (gl, location, value) => gl.uniform1ui(location, value),
  [GL_UNSIGNED_INT_VEC2]: (gl, location, value) => gl.uniform2uiv(location, new Uint32Array(value)),
  [GL_UNSIGNED_INT_VEC3]: (gl, location, value) => gl.uniform3uiv(location, new Uint32Array(value)),
  [GL_UNSIGNED_INT_VEC4]: (gl, location, value) => gl.uniform4uiv(location, new Uint32Array(value)),

  // uniformMatrix(false): don't transpose the matrix
  [GL_FLOAT_MAT2x3]: (gl, location, value) => gl.uniformMatrix2x3fv(location, false, new Float32Array(value)),
  [GL_FLOAT_MAT2x4]: (gl, location, value) => gl.uniformMatrix2x4fv(location, false, new Float32Array(value)),
  [GL_FLOAT_MAT3x2]: (gl, location, value) => gl.uniformMatrix3x2fv(location, false, new Float32Array(value)),
  [GL_FLOAT_MAT3x4]: (gl, location, value) => gl.uniformMatrix3x4fv(location, false, new Float32Array(value)),
  [GL_FLOAT_MAT4x2]: (gl, location, value) => gl.uniformMatrix4x2fv(location, false, new Float32Array(value)),
  [GL_FLOAT_MAT4x3]: (gl, location, value) => gl.uniformMatrix4x3fv(location, false, new Float32Array(value)),

  [GL_SAMPLER_3D]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_SAMPLER_2D_SHADOW]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_SAMPLER_2D_ARRAY]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_SAMPLER_2D_ARRAY_SHADOW]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_SAMPLER_CUBE_SHADOW]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_INT_SAMPLER_2D]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_INT_SAMPLER_3D]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_INT_SAMPLER_CUBE]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_INT_SAMPLER_2D_ARRAY]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_UNSIGNED_INT_SAMPLER_2D]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_UNSIGNED_INT_SAMPLER_3D]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_UNSIGNED_INT_SAMPLER_CUBE]: (gl, location, value) => gl.uniform1i(location, value),
  [GL_UNSIGNED_INT_SAMPLER_2D_ARRAY]: (gl, location, value) => gl.uniform1i(location, value)
  /* eslint-enable max-len */
};

export function parseUniformName(name) {
  // name = name[name.length - 1] === ']' ?
  // name.substr(0, name.length - 3) : name;

  // if array name then clean the array brackets
  const UNIFORM_NAME_REGEXP = /([^\[]*)(\[[0-9]+\])?/;
  const matches = name.match(UNIFORM_NAME_REGEXP);
  if (!matches || matches.length < 2) {
    throw new Error(`Failed to parse GLSL uniform name ${name}`);
  }

  return {
    name: matches[1],
    length: matches[2] || 1,
    isArray: Boolean(matches[2])
  };
}

// Returns a Magic Uniform Setter
/* eslint-disable complexity */
export function getUniformSetter(gl, location, info) {
  const setter = UNIFORM_SETTERS[info.type];
  if (!setter) {
    throw new Error(`Unknown GLSL uniform type ${info.type}`);
  }
  return setter.bind(null, gl, location);
}

// Basic checks of uniform values without knowledge of program
// To facilitate early detection of e.g. undefined values in JavaScript
export function checkUniformValues(uniforms, source) {
  for (const uniformName in uniforms) {
    const value = uniforms[uniformName];
    if (!checkUniformValue(value)) {
      // Add space to source
      source = source ? `${source} ` : '';
      // Value could be unprintable so write the object on console
      console.error(`${source} Bad uniform ${uniformName}`, value); // eslint-disable-line
      /* eslint-enable no-console */
      throw new Error(`${source} Bad uniform ${uniformName}`);
    }
  }
  return true;
}

function checkUniformValue(value) {
  let ok = true;

  // Test for texture (for sampler uniforms)
  // WebGL2: if (value instanceof Texture || value instanceof Sampler) {
  if (value instanceof Texture) {
    ok = true;
  // Check that every element in array is a number, and at least 1 element
  } else if (Array.isArray(value)) {
    for (const element of value) {
      if (!isFinite(element)) {
        ok = false;
      }
    }
    ok = ok && (value.length > 0);
  // Typed arrays can only contain numbers, but check length
  } else if (ArrayBuffer.isView(value)) {
    ok = value.length > 0;
  // Check that single value is a number
  } else if (!isFinite(value)) {
    ok = false;
  }

  return ok;
}

// Prepares a table suitable for console.table
/* eslint-disable max-statements */
export function getUniformsTable({
  header = 'Uniforms',
  program,
  uniforms
} = {}) {
  assert(program);

  const uniformLocations = program._uniformSetters;
  const table = {[header]: {}};

  // Add program's provided uniforms
  for (const uniformName in uniformLocations) {
    const uniform = uniforms[uniformName];
    if (uniform !== undefined) {
      table[uniformName] = {
        Type: uniform,
        Value: formatValue(uniform)
      };
    }
  }

  // Add program's unprovided uniforms
  for (const uniformName in uniformLocations) {
    const uniform = uniforms[uniformName];
    if (uniform === undefined) {
      table[uniformName] = {
        Type: 'NOT PROVIDED',
        Value: 'N/A'
      };
    }
  }

  const unusedTable = {};
  let unusedCount = 0;

  // List any unused uniforms
  for (const uniformName in uniforms) {
    const uniform = uniforms[uniformName];
    if (!table[uniformName]) {
      unusedCount++;
      unusedTable[uniformName] = {
        Type: `NOT USED: ${uniform}`,
        Value: formatValue(uniform)
      };
    }
  }

  return {table, unusedTable, unusedCount};
}
