import GL from '@luma.gl/constants';
import {log} from '@luma.gl/gltools';
import Framebuffer from './framebuffer';
import Renderbuffer from './renderbuffer';
import Texture from './texture';
import {assert} from '../utils';

const UNIFORM_SETTERS = {
  // WEBGL1

  /* eslint-disable max-len */
  [GL.FLOAT]: getArraySetter.bind(null, 'uniform1fv', toFloatArray, 1, setVectorUniform),
  [GL.FLOAT_VEC2]: getArraySetter.bind(null, 'uniform2fv', toFloatArray, 2, setVectorUniform),
  [GL.FLOAT_VEC3]: getArraySetter.bind(null, 'uniform3fv', toFloatArray, 3, setVectorUniform),
  [GL.FLOAT_VEC4]: getArraySetter.bind(null, 'uniform4fv', toFloatArray, 4, setVectorUniform),

  [GL.INT]: getArraySetter.bind(null, 'uniform1iv', toIntArray, 1, setVectorUniform),
  [GL.INT_VEC2]: getArraySetter.bind(null, 'uniform2iv', toIntArray, 2, setVectorUniform),
  [GL.INT_VEC3]: getArraySetter.bind(null, 'uniform3iv', toIntArray, 3, setVectorUniform),
  [GL.INT_VEC4]: getArraySetter.bind(null, 'uniform4iv', toIntArray, 4, setVectorUniform),

  [GL.BOOL]: getArraySetter.bind(null, 'uniform1iv', toIntArray, 1, setVectorUniform),
  [GL.BOOL_VEC2]: getArraySetter.bind(null, 'uniform2iv', toIntArray, 2, setVectorUniform),
  [GL.BOOL_VEC3]: getArraySetter.bind(null, 'uniform3iv', toIntArray, 3, setVectorUniform),
  [GL.BOOL_VEC4]: getArraySetter.bind(null, 'uniform4iv', toIntArray, 4, setVectorUniform),

  // uniformMatrix(false): don't transpose the matrix
  [GL.FLOAT_MAT2]: getArraySetter.bind(null, 'uniformMatrix2fv', toFloatArray, 4, setMatrixUniform),
  [GL.FLOAT_MAT3]: getArraySetter.bind(null, 'uniformMatrix3fv', toFloatArray, 9, setMatrixUniform),
  [GL.FLOAT_MAT4]: getArraySetter.bind(
    null,
    'uniformMatrix4fv',
    toFloatArray,
    16,
    setMatrixUniform
  ),

  [GL.SAMPLER_2D]: getSamplerSetter,
  [GL.SAMPLER_CUBE]: getSamplerSetter,

  // WEBGL2 - unsigned integers, irregular matrices, additional texture samplers

  [GL.UNSIGNED_INT]: getArraySetter.bind(null, 'uniform1uiv', toUIntArray, 1, setVectorUniform),
  [GL.UNSIGNED_INT_VEC2]: getArraySetter.bind(
    null,
    'uniform2uiv',
    toUIntArray,
    2,
    setVectorUniform
  ),
  [GL.UNSIGNED_INT_VEC3]: getArraySetter.bind(
    null,
    'uniform3uiv',
    toUIntArray,
    3,
    setVectorUniform
  ),
  [GL.UNSIGNED_INT_VEC4]: getArraySetter.bind(
    null,
    'uniform4uiv',
    toUIntArray,
    4,
    setVectorUniform
  ),

  // uniformMatrix(false): don't transpose the matrix
  [GL.FLOAT_MAT2x3]: getArraySetter.bind(
    null,
    'uniformMatrix2x3fv',
    toFloatArray,
    6,
    setMatrixUniform
  ),
  [GL.FLOAT_MAT2x4]: getArraySetter.bind(
    null,
    'uniformMatrix2x4fv',
    toFloatArray,
    8,
    setMatrixUniform
  ),
  [GL.FLOAT_MAT3x2]: getArraySetter.bind(
    null,
    'uniformMatrix3x2fv',
    toFloatArray,
    6,
    setMatrixUniform
  ),
  [GL.FLOAT_MAT3x4]: getArraySetter.bind(
    null,
    'uniformMatrix3x4fv',
    toFloatArray,
    12,
    setMatrixUniform
  ),
  [GL.FLOAT_MAT4x2]: getArraySetter.bind(
    null,
    'uniformMatrix4x2fv',
    toFloatArray,
    8,
    setMatrixUniform
  ),
  [GL.FLOAT_MAT4x3]: getArraySetter.bind(
    null,
    'uniformMatrix4x3fv',
    toFloatArray,
    12,
    setMatrixUniform
  ),

  [GL.SAMPLER_3D]: getSamplerSetter,
  [GL.SAMPLER_2D_SHADOW]: getSamplerSetter,
  [GL.SAMPLER_2D_ARRAY]: getSamplerSetter,
  [GL.SAMPLER_2D_ARRAY_SHADOW]: getSamplerSetter,
  [GL.SAMPLER_CUBE_SHADOW]: getSamplerSetter,
  [GL.INT_SAMPLER_2D]: getSamplerSetter,
  [GL.INT_SAMPLER_3D]: getSamplerSetter,
  [GL.INT_SAMPLER_CUBE]: getSamplerSetter,
  [GL.INT_SAMPLER_2D_ARRAY]: getSamplerSetter,
  [GL.UNSIGNED_INT_SAMPLER_2D]: getSamplerSetter,
  [GL.UNSIGNED_INT_SAMPLER_3D]: getSamplerSetter,
  [GL.UNSIGNED_INT_SAMPLER_CUBE]: getSamplerSetter,
  [GL.UNSIGNED_INT_SAMPLER_2D_ARRAY]: getSamplerSetter
  /* eslint-enable max-len */
};

