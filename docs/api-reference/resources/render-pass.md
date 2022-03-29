# RenderPass

> The luma.gl v9 API is currently in [public review](/docs/public-review).

A configuration for rendering.

## Types

### `BufferProps`

| Property      | Type                             | Description                                                                  |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `framebuffer?` | `Framebuffer`                   | Provides render target textures and depth/stencil texture                                                      |
| `parameters?`  | `Parameters`                    | GPU pipeline parameters                         |


## Members

- `device`: `Device` - holds a reference to the `Device` that created this `RenderPass`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `RenderPassProps` - holds a copy of the `RenderPassProps` used to create this `RenderPass`.

## Methods

### `constructor(props: RenderPassProps)`

`RenderPass` is an abstract class and cannot be instantiated directly. Create with `device.beginRenderPass(...)`.

### `endPass(): void`

Free up any GPU resources associated with this render pass.

### `pushDebugGroup(groupLabel: string): void`

Adds a debug group (implementation dependent).

### `popDebugGroup(): void`

Removes a debug group (implementation dependent).

### `insertDebugMarker(markerLabel: string): void`

Adds a debug marker (implementation dependent).
