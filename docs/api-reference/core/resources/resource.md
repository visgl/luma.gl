import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';

# Resource

<CoreDocsTabs group="resources" active="resource" />

`Resource` is the abstract device-independent base for explicit ownership and deterministic
cleanup. It has no constructor arguments, device, handle, or GPU statistics. Extend it directly
for application resource scopes, or extend [DeviceResource](/docs/api-reference/core/resources/device-resource)
for device-backed resources.

## Members

- `owner: Resource | null` — Read-only owner, or `null` for caller-managed lifetime.
- `ownedResources: readonly Resource[]` — A detached snapshot of direct owned children.
- `destroyed: boolean` — Read-only; true once destruction finishes, including after cleanup errors.

## Methods

### `transferOwnershipTo(owner: Resource | null): this`

Transfers exclusive ownership without destroying the resource. Removes it from the old owner
and registers it with the new owner. Use `null` to release ownership to the caller.
Rejects self-ownership, cycles, and changes involving destruction. Validation precedes mutation.
Transferring to the same live owner is a no-op.

### `destroy(): void`

Detaches from the owner, runs preparation, destroys owned descendants, and releases local state.
Repeated and reentrant calls do nothing. Cleanup continues after failures and throws an
`AggregateError` after finalization. Failed cleanup is not retried.

### Protected extension hooks

- `onBeforeDestroy(): void` — Stop activity before children are destroyed.
- `onDestroy(): void` — Release local state after children are destroyed.

Override hooks instead of `destroy()`. DeviceResource backend subclasses use `destroyHandle()`.

### Deprecated compatibility methods

- `delete(): this` — Calls `destroy()`.
- `attachResource(child)` — Transfers the child to this owner.
- `detachResource(child)` — Releases the child only if this resource owns it.
- `destroyAttachedResource(child)` — Destroys the child only if this resource owns it.
- `destroyAttachedResources()` — Destroys current children, keeping this owner alive.

See [Resource ownership](/docs/api-guide/gpu/resource-ownership) for examples, borrowing,
cleanup failures, native handle ownership, and GPU lifetime boundaries.