// Pre-allocated typed arrays for temporary conversion
const FLOAT_ARRAY = {};
const INT_ARRAY = {};
const UINT_ARRAY = {};

const array1 = [0];

// Functions to ensure the type of uniform values
// This is done because uniform*v functions
// are extremely slow when consuming JS arrays directly.
function toTypedArray(value, uniformLength, Type, cache) {
  // convert boolean uniforms to Number
  if (uniformLength === 1 && typeof value === 'boolean') {
    value = value ? 1 : 0;
  }
  if (Number.isFinite(value)) {
    array1[0] = value;
    value = array1;
  }
  const length = value.length;
  if (length % uniformLength) {
    log.warn(`Uniform size should be multiples of ${uniformLength}`, value)();
  }

  if (value instanceof Type) {
    return value;
  }
  let result = cache[length];
  if (!result) {
    result = new Type(length);
    cache[length] = result;
  }
  for (let i = 0; i < length; i++) {
    result[i] = value[i];
  }
  return result;
}

function toFloatArray(value, uniformLength) {
  return toTypedArray(value, uniformLength, Float32Array, FLOAT_ARRAY);
}

function toIntArray(value, uniformLength) {
  return toTypedArray(value, uniformLength, Int32Array, INT_ARRAY);
}

function toUIntArray(value, uniformLength) {
  return toTypedArray(value, uniformLength, Uint32Array, UINT_ARRAY);
}

export function parseUniformName(name) {
  // Shortcut to avoid redundant or bad matches
  if (name[name.length - 1] !== ']') {
    return {
      name,
      length: 1,
      isArray: false
    };
  }

  // if array name then clean the array brackets
  const UNIFORM_NAME_REGEXP = /([^[]*)(\[[0-9]+\])?/;
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

  // NOTE(Tarek): This construction is the ensure
  // separate caches for all setters.
  return setter().bind(null, gl, location);
}

// Basic checks of uniform values (with or without knowledge of program)
// To facilitate early detection of e.g. undefined values in JavaScript
export function checkUniformValues(uniforms, source, uniformMap) {
  for (const uniformName in uniforms) {
    const value = uniforms[uniformName];
    const shouldCheck = !uniformMap || Boolean(uniformMap[uniformName]);
    if (shouldCheck && !checkUniformValue(value)) {
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

// TODO use type information during validation
function checkUniformValue(value) {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return checkUniformArray(value);
  }

  // Check if single value is a number
  if (isFinite(value)) {
    return true;
  } else if (value === true || value === false) {
    return true;
  } else if (value instanceof Texture) {
    return true;
  } else if (value instanceof Renderbuffer) {
    return true;
  } else if (value instanceof Framebuffer) {
    return Boolean(value.texture);
  }
  return false;
}

function checkUniformArray(value) {
  // Check that every element in array is a number, and at least 1 element
  if (value.length === 0) {
    return false;
  }

  const checkLength = Math.min(value.length, 16);

  for (let i = 0; i < checkLength; ++i) {
    if (!Number.isFinite(value[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a copy of the uniform
 */
export function copyUniform(uniforms, key, value) {
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    if (uniforms[key]) {
      const dest = uniforms[key];
      for (let i = 0, len = value.length; i < len; ++i) {
        dest[i] = value[i];
      }
    } else {
      uniforms[key] = value.slice();
    }
  } else {
    uniforms[key] = value;
  }
}
// NOTE(Tarek): Setters maintain a cache
// of the previously set value, and
// avoid resetting it if it's the same.
function getSamplerSetter() {
  let cache = null;
  return (gl, location, value) => {
    const update = cache !== value;
    if (update) {
      gl.uniform1i(location, value);
      cache = value;
    }

    return update;
  };
}

function getArraySetter(functionName, toArray, size, uniformSetter) {
  let cache = null;
  let cacheLength = null;
  return (gl, location, value) => {
    const arrayValue = toArray(value, size);
    const length = arrayValue.length;
    let update = false;
    if (cache === null) {
      cache = new Float32Array(length);
      cacheLength = length;
      update = true;
    } else {
      assert(cacheLength === length, 'Uniform length cannot change.');
      for (let i = 0; i < length; ++i) {
        if (arrayValue[i] !== cache[i]) {
          update = true;
          break;
        }
      }
    }
    if (update) {
      uniformSetter(gl, functionName, location, arrayValue);
      cache.set(arrayValue);
    }

    return update;
  };
}

function setVectorUniform(gl, functionName, location, value) {
  gl[functionName](location, value);
}

function setMatrixUniform(gl, functionName, location, value) {
  gl[functionName](location, false, value);
}
