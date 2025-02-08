# How GPU Rendering Works

:::info
Note that the luma.gl documentation includes a series of tutorials that explain how to render with the luma.gl API.
:::

A major feature of any GPU API is the ability to issue GPU draw calls. 

GPUs can draw into textures, or to the screen. In luma.gl

## Setup

To draw into a texture, the application needs to create 
- A `Texture` that is the target of the draw call
- A `Framebuffer` that references the texture being drawn into.
- A `RenderPass` using the framebuffer. 

If drawing to the screen, the application will instead need to create
- A `CanvasContext` connected to a canvas that the GPU should draw into
- A `Framebuffer` by calling `canvasContext.getCurrentFramebuffer()`.
- A `RenderPass` using the framebuffer. 

Finally, to perform that actual draw call, the application needs a 
- A `RenderPipeline` using the shader code that will execute during the draw.

_Note: setting up a "raw" `Renderpipeline` requires a substantial amount of boilerplace and setup. Instead most applications will typically use the `Model` class in `@luma.gl/engine` module to issue draw calls._


### Creating a Texture

To create a texture suitable as a simple render target, call `device.createTexture()` with no mipmaps and following sampler parameters:

| Texture parameter | Value           |
| ----------------- | --------------- |
| `minFilter`       | `linear`        |
| `magFilter`       | `linear`        |
| `addressModeU`    | `clamp-to-edge` |
| `addressModeV`    | `clamp-to-edge` |


### Creating a Framebuffer

To help organize the target texture(s), luma.gl provides a `Framebuffer` class. 
A `Framebuffer` is a simple container object that holds textures that will be used as render targets for a `RenderPass`, containing
- one or more color attachments
- optionally, a depth, stencil or depth-stencil attachment 

`Framebuffer` also provides a `resize` method makes it easy to efficiently resize all the attachments of a `Framebuffer` with a single method call.

`device.createFramebuffer` constructor enables the creation of a framebuffer with all attachments in a single step. 

When no attachments are provided during `Framebuffer` object creation, new resources are created and used as default attachments for enabled targets (color and depth).

An application can render into an (HTML or offscreen) canvas by obtaining a
`Framebuffer` object from a `CanvasContext` using `canvasContext.getDefaultFramebuffer()`.

Alternatively an application can create custom framebuffers for rendering directly into textures.

The application uses a `Framebuffer` by providing it as a parameter to `device.beginRenderPass()`.
All operations on that `RenderPass` instance will render into that framebuffer.

A `Framebuffer` is shallowly immutable (the list of attachments cannot be changed after creation),
however a Framebuffer can be "resized".


### Creating a CanvasContext

While a `Device` can be used on its own to perform computations on the GPU,
at least one `CanvasContext` is required for rendering to the screen.

