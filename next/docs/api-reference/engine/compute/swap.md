# Swap

[GPU Computations](https://luma.gl/next/docs/api-guide/engine/transforms.md)[Computation](https://luma.gl/next/docs/api-reference/engine/compute/computation.md)[BufferTransform](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md)[TextureTransform](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md)[Swap](https://luma.gl/next/docs/api-reference/engine/compute/swap.md)

`Swap` is a small double-buffering helper for pairs of GPU resources. It is used by higher-level engine utilities such as [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/engine/passes/shader-pass-renderer.md) and is also exported directly for application code.

## Usage[​](#usage "Direct link to Usage")

```
import {SwapBuffers} from '@luma.gl/engine';

const swapBuffers = new SwapBuffers(device, {byteLength: 1024});
swapBuffers.swap();
```

## Classes[​](#classes "Direct link to Classes")

### `Swap<T extends Resource>`[​](#swapt-extends-resource "Direct link to swapt-extends-resource")

Generic double-buffer helper for two structurally compatible resources.

#### Properties[​](#properties "Direct link to Properties")

* `id`
* `current`
* `next`

#### Methods[​](#methods "Direct link to Methods")

* `constructor({current, next, id?})`
* `destroy()`
* `swap()`

### `SwapFramebuffers`[​](#swapframebuffers "Direct link to swapframebuffers")

Specialized `Swap` that creates and manages two framebuffers with matching attachments.

#### Methods[​](#methods-1 "Direct link to Methods")

* `constructor(device: Device, props: FramebufferProps)`
* `resize(size: {width: number; height: number}): boolean`

### `SwapBuffers`[​](#swapbuffers "Direct link to swapbuffers")

Specialized `Swap` that creates and manages two buffers with matching props.

#### Methods[​](#methods-2 "Direct link to Methods")

* `constructor(device: Device, props: BufferProps)`
* `resize(props: {byteLength: number}): boolean`

## Remarks[​](#remarks "Direct link to Remarks")

* `Swap.swap()` simply exchanges `current` and `next`; it does not copy data.
* The specialized subclasses destroy the old resources when resizing.
