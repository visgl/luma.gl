// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {uid} from '../../utils/uid';

const RESOURCE_COUNTS_STATS = 'GPU Resource Counts';
const LEGACY_RESOURCE_COUNTS_STATS = 'Resource Counts';
const RESOURCE_MEMORY_STATS = 'Resource Memory';
const GPU_TIME_AND_MEMORY_STATS = 'GPU Time and Memory';

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
  /** The props that this resource was created with */
  readonly props: Required<Props>;
  /** User data object, reserved for the application */
  readonly userData: Record<string, unknown> = {};
  /** The device that this resource is associated with */
  abstract readonly device: Device;
  /** The handle for the underlying resource, e.g. WebGL object or WebGPU handle */
  abstract readonly handle: unknown;
  /** The device that this resource is associated with - TODO can we remove this dup? */
  private _device: Device;

  /** Whether this resource has been destroyed */
  destroyed: boolean = false;
  /** For resources that allocate GPU memory */
  private allocatedBytes: number = 0;
  /** Stats bucket currently holding the tracked allocation */
  private allocatedBytesName: string | null = null;
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
    const statsObjects = [
      this._device.statsManager.getStats(RESOURCE_COUNTS_STATS),
      this._device.statsManager.getStats(LEGACY_RESOURCE_COUNTS_STATS)
    ];
    const name = this[Symbol.toStringTag];
    for (const stats of statsObjects) {
      stats.get('Resources Active').decrementCount();
      stats.get(`${name}s Active`).decrementCount();
    }
  }

  /** Called by subclass to track memory allocations */
  protected trackAllocatedMemory(bytes: number, name = this[Symbol.toStringTag]): void {
    const statsObjects = [
      this._device.statsManager.getStats(RESOURCE_MEMORY_STATS),
      this._device.statsManager.getStats(GPU_TIME_AND_MEMORY_STATS)
    ];

    for (const stats of statsObjects) {
      if (this.allocatedBytes > 0 && this.allocatedBytesName) {
        stats.get('GPU Memory').subtractCount(this.allocatedBytes);
        stats.get(`${this.allocatedBytesName} Memory`).subtractCount(this.allocatedBytes);
      }
      stats.get('GPU Memory').addCount(bytes);
      stats.get(`${name} Memory`).addCount(bytes);
    }
    this.allocatedBytes = bytes;
    this.allocatedBytesName = name;
  }

  /** Called by subclass to track memory deallocations */
  protected trackDeallocatedMemory(name = this[Symbol.toStringTag]): void {
    if (this.allocatedBytes === 0) {
      this.allocatedBytesName = null;
      return;
    }

    const statsObjects = [
      this._device.statsManager.getStats(RESOURCE_MEMORY_STATS),
      this._device.statsManager.getStats(GPU_TIME_AND_MEMORY_STATS)
    ];
    for (const stats of statsObjects) {
      stats.get('GPU Memory').subtractCount(this.allocatedBytes);
      stats.get(`${this.allocatedBytesName || name} Memory`).subtractCount(this.allocatedBytes);
    }
    this.allocatedBytes = 0;
    this.allocatedBytesName = null;
  }

  /** Called by resource constructor to track object creation */
  private addStats(): void {
    const statsObjects = [
      this._device.statsManager.getStats(RESOURCE_COUNTS_STATS),
      this._device.statsManager.getStats(LEGACY_RESOURCE_COUNTS_STATS)
    ];
    const name = this[Symbol.toStringTag];
    for (const stats of statsObjects) {
      stats.get('Resources Created').incrementCount();
      stats.get('Resources Active').incrementCount();
      stats.get(`${name}s Created`).incrementCount();
      stats.get(`${name}s Active`).incrementCount();
    }
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