A `CanvasContext` holds a connection between the GPU `Device` and an HTML or offscreen `canvas` (`HTMLCanvasElement` (or `OffscreenCanvas`)_ into which it can render.

The most important method is `CanvasContext.getCurrentFramebuffer()` that is used to obtain fresh `Framebuffer` every render frame. This framebuffer contains a special texture `colorAttachment` that draws into to the canvas "drawing buffer" which will then be copied to the screen when then render pass ends.

While there are ways to obtain multiple `CanvasContext` instances on WebGPU, the recommended portable way (that also works on WebGL) is to create a "default canvas context" by supplying the `createCanvasContext` prop to your `luma.createDevice({..., createCanvasContext: true})` call. The created canvas contest is available via `device.getDefaultCanvasContext()`.

### Creating a RenderPipeline

```typescript
const pipeline = device.createRenderPipeline({
  id: 'my-pipeline',
  vs: vertexShaderSourceString,
  fs: fragmentShaderSourceString
});
```

Set or update bindings

```typescript
pipeline.setBindings({...});
```

### Creating a Model

See engine documentation.

## Drawing

Once all bindings have been set up, call `pipeline.draw()`

```typescript
const pipeline = device.createRenderPipeline({vs, fs});

// Create a `VertexArray` to store buffer values for the vertices of a triangle and drawing
const vertexArray = device.createVertexArray();
...

const success = pipeline.draw({vertexArray, ...});
```

Create a `VertexArray` to store buffer values for the vertices of a triangle and drawing

```typescript
const pipeline = device.createRenderPipeline({vs, fs});
const vertexArray = new VertexArray(gl, {pipeline});
vertexArray.setAttributes({
  aVertexPosition: new Buffer(gl, {data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])})
});

pipeline.draw({vertexArray, ...});
```

Creating a pipeline for transform feedback, specifying which varyings to use

```typescript
const pipeline = device.createRenderPipeline({vs, fs, varyings: ['gl_Position']});
```

## Rendering into a canvas

To draw to the screen in luma.gl, simply create a `RenderPass` by calling 
`device.beginRenderPass()` and start rendering. When done rendering, call 
`renderPass.end()`  

```typescript
  // A renderpass without parameters uses the default framebuffer of the device's default CanvasContext 
  const renderPass = device.beginRenderPass();
  model.draw();
  renderPass.end();
  device.submit(); 
```

For more detail. `device.getDefaultCanvasContext().getDefaultFramebuffer()` returns a special framebuffer that lets you render to screen (into the device's swap chain textures). This framebuffer is used by default when a `device.beginRenderPass()` is called without providing a `framebuffer`: 

```typescript
  const renderPass = device.beginRenderPass({framebuffer: device.getDefaultCanvasContext().getDefaultFramebuffer()});
  ...
```

## Clearing

Unless implementing special compositing techniques, applications usually want to clear the target texture before rendering.
Clearing is performed when a `RenderPass` starts. `Framebuffer` attachments are cleared according to the `clearColor,clearDepth,clearStencil` `RenderPassProps`.
`props.clearColor` will clear the color attachment using the supplied color. The default clear color is a fully transparent black `[0, 0, 0, 0]`. 

```typescript
  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
  model.draw();
  renderPass.end();
  device.submit();
```

Depth and stencil buffers should normally also be cleared to default values:

```typescript
  const renderPass = device.beginRenderPass({
    clearColor: [0, 0, 0, 1],
    depthClearValue: 1,
    stencilClearValue: 0
  });
  renderPass.end();
  device.submit();
```

Clearing can be disabled by setting any of the clear properties to the string constant `'false'`. Instead of clearing before rendering, this loads the previous contents of the framebuffer.

_Note: Clearing is normally be expected to be more performant than not clearing, as the latter requires the GPU to read in the previous content of texture while rendering._

## Offscreen rendering

It is possible to render into an `OffscreenCanvas`, enabling worker thread use cases etc.

_Note: offscreen rendering sometimes refers to rendering into one or more application created `Texture`s._

## Resizing Framebuffers

Resizing a framebuffer effectively destroys all current textures and creates new 
textures with otherwise similar properties. All data stored in the previous textures are lost.
This data loss is usually a non-issue as resizes are usually performed between render passes,
(typically to match the size of an off screen render buffer with the new size of the output canvas).

A default Framebuffer should not be manually resized.

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
  color0: device.createTexture({...})
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

### Binding a framebuffer for multiple render calls

```typescript
const framebuffer1 = device.createFramebuffer({...});
const framebuffer2 = device.createFramebuffer({...});

const renderPass1 = device.beginRenderPass({framebuffer: framebuffer1});
program.draw(renderPass1);
renderPass1.endPass();

const renderPass2 = device.beginRenderPass({framebuffer: framebuffer1});
program.draw(renderPass2);
renderPass2.endPass();
```

### Using Multiple Render Targets

:::caution
Multiple render target support is still experimental
:::

Multiple textures from the `framebuffer.colorAttachments` array can be referenced in shaders

Writing to multiple framebuffer attachments in GLSL fragment shader

```typescript
#extension GL_EXT_draw_buffers : require
precision highp float;
void main(void) {
  gl_FragData[0] = vec4(0.25);
  gl_FragData[1] = vec4(0.5);
  gl_FragData[2] = vec4(0.75);
  gl_FragData[3] = vec4(1.0);
}
```

