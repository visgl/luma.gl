import {glCheckError} from './context';

// TODO - use tables to reduce complexity of method below
// const glUniformSetter = {
// FLOAT: {function: 'uniform1fv', type: Float32Array},
// FLOAT_VEC3: {function: 'uniform3fv', type: Float32Array},
// FLOAT_MAT4: {function: 'uniformMatrix4fv', type: Float32Array},
// INT: {function: 'uniform1iv', type: Uint16Array},
// BOOL: {function: 'uniform1iv', type: Uint16Array},
// SAMPLER_2D: {function: 'uniform1iv', type: Uint16Array},
// SAMPLER_CUBE: {function: 'uniform1iv', type: Uint16Array}
// };

// Returns a Magic Uniform Setter
/* eslint-disable complexity */
export function getUniformSetter(gl, glProgram, info, isArray) {
  const {name, type} = info;
  const loc = gl.getUniformLocation(glProgram, name);

  let matrix = false;
  let vector = true;
  let glFunction;
  let TypedArray;

  if (info.size > 1 && isArray) {
    switch (type) {

    case gl.FLOAT:
      glFunction = gl.uniform1fv;
      TypedArray = Float32Array;
      vector = false;
      break;

    case gl.FLOAT_VEC3:
      glFunction = gl.uniform3fv;
      TypedArray = Float32Array;
      vector = true;
      break;

    case gl.FLOAT_MAT4:
      glFunction = gl.uniformMatrix4fv;
      TypedArray = Float32Array;
      vector = true;
      break;

    case gl.INT:
    case gl.BOOL:
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      glFunction = gl.uniform1iv;
      TypedArray = Uint16Array;
      vector = false;
      break;

    default:
      throw new Error('Uniform: Unknown GLSL type ' + type);

    }
  }

  if (vector) {
    switch (type) {
    case gl.FLOAT:
      glFunction = gl.uniform1f;
      break;
    case gl.FLOAT_VEC2:
      glFunction = gl.uniform2fv;
      TypedArray = isArray ? Float32Array : new Float32Array(2);
      break;
    case gl.FLOAT_VEC3:
      glFunction = gl.uniform3fv;
      TypedArray = isArray ? Float32Array : new Float32Array(3);
      break;
    case gl.FLOAT_VEC4:
      glFunction = gl.uniform4fv;
      TypedArray = isArray ? Float32Array : new Float32Array(4);
      break;
    case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: case gl.SAMPLER_CUBE:
      glFunction = gl.uniform1i;
      break;
    case gl.INT_VEC2: case gl.BOOL_VEC2:
      glFunction = gl.uniform2iv;
      TypedArray = isArray ? Uint16Array : new Uint16Array(2);
      break;
    case gl.INT_VEC3: case gl.BOOL_VEC3:
      glFunction = gl.uniform3iv;
      TypedArray = isArray ? Uint16Array : new Uint16Array(3);
      break;
    case gl.INT_VEC4: case gl.BOOL_VEC4:
      glFunction = gl.uniform4iv;
      TypedArray = isArray ? Uint16Array : new Uint16Array(4);
      break;
    case gl.FLOAT_MAT2:
      matrix = true;
      glFunction = gl.uniformMatrix2fv;
      break;
    case gl.FLOAT_MAT3:
      matrix = true;
      glFunction = gl.uniformMatrix3fv;
      break;
    case gl.FLOAT_MAT4:
      matrix = true;
      glFunction = gl.uniformMatrix4fv;
      break;
    default:
      break;
    }
  }

  glFunction = glFunction.bind(gl);

  // Set a uniform array
  if (isArray && TypedArray) {

    return val => {
      glFunction(loc, new TypedArray(val));
      glCheckError(gl);
    };
  } else if (matrix) {
    // Set a matrix uniform
    return val => {
      glFunction(loc, false, val.toFloat32Array());
      glCheckError(gl);
    };

  } else if (TypedArray) {

    // Set a vector/typed array uniform
    return val => {
      TypedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
      glFunction(loc, TypedArray);
      glCheckError(gl);
    };

  }
  // Set a primitive-valued uniform
  return val => {
    glFunction(loc, val);
    glCheckError(gl);
  };

}
