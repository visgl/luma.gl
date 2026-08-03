// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {uid} from '../../utils/uid';

export type ResourceProps = {
  /** Name of resource, mainly for debugging purposes. A unique name will be assigned if not provided */
  id?: string;
  /** Handle for the underlying resources (WebGL object or WebGPU handle) */
  handle?: unknown;
  /**
   * @internal Opaque externally owned handle. luma.gl may reference this handle but must not
   * initialize, mutate, or destroy it.
   */
  _isHandleBorrowed?: boolean;
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
    _isHandleBorrowed: false,
    userData: undefined!
  };

  abstract get [Symbol.toStringTag](): string;

  toString(): string {
    return `${this[Symbol.toStringTag] || this.constructor.name}:"${this.id}"`;
  }

  /** Compact serialization for assertion diffs and structured debug logs. */
  toJSON(): string {
    return this.toString();
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

  /** Whether luma.gl created and owns the underlying resource handle. */
  get ownsHandle(): boolean {
    return (
      (this.props.handle === undefined || this.props.handle === null) && !this.isHandleBorrowed
    );
  }

  /** Whether luma.gl may only reference the opaque externally owned resource handle. */
  get isHandleBorrowed(): boolean {
    return Boolean(this.props._isHandleBorrowed);
  }

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
    if (this.destroyed) {
      return;
    }
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
    for (const resource of this._attachedResources) {
      resource.destroy();
    }
    // don't remove while we are iterating
    this._attachedResources = new Set<Resource<ResourceProps>>();
  }

  // PROTECTED METHODS

  /** Perform all destroy steps. Can be called by derived resources when overriding destroy() */
  protected destroyResource(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyAttachedResources();
    this.removeStats();
    this.destroyed = true;
  }

  /** Called by .destroy() to track object destruction. Subclass must call if overriding destroy() */
  protected removeStats(): void {
    this._device.resourceInstrumentation?.recordResourceDestroyed(
      this._device,
      this,
      this.getStatsName()
    );
  }

  /** Called by subclass to track memory allocations */
  protected trackAllocatedMemory(bytes: number, name = this.getStatsName()): void {
    this._device.resourceInstrumentation?.recordResourceAllocation(
      this._device,
      this,
      bytes,
      name,
      this.allocatedBytes,
      this.allocatedBytesName
    );
    this.allocatedBytes = bytes;
    this.allocatedBytesName = name;
  }

  /** Called by subclass to track handle-backed memory allocations separately from owned allocations */
  protected trackReferencedMemory(bytes: number, name = this.getStatsName()): void {
    this.trackAllocatedMemory(bytes, `External ${name}`);
  }

  /** Called by subclass to track memory deallocations */
  protected trackDeallocatedMemory(name = this.getStatsName()): void {
    if (this.allocatedBytes === 0) {
      this.allocatedBytesName = null;
      return;
    }

    this._device.resourceInstrumentation?.recordResourceDeallocation(
      this._device,
      this,
      this.allocatedBytes,
      this.allocatedBytesName || name
    );
    this.allocatedBytes = 0;
    this.allocatedBytesName = null;
  }

  /** Called by subclass to deallocate handle-backed memory tracked via trackReferencedMemory() */
  protected trackDeallocatedReferencedMemory(name = this.getStatsName()): void {
    this.trackDeallocatedMemory(`Referenced ${name}`);
  }

  /** Called by resource constructor to track object creation */
  private addStats(): void {
    this._device.resourceInstrumentation?.recordResourceCreated(
      this._device,
      this,
      this.getStatsName()
    );
  }

  /** Canonical resource name used for stats buckets. */
  protected getStatsName(): string {
    return getCanonicalResourceName(this);
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

function getCanonicalResourceName(resource: Resource<any>): string {
  let prototype = Object.getPrototypeOf(resource);

  while (prototype) {
    const parentPrototype = Object.getPrototypeOf(prototype);
    if (!parentPrototype || parentPrototype === Resource.prototype) {
      return (
        getPrototypeToStringTag(prototype) ||
        resource[Symbol.toStringTag] ||
        resource.constructor.name
      );
    }
    prototype = parentPrototype;
  }

  return resource[Symbol.toStringTag] || resource.constructor.name;
}

function getPrototypeToStringTag(prototype: object): string | null {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, Symbol.toStringTag);
  if (typeof descriptor?.get === 'function') {
    return descriptor.get.call(prototype);
  }
  if (typeof descriptor?.value === 'string') {
    return descriptor.value;
  }
  return null;
}
