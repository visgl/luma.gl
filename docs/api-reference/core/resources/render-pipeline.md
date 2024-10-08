# RenderPipeline

A `RenderPipeline` contains a matched pair of vertex and fragment [shaders](/docs/api-reference/core/resources/shader) that can be exectued on the GPU by calling `RenderPipeline.draw()`. handle compilation and linking of shaders, and store uniform values. They provide `draw` call which allows the application to run the shaders on specified input data.

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

```ts
const pipeline = device.createRenderPipeline({
  id: 'my-pipeline',
  vs: device.createShader({type: 'vertex', source: vertexShaderSource}),
  fs: device.createShader({type: 'fragment', source: fragmentShaderSource})
  topology: 'triangle-list',
  parameters: {
    depthTest: true
  }
});
```

Set or update uniforms, in this case world and projection matrices

```ts
pipeline.setUniforms({
  uMVMatrix: view,
  uPMatrix: projection
});
```

Create a `VertexArray` to store buffer values for the vertices of a triangle and drawing

```ts
const pipeline = device.createRenderPipeline({vs, fs});

const vertexArray = new VertexArray(gl, {pipeline});

vertexArray.setAttributes({
  aVertexPosition: new Buffer(gl, {data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])})
});

pipeline.draw({vertexArray, ...});
```

Creating a pipeline for WebGL transform feedback, specifying which varyings to use

```ts
const pipeline = device.createRenderPipeline({vs, fs, varyings: ['gl_Position']});
```

## Types

### RenderPipelineProps

| Property         | Type                       | Default | Mutable? | Description                                                              |
| ---------------- | -------------------------- | ------- | -------- | ------------------------------------------------------------------------ |
| Shader           |
| `vs?`            | `Shader`                   | `null`  | No       | Compiled vertex shader                                                   |
| `vertexEntryPoint?`  | `string`                   | -       | No       | Vertex shader entry point (defaults to 'main'). WGSL only                |
| `vsConstants?`   | `Record<string, number>`   |         | No       | Constants to apply to compiled vertex shader (WGSL only)                 |
| `fs?`            | `Shader`                   | `null`  | No       | Compiled fragment shader                                                 |
| `fragmentEntryPoint?`  | `stringy`                  |         | No       | Fragment shader entry point (defaults to 'main'). WGSL only              |
| `fsConstants?`   | ` Record<string, number>`  |         | No       | Constants to apply to compiled fragment shader (WGSL only)               |
| ShaderLayout     |
| `topology?`      | `PrimitiveTopology;`       |         |          | Determines how vertices are read from the 'vertex' attributes            |
| `shaderLayout?`  | `ShaderLayout`             | `null`  |          | Describes the attributes and bindings exposed by the pipeline shader(s). |
| `bufferLayout?`  | `BufferLayout`             |         |          |                                                                          |
| GPU Parameters   |
| `parameters?`    | `RenderPipelineParameters` |         |          | Parameters that are controlled by pipeline                               |
| Dynamic settings |
| `vertexCount?`   | `number`                   |         |          | Number of "rows" in 'vertex' buffers                                     |
| `instanceCount?` | `number`                   |         |          | Number of "rows" in 'instance' buffers                                   |
| `indices?`       | `Buffer`                   | `null`  |          | Optional index buffer                                                    |
| `attributes?`    | `Record<string, Buffer>`   |         |          | Buffers for attributes                                                   |
| `bindings?`      | `Record<string, Binding>`  |         |          | Buffers, Textures, Samplers for the shader bindings                      |
| `uniforms?`      | `Record<string, any>`      |         |          | uniforms (WebGL only)                                                    |

   * A default mapping of one buffer per attribute is always created.
   * @note interleaving attributes into the same buffer does not increase the number of attributes
   * that can be used in a shader (16 on many systems).

### PrimitiveTopology

Describes how primitives (points, lines or triangles) are formed from vertexes.

| Value                  | WebGL | WebGPU | Description                                                                                            |
| ---------------------- | ----- | ------ | ------------------------------------------------------------------------------------------------------ |
| `'point-list'`         | ✅     | ✅      | Each vertex defines a point primitive.                                                                 |
| `'line-list'`          | ✅     | ✅      | Each consecutive pair of two vertices defines a line primitive.                                        |
| `'line-strip'`         | ✅     | ✅      | Each vertex after the first defines a line primitive between it and the previous vertex.               |
| `'triangle-list'`      | ✅     | ✅      | Each consecutive triplet of three vertices defines a triangle primitive.                               |
| `'triangle-strip'`     | ✅     | ✅      | Each vertex after the first two defines a triangle primitive between it and the previous two vertices. |


