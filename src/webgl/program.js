// Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

/* eslint-disable no-console */

import {uid} from '../utils';
import {VertexShader, FragmentShader} from './shader';
import Shaders from '../../shaderlib';
import {default as VertexAttributes} from './vertex-attributes';
import {getUniformSetter} from './uniforms';
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

  setUniforms(uniformMap) {
    for (const name of Object.keys(uniformMap)) {
      if (name in this.uniformSetters) {
        this.uniformSetters[name](uniformMap[name]);
      }
    }
    return this;
  }

  setTexture(texture, index) {
    texture.bind(index);
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
    new VertexAttributes(this.gl)
      .divisor(location, 0)
      .disable(location);
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

  attachToLocation({
    location, buffer, size, dataType, stride, offset, instanced
  } = {}) {
    const {gl} = this;
    return new VertexAttributes(gl)
      .enable(location)
      .setBuffer({location, buffer, size, dataType, stride, offset})
      .divisor(location, instanced ? 1 : 0);
  }

  detachFromLocation({location}) {
    return new VertexAttributes(this.gl)
      .divisor(0)
      .disable();
  }

  // WEBGL2 INTERFACE

  // Retrieves the assigned color number binding for the user-defined varying
  // out variable name for program program. program must have previously been
  // linked.
  // [WebGLHandlesContextLoss]
  getFragDataLocation(varyingName) {
    const {gl} = this;
    // assertWebGL2(gl);
    return gl.getFragDataLocation(this.handle, varyingName);
  }

  // Return the value for the passed pname given the passed program.
  // The type returned is the natural type for the requested pname,
  // as given in the following table:
  // pname returned type
  // DELETE_STATUS GLboolean
  // LINK_STATUS GLboolean
  // VALIDATE_STATUS GLboolean
  // ATTACHED_SHADERS  GLint
  // ACTIVE_ATTRIBUTES GLint
  // ACTIVE_UNIFORMS GLint
  // TRANSFORM_FEEDBACK_BUFFER_MODE  GLenum
  // TRANSFORM_FEEDBACK_VARYINGS GLint
  // ACTIVE_UNIFORM_BLOCKS GLint
  getProgramParameter(pname) {
    const {gl} = this;
    // assertWebGL2(gl);
    return gl.getProgramParameter(this.handle, pname);
  }

  get deleteStatus() {
    return this.getProgramParameter(this.gl.DELETE_STATUS);
  }

  get linkStatus() {
    return this.getProgramParameter(this.gl.LINK_STATUS);
  }

  get validateStatus() {
    return this.getProgramParameter(this.gl.VALIDATE_STATUS);
  }

  get attachedShadersCount() {
    return this.getProgramParameter(this.gl.ATTACHED_SHADERS);
  }

  get activeAttributesCount() {
    return this.getProgramParameter(this.gl.ACTIVE_ATTRIBUTES);
  }

  get activeUniformsCount() {
    return this.getProgramParameter(this.gl.ACTIVE_UNIFORMS);
  }

  // This may be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS.
  get transformFeedbackBufferMode() {
    return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_BUFFER_MODE);
  }

  get transformFeedbackVaryingsCount() {
    return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_VARYINGS);
  }

  get activeUniformBlocksCount() {
    return this.getProgramParameter(this.gl.ACTIVE_UNIFORM_BLOCKS);
  }
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
