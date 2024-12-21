// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {uid} from '../../utils/uid';

export type ResourceProps = {
  /** Name of resource, mainly for debugging purposes. A unique name will be assigned if not provided */
  id?: string;
  /** Handle for the underlying resources (WebGL object or WebGPU handle) */
  handle?: any;
  /** User provided data stored on this resource  */
  userData?: {[key: string]: any};
};

/**
 * Base class for GPU (WebGPU/WebGL) Resources
 */
export abstract class Resource<Props extends ResourceProps> {
  /** Default properties for resource */
  static defaultProps: Required<ResourceProps> = {
    id: 'undefined',
    handle: undefined,
    userData: undefined!
  };

  abstract get [Symbol.toStringTag](): string;

  toString(): string {
    return `${this[Symbol.toStringTag] || this.constructor.name}:"${this.id}"`;
  }

  /** props.id, for debugging. */
  id: string;
  readonly props: Required<Props>;
  readonly userData: Record<string, unknown> = {};
  abstract readonly device: Device;
  private _device: Device;

  /** Whether this resource has been destroyed */
  destroyed: boolean = false;
  /** For resources that allocate GPU memory */
  private allocatedBytes: number = 0;
  /** Attached resources will be destroyed when this resource is destroyed. Tracks auto-created "sub" resources. */
  private _attachedResources = new Set<Resource<ResourceProps>>();

  /**
   * Create a new Resource. Called from Subclass
   */
  constructor(device: Device, props: Props, defaultProps: Required<Props>) {
    if (!device) {
      throw new Error('no device');
    }
    this._device = device;
    this.props = selectivelyMerge<Props>(props, defaultProps);

    const id =
      this.props.id !== 'undefined' ? (this.props.id as string) : uid(this[Symbol.toStringTag]);
    this.props.id = id;
    this.id = id;
    this.userData = this.props.userData || {};

    this.addStats();
  }

  /**
   * destroy can be called on any resource to release it before it is garbage collected.
   */
  destroy(): void {
    this.destroyResource();
  }

  /** @deprecated Use destroy() */
  delete(): this {
    this.destroy();
    return this;
  }

  /**
   * Combines a map of user props and default props, only including props from defaultProps
   * @returns returns a map of overridden default props
   */
  getProps(): object {
    return this.props;
  }

  // ATTACHED RESOURCES

  /**
   * Attaches a resource. Attached resources are auto destroyed when this resource is destroyed
   * Called automatically when sub resources are auto created but can be called by application
   */
  attachResource(resource: Resource<ResourceProps>): void {
    this._attachedResources.add(resource);
  }

  /**
   * Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.
   */
  detachResource(resource: Resource<ResourceProps>): void {
    this._attachedResources.delete(resource);
  }

  /**
   * Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.
   */
  destroyAttachedResource(resource: Resource<ResourceProps>): void {
    if (this._attachedResources.delete(resource)) {
      resource.destroy();
    }
  }

  /** Destroy all owned resources. Make sure the resources are no longer needed before calling. */
  destroyAttachedResources(): void {
    for (const resource of Object.values(this._attachedResources)) {
      resource.destroy();
    }
    // don't remove while we are iterating
    this._attachedResources = new Set<Resource<ResourceProps>>();
  }

  // PROTECTED METHODS

  /** Perform all destroy steps. Can be called by derived resources when overriding destroy() */
  protected destroyResource(): void {
    this.destroyAttachedResources();
    this.removeStats();
    this.destroyed = true;
  }

  /** Called by .destroy() to track object destruction. Subclass must call if overriding destroy() */
  protected removeStats(): void {
    const stats = this._device.statsManager.getStats('Resource Counts');
    const name = this[Symbol.toStringTag];
    stats.get(`${name}s Active`).decrementCount();
  }

  /** Called by subclass to track memory allocations */
  protected trackAllocatedMemory(bytes: number, name = this[Symbol.toStringTag]): void {
    const stats = this._device.statsManager.getStats('Resource Counts');
    stats.get('GPU Memory').addCount(bytes);
    stats.get(`${name} Memory`).addCount(bytes);
    this.allocatedBytes = bytes;
  }

  /** Called by subclass to track memory deallocations */
  protected trackDeallocatedMemory(name = this[Symbol.toStringTag]): void {
    const stats = this._device.statsManager.getStats('Resource Counts');
    stats.get('GPU Memory').subtractCount(this.allocatedBytes);
    stats.get(`${name} Memory`).subtractCount(this.allocatedBytes);
    this.allocatedBytes = 0;
  }

  /** Called by resource constructor to track object creation */
  private addStats(): void {
    const stats = this._device.statsManager.getStats('Resource Counts');
    const name = this[Symbol.toStringTag];
    stats.get('Resources Created').incrementCount();
    stats.get(`${name}s Created`).incrementCount();
    stats.get(`${name}s Active`).incrementCount();
  }
}

/**
 * Combines a map of user props and default props, only including props from defaultProps
 * @param props
 * @param defaultProps
 * @returns returns a map of overridden default props
 */
function selectivelyMerge<Props>(props: Props, defaultProps: Required<Props>): Required<Props> {
  const mergedProps = {...defaultProps};
  for (const key in props) {
    if (props[key] !== undefined) {
      mergedProps[key] = props[key];
    }
  }
  return mergedProps;
}