## Members

- `id` : `String` - `id` string for debugging.
- `device`: `Device` - holds a reference to the `Device` that created this `Buffer`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `BufferProps` - holds a copy of the `BufferProps` used to create this `Buffer`.


## Methods

## constructor

:::info
`RenderPipeline` is an abstract class and cannot be instantiated directly. Create with `device.createRenderPipeline(...)`.
:::

Creates a new pipeline using the supplied vertex and fragment shaders. The shaders are compiled into WebGLShaders and is created and the shaders are linked.

Creates a new pipeline using the supplied vertex and fragment shaders. The shaders are compiled into WebGLShaders and is created and the shaders are linked.

```ts
const pipeline = device.createRenderPipeline(props: RenderProps);
```


```ts
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
- `varyings` WebGL (`String[]`) - a list of names of varyings.


WebGL References [WebGLProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram), [gl.createProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram)

### destroy()

Deletes resources held by pipeline. Note: Does not currently delete shaders (to enable shader sharing and caching).


### draw(opts) : RenderPipeline

`RenderPipeline.draw()` is the entry point for running shaders, rendering and (optionally calculating data using transform feedback techniques).

```ts
  RenderPipeline.draw({
    vertexArray,

    uniforms = {},
    transformFeedback = null,
    samplers = {},
    parameters = {},

    topology: 'triangle-list,
    vertexCount,
    offset = 0,
    isInstanced = false,
    instanceCount = 0,

    start = 0,
    end=
  })
```

Main parameters

- `uniforms`=`{}` - a map of uniforms that will be set just before the draw call (and remain set after the call).
- `bindings`=`{}` - a map of `TextureViews`, `Samplers` and uniform `Buffers` that will be bound before the draw call.
- `parameters` - temporary gl settings to be applied to this draw call.
- `transformFeedback`=`null` - optional `TransformFeedback` object containing buffers that will receive the output of the transform feedback operation.

Potentially auto deduced parameters

- `topology`=`triangle-list` - geometry primitive format of vertex data
- `vertexCount` - number of vertices to draw
- `offset`=`0` - first vertex to draw
- `isInstanced`=`false` - Set to enable instanced rendering.
- `instanceCount`=`0` - Number of instances

Parameters for drawing a limited range

- `start` - hint to GPU, activates `gl.drawElementsRange`
- `end` - hint to GPU, activates `gl.drawElementsRange`

Returns:
- `true` if successful, `false` if draw call is blocked due to resources (the pipeline itself or textures) not yet being initialized.

Notes:

- Runs the shaders in the pipeline, on the attributes and uniforms.
- Indexed rendering is used if the vertex array has an IndexBuffer set.
- If a `TransformFeedback` object is supplied, `transformFeedback.begin()` and `transformFeedback.end()` will be called before and after the draw call.
- A `Sampler` will only be bound if there is a matching Texture with the same key in the supplied `uniforms` object.
- Once a uniform is set, it's size should not be changed. This is only a concern for array uniforms.

The following WebGL APIs are called in this function:

### setBindings()

Sets named bindings from a map, ignoring names

- `key` (_String_) - The name of the uniform to be set. The name of the uniform will be matched with the name of the uniform declared in the shader. You can set more bindings on the RenderPipeline than its shaders use, the extra bindings will simply be ignored.
- `value` (_mixed_) - The value to be set. Can be a float, an array of floats, a typed array, a boolean, etc. The values must match the declarations in the shader.

### WebGL notes

The following WebGL APIs are called by the WEBGLRenderPipeline:

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram),
[gl.drawElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements),
[gl.drawRangeElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawRangeElements),
[gl.drawArrays](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays),
[gl.drawElementsInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced),
[gl.drawArraysInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced),
[gl.getExtension](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension), [ANGLE_instanced_arrays](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays),
[gl.drawElementsInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawElementsInstancedANGLE),
[gl.drawArraysInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawArraysInstancedANGLE)
