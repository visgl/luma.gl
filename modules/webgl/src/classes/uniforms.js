import GL from '@luma.gl/constants';
import Framebuffer from './framebuffer';
import Renderbuffer from './renderbuffer';
import Texture from './texture';
import {log} from '../utils';

const UNIFORM_SETTERS = {
  // WEBGL1

  /* eslint-disable max-len */
  [GL.FLOAT]: getArraySetter.bind(null, 'uniform1fv', toFloatArray, 1),
  [GL.FLOAT_VEC2]: getArraySetter.bind(null, 'uniform2fv', toFloatArray, 2),
  [GL.FLOAT_VEC3]: getArraySetter.bind(null, 'uniform3fv', toFloatArray, 3),
  [GL.FLOAT_VEC4]: getArraySetter.bind(null, 'uniform4fv', toFloatArray, 4),

  [GL.INT]: getArraySetter.bind(null, 'uniform1iv', toIntArray, 1),
  [GL.INT_VEC2]: getArraySetter.bind(null, 'uniform2iv', toIntArray, 2),
  [GL.INT_VEC3]: getArraySetter.bind(null, 'uniform3iv', toIntArray, 3),
  [GL.INT_VEC4]: getArraySetter.bind(null, 'uniform4iv', toIntArray, 4),

  [GL.BOOL]: getArraySetter.bind(null, 'uniform1iv', toIntArray, 1),
  [GL.BOOL_VEC2]: getArraySetter.bind(null, 'uniform2iv', toIntArray, 2),
  [GL.BOOL_VEC3]: getArraySetter.bind(null, 'uniform3iv', toIntArray, 3),
  [GL.BOOL_VEC4]: getArraySetter.bind(null, 'uniform4iv', toIntArray, 4),

  // uniformMatrix(false): don't transpose the matrix
  [GL.FLOAT_MAT2]: getMatrixSetter.bind(null, 'uniformMatrix2fv', 4),
  [GL.FLOAT_MAT3]: getMatrixSetter.bind(null, 'uniformMatrix3fv', 9),
  [GL.FLOAT_MAT4]: getMatrixSetter.bind(null, 'uniformMatrix4fv', 16),

  [GL.SAMPLER_2D]: getSamplerSetter,
  [GL.SAMPLER_CUBE]: getSamplerSetter,

  // WEBGL2 - unsigned integers, irregular matrices, additional texture samplers

  [GL.UNSIGNED_INT]: getArraySetter.bind(null, 'uniform1uiv', toUIntArray, 1),
  [GL.UNSIGNED_INT_VEC2]: getArraySetter.bind(null, 'uniform2uiv', toUIntArray, 2),
  [GL.UNSIGNED_INT_VEC3]: getArraySetter.bind(null, 'uniform3uiv', toUIntArray, 3),
  [GL.UNSIGNED_INT_VEC4]: getArraySetter.bind(null, 'uniform4uiv', toUIntArray, 4),

  // uniformMatrix(false): don't transpose the matrix
  [GL.FLOAT_MAT2x3]: getMatrixSetter.bind(null, 'uniformMatrix2x3fv', 6),
  [GL.FLOAT_MAT2x4]: getMatrixSetter.bind(null, 'uniformMatrix2x4fv', 8),
  [GL.FLOAT_MAT3x2]: getMatrixSetter.bind(null, 'uniformMatrix3x2fv', 6),
  [GL.FLOAT_MAT3x4]: getMatrixSetter.bind(null, 'uniformMatrix3x4fv', 12),
  [GL.FLOAT_MAT4x2]: getMatrixSetter.bind(null, 'uniformMatrix4x2fv', 8),
  [GL.FLOAT_MAT4x3]: getMatrixSetter.bind(null, 'uniformMatrix4x3fv', 12),

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
 * Given two values of a uniform, returns `true` if they are equal
 */
export function areUniformsEqual(uniform1, uniform2) {
  if (Array.isArray(uniform1) || ArrayBuffer.isView(uniform1)) {
    if (!uniform2) {
      return false;
    }
    const len = uniform1.length;
    if (uniform2.length !== len) {
      return false;
    }
    for (let i = 0; i < len; i++) {
      if (uniform1[i] !== uniform2[i]) {
        return false;
      }
    }
    return true;
  }
  return uniform1 === uniform2;
}

/**
 * Creates a copy of the uniform
 */
export function getUniformCopy(uniform) {
  if (Array.isArray(uniform) || ArrayBuffer.isView(uniform)) {
    return uniform.slice();
  }
  return uniform;
}

function getSamplerSetter() {
  let cache = null;
  return (gl, location, value) => {
    if (cache !== value) {
      gl.uniform1i(location, value);
      cache = value;
    }
  };
}

function getArraySetter(functionName, toArray, size) {
  let cache = null;
  return (gl, location, value) => {
    const arrayVal = toArray(value, size);
    let update = false;
    if (cache === null) {
      cache = new arrayVal.constructor(arrayVal.length);
      update = true;
    } else {
      for (let i = 0, len = arrayVal.length; i < len; ++i) {
        if (arrayVal[i] !== cache[i]) {
          update = true;
          break;
        }
      }
    }
    if (update) {
      gl[functionName](location, arrayVal);
      cache.set(arrayVal);
    }
  };
}

function getMatrixSetter(functionName, size) {
  let cache = null;
  return (gl, location, value) => {
    const arrayVal = toFloatArray(value, size);
    let update = false;
    if (cache === null) {
      cache = new Float32Array(arrayVal.length);
      update = true;
    } else {
      for (let i = 0, len = arrayVal.length; i < len; ++i) {
        if (arrayVal[i] !== cache[i]) {
          update = true;
          break;
        }
      }
    }
    if (update) {
      gl[functionName](location, false, arrayVal);
      cache.set(arrayVal);
    }
  };
}
