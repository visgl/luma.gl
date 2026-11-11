# Resource ownership

luma.gl resources have explicit lifetimes. An owner destroys its owned resources when it is
destroyed. A borrower can use a resource, but does not control its lifetime.

## Resource and DeviceResource

`Resource` is a device-independent base class for deterministic cleanup. It provides ownership,
transfer, and destruction without requiring a GPU device or allocating GPU resource statistics.

`DeviceResource` extends `Resource` with a device, native handle, properties, identifiers, and GPU
statistics. Buffers, textures, framebuffers, and the other device-created resources extend this
class. Ownership of these objects follows the same rules as ownership of a device-free resource.

Higher-level APIs such as `Model` have their existing lifetime contracts; they do not yet extend
this new base. An application can already use it to group device resources:

```typescript
import {Resource, Buffer} from '@luma.gl/core';

class ResourceScope extends Resource {}

const scope = new ResourceScope();
const positions = device.createBuffer({
  byteLength: 1024,
  usage: Buffer.VERTEX
}).transferOwnershipTo(scope);
const texture = device.createTexture({width: 256, height: 256})
  .transferOwnershipTo(scope);

// Use positions and texture while scope is alive.
scope.destroy(); // Destroys positions, texture, and their owned descendants.
```

## Owned and borrowed references

A resource has at most one owner. `resource.owner` is that owner, or `null` when the caller is
responsible for destruction. `owner.ownedResources` returns a read-only snapshot of direct children.
It is not a list of every resource the owner uses.

Passing an existing resource as a binding or attachment does not itself transfer ownership.
For example, a framebuffer borrows a texture passed through `colorAttachments`. A framebuffer
created with attachment format strings owns the textures it creates. A texture owns its default
view, while a separate view returned by `createView()` is caller-managed. Views reference their
texture; owning a view does not imply ownership of its texture.

Ordinary and external textures own samplers created from sampler properties. Replacing such a
sampler destroys the previous owned sampler; passing a sampler instance borrows it instead.

```typescript
const texture = device.createTexture({width: 256, height: 256});
const framebuffer = device.createFramebuffer({colorAttachments: [texture]});

framebuffer.destroy(); // texture remains alive
texture.destroy();
```

Borrowing is an ordinary JavaScript reference, not reference counting. Borrowers must stop using a
resource before its owner destroys it. Keeping a reference does not keep the underlying resource
alive. A shared cache can own a resource while many consumers borrow it.

## Transferring ownership

```typescript
texture.transferOwnershipTo(firstScope);
texture.transferOwnershipTo(secondScope); // Removes it from firstScope atomically.
texture.transferOwnershipTo(null); // Caller resumes responsibility; nothing is destroyed.
```

Transferring to the current owner is a no-op for live resources. Self-ownership and ownership cycles
are rejected. Transfers involving a destroyed resource, a destroying resource, or an owner tearing
down its children are rejected before changing ownership. Directly destroying a child automatically
removes it from its owner.

Transfer changes cleanup responsibility only. It does not copy data, move a resource to another
GPU device, rebind consumers, or extend native GPU submission lifetimes.

## Destruction and extension hooks

Call `destroy()` explicitly; garbage collection is not the ownership mechanism. Repeated and
reentrant calls are harmless. Destruction proceeds as follows:

1. Mark the resource as destroying and remove it from its owner.
2. Run `onBeforeDestroy()` to stop callbacks or other activity.
3. Recursively destroy owned children.
4. Run `onDestroy()` to release the resource's own state.
5. Mark the resource as destroyed.

Do not rely on sibling destruction order. Model cleanup dependencies through ownership or explicit
preparation. All children and the parent's cleanup are attempted even if a hook throws. The resource
is finalized and an `AggregateError` reports the failures; another `destroy()` call does not retry
failed cleanup.

### Cleanup cannot veto destruction

`onBeforeDestroy()` is a cleanup hook, not an admission check. Throwing from it does **not**
leave the resource alive: owned children and local state are still cleaned up, then an
`AggregateError` is thrown. Do not put an active-execution assertion in this hook.

For example, the independent graph-state API proposed in
[PR #3639](https://github.com/visgl/luma.gl/pull/3639) retains state while prepared executions
are active and rejects destruction until those executions release it. Moving that assertion
into `onBeforeDestroy()` would destroy storage that those executions still need.

Such APIs should keep their existing guarded lifecycle for now. Adoption requires a separate
destruction-admission or deferred-release design, including what happens when destruction
cascades from an owner. This ownership foundation does not supply either policy.

Extend `Resource` by overriding the protected hooks, not `destroy()`:

```typescript
class SubscriptionScope extends Resource {
  constructor(private unsubscribe: () => void) {
    super();
  }

  protected override onBeforeDestroy(): void {
    this.unsubscribe();
  }
}
```

Device backend subclasses override `destroyHandle()` for native cleanup instead of `onDestroy()`.
`DeviceResource` runs that hook after owned children are destroyed and balances memory and resource
statistics even if native cleanup throws. TypeScript cannot prevent overriding `destroy()`, so
subclasses must honor this extension contract.

## Native handles and asynchronous GPU work

Ownership of a luma.gl wrapper is separate from ownership of its native handle. An owner may destroy
a wrapper around an externally supplied handle without destroying that handle. Wrapper-owned
children and wrapper statistics are still cleaned up. Handle borrowing does not grant permission
to mutate an opaque externally owned handle.

Ownership also does not synchronize GPU execution. Existing encoding, submission, readback, and
completion rules still apply. Transfer responsibility to the appropriate lifetime owner, and only
destroy resources when their API's GPU lifetime requirements permit it.

## Migrating attachment APIs

`attachResource(child)` now transfers exclusive ownership to the receiver; it cannot register a
child under multiple owners. Prefer `child.transferOwnershipTo(owner)`.

`detachResource(child)` releases a child only if the receiver owns it. Prefer checking `child.owner`
and calling `child.transferOwnershipTo(null)`. `destroyAttachedResource(child)` similarly destroys
only a child owned by the receiver. `destroyAttachedResources()` destroys current children without
destroying the receiver. These attachment methods remain as deprecated compatibility helpers.

See the [Resource reference](/docs/api-reference/core/resources/resource),
[DeviceResource reference](/docs/api-reference/core/resources/device-resource), and
[upgrade guide](/docs/upgrade-guide).
