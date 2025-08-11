# Fence

A synchronization primitive that resolves when submitted GPU work is completed.

## Members

- `signaled`: `Promise<void>` - resolves when the fence is signaled.

## Methods

### `isSignaled(): boolean`

Checks if the fence has already been signaled.

### `destroy(): void`

Destroys the fence and releases any associated resources.
