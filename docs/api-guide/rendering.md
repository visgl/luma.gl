# Rendering

> Proposed luma.gl v9 API. Open for comments.

> This page is a work-in-progress

A major feature of any GPU API is the ability to issue GPU draw calls. luma.gl has been designed to offer developers full control over draw calls as outlined below.

## Tutorials

The luma.gl documentation includes a series of tutorials that show how to render 

## Model

## RenderPipeline

## RenderPass

... 

The luma.gl `Framebuffer` constructor enables the creation of a framebuffer with all the proper attachments in a single step and also the `resize` method makes it easy to efficiently resize a all the attachments of a `Framebuffer` with a single method.

When no attachments are provided during `Framebuffer` object creation, new resources are created and used as default attachments for enabled targets (color and depth).
For color, new `Texture2D` object is created with no mipmaps and following filtering parameters are set.

| Texture parameter | Value           |
| ----------------- | --------------- |
| `minFilter`       | `linear`        |
| `magFilter`       | `linear`        |
| `addressModeU`    | `clamp-to-edge` |
| `addressModeV`    | `clamp-to-edge` |


A `Framebuffer` is a container object that holds textures that will be used as render targets for `RenderPipeline`s.
- one or more color textures
- optionally a depth / stencil buffer

An application can render into an (HTML or offscreen) canvas by obtaining a
`Framebuffer` object from a `CanvasContext` using `canvasContext.getDefaultFramebuffer()`.

Alternatively an application can create custom framebuffers for rendering directly into textures.

The application uses a `Framebuffer` by providing it as a parameter to `device.beginRenderPass()`.
All operations on that `RenderPass` instance will render into that framebuffer.

A `Framebuffer` is shallowly immutable (the list of attachments cannot be changed after creation),
however a Framebuffer can be "resized".

## Framebuffer Attachments

A `Framebuffer` holds:

- an array of "color attachments" (often just one) that store data (one or more color `Texture`s)
- an optional depth, stencil or combined depth-stencil `Texture`).

All attachments must be in the form of `Texture`s.

## Rendering into a canvas

To render into a canvas, a special `Framebuffer` should be obtained from a 
`CanvasContext` using `canvasContext.getDefaultFramebuffer()`.
A device context `Framebuffer` and has a (single) special color attachment that is connected to the
current swap chain buffer, and also a depth buffer, and is automatically resized to match the size of the canvas
associated.

## Resizing Framebuffers

Resizing a framebuffer effectively destroys all current textures and creates new 
textures with otherwise similar properties. All data stored in the previous textures are lost.
This data loss is usually a non-issue as resizes are usually performed between render passes,
(typically to match the size of an off screen render buffer with the new size of the output canvas).

A default Framebuffer should not be manually resized.

### Reading, copying or blitting data from a Framebuffer attachment.

- For reading data into CPU memory check [`readPixelsToArray`](/docs/api-reference/webgl/moving-data)
- For reading into a Buffer object (GPU memory), doesn't result in CPU and GPU sync, check [`readPixelsToBuffer`](/docs/api-reference/webgl/moving-data)
- For reading into a Texture object (GPU memory), doesn't result in CPU and GPU sync, check [`copyToTexture`](/docs/api-reference/webgl/moving-data)
- For blitting between framebuffers (WebGL 2), check [`blit`](/docs/api-reference/webgl/moving-data)

### Framebuffer Attachment Values (TBD)

The following values can be provided for each attachment point

- `Texture` - attaches at mipmapLevel 0 of the supplied `Texture2D`.
- [`Texture`, 0, mipmapLevel] - attaches the specified mipmapLevel from the supplied `Texture2D` (WebGL 2), or cubemap face. The second element in the array must be `0`. In WebGL 1, mipmapLevel must be 0.
- [`Texture` (cube), face (number), mipmapLevel=0 (number)] - attaches the specifed cubemap face from the `Texture`, at the specified mipmap level. In WebGL 1, mipmapLevel must be 0.
- [`Texture`, layer (number), mipmapLevel=0 (number)] - attaches the specifed layer from the `Texture2DArray`, at the specified mipmap level.
- [`Texture3D`, layer (number), mipmapLevel=0 (number)] - attaches the specifed layer from the `Texture3D`, at the specified mipmap level.

## Limitations

The maximum number of color attachments supported is at least `8` in WebGPU and `4` in WebGL2. 
There is currently no portable API to query this limit.

## Usage

Creating a framebuffer with default color and depth attachments

```typescript
const framebuffer = device.createFramebuffer({
  width: window.innerWidth,
  height: window.innerHeight,
  color: 'true',
  depthStencil: true
});
```

Attaching textures and renderbuffers

```typescript
device.createFramebuffer({
  depthStencil: device.createRenderbuffer({...}),
  color0: device.createTexture({...}),
  color1: [device.createTexture({dimension: 'cube', ...}), GL.TEXTURE_CUBE_MAP_POSITIVE_X],
  color2: [device.createTextureArray2D({{dimension: '2d-array',...}), 0],
  color3: [device.createTextureArray2D({{dimension: '2d-array',...}), 1],
  color4: [device.createTexture3D({{dimension: '3d', ..., depth: 8}), 2]
});
framebuffer.checkStatus(); // optional
```

Resizing a framebuffer to the size of a window. Resizes (and possibly clears) all attachments.

```typescript
framebuffer.resize(window.innerWidth, window.innerHeight);
```

Specifying a framebuffer for rendering in each render calls

```typescript
const offScreenBuffer = device.createFramebuffer(...);
const offScreenRenderPass = device.beginRenderPass({framebuffer: offScreenFramebuffer});
model1.draw({
  framebuffer: offScreenBuffer,
  parameters: {}
});
model2.draw({
  framebuffer: null, // the default drawing buffer
  parameters: {}
});
```


Clearing a framebuffer

```typescript
framebuffer.clear();
framebuffer.clear({color: [0, 0, 0, 0], depth: 1, stencil: 0});
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