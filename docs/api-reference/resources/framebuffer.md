# Framebuffer

> Proposed luma.gl v9 API. Open for comments.

A `Framebuffer` holds textures that will be used as render targets for `RenderPipeline`s:
- one or more color textures
- optionally a depth / stencil buffer

A `Framebuffer` is "shallowly immutable": the list of attachments cannot be changed after creation,
however a Framebuffer can be "resized" causing the attachments to be resized.

The use of framebuffers is described in detail in the [Rendering Guide](../../api-guide/rendering)/

## Usage

Creating a framebuffer with default color and depth attachments

```typescript
const framebuffer = device.createFramebuffer({
  width: window.innerWidth,
  height: window.innerHeight,
  colorAttachments: ['rgb8unorm'],
  depthStencilAttachment: 'depth24unorm-stencil8'
});
```

Resizing a framebuffer to the size of a window by resizing all attachments.

```typescript
framebuffer.resize(window.innerWidth, window.innerHeight);
```

Specifying a framebuffer for rendering in each render calls

```typescript
const offScreenBuffer = device.createFramebuffer(...);

const offScreenRenderPass = device.beginRenderPass({framebuffer: offScreenFramebuffer});
model1.draw({renderPass: offScreenRenderPass});
offScreenRenderPass.endPass();

const screenRenderPass = device.getDefaultRenderPass();
model2.draw({renderPass: screenRenderPass});
```

## Types

### `FramebufferProps`

| Property                  | Type                       | Description                          |
| ------------------------- | -------------------------- | ------------------------------------ |
| `id?`                     | `string`                   | An optional name (id) of the buffer. |
| `width? = 1`              | `number`                   | The width of the framebuffer.        |
| `height? = 1`             | `number`                   | The height of the framebuffer.       |
| `colorAttachments`        | `TextureFormat\|Texture[]` | Array of render target textures.     |
| `depthStencilAttachment?` | `TextureFormat\|Texture[]` | Depth/stencil texture.               |

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `Framebuffer`.
- `handle`: `unknown` - WebGL: holds the underlying `WebGLFramebuffer`. No underlying object on WebGPU.
- `props`: `BufferProps` - holds a copy of the `BufferProps` used to create this `Buffer`.

## Methods

### constructor

`Framebuffer` is an abstract class and cannot be instantiated directly. Create with `device.createFramebuffer(props: FramebufferProps)`.

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
