# Framebuffer

A `Framebuffer` is a container object that holds one or more textures
that will be used as render targets and optionally a depth / stencil buffer
for the GPU pipeline.

An application can render into an (HTML or offscreen) canvas by obtaining a
`Framebuffer` object from a `DeviceContext`.

Alternatively an application can create custom framebuffers for rendering directly into textures.

The application uses a `Framebuffer` by providing it as a parameter to a `RenderPass`.

## Framebuffer Attachments

A `Framebuffer` holds:

- a list of `Texture` attachments that store data (one or more color `Texture`s)
- plus an optional depth, stencil or combined depth-stencil `Texture`).

Attachments must be in the form of `Texture`s.

## Resizing Framebuffers

A `Framebuffer` is shallowly immutable (the list of attachments cannot be changed after creation),
however a Framebuffer can be "resized". Resizing a framebuffer effectively destroys all current textures
and creates new textures with otherwise similar properties. All data stored in the textures are lost.
This data loss is usually a non-issue as resizes would be performed between render passes,
typically to match the size of an off screen render buffer with the output canvas.

To render into a canvas, a "device context" `Framebuffer` should be obtained from a `DeviceContext`.
A device context `Framebuffer` and has a (single) special color attachment that is connected to the
current swap chain buffer. It updates every frame, and also automatically resizes based on the size of the connected canvas
and should not be manually resized.

Remarks:

- WebGPU: The `Framebuffer` concept does not exist natively in WebGPU (this information has to be provided through the `GPURenderPassDescriptor` `colorAttachments` and the `depthStencilAttachment` fields every frame when a render pass is created).`.
- WebGL: A native `WebGLFramebuffer` object exists that manages a set of attachments.
- OpenGL Wiki [Framebuffer](https://www.khronos.org/opengl/wiki/Framebuffer)
- OpenGL Wiki [Framebuffer Object](https://www.khronos.org/opengl/wiki/Framebuffer_Object).

## Usage

Creating a framebuffer with default color and depth attachments

```typescript
const framebuffer = device.createFramebuffer({
  width: window.innerWidth,
  height: window.innerHeight,
  color: true,
  depthStencil: true
});
```

Attaching textures and renderbuffers

```typescript
device.createFramebuffer({
  depthStencil: new Renderbuffer(gl, {...}),
  color0: new Texture(gl, {...}),
  color1: [new TextureCube(gl, {...}), GL.TEXTURE_CUBE_MAP_POSITIVE_X],
  color2: [new TextureArray2D(gl, {...}), 0],
  color3: [new TextureArray2D(gl, {...}), 1],
  color4: [new Texture3D(gl, {..., depth: 8}), 2]
});
framebuffer.checkStatus(); // optional
```

Resizing a framebuffer to the size of a window. Resizes all attachements with a single `framebuffer.resize()` call

```typescript
// Note: this resizes (and possibly clears) all attachments
framebuffer.resize({width: window.innerWidth, height: window.innerHeight});
```

Clearing a framebuffer

```typescript
framebuffer.clear();
framebuffer.clear({color: [0, 0, 0, 0], depth: 1, stencil: 0});
```

Specifying a framebuffer for rendering in each render calls

```typescript
const offScreenBuffer = new Framebuffer();
program1.draw({
  framebuffer: offScreenBuffer,
  parameters: {}
});
model.draw({
  framebuffer: null, // the default drawing buffer
  parameters: {}
});
```

Binding a framebuffer for multiple render calls

```typescript
const framebuffer1 = device.createFramebuffer({...});
const framebuffer2 = device.createFramebuffer({...});

const renderPass1 = device.createRenderPass({framebuffer: framebuffer1});
program.draw(renderPass1);
renderPass1.endPass();

const renderPass2 = device.createRenderPass({framebuffer: framebuffer1});
program.draw(renderPass2);
renderPass2.endPass();

```

### Reading, copying or blitting data from a Framebuffer attachment.

- For reading data into CPU memory check [`readPixelsToArray`](/docs/api-reference/webgl/moving-data)
- For reading into a Buffer object (GPU memory), doesn't result in CPU and GPU sync, check [`readPixelsToBuffer`](/docs/api-reference/webgl/moving-data)
- For reading into a Texture object (GPU memory), doesn't result in CPU and GPU sync, check [`copyToTexture`](/docs/api-reference/webgl/moving-data)
- For blitting between framebuffers (WebGL 2), check [`blit`](/docs/api-reference/webgl/moving-data)

### Using Multiple Render Targets

Specify which framebuffer attachments the fragment shader will be writing to when assigning to `gl_FragData[]`

```typescript
framebuffer.update({
  drawBuffers: [
    GL.COLOR_ATTACHMENT0, // gl_FragData[0]
    GL.COLOR_ATTACHMENT1, // gl_FragData[1]
    GL.COLOR_ATTACHMENT2, // gl_FragData[2]
    GL.COLOR_ATTACHMENT3 // gl_FragData[3]
  ]
});
```

Writing to multiple framebuffer attachments in GLSL fragment shader

```
#extension GL_EXT_draw_buffers : require
precision highp float;
void main(void) {
  gl_FragData[0] = vec4(0.25);
  gl_FragData[1] = vec4(0.5);
  gl_FragData[2] = vec4(0.75);
  gl_FragData[3] = vec4(1.0);
}
```

Clearing a specific draw buffer in a framebuffer (WebGL 2)

```typescript
framebuffer.clear({
  [GL.COLOR]: [0, 0, 1, 1], // Blue
  [GL.COLOR]: new Float32Array([0, 0, 0, 0]), // Black/transparent
  [GL.DEPTH_BUFFER]: 1, // Infinity
  [GL.STENCIL_BUFFER]: 0 // no stencil
});

