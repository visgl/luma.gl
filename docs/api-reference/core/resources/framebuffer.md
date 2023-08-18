# Framebuffer

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

A `Framebuffer` holds textures that will be used as render targets for `RenderPipeline`s 
together with additional information on how the `RenderPipeline` should use the various attached textures:

- one or more color textures
- optionally a depth / stencil buffer
- `clearColor`, `clearDepth` and `clearStencil` etc fields on the various attachments.

The list of attachments cannot be changed after creation, however a Framebuffer can be "resized" causing the attachments to be resized.

Special `Framebuffer`s can be obtained from `CanvasContext`s that enabled rendering directly into HTML canvases (i.e. onto the screen). 

The use of framebuffers is described in detail in the [Rendering Guide](/docs/api-guide/rendering)/

## Usage

Creating a framebuffer and have it auto-create color and depth attachments

```typescript
const framebuffer = device.createFramebuffer({
  width: window.innerWidth,
  height: window.innerHeight,
  colorAttachments: [{format: 'rgb8unorm'}],
  depthStencilAttachment: {format: 'depth24unorm-stencil8'}
});
```

Creating a framebuffer with supplied color and depth attachments

```typescript
const size = {
  width: window.innerWidth,
  height: window.innerHeight
};
const framebuffer = device.createFramebuffer({
  ...size,
  colorAttachments: [device.createTexture({format: 'rgb8unorm', ...size})],
  depthStencilAttachment: device.createTexture({format: 'depth24unorm-stencil8', ...size})
});
```

Resizing a framebuffer to the size of the browser's window by resizing all attachments.

```typescript
framebuffer.resize(window.innerWidth, window.innerHeight);
```

To render into a canvas make sure you have a `CanvasContext` for that HTML or offscreen canvas.
You can the obtain a `Framebuffer` object from the `CanvasContext` using `canvasContext.getDefaultFramebuffer()`. 

For the 

```typescript
const canvasFramebuffer = canvasContext.getDefaultFramebuffer();
const canvasRenderPass = device.beginRenderPass({framebuffer: canvasFramebuffer});
model2.draw({renderPass: screenRenderPass, ...});
```

Alternatively can create texture based framebuffers for off-screen rendering.
Specifying a separate offscreen framebuffer for rendering:

```typescript
const offScreenFramebuffer = device.createFramebuffer(...);

const offScreenRenderPass = device.beginRenderPass({framebuffer: offScreenFramebuffer});
model1.draw({renderPass: offScreenRenderPass, ...});
offScreenRenderPass.endPass();

// Textures attached offscreenFramebuffer now contain the results of the first renderpass, 
// and those textures can be used as input for a second to-screen render pass

const screenRenderPass = device.getDefaultRenderPass();
model2.draw({renderPass: screenRenderPass, ...});
```

## Types

### `FramebufferProps`

| Property                  | Type                                | Description                          |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| `id?`                     | `string`                            | An optional name (id) of the buffer. |
| `width? = 1`              | `number`                            | The width of the framebuffer.        |
| `height? = 1`             | `number`                            | The height of the framebuffer.       |
| `colorAttachments`        | `ColorAttachment\|Texture[]`        | Array of render target textures.     |
| `depthStencilAttachment?` | `DepthStencilAttachment\|Texture[]` | Depth/stencil texture.               |

### `ColorAttachment`

Framebuffer attachments lets the user specify the textures that will be used for a RenderPass, 
together with some additional options for how to clear color textures.

| Property    | Type                   | Description                                                                                                    |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `texture`     | `Texture`              | Describes the texture subresource that will be output to for this color attachment.                            |
| `clearValue`? | `number[]`             | Value to clear to prior to executing the render pass. Default: [0, 0, 0, 0]. Ignored if loadOp is not "clear". |
| `loadOp`?     | `'load'`, `'clear'`    | Load operation to perform on texture prior to executing the render pass. Default: 'clear'.                     |
| `storeOp`?    | `'store'`, `'discard'` | The store operation to perform on texture after executing the render pass. Default: 'store'.                   |

- Clearing can be disabled by setting `loadOp='load'` however this may have a small performance cost as GPUs are optimized for clearing.
- WebGL does not support setting `storeOp: 'discard'` for just some attachments, it is all or nothing.

