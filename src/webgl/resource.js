import luma from '../init';
import {assertWebGLContext, isWebGL2Context} from './context';
import {glGet, glKey} from './gl-constants';
import {uid} from '../utils';

const ERR_RESOURCE_METHOD_UNDEFINED = 'Resource subclass must define virtual methods';

// TODO - Handle context loss
// function glGetContextLossCount(gl) {
//   return (gl.luma && gl.luma.glCount) || 0;
// }

export default class Resource {
  constructor(gl, opts = {}) {
    assertWebGLContext(gl);

    const {id, userData = {}} = opts;
    this.gl = gl;
    this.ext = null;
    this.id = id || uid(this.constructor.name);
    this.userData = userData;
    this.opts = opts;

    // Set the handle
    // If handle was provided, use it, otherwise create a new handle

    // TODO - Stores the handle with context loss information
    // this.glCount = glGetContextLossCount(this.gl);
    this._handle = opts.handle || this._createHandle();

    this._addStats();
  }

  toString() {
    return `${this.constructor.name}(${this.id})`;
  }

  get handle() {
    // TODO - Add context loss handling
    // Will regenerate and reinitialize the handle if necessary
    // const glCount = glGetContextLossCount(this.gl);
    // if (this.glCount !== glCount) {
    //   this._handle = this._createHandle(this.opts);
    //   this._glCount = glCount;
    //   // Reinitialize object
    //   this.initialize(this.opts);
    // }
    return this._handle;
  }

  delete() {
    if (this._handle) {
      this._deleteHandle();
      this._handle = null;
      // this.glCount = undefined;
    }
    return this;
  }

  /**
   * Query a Resource parameter
   *
   * @todo - cache parameters to avoid issuing WebGL calls?
   *
   * @param {GLenum} pname
   * @return {GLint|GLfloat|GLenum} param
   */
  getParameter(pname) {
    pname = glGet(pname);

    const parameters = this.constructor.PARAMETERS || {};

    // Use parameter definitions to handle unsupported parameters
    const parameter = parameters[pname];
    if (parameter) {
      const isWebgl2 = isWebGL2Context(this.gl);

      // Check if we can query for this parameter
      const parameterAvailable =
        (!('webgl2' in parameter) || isWebgl2) &&
        (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (!parameterAvailable) {
        const webgl1Default = parameter.webgl1;
        const webgl2Default = 'webgl2' in parameter ? parameter.webgl2 : parameter.webgl1;
        const defaultValue = isWebgl2 ? webgl2Default : webgl1Default;
        return defaultValue;
      }
    }

    // If unknown parameter - Could be a valid parameter not covered by PARAMS
    // Attempt to query for it and let WebGL report errors
    return this._getParameter(pname);
  }

  // Many resources support a getParameter call -
  // getParameters will get all parameters - slow but useful for debugging
  getParameters({parameters, keys} = {}) {
    // Get parameter definitions for this Resource
    const PARAMETERS = this.constructor.PARAMETERS || {};

    // Query all parameters if no list provided
    parameters = parameters || Object.keys(PARAMETERS);

    const isWebgl2 = isWebGL2Context(this.gl);

    const values = {};

    // WEBGL limits
    for (const pname of parameters) {
      const parameter = PARAMETERS[pname];

      // Check if this parameter is available on this platform
      const parameterAvailable =
        parameter &&
        (!('webgl2' in parameter) || isWebgl2) &&
        (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (parameterAvailable) {
        const key = keys ? glKey(pname) : pname;
        values[key] = this.getParameter(pname);
        if (keys && parameter.type === 'GLenum') {
          values[key] = glKey(values[key]);
        }
      }
    }

    return values;
  }

  /**
   * Update a Resource setting
   *
   * @todo - cache parameter to avoid issuing WebGL calls?
   *
   * @param {GLenum} pname - parameter (GL constant, value or key)
   * @param {GLint|GLfloat|GLenum} value
   * @return {Resource} returns self to enable chaining
   */
  setParameter(pname, value) {
    pname = glGet(pname);

    const parameters = this.constructor.PARAMETERS || {};

    const parameter = parameters[pname];
    if (parameter) {
      const isWebgl2 = isWebGL2Context(this.gl);

      // Check if this parameter is available on this platform
      const parameterAvailable =
        (!('webgl2' in parameter) || isWebgl2) &&
        (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (!parameterAvailable) {
        throw new Error('Parameter not available on this platform');
      }

      // Handle string keys
      if (parameter.type === 'GLenum') {
        value = glGet(value);
      }
    }

    // If unknown parameter - Could be a valid parameter not covered by PARAMS
    // attempt to set it and let WebGL report errors
    this._setParameter(value);
    return this;
  }

  /*
   * Batch update resource settings
   * Assumes the subclass supports a setParameter call
   */
  setParameters(parameters) {
    for (const pname in parameters) {
      this.setParameter(pname, parameters[pname]);
    }
    return this;
  }

  // PUBLIC VIRTUAL METHODS
  initialize(opts) {
  }

  // PROTECTED METHODS - These must be overridden by subclass
  _createHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _deleteHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _getOptsFromHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _getParameter(pname) {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _setParameter(pname, value) {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  // PRIVATE METHODS

  _addStats() {
    const name = this.constructor.name;

    const {stats} = luma;
    stats.resourceCount = stats.resourceCount || 0;
    stats.resourceMap = stats.resourceMap || {};

    // Resource creation stats
    stats.resourceCount++;
    stats.resourceMap[name] = stats.resourceMap[name] || {count: 0};
    stats.resourceMap[name].count++;
  }
}
