# How Rendering Works

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

:::caution
This page is a work-in-progress
:::

A major feature of any GPU API is the ability to issue GPU draw calls. luma.gl has been designed to offer developers full control over draw calls as outlined below.

## Tutorials

The luma.gl documentation includes a series of tutorials that show how to render 

## Overview

## Drawing to the screen

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

### Reading, copying or blitting data from a Framebuffer attachment.

- For reading data into CPU memory check [`readPixelsToArray`](/docs/api-reference-v8/webgl-legacy/classes/moving-data)
- For reading into a Buffer object (GPU memory), doesn't result in CPU and GPU sync, check [`readPixelsToBuffer`](/docs/api-reference-v8/webgl-legacy/classes/moving-data)
- For reading into a Texture object (GPU memory), doesn't result in CPU and GPU sync, check [`copyToTexture`](/docs/api-reference-v8/webgl-legacy/classes/moving-data)
- For blitting between framebuffers (WebGL 2), check [`blit`](/docs/api-reference-v8/webgl-legacy/classes/moving-data)

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

const renderPass1 = device.beginRenderPass({framebuffer: framebuffer1});
program.draw(renderPass1);
renderPass1.endPass();

const renderPass2 = device.beginRenderPass({framebuffer: framebuffer1});
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



# RenderPipeline

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

A `RenderPipeline` contains a matched pair of vertex and fragment [shaders](/docs/api-reference/api/resources/shader) that can be exectued on the GPU by calling `RenderPipeline.draw()`. handle compilation and linking of shaders, and store uniform values. They provide `draw` call which allows the application to run the shaders on specified input data.

A RenderPipeline controls the vertex and fragment shader stages, and can be used in GPURenderPassEncoder as well as GPURenderBundleEncoder.

Render pipeline inputs are:
- bindings, according to the given bindingLayout
- vertex and index buffers
- the color attachments, Framebuffer
- the optional depth-stencil attachment, described by Framebuffer
- parameters

Render pipeline outputs are:
- buffer bindings with a type of "storage"
- storageTexture bindings with a access of "write-only"
- the color attachments, described by Framebuffer
- the depth-stencil optional attachment, described by Framebuffer

A render pipeline is comprised of the following render stages:
- Vertex fetch, from the buffers buffers
- Vertex shader, props.vs
- Primitive assembly, controlled by
- Rasterization controlled by parameters (GPUPrimitiveState, GPUDepthStencilState, and GPUMultisampleState)
- Fragment shader, controlled by props.fs
- Stencil test and operation, controlled by GPUDepthStencilState
- Depth test and write, controlled by GPUDepthStencilState
- Output merging, controlled by GPUFragmentState.targets

## Usage

Creating a pipeline

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

## Members

- `gl` : `WebGLRenderingContext`
- `handle` : `WebGLProgram` - The WebGL `WebGLProgram` instance.
- `id` : `String` - `id` string for debugging.


## Methods

### constructor

RenderPipeline(gl : WebGLRenderingContext, props : Object)

Creates a new pipeline using the supplied vertex and fragment shaders. The shaders are compiled into WebGLShaders and is created and the shaders are linked.

```typescript
const pipeline = device.createRenderPipeline({
  id: 'my-identifier',
  vs: vertexShaderSource,
  fs: fragmentShaderSource,
  varyings: ['gl_Position', 'vColor']
});
```

- `id` (`string`, optional) - string id (to help indentify the pipeline during debugging).
- `vs` (`VertexShader`|`String`) - A vertex shader object, or source as a string.
- `fs` (`FragmentShader`|`String`) - A fragment shader object, or source as a string.
- `varyings` WebGL 2 (`String[]`) - a list of names of varyings.


WebGL References [WebGLProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram), [gl.createProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram)

### delete() : RenderPipeline

Deletes resources held by pipeline. Note: Does not currently delete shaders (to enable shader caching).

## Methods

### initialize(props : Object) : RenderPipeline

Relinks a pipeline. Takes the same options as the constructor

### setUniforms()

```typescript
  setUniforms(uniforms: Record<string, UniformValue>): void
```

Sets named uniforms from a map, ignoring names

- `key` (_String_) - The name of the uniform to be set. The name of the uniform will be matched with the name of the uniform declared in the shader. You can set more uniforms on the RenderPipeline than its shaders use, the extra uniforms will simply be ignored.
- `value` (_mixed_) - The value to be set. Can be a float, an array of floats, a typed array, a boolean, `Texture` etc. The values must match the declarations in the shader.

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram)

