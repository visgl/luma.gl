// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, ResourceProps} from '@luma.gl/core';
import {Resource, uid, stubRemovedMethods} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';

const ERR_RESOURCE_METHOD_UNDEFINED = 'Resource subclass must define virtual methods';

/**
 * Base class for WebGL object wrappers
 */
export abstract class WebGLResource<Props extends ResourceProps> extends Resource<Props> {
  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  readonly gl2: WebGL2RenderingContext;
  private _handle: any;

  private _bound = false;
  // Only meaningful for resources that allocate GPU memory
  byteLength = 0;

  constructor(device: Device, props: Props, defaultProps: Required<Props>) {
    super(device, props, defaultProps);

    this.device = device as WebGLDevice;
    const gl = this.device.gl;

    // extends
    const {id} = props || {};
    this.gl = gl;
    this.gl2 = gl;
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
      children.filter(Boolean).forEach(child => child.destroy());
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
