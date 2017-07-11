/* eslint-disable no-inline-comments */
import GL from './api';
import {assertWebGL2Context, isWebGL2} from './context';
import VertexArray from './vertex-array';
import Resource from './resource';
import Texture from './texture';
import {getTransformFeedbackMode} from './transform-feedback';
import {parseUniformName, getUniformSetter} from './uniforms';
import {VertexShader, FragmentShader} from './shader';
import {log, uid} from '../utils';
import assert from 'assert';

// const GL_TRANSFORM_FEEDBACK_BUFFER_MODE = 0x8C7F;
// const GL_TRANSFORM_FEEDBACK_VARYINGS = 0x8C83;
// MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS : 0x8C80,
// TRANSFORM_FEEDBACK_BUFFER_START: 0x8C84,
// TRANSFORM_FEEDBACK_BUFFER_SIZE : 0x8C85,
// TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: 0x8C88,
// MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: 0x8C8A,
// MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: 0x8C8B,
// INTERLEAVED_ATTRIBS: 0x8C8C,
// SEPARATE_ATTRIBS : 0x8C8D,

export default class Program extends Resource {
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
  constructor(gl, opts = {}) {
    super(gl, opts);
    this.initialize(opts);
    this.vertexAttributes = VertexArray.getDefaultArray(gl);
    Object.seal(this);

    // If program is not named, name it after shader names
    if (!opts.id) {
      let programName = this.vs.getName() || this.fs.getName();
      programName = programName.replace(/shader/i, '');
      programName = programName ? `${programName}-program` : 'program';
      // TODO - this.id will already have been initialized
      this.id = uid(programName);
    }
  }

  initialize({vs, fs, defaultUniforms, varyings, bufferMode = GL.SEPARATE_ATTRIBS} = {}) {
    // Create shaders if needed
    this.vs = typeof vs === 'string' ? new VertexShader(this.gl, vs) : vs;
    this.fs = typeof fs === 'string' ? new FragmentShader(this.gl, fs) : fs;

    assert(this.vs instanceof VertexShader, 'Program: bad vertex shader');
    assert(this.fs instanceof FragmentShader, 'Program: bad fragment shader');

    this.defaultUniforms = defaultUniforms;

    // Setup varyings if supplied
    if (varyings) {
      assertWebGL2Context(this.gl);
      this.gl.transformFeedbackVaryings(this.handle, varyings, bufferMode);
      this.varyings = getVaryingMap(varyings, bufferMode);
    }

    this._compileAndLink();

    // determine attribute locations (i.e. indices)
    this._attributeLocations = this._getAttributeLocations();
    this._attributeCount = this.getAttributeCount();
    this._warn = [];
    this._filledLocations = {};

    // prepare uniform setters
    this._uniformSetters = this._getUniformSetters();
    this._uniformCount = this.getUniformCount();
    this._textureIndexCounter = 0;

    return this;
  }

  use() {
    this.gl.useProgram(this.handle);
    return this;
  }

  // A good thing about webGL is that there are so many ways to draw things,
  // e.g. depending on whether data is indexed and/or isInstanced.
  // This function unifies those into a single call with simple parameters
  // that have sane defaults.
  draw({
    drawMode = GL.TRIANGLES,
    vertexCount,
    offset = 0,
    start,
    end,
    isIndexed = false,
    indexType = GL.UNSIGNED_SHORT,
    isInstanced = false,
    instanceCount = 0,
    vertexArray = null,
    transformFeedback = null,
    uniforms = {},
    samplers = {},
    parameters = {},
    settings
  }) {
    if (settings) {
      log.deprecated('settings', 'parameters');
      parameters = settings;
    }

    vertexArray = vertexArray || VertexArray.getDefaultArray(this.gl);
    vertexArray.bind(() => {

      this.gl.useProgram(this.handle);

      if (transformFeedback) {
        if (parameters[GL.RASTERIZER_DISCARD]) {
          // bypass fragment shader
          this.gl.enable(GL.RASTERIZER_DISCARD);
        }

        const primitiveMode = getTransformFeedbackMode({drawMode});
        transformFeedback.begin(primitiveMode);
      }

      this.setUniforms(uniforms, samplers);

      // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
      if (isIndexed && isInstanced) {
        this.ext.drawElementsInstanced(drawMode, vertexCount, indexType, offset, instanceCount);
      } else if (isIndexed && isWebGL2(this.gl) && !isNaN(start) && !isNaN(end)) {
        this.gl.drawElementsRange(drawMode, start, end, vertexCount, indexType, offset);
      } else if (isIndexed) {
        this.gl.drawElements(drawMode, vertexCount, indexType, offset);
      } else if (isInstanced) {
        this.ext.drawArraysInstanced(drawMode, offset, vertexCount, instanceCount);
      } else {
        this.gl.drawArrays(drawMode, offset, vertexCount);
      }

      // this.gl.useProgram(null);

      if (transformFeedback) {
        transformFeedback.end();

        if (parameters[GL.RASTERIZER_DISCARD]) {
          // resume fragment shader
          this.gl.disable(GL.RASTERIZER_DISCARD);
        }
      }

    });

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
    if (clear) {
      this._filledLocations = {};
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
        this.vertexAttributes.disable(location);
      } else {
        const divisor = buffer.layout.instanced ? 1 : 0;
        this.vertexAttributes.enable(location);
        this.vertexAttributes.setBuffer({location, buffer});
        this.vertexAttributes.setDivisor(location, divisor);
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
      this._checkBuffers();
    }

    return this;
  }
  /* eslint-enable max-statements */

