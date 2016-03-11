// Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

/* eslint-disable no-console, complexity */

/* global document, console */
import {merge, uid} from '../utils';
import formatCompilerError from 'gl-format-compiler-error';

// TODO - remove this functionality, should not depend on upper layers
import {XHRGroup} from '../io';
import Shaders from '../shaders';

export default class Program {

  /*
   * @classdesc Handles loading of programs, mapping of attributes and uniforms
   */
  constructor(gl, vertexShader, fragmentShader, id) {
    const glProgram = createProgram(gl, vertexShader, fragmentShader);
    if (!glProgram) {
      throw new Error('Failed to create program');
    }

    this.gl = gl;
    this.program = glProgram;
    this.id = id || uid();

    // determine attribute locations (i.e. indices)
    this.attributeLocations = getAttributeLocations(gl, glProgram);
    console.log(`${id} locations`, this.attributeLocations);
    // prepare uniform setters
    this.uniformSetters = getUniformSetters(gl, glProgram);
    // no attributes enabled yet
    this.attributeEnabled = {};
  }

  // Alternate constructor
  // Create a program from vertex and fragment shader node ids
  static fromHTMLTemplates(gl, vs, fs) {
    const vertexShader = document.getElementById(vs).innerHTML;
    const fragmentShader = document.getElementById(fs).innerHTML;
    return new Program(gl, vertexShader, fragmentShader);
  }

  // Alternate constructor
  // Build program from default shaders (requires Shaders)
  static fromDefaultShaders(gl) {
    return new Program(gl,
      Shaders.Vertex.Default,
      Shaders.Fragment.Default
    );
  }

  // Alternate constructor
  static async fromShaderURIs(gl, vs, fs, opts) {
    opts = merge({
      path: '/',
      noCache: false
    }, opts);

    const vertexShaderURI = opts.path + vs;
    const fragmentShaderURI = opts.path + fs;

    const responses = await new XHRGroup({
      urls: [vertexShaderURI, fragmentShaderURI],
      noCache: opts.noCache
    }).sendAsync();

    return new Program(gl, responses[0], responses[1]);

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
    if (name in this.uniformSetters) {
      this.uniformSetters[name](value);
    }
    return this;
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

  setBuffers(...buffers) {
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

  unsetBuffers(...buffers) {
    buffers = buffers.length === 1 && Array.isArray(buffers[0]) ?
      buffers[0] : buffers;
    for (const buffer of buffers) {
      this.unsetBuffer(buffer);
    }
    return this;
  }

}

// Creates a shader from a string source.
function createShader(gl, shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);
  if (shader === null) {
    throw new Error(`Error creating shader with type ${shaderType}`);
  }
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    var info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    /* eslint-disable no-try-catch */
    var formattedLog;
    try {
      formattedLog = formatCompilerError(info, shaderSource, shaderType);
    } catch (error) {
      /* eslint-disable no-console */
      /* global console */
      console.warn('Error formatting glsl compiler error:', error);
      /* eslint-enable no-console */
      throw new Error(`Error while compiling the shader ${info}`);
    }
    /* eslint-enable no-try-catch */
    throw new Error(formattedLog.long);
  }
  return shader;
}

// Creates a program from vertex and fragment shader sources.
function createProgram(gl, vertexShader, fragmentShader) {
  const vs = createShader(gl, vertexShader, gl.VERTEX_SHADER);
  const fs = createShader(gl, fragmentShader, gl.FRAGMENT_SHADER);

  const glProgram = gl.createProgram();
  gl.attachShader(glProgram, vs);
  gl.attachShader(glProgram, fs);

  gl.linkProgram(glProgram);
  const linked = gl.getProgramParameter(glProgram, gl.LINK_STATUS);
  if (!linked) {
    throw new Error(`Error linking shader ${gl.getProgramInfoLog(glProgram)}`);
  }

  return glProgram;
}

// TODO - use tables to reduce complexity of method below
// const glUniformSetter = {
//   FLOAT: {function: 'uniform1fv', type: Float32Array},
//   FLOAT_VEC3: {function: 'uniform3fv', type: Float32Array},
//   FLOAT_MAT4: {function: 'uniformMatrix4fv', type: Float32Array},
//   INT: {function: 'uniform1iv', type: Uint16Array},
//   BOOL: {function: 'uniform1iv', type: Uint16Array},
//   SAMPLER_2D: {function: 'uniform1iv', type: Uint16Array},
//   SAMPLER_CUBE: {function: 'uniform1iv', type: Uint16Array}
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

    return val => glFunction(loc, new TypedArray(val));

  } else if (matrix) {
    // Set a matrix uniform
    return val => glFunction(loc, false, val.toFloat32Array());

  } else if (TypedArray) {

    // Set a vector/typed array uniform
    return val => {
      TypedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
      glFunction(loc, TypedArray);
    };

  }
  // Set a primitive-valued uniform
  return val => glFunction(loc, val);

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