### draw(opts) : RenderPipeline

`RenderPipeline.draw` is the entry point for running shaders, rendering and (optionally calculating data using transform feedback techniques).

```typescript
  RenderPipeline.draw({
    vertexArray,

    uniforms = {},
    transformFeedback = null,
    samplers = {},
    parameters = {},

    drawMode = GL.TRIANGLES,
    vertexCount,
    offset = 0,
    isIndexed = false,
    indexType = GL.UNSIGNED_SHORT,
    isInstanced = false,
    instanceCount = 0,

    start = 0,
    end=
  })
```

Main parameters

- `vertexArray` - a `VertexArray` object that will be bound and unbound before and after the draw call.
- `uniforms`=`{}` - a map of uniforms that will be set just before the draw call (and remain set after the call).
- `samplers`=`{}` - a map of texture `Sampler`s that will be bound before the draw call.
- `parameters` - temporary gl settings to be applied to this draw call.
- `transformFeedback`=`null` - optional `TransformFeedback` object containing buffers that will receive the output of the transform feedback operation.

Potentially autodeduced parameters

- `drawMode`=`GL.TRIANGLES` - geometry primitive format of vertex data
- `vertexCount` - number of vertices to draw
- `offset`=`0` - first vertex to draw
- `isIndexed`=`false` - use indices in the "elements" buffer
- `indexType`=`GL.UNSIGNED_SHORT` - must match the type of the "elements" buffer
- `isInstanced`=`false` - Set to enable instanced rendering.
- `instanceCount`=`0` - Number of instances

Parameters for drawing a limited range (WebGL 2 only)

- `start` - hint to GPU, activates `gl.drawElementsRange` (WebGL 2)
- `end` - hint to GPU, activates `gl.drawElementsRange` (WebGL 2)

Returns: `true` if successful, `false` if draw call is blocked due to missing resources.

Notes:

- Runs the shaders in the pipeline, on the attributes and uniforms.
- Indexed rendering uses the element buffer (`GL.ELEMENT_ARRAY_BUFFER`), make sure your attributes or `VertexArray` contains one.
- If a `TransformFeedback` object is supplied, `transformFeedback.begin()` and `transformFeedback.end()` will be called before and after the draw call.
- A `Sampler` will only be bound if there is a matching Texture with the same key in the supplied `uniforms` object.
- Once a uniform is set, it's size should not be changed. This is only a concern for array uniforms.

The following WebGL APIs are called in this function:

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram),
[gl.drawElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements),
[gl.drawRangeElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawRangeElements) (WebGL 2),
[gl.drawArrays](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays),
[gl.drawElementsInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced) (WebGL 2),
[gl.drawArraysInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced) (WebGL 2),
[gl.getExtension](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension), [ANGLE_instanced_arrays](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays),
[gl.drawElementsInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawElementsInstancedANGLE),
[gl.drawArraysInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawArraysInstancedANGLE)

## Constants

### Limits

| Limit                                                | Value          | Description |
| ---------------------------------------------------- | -------------- | ----------- |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS`                  | >= 0 (GLint)   |             |
| `GL.MAX_RENDERBUFFER_SIZE`                           | >= 1 (GLint)   |             |
| `GL.MAX_VARYING_VECTORS`                             | >= 8 (GLint)   |             |
| `GL.MAX_VERTEX_ATTRIBS`                              | >= 8 (GLint)   |             |
| `GL.MAX_VERTEX_UNIFORM_VECTORS`                      | >= 128 (GLint) |             |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS`                    | >= 16 (GLint)  |             |
| `GL.TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH` (WebGL 2) | -              | -           |

### Parameters

Use with `RenderPipeline.getParameter(parameter)`