  /*
   * @returns {Program} Returns itself for chaining.
   */
  unsetBuffers() {
    const length = this._attributeCount;
    for (let i = 1; i < length; ++i) {
      // this.vertexAttributes.setDivisor(i, 0);
      this.vertexAttributes.disable(i);
    }

    // Clear elements buffer
    this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
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
  setUniforms(uniforms, samplers = {}) {
    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];
      const uniformSetter = this._uniformSetters[uniformName];
      const sampler = samplers[uniformName];

      if (uniformSetter) {
        if (uniform instanceof Texture) {
          if (uniformSetter.textureIndex === undefined) {
            uniformSetter.textureIndex = this._textureIndexCounter++;
          }

          // Bind texture to index
          const texture = uniform;
          const {textureIndex} = uniformSetter;

          texture.bind(textureIndex);

          // Bind a sampler (if supplied) to index
          if (sampler) {
            sampler.bind(textureIndex);
          }

          // Set the uniform sampler to the texture index
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

  // setTransformFeedbackBuffers(buffers) {
  //   for (const buffer of buffers) {
  //     buffer.bindBase()
  //   }
  // }

  /**
   * ATTRIBUTES API
   * (Locations are numeric indices)
   * @return {Number} count
   */
  getAttributeCount() {
    return this._getParameter(GL.ACTIVE_ATTRIBUTES);
  }

  /**
   * Returns location (index) of a name
   * @param {String} attributeName - name of an attribute
   *   (matches name in a linked shader)
   * @returns {Number} - // array of actual attribute names from shader linking
   */
  getAttributeLocation(attributeName) {
    return this.gl.getAttribLocation(this.handle, attributeName);
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

  /**
   * UNIFORMS API
   * (Locations are numeric indices)
   * @return {Number} count
   */
  getUniformCount() {
    return this._getParameter(GL.ACTIVE_UNIFORMS);
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

  // WebGL2
  /**
   * @param {GLuint} index
   * @return {WebGLActiveInfo} - object with {name, size, type}
   */
  getVarying(program, index) {
    const result = this.gl.getTransformFeedbackVarying(program, index);
    return result;
  }

  // Retrieves the assigned color number binding for the user-defined varying
  // out variable name for program. program must have previously been linked.
  getFragDataLocation(varyingName) {
    assertWebGL2Context(this.gl);
    return this.gl.getFragDataLocation(this.handle, varyingName);
  }

  // @returns {WebGLShader[]} - array of attached WebGLShader objects
  getAttachedShaders() {
    return this.gl.getAttachedShaders(this.handle);
  }

  // PRIVATE METHODS

  _compileAndLink() {
    const {gl} = this;
    gl.attachShader(this.handle, this.vs.handle);
    gl.attachShader(this.handle, this.fs.handle);
    gl.linkProgram(this.handle);

    // Avoid checking program linking error in production
    if (gl.debug || log.priority > 0) {
      gl.validateProgram(this.handle);
      const linked = gl.getProgramParameter(this.handle, gl.LINK_STATUS);
      if (!linked) {
        throw new Error(`Error linking ${gl.getProgramInfoLog(this.handle)}`);
      }
    }
  }

  _checkBuffers() {
    for (const attributeName in this._attributeLocations) {
      if (!this._filledLocations[attributeName] && !this._warn[attributeName]) {
        const location = this._attributeLocations[attributeName];
        // throw new Error(`Program ${this.id}: ` +
        //   `Attribute ${location}:${attributeName} not supplied`);
        log.warn(0, `Program ${this.id}: Attribute ${location}:${attributeName} not supplied`);
        this._warn[attributeName] = true;
      }
    }
    return this;
  }

  _sortBuffersByLocation(buffers) {
    let elements = null;
    const locations = new Array(this._attributeCount);

    for (const bufferName in buffers) {
      const buffer = buffers[bufferName];
      const location = this._attributeLocations[bufferName];
      if (location === undefined) {
        if (buffer.target === GL.ELEMENT_ARRAY_BUFFER && elements) {
          throw new Error(`${this._print(bufferName)} duplicate GL.ELEMENT_ARRAY_BUFFER`);
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
    const length = this._attributeCount;
    for (let i = 0; i < length; ++i) {
      if (!this.vertexAttributes.isEnabled(i)) {
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
      const name = this.getAttributeInfo(location).name;
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

  _print(bufferName) {
    return `Program ${this.id}: Attribute ${bufferName}`;
  }

  _createHandle() {
    return this.gl.createProgram();
  }

  _deleteHandle() {
    this.gl.deleteProgram(this.handle);
  }

  _getOptionsFromHandle(handle) {
    const shaderHandles = this.gl.getAttachedShaders(handle);
    const opts = {};
    for (const shaderHandle of shaderHandles) {
      const type = this.gl.getShaderParameter(this.handle, GL.SHADER_TYPE);
      switch (type) {
      case GL.VERTEX_SHADER:
        opts.vs = new VertexShader({handle: shaderHandle});
        break;
      case GL.FRAGMENT_SHADER:
        opts.fs = new FragmentShader({handle: shaderHandle});
        break;
      default:
      }
    }
    return opts;
  }

  _getParameter(pname) {
    return this.gl.getProgramParameter(this.handle, pname);
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

// Get a map of buffer indices
export function getVaryingMap(varyings, bufferMode) {
  const varyingMap = {};
  let index = 0;
  for (const varying of varyings) {
    if (bufferMode === GL.SEPARATE_ATTRIBS) {
      varyingMap[varyings] = {index};
      index++;
    } else if (varying === 'gl_NextBuffer') {
      index++;
    } else {
      // Add a "safe" offset as fallback unless app specifies it
      // Could query
      varyingMap[varyings] = {index, offset: 16};
    }
  }
  return varyingMap;
}
