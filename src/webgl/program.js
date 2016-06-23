// Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

/* eslint-disable no-console */

import {WebGLRenderingContext, WebGL2RenderingContext} from './types';
import {glCheckError} from './context';
import * as VertexAttributes from './vertex-attributes';
import Buffer from './buffer';
import {getUniformSetter} from './uniforms';
import {VertexShader, FragmentShader} from './shader';
import Shaders from '../../shaderlib';
import {uid} from '../utils';
import assert from 'assert';

const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
const ERR_WEBGL2 = 'WebGL2 required';

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
  } = {}) {
    assert(gl instanceof WebGLRenderingContext, ERR_CONTEXT);

    if (arguments.length > 2) {
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
    this._attributeLocations = this._getAttributeLocations();
    this._attributeCount = this.getActiveAttributeCount();
    // prepare uniform setters
    this._uniformSetters = this._getUniformSetters();
    this._uniformCount = this.getActiveUniformCount();
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
    const {gl} = this;
    gl.useProgram(this.handle);
    return this;
  }

  // DEPRECATED METHODS

  /**
   * Attach a map of Buffers values to a program
   * Only attributes with names actually present in the linked program
   * will be updated. Other supplied buffers will be ignored.
   *
   * @param {Object} buffers - An object map with attribute names being keys
   *  and values are expected to be instances of Buffer.
   * @returns {Program} Returns itself for chaining.
   */
  setBuffers(buffers, {warn = false} = {}) {
    const {gl} = this;
    if (Array.isArray(buffers)) {
      throw new Error('Program.setBuffers expects map of buffers');
    }
    for (const bufferName in buffers) {
      const buffer = buffers[bufferName];
      if (buffer.target === gl.ELEMENT_ARRAY_BUFFER) {
        buffer.bind();
      } else {
        const location = this._attributeLocations[bufferName];
        if (warn && location >= 0 && VertexAttributes.isEnabled(gl, location)) {
          console.warn(`Attribute ${location}:${bufferName} already enabled`);
        }
        VertexAttributes.enable(gl, location);
        VertexAttributes.setBuffer({gl, location, buffer});
        const divisor = buffer.layout.instanced ? 1 : 0;
        VertexAttributes.setDivisor(gl, location, divisor);
      }
    }
    return this;
  }

  /*
   * @returns {Program} Returns itself for chaining.
   */
  unsetBuffers(buffers) {
    const {gl} = this;
    const length = this._attributeCount;
    for (let i = 1; i < length; ++i) {
      VertexAttributes.disable(gl, i);
      VertexAttributes.divisor(gl, i, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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
      if (name in this._uniformSetters) {
        this._uniformSetters[name](uniformMap[name]);
      }
    }
    return this;
  }

  /*
   * Set a texture at a given index
   */
  setTexture(texture, index) {
    texture.bind(index);
    return this;
  }

  getAttachedShadersCount() {
    return this.getProgramParameter(this.gl.ATTACHED_SHADERS);
  }

  // ATTRIBUTES

  getActiveAttributeCount() {
    return this.getProgramParameter(this.gl.ACTIVE_ATTRIBUTES);
  }

  /**
   * @param {int} location - index of an attribute
   * @returns {WebGLActiveInfo} - info about an active attribute
   *   fields: {name, size, type}
   */
  getAttributeInfo(location) {
    const {gl} = this;
    const value = gl.getActiveAttrib(this.handle, location);
    glCheckError(gl);
    return value;
  }

  getAttributeName(location) {
    return this.getAttributeInfo(location).name;
  }

  /**
   * @param {String} attributeName - name of an attribute
   *   (matches name in a linked shader)
   * @returns {String[]} - array of actual attribute names from shader linking
   */
  getAttributeLocation(attributeName) {
    const {gl} = this;
    const value = gl.getAttribLocation(this.handle, attributeName);
    glCheckError(gl);
    return value;
  }

  getActiveUniformCount() {
    return this.getProgramParameter(this.gl.ACTIVE_UNIFORMS);
  }

  getUniformInfo(location) {
    const {gl} = this;
    const info = gl.getActiveUniform(this.handle, location);
    glCheckError(gl);
    return info;
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

  // WEBGL2 INTERFACE

  // This may be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS.
  getTransformFeedbackBufferMode() {
    const {gl} = this;
    assert(gl instanceof WebGL2RenderingContext, ERR_WEBGL2);
    return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_BUFFER_MODE);
  }

  getTransformFeedbackVaryingsCount() {
    const {gl} = this;
    assert(gl instanceof WebGL2RenderingContext, ERR_WEBGL2);
    return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_VARYINGS);
  }

  getActiveUniformBlocksCount() {
    const {gl} = this;
    assert(gl instanceof WebGL2RenderingContext, ERR_WEBGL2);
    return this.getProgramParameter(this.gl.ACTIVE_UNIFORM_BLOCKS);
  }

  // Retrieves the assigned color number binding for the user-defined varying
  // out variable name for program. program must have previously been linked.
  // [WebGLHandlesContextLoss]
  getFragDataLocation(varyingName) {
    const {gl} = this;
    assert(gl instanceof WebGL2RenderingContext, ERR_WEBGL2);
    const location = gl.getFragDataLocation(this.handle, varyingName);
    glCheckError(gl);
    return location;
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
    const parameter = gl.getProgramParameter(this.handle, pname);
    glCheckError(gl);
    return parameter;
  }

  // PRIVATE METHODS

  // Check that all active attributes are enabled
  _areAllAttributesEnabled() {
    const {gl} = this;
    const length = this._attributeCount;
    for (let i = 0; i < length; ++i) {
      if (!VertexAttributes.isEnabled(gl, i)) {
        return false;
      }
    }
    return true;
  }

  // determine attribute locations (maps attribute name to index)
  _getAttributeLocations() {
    const attributeLocations = {};
    const length = this.getActiveAttributeCount();
    for (let i = 0; i < length; i++) {
      const name = this.getAttributeName(i);
      // TODO - is this necessary, doesn't it always return i?
      const index = this.getAttributeLocation(name);
      console.log(`Attribute ${i} ${index}`);

      attributeLocations[name] = index;
    }
    return attributeLocations;
  }

  // create uniform setters
  // Map of uniform names to setter functions
  _getUniformSetters() {
    const {gl} = this;
    const uniformSetters = {};
    const length = this.getActiveUniformCount();
    for (let i = 0; i < length; i++) {
      const info = this.getUniformInfo(i);
      let name = info.name;
      // if array name then clean the array brackets
      name = name[name.length - 1] === ']' ?
        name.substr(0, name.length - 3) :
        name;
      uniformSetters[name] =
        getUniformSetter(gl, this.handle, info, info.name !== name);
    }
    return uniformSetters;
  }
}