| Parameter                           | Type      | Description                                                                                                                                                        |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GL.DELETE_STATUS`                  | GLboolean | If true, pipeline has been flagged for deletion (by calling `RenderPipeline.destroy()`), but the delete is pending because pipeline is still part of current rendering state |
| `GL.LINK_STATUS`                    | GLboolean | Indicates whether last link operation was successful. RenderPipeline linking is performed by luma on pipeline initialization                                               |
| `GL.VALIDATE_STATUS`                | GLboolean | Result of last `gl.validateProgram()` operation                                                                                                                    |
| `GL.ATTACHED_SHADERS`               | GLint     | Number of attached shaders (`0`, `1` or `2`)                                                                                                                       |
| `GL.ACTIVE_ATTRIBUTES`              | GLint     | Number of active attribute variables to a pipeline                                                                                                                  |
| `GL.ACTIVE_UNIFORMS`                | GLint     | Number of active attribute variables to a pipeline                                                                                                                  |
| `GL.TRANSFORM_FEEDBACK_BUFFER_MODE` | GLenum    | (WebGL 2) Buffer capture mode, `GL.SEPARATE_ATTRIBS` or `GL.INTERLEAVED_ATTRIBS`                                                                                   |
| `GL.TRANSFORM_FEEDBACK_VARYINGS`    | GLint     | (WebGL 2) Number of varying variables to capture in transform feedback mode.                                                                                       |
| `GL.ACTIVE_UNIFORM_BLOCKS`          | GLint     | (WebGL 2) Number of uniform blocks containing active uniforms.                                                                                                     |


# RenderPipeline

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

A `RenderPipeline` contains a matched pair of vertex and fragment [shaders](/docs/api-reference/api/resources/shader) that can be exectued on the GPU by calling `RenderPipeline.draw()`. Programs handle compilation and linking of shaders, and store uniform values. They provide `draw` call which allows the application to run the shaders on specified input data.

## Usage

Creating a pipeline

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

## Members

- `device`: `Device` - holds a reference to the `Device` that created this `Buffer`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `BufferProps` - holds a copy of the `BufferProps` used to create this `Buffer`.

## Methods

### `constructor(props: BufferProps)`

`Buffer` is an abstract class and cannot be instantiated directly. Create with `device.createBuffer(...)`.

### `destroy(): void`

Free up any GPU resources associated with this buffer immediately (instead of waiting for garbage collection).

## Members

- `gl` : `WebGLRenderingContext`
- `handle` : `WebGLProgram` - The WebGL `WebGLProgram` instance.
- `id` : `String` - `id` string for debugging.

## Constructor

### RenderPipeline(gl : WebGLRenderingContext, props : Object)

Creates a new pipeline using the supplied vertex and fragment shaders. The shaders are compiled into WebGLShaders and is created and the shaders are linked.

```typescript
const pipeline = device.createRenderPipeline({
  id: 'my-identifier',
  vs: vertexShaderSource,
  fs: fragmentShaderSource,
  varyings: ['gl_Position', 'vColor']
});
```

- `id` (`string`, optional) - string id (to help indentify the pipeline during debugging).
- `vs` (`VertexShader`|`String`) - A vertex shader object, or source as a string.
- `fs` (`FragmentShader`|`String`) - A fragment shader object, or source as a string.
- `varyings` WebGL 2 (`String[]`) - a list of names of varyings.
- `bufferMode`=`GL.SEPARATE_ATTRIBS` WebGL 2 (`GLenum`) - Optional, specifies how transform feedback should store the varyings.

| `GL.TRANSFORM_FEEDBACK_BUFFER_MODE` | Description                  |
| ----------------------------------- | ---------------------------- |
| `GL.SEPARATE_ATTRIBS`               | One varying per buffer       |
| `GL.INTERLEAVED_ATTRIBS`            | Multiple varyings per buffer |

WebGL References [WebGLProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram), [gl.createProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram)

### delete() : RenderPipeline

Deletes resources held by pipeline. Note: Does not currently delete shaders (to enable shader caching).

## Methods

### initialize(props : Object) : RenderPipeline

Relinks a pipeline. Takes the same options as the constructor

### setUniforms(uniforms : Object) : RenderPipeline

Sets named uniforms from a map, ignoring names

- `key` (_String_) - The name of the uniform to be set. The name of the uniform will be matched with the name of the uniform declared in the shader. You can set more uniforms on the RenderPipeline than its shaders use, the extra uniforms will simply be ignored.
- `value` (_mixed_) - The value to be set. Can be a float, an array of floats, a typed array, a boolean, `Texture` etc. The values must match the declarations in the shader.

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram)

### draw(opts) : RenderPipeline

`RenderPipeline.draw` is the entry point for running shaders, rendering and (optionally calculating data using transform feedback techniques).

```typescript
  RenderPipeline.draw({
    vertexArray,

    uniforms = {},
    transformFeedback = null,
    samplers = {},
    parameters = {},

    drawMode = GL.TRIANGLES,
    vertexCount,
    offset = 0,
    isIndexed = false,
    indexType = GL.UNSIGNED_SHORT,
    isInstanced = false,
    instanceCount = 0,

    start = 0,
    end=
  })
