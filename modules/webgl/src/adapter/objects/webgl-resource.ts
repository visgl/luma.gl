// luma.gl, MIT license
import {Resource, assert, uid, stubRemovedMethods} from '@luma.gl/api';
import type {Device, ResourceProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {isWebGL2, assertWebGLContext} from '../../context/context/webgl-checks';
import {WebGLDevice} from '../webgl-device';

// Requires full GL enum to be bundled... Make these bindings dependent on dynamic import (debug)?
import {getKeyValue} from './constants-to-keys';

const ERR_RESOURCE_METHOD_UNDEFINED = 'Resource subclass must define virtual methods';

/**
 * Base class for WebGL object wrappers
 */
export abstract class WebGLResource<Props extends ResourceProps> extends Resource<Props> {
  readonly device: WebGLDevice;
  readonly gl: WebGLRenderingContext;
  readonly gl2: WebGL2RenderingContext;
  private _handle: any;

  private _bound = false;
  // Only meaningful for resources that allocate GPU memory
  byteLength = 0;

  constructor(device: Device, props: Props, defaultProps: Required<Props>) {
    super(device, props, defaultProps);

    this.device = WebGLDevice.attach(device);
    const gl = this.device.gl;

    assertWebGLContext(gl);

    // extends 
    const {id} = props || {};
    this.gl = gl;
    this.gl2 = gl as WebGL2RenderingContext;
    this.id = id || uid(this.constructor.name);

    // Set the handle
    // If handle was provided, use it, otherwise create a new handle

    // TODO - Stores the handle with context loss information
    // this.glCount = glGetContextLossCount(this.gl);

    // Default VertexArray needs to be created with null handle, so compare against undefined
    this._handle = props?.handle;
    if (this._handle === undefined) {
      this._handle = this._createHandle();
    }

    this.byteLength = 0;
  }

  override toString(): string {
    return `${this.constructor.name}(${this.id})`;
  }

  get handle() {
    // TODO - Add context loss handling
    // Will regenerate and reinitialize the handle if necessary
    // const glCount = glGetContextLossCount(this.gl);
    // if (this.glCount !== glCount) {
    //   this._handle = this._createHandle(this.props);
    //   this._glCount = glCount;
    //   // Reinitialize object
    //   this.initialize(this.props);
    // }
    return this._handle;
  }

  override delete({deleteChildren = false} = {}) {
    // Delete this object, and get refs to any children
    // @ts-expect-error
    const children = this._handle && this._deleteHandle(this._handle);
    if (this._handle) {
      this.removeStats();
    }
    this._handle = null;

    // Optionally, recursively delete the children
    // @ts-expect-error
    if (children && deleteChildren) {
      // @ts-expect-error
      children.filter(Boolean).forEach((child) => child.destroy());
    }

    return this;
  }

  bind(funcOrHandle = this.handle) {
    if (typeof funcOrHandle !== 'function') {
      this._bindHandle(funcOrHandle);
      return this;
    }

    let value;

    if (!this._bound) {
      this._bindHandle(this.handle);
      this._bound = true;

      value = funcOrHandle();

      this._bound = false;
      this._bindHandle(null);
    } else {
      value = funcOrHandle();
    }

    return value;
  }

  unbind() {
    this.bind(null);
  }

  /**
   * Query a Resource parameter
   *
   * @param name
   * @return param
   */
  getParameter(pname: number, props: any = {}): any {
    pname = getKeyValue(this.gl, pname);
    assert(pname);

    // @ts-expect-error
    const parameters = this.constructor.PARAMETERS || {};

    // Use parameter definitions to handle unsupported parameters
    const parameter = parameters[pname];
    if (parameter) {
      const isWebgl2 = isWebGL2(this.gl);

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
    return this._getParameter(pname, props);
  }

  // Many resources support a getParameter call -
  // getParameters will get all parameters - slow but useful for debugging
  // eslint-disable-next-line complexity
  getParameters(options: {parameters?: any, keys?: any} = {}) {
    const {parameters, keys} = options;

    // Get parameter definitions for this Resource
    // @ts-expect-error
    const PARAMETERS = this.constructor.PARAMETERS || {};

    const isWebgl2 = isWebGL2(this.gl);

    const values: Record<string, any> = {};

    // Query all parameters if no list provided
    const parameterKeys = parameters || Object.keys(PARAMETERS);

    // WEBGL limits
    for (const pname of parameterKeys) {
      const parameter = PARAMETERS[pname];

      // Check if this parameter is available on this platform
      const parameterAvailable =
        parameter &&
        (!('webgl2' in parameter) || isWebgl2) &&
        (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (parameterAvailable) {
        const key = keys ? this.device.getGLKey(pname) : pname;
        values[key] = this.getParameter(pname, options);
        if (keys && parameter.type === 'GLenum') {
          values[key] = this.device.getGLKey(values[key]);
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
   * @param pname - parameter (GL constant, value or key)
   * @param value {GLint|GLfloat|GLenum} 
   * @return returns self to enable chaining
   */
  setParameter(pname: GL | string, value: any): this {
    pname = getKeyValue(this.gl, pname);
    assert(pname);

    // @ts-expect-error
    const parameters = this.constructor.PARAMETERS || {};

    const parameter = parameters[pname];
    if (parameter) {
      const isWebgl2 = isWebGL2(this.gl);

      // Check if this parameter is available on this platform
      const parameterAvailable =
        (!('webgl2' in parameter) || isWebgl2) &&
        (!('extension' in parameter) || this.gl.getExtension(parameter.extension));

      if (!parameterAvailable) {
        throw new Error('Parameter not available on this platform');
      }

      // Handle string keys
      if (parameter.type === 'GLenum') {
        // @ts-expect-error
        value = getKeyValue(value);
      }
    }

    // If unknown parameter - Could be a valid parameter not covered by PARAMS
    // attempt to set it and let WebGL report errors
    this._setParameter(pname, value);
    return this;
  }

  /*
   * Batch update resource parameters
   * Assumes the subclass supports a setParameter call
   */
  setParameters(parameters: Record<GL, any>) {
    for (const pname in parameters) {
      this.setParameter(pname, parameters[pname]);
    }
    return this;
  }

  // Install stubs for removed methods
  stubRemovedMethods(className: string, version: string, methodNames: string[]) {
    return stubRemovedMethods(this, className, version, methodNames);
  }

  // PUBLIC VIRTUAL METHODS
  initialize(props: ResourceProps) {}

  // PROTECTED METHODS - These must be overridden by subclass
  _createHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _deleteHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _bindHandle(handle: any) {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _getOptsFromHandle() {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _getParameter(pname: GL, props: Record<string, any>): number {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  _setParameter(pname: GL | string, value: any) {
    throw new Error(ERR_RESOURCE_METHOD_UNDEFINED);
  }

  // PRIVATE METHODS

  /*
  _addStats() {
    const name = this.constructor.name;
    const stats = lumaStats.get('Resource Counts');

    stats.get('Resources Created').incrementCount();
    stats.get(`${name}s Created`).incrementCount();
    stats.get(`${name}s Active`).incrementCount();
  }

  _removeStats() {
    const name = this.constructor.name;
    const stats = lumaStats.get('Resource Counts');

    stats.get(`${name}s Active`).decrementCount();
  }

  trackAllocatedMemory(bytes, name = this.constructor.name) {
    const stats = lumaStats.get('Memory Usage');

    stats.get('GPU Memory').addCount(bytes);
    stats.get(`${name} Memory`).addCount(bytes);
    this.byteLength = bytes;
  }

  trackDeallocatedMemory(name = this.constructor.name) {
    const stats = lumaStats.get('Memory Usage');

    stats.get('GPU Memory').subtractCount(this.byteLength);
    stats.get(`${name} Memory`).subtractCount(this.byteLength);
    this.byteLength = 0;
  }
  */
}
