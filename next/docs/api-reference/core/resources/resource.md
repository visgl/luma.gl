# Resource

[Resource](https://luma.gl/next/docs/api-reference/core/resources/resource.md)[DeviceResource](https://luma.gl/next/docs/api-reference/core/resources/device-resource.md)[Buffer](https://luma.gl/next/docs/api-reference/core/resources/buffer.md)[CommandBuffer](https://luma.gl/next/docs/api-reference/core/resources/command-buffer.md)[QuerySet](https://luma.gl/next/docs/api-reference/core/resources/query-set.md)[Fence](https://luma.gl/next/docs/api-reference/core/resources/fence.md)[PipelineLayout](https://luma.gl/next/docs/api-reference/core/resources/pipeline-layout.md)

`Resource` is the abstract device-independent base for explicit ownership and deterministic cleanup. It has no constructor arguments, device, handle, or GPU statistics. Extend it directly for application resource scopes, or extend [DeviceResource](https://luma.gl/next/docs/api-reference/core/resources/device-resource.md) for device-backed resources.

## Members[​](#members "Direct link to Members")

* `owner: Resource | null` — Read-only owner, or `null` for caller-managed lifetime.
* `ownedResources: readonly Resource[]` — A detached snapshot of direct owned children.
* `destroyed: boolean` — Read-only; true once destruction finishes, including after cleanup errors.

## Methods[​](#methods "Direct link to Methods")

### `transferOwnershipTo(owner: Resource | null): this`[​](#transferownershiptoowner-resource--null-this "Direct link to transferownershiptoowner-resource--null-this")

Transfers exclusive ownership without destroying the resource. Removes it from the old owner and registers it with the new owner. Use `null` to release ownership to the caller. Rejects self-ownership, cycles, and changes involving destruction. Validation precedes mutation. Transferring to the same live owner is a no-op.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Detaches from the owner, runs preparation, destroys owned descendants, and releases local state. Repeated and reentrant calls do nothing. Cleanup continues after failures and throws an `AggregateError` after finalization. Failed cleanup is not retried.

### Protected extension hooks[​](#protected-extension-hooks "Direct link to Protected extension hooks")

* `onBeforeDestroy(): void` — Stop activity before children are destroyed.
* `onDestroy(): void` — Release local state after children are destroyed.

Override hooks instead of `destroy()`. DeviceResource backend subclasses use `destroyHandle()`. Neither hook can veto destruction: an error is collected while remaining cleanup continues. APIs that reject destruction while work is active must retain their guarded lifecycle until an admission or deferred-release policy is designed; see the [ownership guide](https://luma.gl/next/docs/api-guide/gpu/resource-ownership.md#cleanup-cannot-veto-destruction).

### Deprecated compatibility methods[​](#deprecated-compatibility-methods "Direct link to Deprecated compatibility methods")

* `delete(): this` — Calls `destroy()`.
* `attachResource(child)` — Transfers the child to this owner.
* `detachResource(child)` — Releases the child only if this resource owns it.
* `destroyAttachedResource(child)` — Destroys the child only if this resource owns it.
* `destroyAttachedResources()` — Destroys current children, keeping this owner alive.

See [Resource ownership](https://luma.gl/next/docs/api-guide/gpu/resource-ownership.md) for examples, borrowing, cleanup failures, native handle ownership, and GPU lifetime boundaries.