```

Main parameters

- `vertexArray` - a `VertexArray` object that will be bound and unbound before and after the draw call.
- `uniforms`=`{}` - a map of uniforms that will be set just before the draw call (and remain set after the call).
- `samplers`=`{}` - a map of texture `Sampler`s that will be bound before the draw call.
- `parameters` - temporary gl settings to be applied to this draw call.
- `transformFeedback`=`null` - optional `TransformFeedback` object containing buffers that will receive the output of the transform feedback operation.

Potentially autodeduced parameters

- `drawMode`=`GL.TRIANGLES` - geometry primitive format of vertex data
- `vertexCount` - number of vertices to draw
- `offset`=`0` - first vertex to draw
- `isIndexed`=`false` - use indices in the "elements" buffer
- `indexType`=`GL.UNSIGNED_SHORT` - must match the type of the "elements" buffer
- `isInstanced`=`false` - Set to enable instanced rendering.
- `instanceCount`=`0` - Number of instances

Parameters for drawing a limited range (WebGL 2 only)

- `start` - hint to GPU, activates `gl.drawElementsRange` (WebGL 2)
- `end` - hint to GPU, activates `gl.drawElementsRange` (WebGL 2)

Returns: `true` if successful, `false` if draw call is blocked due to missing resources.

Notes:

- Runs the shaders in the pipeline, on the attributes and uniforms.
- Indexed rendering uses the element buffer (`GL.ELEMENT_ARRAY_BUFFER`), make sure your attributes or `VertexArray` contains one.
- If a `TransformFeedback` object is supplied, `transformFeedback.begin()` and `transformFeedback.end()` will be called before and after the draw call.
- A `Sampler` will only be bound if there is a matching Texture with the same key in the supplied `uniforms` object.
- Once a uniform is set, it's size should not be changed. This is only a concern for array uniforms.

The following WebGL APIs are called in this function:

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram),
[gl.drawElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements),
[gl.drawRangeElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawRangeElements) (WebGL 2),
[gl.drawArrays](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays),
[gl.drawElementsInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced) (WebGL 2),
[gl.drawArraysInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced) (WebGL 2),
[gl.getExtension](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension), [ANGLE_instanced_arrays](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays),
[gl.drawElementsInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawElementsInstancedANGLE),
[gl.drawArraysInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawArraysInstancedANGLE)

## Constants

### Limits

| Limit                                                | Value          | Description |
| ---------------------------------------------------- | -------------- | ----------- |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS`                  | >= 0 (GLint)   |             |
| `GL.MAX_RENDERBUFFER_SIZE`                           | >= 1 (GLint)   |             |
| `GL.MAX_VARYING_VECTORS`                             | >= 8 (GLint)   |             |
| `GL.MAX_VERTEX_ATTRIBS`                              | >= 8 (GLint)   |             |
| `GL.MAX_VERTEX_UNIFORM_VECTORS`                      | >= 128 (GLint) |             |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS`                    | >= 16 (GLint)  |             |
| `GL.TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH` (WebGL 2) | -              | -           |

### Parameters

Use with `RenderPipeline.getParameter(parameter)`

| Parameter                           | Type      | Description                                                                                                                                                        |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GL.DELETE_STATUS`                  | GLboolean | If true, pipeline has been flagged for deletion (by calling `RenderPipeline.destroy()`), but the delete is pending because pipeline is still part of current rendering state |
| `GL.LINK_STATUS`                    | GLboolean | Indicates whether last link operation was successful. RenderPipeline linking is performed by luma on pipeline initialization                                               |
| `GL.VALIDATE_STATUS`                | GLboolean | Result of last `gl.validateProgram()` operation                                                                                                                    |
| `GL.ATTACHED_SHADERS`               | GLint     | Number of attached shaders (`0`, `1` or `2`)                                                                                                                       |
| `GL.ACTIVE_ATTRIBUTES`              | GLint     | Number of active attribute variables to a pipeline                                                                                                                  |
| `GL.ACTIVE_UNIFORMS`                | GLint     | Number of active attribute variables to a pipeline                                                                                                                  |
| `GL.TRANSFORM_FEEDBACK_BUFFER_MODE` | GLenum    | (WebGL 2) Buffer capture mode, `GL.SEPARATE_ATTRIBS` or `GL.INTERLEAVED_ATTRIBS`                                                                                   |
| `GL.TRANSFORM_FEEDBACK_VARYINGS`    | GLint     | (WebGL 2) Number of varying variables to capture in transform feedback mode.                                                                                       |
| `GL.ACTIVE_UNIFORM_BLOCKS`          | GLint     | (WebGL 2) Number of uniform blocks containing active uniforms.                                                                                                     |
