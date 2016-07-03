import {WebGL2RenderingContext} from './webgl-types';
import {assertWebGLRenderingContext} from './webgl-checks';
import {glCheckError} from './context';
import * as VertexAttributes from './vertex-attributes';
import Buffer from './buffer';
import {getUniformSetter} from './uniforms';
import {VertexShader, FragmentShader} from './shader';
import Shaders from '../../shaderlib';
import {log, uid} from '../utils';
import assert from 'assert';

const ERR_WEBGL2 = 'WebGL2 required';

export default class Program {

  /**
   * Returns a Program wrapped WebGLProgram from a variety of inputs.
   * Allows other functions to transparently accept raw WebGLPrograms etc
   * and manipulate them using the methods in the `Program` class.
   * Checks for ".handle"
   *
   * @param {WebGLRenderingContext} gl - if a new buffer needs to be initialized
   * @param {*} object - candidate that will be coerced to a buffer
   * @returns {Program} - Program object that wraps the buffer parameter
   */
  static makeFrom(gl, object = {}) {
    return object instanceof Program ? object :
      // Use .handle if available, else use 'program' directly
      new Program(gl).setData({handle: object.handle || object});
  }

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
    id = uid('program'),
    handle
  } = {}) {
    assertWebGLRenderingContext(gl);

    if (arguments.length > 2) {
      throw new Error('Wrong number of arguments to Program(gl, {vs, fs, id})');
    }

    this.handle = handle || gl.createProgram();
    if (!this.handle) {
      throw new Error('Failed to create program');
    }

    this.gl = gl;
    this.id = id;
    this.userData = {};

    this._compileAndLink(vs, fs);

    // determine attribute locations (i.e. indices)
    this._attributeLocations = this._getAttributeLocations();
    this._attributeCount = this.getActiveAttributeCount();
    this._warn = [];
    this._filledLocations = {};

    // prepare uniform setters
    this._uniformSetters = this._getUniformSetters();
    this._uniformCount = this.getActiveUniformCount();
    Object.seal(this);
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

  _compileAndLink(vs, fs) {
    const {gl} = this;
    gl.attachShader(this.handle, new VertexShader(gl, vs).handle);
    gl.attachShader(this.handle, new FragmentShader(gl, fs).handle);
    gl.linkProgram(this.handle);
    gl.validateProgram(this.handle);
    const linked = gl.getProgramParameter(this.handle, gl.LINK_STATUS);
    if (!linked) {
      throw new Error(`Error linking ${gl.getProgramInfoLog(this.handle)}`);
    }
  }

  use() {
    const {gl} = this;
    gl.useProgram(this.handle);
    return this;
  }

  // DEPRECATED METHODS
  clearBuffers() {
    this._filledLocations = {};
    return this;
  }

  /**
   * Attach a map of Buffers values to a program
   * Only attributes with names actually present in the linked program
   * will be updated. Other supplied buffers will be ignored.
   *
   * @param {Object} buffers - An object map with attribute names being keys
   *  and values are expected to be instances of Buffer.
   * @returns {Program} Returns itself for chaining.
   */
  /* eslint-disable max-statements */
  setBuffers(buffers, {clear = true, check = true, drawParams = {}} = {}) {
    const {gl} = this;
    if (Array.isArray(buffers)) {
      throw new Error('Program.setBuffers expects map of buffers');
    }

    if (clear) {
      this.clearBuffers();
    }

    // indexing is autodetected - buffer with target gl.ELEMENT_ARRAY_BUFFER
    // index type is saved for drawElement calls
    drawParams.isInstanced = false;
    drawParams.isIndexed = false;
    drawParams.indexType = null;

    for (const bufferName in buffers) {
      const location = this._attributeLocations[bufferName];
      const buffer = Buffer.makeFrom(gl, buffers[bufferName]);

      // SET ELEMENTS ARRAY BUFFER
      if (buffer.target === gl.ELEMENT_ARRAY_BUFFER) {
        if (location !== undefined) {
          throw new Error(`Program ${this.id}: ` +
            `Attribute ${bufferName}:${location}` +
            `has both location and type gl.ELEMENT_ARRAY_BUFFER`);
        }
        if (this.isIndexed) {
          throw new Error(`Program ${this.id}: ` +
            `Attribute ${bufferName} duplicate gl.ELEMENT_ARRAY_BUFFER`);
        }
        buffer.bind();
        drawParams.isIndexed = true;
        drawParams.indexType = buffer.layout.type;
      } else if (location === undefined) {
        if (!this._warn[bufferName]) {
          log.warn(2, `Program ${this.id}: Buffer ${bufferName} not used`);
          this._warn[bufferName] = true;
        }
      } else {
        const divisor = buffer.layout.instanced ? 1 : 0;
        VertexAttributes.enable(gl, location);
        VertexAttributes.setBuffer({gl, location, buffer});
        VertexAttributes.setDivisor(gl, location, divisor);
        this._filledLocations[bufferName] = true;
        drawParams.isInstanced = buffer.layout.instanced > 0;
      }
    }

    if (check) {
      this.checkBuffers();
    }

    return this;
  }
  /* eslint-enable max-statements */

  checkBuffers() {
    for (const attributeName in this._attributeLocations) {
      if (!this._filledLocations[attributeName] && !this._warn[attributeName]) {
        const location = this._attributeLocations[attributeName];
        // throw new Error(`Program ${this.id}: ` +
        //   `Attribute ${location}:${attributeName} not supplied`);
        log.warn(0, `Program ${this.id}: ` +
          `Attribute ${location}:${attributeName} not supplied`);
        this._warn[attributeName] = true;
      }
    }
    return this;
  }

  /*
   * @returns {Program} Returns itself for chaining.
   */
  unsetBuffers() {
    const {gl} = this;
    const length = this._attributeCount;
    for (let i = 1; i < length; ++i) {
      // VertexAttributes.setDivisor(gl, i, 0);
      VertexAttributes.disable(gl, i);
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
    for (let location = 0; location < length; location++) {
      const name = this.getAttributeName(location);
      attributeLocations[name] = location;
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
