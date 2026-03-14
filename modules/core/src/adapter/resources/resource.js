// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { uid } from '../../utils/uid';
/**
 * Base class for GPU (WebGPU/WebGL) Resources
 */
export class Resource {
    /** Default properties for resource */
    static defaultProps = {
        id: 'undefined',
        handle: undefined,
        userData: undefined
    };
    toString() {
        return `${this[Symbol.toStringTag] || this.constructor.name}:"${this.id}"`;
    }
    /** props.id, for debugging. */
    id;
    /** The props that this resource was created with */
    props;
    /** User data object, reserved for the application */
    userData = {};
    /** The device that this resource is associated with - TODO can we remove this dup? */
    _device;
    /** Whether this resource has been destroyed */
    destroyed = false;
    /** For resources that allocate GPU memory */
    allocatedBytes = 0;
    /** Attached resources will be destroyed when this resource is destroyed. Tracks auto-created "sub" resources. */
    _attachedResources = new Set();
    /**
     * Create a new Resource. Called from Subclass
     */
    constructor(device, props, defaultProps) {
        if (!device) {
            throw new Error('no device');
        }
        this._device = device;
        this.props = selectivelyMerge(props, defaultProps);
        const id = this.props.id !== 'undefined' ? this.props.id : uid(this[Symbol.toStringTag]);
        this.props.id = id;
        this.id = id;
        this.userData = this.props.userData || {};
        this.addStats();
    }
    /**
     * destroy can be called on any resource to release it before it is garbage collected.
     */
    destroy() {
        this.destroyResource();
    }
    /** @deprecated Use destroy() */
    delete() {
        this.destroy();
        return this;
    }
    /**
     * Combines a map of user props and default props, only including props from defaultProps
     * @returns returns a map of overridden default props
     */
    getProps() {
        return this.props;
    }
    // ATTACHED RESOURCES
    /**
     * Attaches a resource. Attached resources are auto destroyed when this resource is destroyed
     * Called automatically when sub resources are auto created but can be called by application
     */
    attachResource(resource) {
        this._attachedResources.add(resource);
    }
    /**
     * Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.
     */
    detachResource(resource) {
        this._attachedResources.delete(resource);
    }
    /**
     * Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.
     */
    destroyAttachedResource(resource) {
        if (this._attachedResources.delete(resource)) {
            resource.destroy();
        }
    }
    /** Destroy all owned resources. Make sure the resources are no longer needed before calling. */
    destroyAttachedResources() {
        for (const resource of Object.values(this._attachedResources)) {
            resource.destroy();
        }
        // don't remove while we are iterating
        this._attachedResources = new Set();
    }
    // PROTECTED METHODS
    /** Perform all destroy steps. Can be called by derived resources when overriding destroy() */
    destroyResource() {
        this.destroyAttachedResources();
        this.removeStats();
        this.destroyed = true;
    }
    /** Called by .destroy() to track object destruction. Subclass must call if overriding destroy() */
    removeStats() {
        const stats = this._device.statsManager.getStats('Resource Counts');
        const name = this[Symbol.toStringTag];
        stats.get(`${name}s Active`).decrementCount();
    }
    /** Called by subclass to track memory allocations */
    trackAllocatedMemory(bytes, name = this[Symbol.toStringTag]) {
        const stats = this._device.statsManager.getStats('Resource Counts');
        stats.get('GPU Memory').addCount(bytes);
        stats.get(`${name} Memory`).addCount(bytes);
        this.allocatedBytes = bytes;
    }
    /** Called by subclass to track memory deallocations */
    trackDeallocatedMemory(name = this[Symbol.toStringTag]) {
        const stats = this._device.statsManager.getStats('Resource Counts');
        stats.get('GPU Memory').subtractCount(this.allocatedBytes);
        stats.get(`${name} Memory`).subtractCount(this.allocatedBytes);
        this.allocatedBytes = 0;
    }
    /** Called by resource constructor to track object creation */
    addStats() {
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
function selectivelyMerge(props, defaultProps) {
    const mergedProps = { ...defaultProps };
    for (const key in props) {
        if (props[key] !== undefined) {
            mergedProps[key] = props[key];
        }
    }
    return mergedProps;
}
