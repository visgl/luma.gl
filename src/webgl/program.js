// Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

/* eslint-disable no-console, complexity */

import {glCheckError} from './context';
import {uid} from '../utils';
import {VertexShader, FragmentShader} from './shader';
import Shaders from '../shaders';
import assert from 'assert';

export default class Program {

  /*
   * @classdesc
   * Handles creation of programs, mapping of attributes and uniforms
   *
   * @class
   * @param {WebGLRenderingContext} gl - gl context
   * @param {Object} opts - options
   * @param {String} opts.vs - Vertex shader source
   * @param {String} opts.fs - Fragment shader source
   * @param {String} opts.id= - Id
   */
  constructor(gl, {
    vs = Shaders.Vertex.Default,
    fs = Shaders.Fragment.Default,
    id = uid()
  } = {}, ...args) {
    assert(gl, 'Program needs WebGLRenderingContext');

    if (arguments.length !== 2) {
      throw new Error('Wrong number of arguments to Program(gl, {vs, fs, id})');
    }

    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program');
    }

    gl.attachShader(program, new VertexShader(gl, vs).handle);
    gl.attachShader(program, new FragmentShader(gl, fs).handle);
    gl.linkProgram(program);
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      throw new Error(`Error linking ${gl.getProgramInfoLog(program)}`);
    }

    this.gl = gl;
    this.program = program;
    // determine attribute locations (i.e. indices)
    this.attributeLocations = getAttributeLocations(gl, program);
    // prepare uniform setters
    this.uniformSetters = getUniformSetters(gl, program);
    // no attributes enabled yet
    this.attributeEnabled = {};
  }

  use() {
    this.gl.useProgram(this.program);
    return this;
  }

  setTexture(texture, index) {
    texture.bind(index);
    return this;
  }

  setUniform(name, value) {
    throw new Error('Use setUniforms instead');
  }

  setUniforms(uniformMap) {
    for (const name of Object.keys(uniformMap)) {
      if (name in this.uniformSetters) {
        this.uniformSetters[name](uniformMap[name]);
      }
    }
    return this;
  }

  setBuffer(buffer) {
    const location = this.attributeLocations[buffer.attribute];
    buffer.attachToLocation(location);
    return this;
  }

  setBuffers(buffers) {
    assert(Array.isArray(buffers), 'Program.setBuffers expects array');
    buffers = buffers.length === 1 && Array.isArray(buffers[0]) ?
      buffers[0] : buffers;
    for (const buffer of buffers) {
      this.setBuffer(buffer);
    }
    return this;
  }

  unsetBuffer(buffer) {
    const location = this.attributeLocations[buffer.attribute];
    buffer.detachFromLocation(location);
    return this;
  }

  unsetBuffers(buffers) {
    assert(Array.isArray(buffers), 'Program.setBuffers expects array');
    buffers = buffers.length === 1 && Array.isArray(buffers[0]) ?
      buffers[0] : buffers;
    for (const buffer of buffers) {
      this.unsetBuffer(buffer);
    }
    return this;
  }

}

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
function getUniformSetter(gl, glProgram, info, isArray) {
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

// create uniform setters
// Map of uniform names to setter functions
function getUniformSetters(gl, glProgram) {
  const uniformSetters = {};
  const length = gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < length; i++) {
    const info = gl.getActiveUniform(glProgram, i);
    let name = info.name;
    // if array name then clean the array brackets
    name = name[name.length - 1] === ']' ?
      name.substr(0, name.length - 3) : name;
    uniformSetters[name] =
      getUniformSetter(gl, glProgram, info, info.name !== name);
  }
  return uniformSetters;
}

// determine attribute locations (maps attribute name to index)
function getAttributeLocations(gl, glProgram) {
  const length = gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES);
  const attributeLocations = {};
  for (let i = 0; i < length; i++) {
    const info = gl.getActiveAttrib(glProgram, i);
    const index = gl.getAttribLocation(glProgram, info.name);
    attributeLocations[info.name] = index;
  }
  return attributeLocations;
}
