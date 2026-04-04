# RenderPipeline

A `RenderPipeline` combines a vertex shader, a fragment shader, a
[`ShaderLayout`](/docs/api-reference/core/shader-layout), and fixed render
state into a reusable draw pipeline.

## Bindings and bind groups

`RenderPipeline` accepts bindings in two forms:

- `bindings`: a flat `Record<string, Binding>`
- `bindGroups`: grouped bindings keyed by bind-group index

Flat `bindings` remain supported for compatibility. When they are used, luma.gl
partitions them into logical groups using `shaderLayout.bindings[].group`.

Grouped `bindGroups` are useful when you want your application code to mirror
the structure of your WGSL bind groups directly.

## Usage

```ts
const pipeline = device.createRenderPipeline({
  id: 'my-pipeline',
  vs,
  fs,
  shaderLayout: {
    attributes: [{name: 'positions', location: 0, type: 'vec3<f32>'}],
    bindings: [
      {name: 'frameUniforms', type: 'uniform', group: 0, location: 0},
      {name: 'lightingUniforms', type: 'uniform', group: 2, location: 0},
      {name: 'materialUniforms', type: 'uniform', group: 3, location: 0}
    ]
  }
});
```

Draw with grouped bindings:

```ts
pipeline.draw({
  renderPass,
  vertexArray,
  vertexCount,
  bindGroups: {
    0: {frameUniforms},
    2: {lightingUniforms},
    3: {materialUniforms}
  }
});
```

Draw with flat bindings:

```ts
pipeline.draw({
  renderPass,
  vertexArray,
  vertexCount,
  bindings: {
    frameUniforms,
    lightingUniforms,
    materialUniforms
  }
});
```

Use one form or the other per draw call.

## `RenderPipelineProps`

Important properties:

- `vs?: Shader | null`
- `fs?: Shader | null`
- `shaderLayout?: ShaderLayout | null`
- `bufferLayout?: BufferLayout[]`
- `topology?: PrimitiveTopology`
- `parameters?: RenderPipelineParameters`
- `bindings?: Bindings`
- `bindGroups?: BindingsByGroup`
- `varyings?: string[]`
- `bufferMode?: number`

### `bindings`

Optional default flat bindings stored on the pipeline for compatibility paths.

### `bindGroups`

Optional default grouped bindings stored on the pipeline. Keys are bind-group
indices such as `0`, `2`, and `3`.

## `draw()`

The draw call accepts dynamic resources and draw parameters, including:

- `renderPass`
- `vertexArray`
- `vertexCount`
- `indexCount`
- `instanceCount`
- `bindings?: Bindings`
- `bindGroups?: BindingsByGroup`
- `parameters?: RenderPipelineParameters`
- `topology?: PrimitiveTopology`

## WebGPU vs WebGL

### WebGPU

WebGPU uses native bind groups and luma.gl binds each populated group before the
draw.

### WebGL

WebGL does not support bind groups natively. luma.gl still accepts grouped
bindings logically and flattens them to WebGL uniform-buffer and texture-unit
bindings at draw time.

## Related Pages

- [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings)
- [Bindings](/docs/api-reference/core/bindings)
- [ShaderLayout](/docs/api-reference/core/shader-layout)
