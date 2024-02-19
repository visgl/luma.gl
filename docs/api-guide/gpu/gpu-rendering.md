# How Rendering Works

:::info
Applications will typically used the `Model` class in `@luma.gl/engine` module to issue draw calls.
While the `Model` class handles some of the necessary setup, it is still useful to understand how
rendering is done with the underlying `Renderpipeline`
:::

A major feature of any GPU API is the ability to issue GPU draw calls. luma.gl has been designed to offer developers full control over draw calls as outlined below.

## Tutorials

The luma.gl documentation includes a series of tutorials that show how to render with the luma.gl API.

## Drawing

### Creating a RenderPipeline

```typescript
const pipeline = device.createRenderPipeline({
  id: 'my-pipeline',
  vs: vertexShaderSourceString,
  fs: fragmentShaderSourceString
});
```

Set or update uniforms, in this case world and projection matrices

```typescript
pipeline.setUniforms({
  uMVMatrix: view,
  uPMatrix: projection
});
```

Create a `VertexArray` to store buffer values for the vertices of a triangle and drawing

```typescript
const pipeline = device.createRenderPipeline({vs, fs});

pipeline.draw({vertexArray, ...});
```

Creating a pipeline for transform feedback, specifying which varyings to use

```typescript
const pipeline = device.createRenderPipeline({vs, fs, varyings: ['gl_Position']});
```


```

Set or update uniforms, in this case world and projection matrices

```typescript
pipeline.setUniforms({
  uMVMatrix: view,
  uPMatrix: projection
});
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

To render to the screen requires rendering into a canvas, a special `Framebuffer` should be obtained from a 
`CanvasContext` using `canvasContext.getDefaultFramebuffer()`.
A device context `Framebuffer` and has a (single) special color attachment that is connected to the
current swap chain buffer, and also a depth buffer, and is automatically resized to match the size of the canvas
associated.

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

For more detail. `device.canvasContext.getDefaultFramebuffer()` returns a special framebuffer that lets you render to screen (into the device's swap chain textures). This framebuffer is used by default when a `device.beginRenderPass()` is called without providing a `framebuffer`: 

```typescript
  const renderPass = device.beginRenderPass({framebuffer: device.canvasContext.getDefaultFramebuffer()});
  ...
```

## Clearing the screen

`Framebuffer` attachments are cleared by default when a RenderPass starts. Control is provided via the `RenderPassProps.clearColor` parameter, setting this will clear the attachments to the corresponding color. The default clear color is a fully transparent black `[0, 0, 0, 0]`. 

```typescript
  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1]});
  model.draw();
  renderPass.end();
  device.submit();
```

Depth and stencil buffers are also cleared to default values:

```typescript
  const renderPass = device.beginRenderPass({
    clearColor: [0, 0, 0, 1],
    depthClearValue: 1,
    stencilClearValue: 0
  });
  renderPass.end();
  device.submit();
```

Clearing can  be disabled by setting any of the clear properties to the string constant `'load'`. Instead of clearing before rendering, this loads the previous contents of the framebuffer. Clearing should generally be expected to be more performant.

## Offscreen rendering

While is possible to render into an `OffscreenCanvas`, offscreen rendering usually refers to 
rendering into one or more application created `Texture`s. 

To help organize and resize these textures, luma.gl provides a `Framebuffer` class. 
A `Framebuffer` is a simple container object that holds textures that will be used as render targets for a `RenderPass`, containing
- one or more color attachments
- optionally, a depth, stencil or depth-stencil attachment 

`Framebuffer` also provides a `resize` method makes it easy to efficiently resize all the attachments of a `Framebuffer` with a single method call.

`device.createFramebuffer` constructor enables the creation of a framebuffer with all attachments in a single step. 

When no attachments are provided during `Framebuffer` object creation, new resources are created and used as default attachments for enabled targets (color and depth).

For color, new `Texture2D` object is created with no mipmaps and following filtering parameters are set.

| Texture parameter | Value           |
| ----------------- | --------------- |
| `minFilter`       | `linear`        |
| `magFilter`       | `linear`        |
| `addressModeU`    | `clamp-to-edge` |
| `addressModeV`    | `clamp-to-edge` |


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


Clearing a framebuffer

```typescript
framebuffer.clear();
framebuffer.clear({color: [0, 0, 0, 0], depth: 1, stencil: 0});
```

Binding a framebuffer for multiple render calls

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

The colorAttachments can be referenced in the shaders

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

