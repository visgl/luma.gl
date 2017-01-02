import {GL} from './webgl';
import {assertWebGLContext, assertWebGL2Context} from './webgl-checks';
import * as VertexAttributes from './vertex-attributes';
import Buffer from './buffer';
import Texture from './texture';
import {parseUniformName, getUniformSetter} from './uniforms';
import {VertexShader, FragmentShader} from './shader';
import {log, uid} from '../utils';
import assert from 'assert';

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
  /* eslint-disable max-statements */
  constructor(gl, {
    id,
    vs,
    fs,
    defaultUniforms,
    handle
  } = {}) {
    assertWebGLContext(gl);

    // Create shaders if needed
    this.vs = typeof vs === 'string' ? new VertexShader(gl, vs) : vs;
    this.fs = typeof vs === 'string' ? new FragmentShader(gl, fs) : fs;

    assert(this.vs instanceof VertexShader, 'Program: bad vertex shader');
    assert(this.fs instanceof FragmentShader, 'Program: bad fragment shader');

    // If program is not named, name it after shader names
    let programName = this.vs.getName() || this.fs.getName();
    programName = programName ? `${programName}-program` : 'program';
    this.id = id || uid(programName);

    this.gl = gl;
    this.defaultUniforms = defaultUniforms;
    this.handle = handle;
    if (!this.handle) {
      this.handle = gl.createProgram();
      this._compileAndLink();
    }
    if (!this.handle) {
      throw new Error('Failed to create program');
    }

    // determine attribute locations (i.e. indices)
    this._attributeLocations = this._getAttributeLocations();
    this._attributeCount = this.getAttributeCount();
    this._warn = [];
    this._filledLocations = {};

    // prepare uniform setters
    this._uniformSetters = this._getUniformSetters();
    this._uniformCount = this.getUniformCount();
    this._textureIndexCounter = 0;

    this.userData = {};
    Object.seal(this);
  }
  /* eslint-enable max-statements */

  delete() {
    const {gl} = this;
    if (this.handle) {
      gl.deleteProgram(this.handle);
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
  clearBuffers() {
    this._filledLocations = {};
    return this;
  }

  _print(bufferName) {
    return `Program ${this.id}: Attribute ${bufferName}`;
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

    const {locations, elements} = this._sortBuffersByLocation(buffers);

    // Process locations in order
    for (let location = 0; location < locations.length; ++location) {
      const bufferName = locations[location];
      const buffer = buffers[bufferName];
      // DISABLE MISSING ATTRIBUTE
      if (!buffer) {
        VertexAttributes.disable(gl, location);
      } else {
        const divisor = buffer.layout.instanced ? 1 : 0;
        VertexAttributes.enable(gl, location);
        VertexAttributes.setBuffer({gl, location, buffer});
        VertexAttributes.setDivisor(gl, location, divisor);
        drawParams.isInstanced = buffer.layout.instanced > 0;
        this._filledLocations[bufferName] = true;
      }
    }

    // SET ELEMENTS ARRAY BUFFER
    if (elements) {
      const buffer = buffers[elements];
      buffer.bind();
      drawParams.isIndexed = true;
      drawParams.indexType = buffer.layout.type;
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
  /* eslint-disable max-depth */
  setUniforms(uniforms) {
    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];
      const uniformSetter = this._uniformSetters[uniformName];
      if (uniformSetter) {
        if (uniform instanceof Texture) {
          if (uniformSetter.textureIndex === undefined) {
            uniformSetter.textureIndex = this._textureIndexCounter++;
          }
          // Bind texture to index, and set the uniform sampler to the index
          const texture = uniform;
          const {textureIndex} = uniformSetter;
          // console.debug('setting texture', textureIndex, texture);
          texture.bind(textureIndex);
          uniformSetter(textureIndex);
        } else {
          // Just set the value
          uniformSetter(uniform);
        }
      }
    }
    return this;
  }
  /* eslint-enable max-depth */

  // RAW WEBGL METHODS

  getAttachedShadersCount() {
    return this.getProgramParameter(GL.ATTACHED_SHADERS);
  }

  // ATTRIBUTES API
  // Note: Locations are numeric indices

  getAttributeCount() {
    return this.getProgramParameter(GL.ACTIVE_ATTRIBUTES);
  }

  /**
   * Returns an object with info about attribute at index "location"/
   * @param {int} location - index of an attribute
   * @returns {WebGLActiveInfo} - info about an active attribute
   *   fields: {name, size, type}
   */
  getAttributeInfo(location) {
    return this.gl.getActiveAttrib(this.handle, location);
  }

  getAttributeName(location) {
    return this.getAttributeInfo(location).name;
  }

  /**
   * Returns location (index) of a name
   * @param {String} attributeName - name of an attribute
   *   (matches name in a linked shader)
   * @returns {String[]} - array of actual attribute names from shader linking
   */
  getAttributeLocation(attributeName) {
    return this.gl.getAttribLocation(this.handle, attributeName);
  }

  // UNIFORMS API
  // Note: locations are opaque structures

  getUniformCount() {
    return this.getProgramParameter(GL.ACTIVE_UNIFORMS);
  }

  /*
   * @returns {WebGLActiveInfo} - object with {name, size, type}
   */
  getUniformInfo(index) {
    return this.gl.getActiveUniform(this.handle, index);
  }

  /*
   * @returns {WebGLUniformLocation} - opaque object representing location
   * of uniform, used by setter methods
   */
  getUniformLocation(name) {
    return this.gl.getUniformLocation(this.handle, name);
  }

  getUniformValue(location) {
    return this.gl.getUniform(this.handle, location);
  }

  // PROGRAM API

  isFlaggedForDeletion() {
    return this.getProgramParameter(GL.DELETE_STATUS);
  }

  getLastLinkStatus() {
    return this.getProgramParameter(GL.LINK_STATUS);
  }

  getLastValidationStatus() {
    return this.getProgramParameter(GL.VALIDATE_STATUS);
  }

  // WEBGL2 INTERFACE

  // This may be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS.
  getTransformFeedbackBufferMode() {
    assertWebGL2Context(this.gl);
    return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_BUFFER_MODE);
  }

  getTransformFeedbackVaryingsCount() {
    assertWebGL2Context(this.gl);
    return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_VARYINGS);
  }

  getActiveUniformBlocksCount() {
    assertWebGL2Context(this.gl);
    return this.getProgramParameter(this.gl.ACTIVE_UNIFORM_BLOCKS);
  }

  // Retrieves the assigned color number binding for the user-defined varying
  // out variable name for program. program must have previously been linked.
  // [WebGLHandlesContextLoss]
  getFragDataLocation(varyingName) {
    assertWebGL2Context(this.gl);
    return this.gl.getFragDataLocation(this.handle, varyingName);
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
    return this.gl.getProgramParameter(this.handle, pname);
  }

  // PRIVATE METHODS

  _compileAndLink() {
    const {gl} = this;
    gl.attachShader(this.handle, this.vs.handle);
    gl.attachShader(this.handle, this.fs.handle);
    gl.linkProgram(this.handle);
    gl.validateProgram(this.handle);
    const linked = gl.getProgramParameter(this.handle, gl.LINK_STATUS);
    if (!linked) {
      throw new Error(`Error linking ${gl.getProgramInfoLog(this.handle)}`);
    }
  }

  _sortBuffersByLocation(buffers) {
    let elements = null;
    const locations = new Array(this._attributeCount);

    for (const bufferName in buffers) {
      const buffer = Buffer.makeFrom(this.gl, buffers[bufferName]);
      const location = this._attributeLocations[bufferName];
      if (location === undefined) {
        if (buffer.target === GL.ELEMENT_ARRAY_BUFFER && elements) {
          throw new Error(
            `${this._print(bufferName)} duplicate gl.ELEMENT_ARRAY_BUFFER`);
        } else if (buffer.target === GL.ELEMENT_ARRAY_BUFFER) {
          elements = bufferName;
        } else if (!this._warn[bufferName]) {
          log.warn(2, `${this._print(bufferName)} not used`);
          this._warn[bufferName] = true;
        }
      } else {
        if (buffer.target === GL.ELEMENT_ARRAY_BUFFER) {
          throw new Error(`${this._print(bufferName)}:${location} ` +
            'has both location and type gl.ELEMENT_ARRAY_BUFFER');
        }
        locations[location] = bufferName;
      }
    }

    return {locations, elements};
  }

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
    const length = this.getAttributeCount();
    for (let location = 0; location < length; location++) {
      const name = this.getAttributeName(location);
      attributeLocations[name] = this.getAttributeLocation(name);
    }
    return attributeLocations;
  }

  // create uniform setters
  // Map of uniform names to setter functions
  _getUniformSetters() {
    const {gl} = this;
    const uniformSetters = {};
    const length = this.getUniformCount();
    for (let i = 0; i < length; i++) {
      const info = this.getUniformInfo(i);
      const parsedName = parseUniformName(info.name);
      const location = this.getUniformLocation(parsedName.name);
      uniformSetters[parsedName.name] =
        getUniformSetter(gl, location, info, parsedName.isArray);
    }
    return uniformSetters;
  }
}

// create uniform setters
// Map of uniform names to setter functions
export function getUniformDescriptors(gl, program) {
  const uniformDescriptors = {};
  const length = program.getUniformCount();
  for (let i = 0; i < length; i++) {
    const info = program.getUniformInfo(i);
    const location = program.getUniformLocation(info.name);
    const descriptor = getUniformSetter(gl, location, info);
    uniformDescriptors[descriptor.name] = descriptor;
  }
  return uniformDescriptors;
}

