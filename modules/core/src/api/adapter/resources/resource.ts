// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '../../utils/assert';

/** A device-independent lifetime with exclusive ownership and deterministic cleanup. */
export abstract class Resource {
  private _owner: Resource | null = null;
  private readonly _ownedResources = new Set<Resource>();
  private _state: 'live' | 'destroying' | 'destroyed' = 'live';
  private _destroyingOwnedResources = false;

  /** The resource responsible for destroying this resource, or null for caller-managed lifetime. */
  get owner(): Resource | null {
    return this._owner;
  }

  /** A snapshot of this resource's children. Mutating the snapshot cannot change ownership. */
  get ownedResources(): readonly Resource[] {
    return Array.from(this._ownedResources);
  }

  /** Whether destruction has completed, including when cleanup reported an error. */
  get destroyed(): boolean {
    return this._state === 'destroyed';
  }

  /** Transfer exclusive ownership, or return lifetime responsibility to the caller with null. */
  transferOwnershipTo(owner: Resource | null): this {
    // Neither endpoint, nor the previous owner, may be tearing down its ownership tree.
    assert(this._state === 'live' && !this._destroyingOwnedResources);
    assert(!this._owner || this._owner.canChangeOwnership());
    assert(!owner || owner.canChangeOwnership());
    for (let ancestor = owner; ancestor; ancestor = ancestor._owner) {
      // Ownership must remain acyclic, including rejecting self-ownership.
      assert(ancestor !== this);
    }
    if (owner !== this._owner) {
      this._owner?._ownedResources.delete(this);
      this._owner = owner;
      owner?._ownedResources.add(this);
    }
    return this;
  }

  /** Destroy children before this resource. Subclasses implement hooks instead of overriding. */
  destroy(): void {
    if (this._state !== 'live') {
      return;
    }
    this._state = 'destroying';
    this._owner?._ownedResources.delete(this);
    this._owner = null;
    const errors: unknown[] = [];
    try {
      try {
        this.onBeforeDestroy();
      } catch (error) {
        errors.push(error);
      }
      this.destroyChildren(errors);
      try {
        this.onDestroy();
      } catch (error) {
        errors.push(error);
      }
    } finally {
      this._state = 'destroyed';
    }
    if (errors.length) {
      throw new AggregateError(errors, 'Resource cleanup failed');
    }
  }

  /** @deprecated Use destroy(). */
  delete(): this {
    this.destroy();
    return this;
  }

  /** @deprecated Use resource.transferOwnershipTo(this). */
  attachResource(resource: Resource): void {
    resource.transferOwnershipTo(this);
  }

  /** @deprecated Use resource.transferOwnershipTo(null). Only detaches a child owned by this. */
  detachResource(resource: Resource): void {
    if (resource._owner === this) {
      resource.transferOwnershipTo(null);
    }
  }

  /** @deprecated Check resource.owner and call resource.destroy(). */
  destroyAttachedResource(resource: Resource): void {
    if (resource._owner === this) {
      resource.destroy();
    }
  }

  /** @deprecated Destroy individually owned resources, or destroy the owner. */
  destroyAttachedResources(): void {
    if (this._state !== 'live' || this._destroyingOwnedResources) {
      return;
    }
    const errors: unknown[] = [];
    this.destroyChildren(errors);
    if (errors.length) {
      throw new AggregateError(errors, 'Resource cleanup failed');
    }
  }

  /** Stop callbacks or other activity before destroying owned children. */
  protected onBeforeDestroy(): void {}

  /** Release this resource's own state after its children have been destroyed. */
  protected onDestroy(): void {}

  private canChangeOwnership(): boolean {
    return this._state === 'live' && !this._destroyingOwnedResources;
  }

  private destroyChildren(errors: unknown[]): void {
    this._destroyingOwnedResources = true;
    try {
      // Children unregister themselves, and a hook may destroy a sibling early.
      for (const resource of this._ownedResources) {
        try {
          resource.destroy();
        } catch (error) {
          errors.push(error);
        }
      }
    } finally {
      this._ownedResources.clear();
      this._destroyingOwnedResources = false;
    }
  }
}
