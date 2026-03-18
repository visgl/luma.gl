# Swap

`Swap` is a small double-buffering helper for pairs of GPU resources.
It is used by higher-level engine utilities such as [`ShaderPassRenderer`](/docs/api-reference/engine/passes/shader-pass-renderer) and is also exported directly for application code.

## Usage

```typescript
import {SwapBuffers} from '@luma.gl/engine';

const swapBuffers = new SwapBuffers(device, {byteLength: 1024});
swapBuffers.swap();
```

## Classes

### `Swap<T extends Resource>`

Generic double-buffer helper for two structurally compatible resources.

#### Properties

- `id`
- `current`
- `next`

#### Methods

- `constructor({current, next, id?})`
- `destroy()`
- `swap()`

### `SwapFramebuffers`

Specialized `Swap` that creates and manages two framebuffers with matching attachments.

#### Methods

- `constructor(device: Device, props: FramebufferProps)`
- `resize(size: {width: number; height: number}): boolean`

### `SwapBuffers`

Specialized `Swap` that creates and manages two buffers with matching props.

#### Methods

- `constructor(device: Device, props: BufferProps)`
- `resize(props: {byteLength: number}): boolean`

## Remarks

- `Swap.swap()` simply exchanges `current` and `next`; it does not copy data.
- The specialized subclasses destroy the old resources when resizing.
