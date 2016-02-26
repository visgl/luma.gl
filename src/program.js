// program.js
// Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

/* global document */
import formatCompilerError from 'gl-format-compiler-error';
import Shaders from './shaders';
import {XHRGroup} from './io';
import {merge, uid} from './utils';

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
    try {
      var formattedLog = formatCompilerError(info, shaderSource, shaderType);
    } catch(e) {
      console.warn('Error formatting glsl compiler error:', e);
      throw new Error(`Error while compiling the shader ${info}`);
    }
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

// Returns a Magic Uniform Setter
function getUniformSetter(gl, glProgram, info, isArray) {
  const {name, type} = info;
  const loc = gl.getUniformLocation(glProgram, name);

  let matrix = false;
  let vector = true;
  let glFunction;
  let typedArray;

  if (info.size > 1 && isArray) {
    switch (type) {

    case gl.FLOAT:
      glFunction = gl.uniform1fv;
      typedArray = Float32Array;
      vector = false;
      break;

    case gl.FLOAT_VEC3:
      glFunction = gl.uniform3fv;
      typedArray = Float32Array;
      vector = true;
      break;

    case gl.FLOAT_MAT4:
      glFunction = gl.uniformMatrix4fv;
      typedArray = Float32Array;
      vector = true;
      break;

    case gl.INT:
    case gl.BOOL:
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      glFunction = gl.uniform1iv;
      typedArray = Uint16Array;
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
      typedArray = isArray ? Float32Array : new Float32Array(2);
      break;
    case gl.FLOAT_VEC3:
      glFunction = gl.uniform3fv;
      typedArray = isArray ? Float32Array : new Float32Array(3);
      break;
    case gl.FLOAT_VEC4:
      glFunction = gl.uniform4fv;
      typedArray = isArray ? Float32Array : new Float32Array(4);
      break;
    case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: case gl.SAMPLER_CUBE:
      glFunction = gl.uniform1i;
      break;
    case gl.INT_VEC2: case gl.BOOL_VEC2:
      glFunction = gl.uniform2iv;
      typedArray = isArray ? Uint16Array : new Uint16Array(2);
      break;
    case gl.INT_VEC3: case gl.BOOL_VEC3:
      glFunction = gl.uniform3iv;
      typedArray = isArray ? Uint16Array : new Uint16Array(3);
      break;
    case gl.INT_VEC4: case gl.BOOL_VEC4:
      glFunction = gl.uniform4iv;
      typedArray = isArray ? Uint16Array : new Uint16Array(4);
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
  if (isArray && typedArray) {

    return val => glFunction(loc, new typedArray(val));

  } else if (matrix) {
    // Set a matrix uniform
    return val => glFunction(loc, false, val.toFloat32Array());

  } else if (typedArray) {

    // Set a vector/typed array uniform
    return val => {
      typedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
      glFunction(loc, typedArray);
    };

  } else {

    // Set a primitive-valued uniform
    return val => glFunction(loc, val);

  }

  // FIXME: Unreachable code
  throw new Error(`Unknown type: ${type}`);
}

export default class Program {

  /**
   * @classdesc Handles loading of programs, mapping of attributes and uniforms
   */
  constructor(gl, vertexShader, fragmentShader, id) {
    this.gl = gl;
    const glProgram = createProgram(gl, vertexShader, fragmentShader);
    if (!glProgram) {
      throw new Error('Failed to create program');
    }

    const attributes = {};
    const attributeEnabled = {};
    const uniforms = {};
    let info;
    let name;
    let index;

    // fill attribute locations
    let len = gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < len; i++) {
      info = gl.getActiveAttrib(glProgram, i);
      name = info.name;
      index = gl.getAttribLocation(glProgram, info.name);
      attributes[name] = index;
    }

    // create uniform setters
    len = gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < len; i++) {
      info = gl.getActiveUniform(glProgram, i);
      name = info.name;
      // if array name then clean the array brackets
      name = name[name.length - 1] === ']' ?
        name.substr(0, name.length - 3) : name;
      uniforms[name] =
        getUniformSetter(gl, glProgram, info, info.name !== name);
    }

    this.program = glProgram;

    // handle attributes and uniforms
    this.attributes = attributes;
    this.attributeEnabled = attributeEnabled;
    this.uniforms = uniforms;
    this.id = id || uid();
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
  // Implement Program.fromShaderURIs (requires IO)
  static async fromShaderURIs(gl, vs, fs, opts) {
    opts = merge({
      path: '/',
      noCache: false
    }, opts);

    const vertexShaderURI = opts.path + vs;
    const fragmentShaderURI = opts.path + fs;

    const responses = await new XHRGroup({
      urls: [vertexShaderURI, fragmentShaderURI],
      noCache: opts.noCache,
    }).sendAsync();

    return new Program(gl, responses[0], responses[1]);

  }

  setUniform(name, value) {
    if (name in this.uniforms) {
      this.uniforms[name](value);
    }
    return this;
  }

  setUniforms(forms) {
    for (const name of Object.keys(forms)) {
      if (name in this.uniforms) {
        this.uniforms[name](forms[name]);
      }
    }
    return this;
  }

  setBuffer(buf) {
    const gl = this.gl;
    const loc = this.attributes[buf.attribute];
    const isAttribute = loc !== undefined;
    if (isAttribute) {
      gl.enableVertexAttribArray(loc);
    }
    gl.bindBuffer(buf.bufferType, buf.buffer);
    if (isAttribute) {
      gl.vertexAttribPointer(loc, buf.size, buf.dataType, false, buf.stride, buf.offset);
    }
    if (buf.instanced) {
      const ext = gl.getExtension('ANGLE_instanced_arrays');
      if (!ext) {
        console.warn('ANGLE_instanced_arrays not supported!');
      } else {
        ext.vertexAttribDivisorANGLE(loc, buf.instanced === true ? 1 : buf.instanced);
      }
    }
    return this;
  }

  setBuffers() {
    let args = arguments;
    if (Array.isArray(args[0])) {
      args = args[0];
    }
    for (const buf of args) {
      this.setBuffer(buf);
    }
    return this;
  }

  unsetBuffer(buf) {
    const gl = this.gl;
    const loc = this.attributes[buf.attribute];
    const isAttribute = loc !== undefined;
    if (isAttribute) {
      gl.disableVertexAttribArray(loc);
    }
    gl.bindBuffer(buf.bufferType, null);
    if (buf.instanced) {
      const ext = gl.getExtension('ANGLE_instanced_arrays');
      if (!ext) {
        console.warn('ANGLE_instanced_arrays not supported!');
      } else {
        ext.vertexAttribDivisorANGLE(loc, 0);
      }
    }
    return this;
  }

  unsetBuffers() {
    let args = arguments;
    if (Array.isArray(args[0])) {
      args = args[0];
    }
    for (const buf of args) {
      this.unsetBuffer(buf);
    }
    return this;
  }

  use() {
    this.gl.useProgram(this.program);
    return this;
  }

  setTexture(texture, index) {
    texture.bind(index);
    return this;
  }

  // Get options object or make options object from 2 arguments
  static _getOptions(base = {}, ...args) {
    let opt;
    if (args.length === 2) {
      return {
        ...base,
        vs: args[0],
        fs: args[1]
      };
    } else {
      return {
        ...base,
        ...(args[0] || {})
      };
    }
  }

}
