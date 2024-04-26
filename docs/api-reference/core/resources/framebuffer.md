# Framebuffer

A `Framebuffer` holds textures that will be used as render targets for `RenderPipeline`s 
together with additional information on how the `RenderPipeline` should use the various attached textures:

- one or more color textures
- optionally a depth / stencil buffer
- `clearColor`, `clearDepth` and `clearStencil` etc fields on the various attachments.

The list of attachments cannot be changed after creation, however a Framebuffer can be "resized" causing the attachments to be resized.

Special `Framebuffer`s can be obtained from `CanvasContext`s that enabled rendering directly into HTML canvases (i.e. onto the screen). 

The use of framebuffers is described in detail in the [Rendering Guide](/docs/api-guide/gpu/gpu-rendering).

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

const screenRenderPass = device.beginRenderPass();
model2.draw({renderPass: screenRenderPass, ...});
```

## Overview

### Framebuffer Attachment Values

The following values can be provided for each attachment point

- `Texture` - attaches at mipmapLevel 0 (the the supplied `Texture`'s default `TextureView`.
- `TextureView`
   - `2d`: attaches the specified mipmapLevel from the supplied `Texture`, or cubemap face. The second element in the array must be `0`.
   - `cube`: face (depth), mipmapLevel=0 - attaches the specifed cubemap face from the `Texture`, at the specified mipmap level.
   - `2d-array`, layer (number), mipmapLevel=0 (number)] - attaches the specifed layer from the `Texture`, at the specified mipmap level.
   - `3d`, layer (number), mipmapLevel=0 (number)] - attaches the specifed layer from the `Texture3D`, at the specified mipmap level.
  
## Framebuffer Attachments

A `Framebuffer` holds:

- an array of "color attachments" (often just one) that store data (one or more color `Texture`s)
- an optional depth, stencil or combined depth-stencil `Texture`).

All attachments must be in the form of `Texture`s.

## Resizing Framebuffers

Resizing a framebuffer effectively destroys all current textures and creates new 
textures with otherwise similar properties. All data stored in the previous textures are lost.
This data loss is usually a non-issue as resizes are usually performed between render passes,
(typically to match the size of an off screen render buffer with the new size of the output canvas).


## Types

### `FramebufferProps`

| Property                  | Type                                | Description                          |
| ------------------------- | ----------------------------------- | ------------------------------------ |
| `id?`                     | `string`                            | An optional name (id) of the buffer. |
| `width? = 1`              | `number`                            | The width of the framebuffer.        |
| `height? = 1`             | `number`                            | The height of the framebuffer.       |
| `colorAttachments`        | `ColorAttachment\|Texture[]`        | Array of render target textures.     |
| `depthStencilAttachment?` | `DepthStencilAttachment\|Texture[]` | Depth/stencil texture.               |

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `Framebuffer`.
- `handle`: `unknown` - WebGL: holds the underlying `WebGLFramebuffer`. No underlying object on WebGPU.
- `props`: `FramebufferProps` - holds a copy of the `FramebufferProps` used to create this `Buffer`.

### `colorAttachments`

```ts
colorAttachments: TextureView)[]
```

Framebuffer attachments lets the user specify the textures that will be used for a RenderPass, 
together with some additional options for how to clear color textures.


### `DepthStencilAttachment`

```ts
depthStencilAttachments: TextureView[]
```

 Framebuffer attachments lets the user specify the depth stencil texture that will be used for a RenderPass, 
 together with some additional options for how to clear depth and stencil buffers.
 
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

Note the `framebuffer.resize()` method has been designed so that it can be called every frame without performance concerns. While the actual resizing of attachments can be expensive, the `resize()` methods checks if `width` or `height` have changed before actually resizing any attachments.

## Remarks

**WebGPU**
- The `Framebuffer` class is a pure luma.gl class as this concept does not exist natively in WebGPU (attachment information has to be provided through the `GPURenderPassDescriptor` `colorAttachments` and the `depthStencilAttachment` fields every frame when a render pass is created).`.
- `resize()` will destroy and recreate textures (meaning the the underlying `GPUTexture` / `GPUTextureView` handles are no longer the same after a `resize()`

**WebGL**
- The `Framebuffer` class wraps the `WebGLFramebuffer` object, see e.g. [Framebuffer](https://www.khronos.org/opengl/wiki/Framebuffer)
  and [Framebuffer Object](https://www.khronos.org/opengl/wiki/Framebuffer_Object) in the OpenGL Wiki.
- `resize()` will erase the current content of any attachments, but not actually recreate them (The underlying`WebGLTexture` handles are not changed).