### `DepthStencilAttachment`

 Framebuffer attachments lets the user specify the depth stencil texture that will be used for a RenderPass, 
 together with some additional options for how to clear depth and stencil buffers.
 
 | Property             | Type                   | Description                                                                                                    |
 | -------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
 | `texture`            | `Texture`              | Describes the texture subresource that will be output to and read from for this depth/stencil attachment.      |
 | `depthClearValue`?   | `number`               | Value to clear depth component to prior to executing the render pass, if depthLoadOp is "clear". 0.0-1.0.      |
 | `depthLoadOp`?       | `'load'`, `'clear'`    | Load operation to perform on depth component prior to executing the render pass. Default 'clear'.    |
 | `depthStoreOp`?      | `'store'`, `'discard'` | Store operation` to perform on depth component after executing the render pass. Default 'store'.               |
 | `depthReadOnly`?     | `boolean`              | Depth component is read only.                                                               |
 | `stencilClearValue`? | `number `              | Value to clear stencil component to prior to executing the render pass, if stencilLoadOp is "clear". |
 | `stencilLoadOp`?     | `'clear'`, `'load'`    | Load operation to perform on stencil component prior to executing the render pass. Prefer clearing. |
 | `stencilStoreOp`?    | `'store'`, `'discard'` | Store operation to perform on stencil component after executing the render pass.                               |
 | `stencilReadOnly`?   | `boolean`              | Stencil component is read only.                                                             |

- Clearing can be disabled by setting `loadOp='load'` however this may have a small performance cost as GPUs are optimized for clearing.
- WebGL does not support setting `storeOp: 'discard'` for just some attachments, it is all or nothing.

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `Framebuffer`.
- `handle`: `unknown` - WebGL: holds the underlying `WebGLFramebuffer`. No underlying object on WebGPU.
- `props`: `FramebufferProps` - holds a copy of the `FramebufferProps` used to create this `Buffer`.

## Methods

### constructor

Create with `device.createFramebuffer(...)`. (`Framebuffer` is an abstract class and cannot be instantiated directly with `new Framebuffer()`.)

An application can render into an (HTML or offscreen) canvas by obtaining a
`Framebuffer` object from a `CanvasContext` using `canvasContext.getDefaultFramebuffer()`. Alternatively can create texture based framebuffers for off-screen rendering.

### destroy(): void

Free up any GPU resources associated with this buffer immediately (instead of waiting for garbage collection).

TBD - When destroying `Framebuffer` will also destroy any `Texture` that was created automatically during Framebuffer creation. Supplied textures will not be destroyed (but will eventually be garbage collected and destroyed).

### resize(width: number, height: number): void

`Framebuffer.resize(width, height)`

Resizes all the `Framebuffer`'s current attachments to the new `width` and `height` by calling `resize` on those attachments.

- `width` - the new width of `Framebuffer` in pixels
- `height` - the new height of `Framebuffer` in pixels

Returns itself to enable chaining

Note the `framebuffer.resize()` method has been designed so that it can be called every frame without performance concerns. While the actual resizing of attachments can be expensive, the `resize()` methods checks if `width` or `height` have changed before actually resizing any attachments.

## Remarks

- WebGPU: `resize()` will destroy and recreate textures (meaning the the underlying `GPUTexture` / `GPUTextureView` handles are no longer the same after a `resize()`
- WebGL: `resize()` will erase the current content of any attachments, but not actually create them (The underlying`WebGLTexture` / `WebGLRenderbuffer` handles are not changed).
- WebGPU: The `Framebuffer` class is a pure luma.gl class as this concept does not exist natively in WebGPU (attachment information has to be provided through the `GPURenderPassDescriptor` `colorAttachments` and the `depthStencilAttachment` fields every frame when a render pass is created).`.
- WebGL: The `Framebuffer` class wraps the `WebGLFramebuffer` object exists, see e.g. [Framebuffer](https://www.khronos.org/opengl/wiki/Framebuffer)
  and [Framebuffer Object](https://www.khronos.org/opengl/wiki/Framebuffer_Object) in the OpenGL Wiki.