framebuffer.clear({
  [GL.DEPTH_STENCIL_BUFFER]: [1, 0] // Infinity, no stencil
});
```

## Limits

- `GL.MAX_COLOR_ATTACHMENTS` - The maximum number of color attachments supported. Can be `0` in WebGL 1.
- `GL.MAX_DRAW_BUFFERS` - The maximum number of draw buffers supported. Can be `0` in WebGL 1, which means that `gl_FragData[]` is not available in shaders.

It is possible that you can have a certain number of attachments, but you can't draw to all of them at the same time.

## Methods

### constructor

A `Framebuffer` is created via `device.createFramebuffer(props: FramebufferProps)`.

Creates a new framebuffer, optionally creating and attaching `Texture` attachments.

```
device.createFramebuffer(gl, {
  id,
  width,
  height,
  attachments,
  color,
  depth,
  stencil
})
```

- `id`= - (_String_) - An optional name (id) of the buffer.
- `width`=`1` - (_number_) The width of the framebuffer.
- `height`=`1` - (_number_) The height of the framebuffer.
- `colorAttachments`=[] - (_Object_, optional) - a map of Textures and/or Renderbuffers, keyed be "attachment points" (see below).
- `depthStencilAttachment?`
- `color` - shortcut to the attachment in `GL.COLOR_ATTACHMENT0`
- `depth` - shortcut to the attachment in `GL.DEPTH_ATTACHMENT`
- `stencil` - shortcut to the attachment in `GL.STENCIL_ATTACHMENT`

The luma.gl `Framebuffer` constructor enables the creation of a framebuffer with all the proper attachments in a single step and also the `resize` method makes it easy to efficiently resize a all the attachments of a `Framebuffer` with a single method.

When no attachments are provided during `Framebuffer` object creation, new resources are created and used as default attachments for enabled targets (color and depth).
For color, new `Texture2D` object is created with no mipmaps and following filtering parameters are set.

| Texture parameter | Value           |
| ----------------- | --------------- |
| `minFilter`       | `linear`        |
| `magFilter`       | `linear`        |
| `addressModeU`    | `clamp-to-edge` |
| `addressModeV`    | `clamp-to-edge` |

### destroy()

Destroys the underlying GPU object. When destroying `Framebuffer` will also destroy any `Texture` that was created automatically during Framebuffer creation. Supplied textures will not be destroyed (but will eventually be garbage collected and destroyed).

### resize(width: number, height: number): Framebuffer

`Framebuffer.resize({width, height})`

Resizes all the `Framebuffer`'s current attachments to the new `width` and `height` by calling `resize` on those attachments.

- `width` (GLint) - width of `Framebuffer` in pixels
- `height` (GLint) - height of `Framebuffer` in pixels

Returns itself to enable chaining

- Each attachment's `resize` method checks if `width` or `height` have actually changed before reinitializing their data store, so calling `resize` multiple times with the same `width` and `height` does not trigger multiple resizes.
- If a resize happens, `resize` erases the current content of the attachment in question.

### clear(options: Object): Framebuffer

Clears the contents (pixels) of the framebuffer attachments.

- `options.color` (Boolean or Array) - clears all active color buffers (any selected `drawBuffer`s) with either the provided color or the default color.
- `options.depth`
- `options.stencil`
- `options.drawBuffers`=`[]` - An array of color values, with indices matching the buffers selected by `drawBuffers` argument.

Notes:

- The scissor box bounds the cleared region.
- The pixel ownership test, the scissor test, dithering, and the buffer writemasks affect the operation of `clear`.
- Alpha function, blend function, logical operation, stenciling, texture mapping, and depth-buffering are ignored by `clear`.

### Framebuffer Attachment Values

The following values can be provided for each attachment point

- `Texture` - attaches at mipmapLevel 0 of the supplied `Texture2D`.
- [`Texture`, 0, mipmapLevel] - attaches the specified mipmapLevel from the supplied `Texture2D` (WebGL 2), or cubemap face. The second element in the array must be `0`. In WebGL 1, mipmapLevel must be 0.
- [`Texture` (cube), face (number), mipmapLevel=0 (number)] - attaches the specifed cubemap face from the `Texture`, at the specified mipmap level. In WebGL 1, mipmapLevel must be 0.
- [`Texture`, layer (number), mipmapLevel=0 (number)] - attaches the specifed layer from the `Texture2DArray`, at the specified mipmap level.
- [`Texture3D`, layer (number), mipmapLevel=0 (number)] - attaches the specifed layer from the `Texture3D`, at the specified mipmap level.

## Remarks

- In the raw WebGL API, creating a set of properly configured and matching textures and renderbuffers can require a lot of careful coding and boilerplate.
- This is further complicated by many capabilities (such as support for multiple color buffers and various image formats) depending on WebGL extensions or WebGL versions.

### WebGL Notes:

This class makes calls to the following WebGL APIs:
[`gl.framebufferRenderbuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferRenderbuffer),
[`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer),
[`gl.framebufferTexture2D`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D),
[`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer),
[`gl.framebufferTextureLayer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/framebufferTextureLayer),
[`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer) (This is for WebGL 2 only)
[`gl.checkFramebufferStatus`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)

[`gl.invalidateFramebuffer`](<WebGL2RenderingContext.invalidateFramebuffer()>), [`gl.invalidateSubFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/invalidateSubFramebuffer), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)

For depth, new `Renderbuffer` object is created with `GL.DEPTH_COMPONENT16` format.
