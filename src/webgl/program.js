// Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

/* eslint-disable no-console */

import {uid} from '../utils';
import {glCheckError} from './context';
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
    gl.validateProgram(program);
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      throw new Error(`Error linking ${gl.getProgramInfoLog(program)}`);
    }

    this.gl = gl;
    this.handle = program;
    // determine attribute locations (i.e. indices)
    this.updateAttributeInfo();
    // prepare uniform setters
    this.uniformSetters = getUniformSetters(gl, program);
    // no attributes enabled yet
    this.attributeEnabled = {};
  }

  delete() {
    const {gl} = this;
    if (this.handle) {
      gl.deleteProgram(this.handle);
      glCheckError(gl);
    }
    this.handle = null;
    return this;
  }

  use() {
    this.gl.useProgram(this.handle);
    return this;
  }

  /**
   * Apply a set of uniform values to a program
   * Only uniforms with names actually present in the linked program
   * will be updated.
   * other uniforms will be ignored
   *
   * @param {Object} uniformMap - An object with names being keys
   * @returns {Program} - returns itself for chaining.
   */
  setUniforms(uniformMap) {
    for (const name of Object.keys(uniformMap)) {
      if (name in this.uniformSetters) {
        this.uniformSetters[name](uniformMap[name]);
      }
    }
    return this;
  }

  /**
   * Set a texture at a given index
   */
  setTexture(texture, index) {
    texture.bind(index);
    return this;
  }

  // ATTRIBUTES

  /**
   * @returns {String[]} - array, "active" attribute names from shader linking
   */
  getAttributeNames() {
    return this.attributeInfoMap.keys();
  }

  /**
   * @param {String} - name of an attribute (matches name in a linked shader)
   * @returns {String[]} - array of actual attribute names from shader linking
   */
  getAttributeLocation(attributeName) {
    return gl.getAttribLocation(this.handle, attributeName);
  }

  /**
   * @param {String} - name of an attribute (matches name in a linked shader)
   * @returns {WebGLActiveInfo} - info about an active attribute
   */
  getAttributeInfo(attributeName) {
    return this.attributeInfoMap[attributeName];
  }

  attachToLocation({
    location, buffer, size, dataType, stride, offset, instanced
  }) {}

  /**
   * @param {String} - name of an attribute (matches name in a linked shader)
   * @returns {WebGLActiveInfo} - info about an active attribute
   */
  setBuffer(buffer) {
    const location = this.getAttributeLocation(buffer.attribute);
    const {gl} = this;
    new VertexAttributes(gl)
      .enable(location)
      .setBuffer({location, buffer, size, dataType, stride, offset})
      .divisor(location, instanced ? 1 : 0);
    return this;
  }

  unsetBuffer(buffer) {
    const location = this.getAttributeLocation(buffer.attribute);
    new VertexAttributes(this.gl)
      .divisor(location, 0)
      .disable(location);
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

  unsetBuffers(buffers) {
    assert(Array.isArray(buffers), 'Program.setBuffers expects array');
    buffers = buffers.length === 1 && Array.isArray(buffers[0]) ?
      buffers[0] : buffers;
    for (const buffer of buffers) {
      this.unsetBuffer(buffer);
    }
    return this;
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

  isFlaggedForDeletion() {
    return this.getProgramParameter(this.gl.DELETE_STATUS);
  }

  getLastLinkStatus() {
    return this.getProgramParameter(this.gl.LINK_STATUS);
  }

  getLastValidationStatus() {
    return this.getProgramParameter(this.gl.VALIDATE_STATUS);
  }

  getAttachedShadersCount() {
    return this.getProgramParameter(this.gl.ATTACHED_SHADERS);
  }

  getActiveAttributesCount() {
    return this.getProgramParameter(this.gl.ACTIVE_ATTRIBUTES);
  }

  getActiveUniformsCount() {
    return this.getProgramParameter(this.gl.ACTIVE_UNIFORMS);
  }

  // This may be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS.
  getTransformFeedbackBufferMode() {
    return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_BUFFER_MODE);
  }

  getTransformFeedbackVaryingsCount() {
    return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_VARYINGS);
  }

  getActiveUniformBlocksCount() {
    return this.getProgramParameter(this.gl.ACTIVE_UNIFORM_BLOCKS);
  }

  // determine attribute locations (maps attribute name to index)
  _updateAttributeInfo() {
    const {gl} = this;
    this.attributeInfoMap = {};
    const length = gl.getProgramParameter(this.handle, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < length; i++) {
      const info = gl.getActiveAttrib(this.handle, i);
      const index = gl.getAttribLocation(this.handle, info.name);
      console.log(`Attribute ${i} ${index}`);

      // Add console
      this.attributeInfoMap[info.name] = {
        ...info,
        index
      };
    }
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

