import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';

# RenderPipeline

<CoreDocsTabs group="pipelines" active="render-pipeline" />

A `RenderPipeline` combines a vertex shader, a fragment shader, a
[`ShaderLayout`](/docs/api-reference/core/shader-layout), and fixed render
state into a reusable, immutable pipeline descriptor. Select it on a
[`RenderPass`](/docs/api-reference/core/resources/render-pass) before drawing.

## Deprecated pipeline-owned bindings

`RenderPipelineProps.bindings`, `RenderPipelineProps.bindGroups`,
`pipeline.setBindings()`, and `pipeline.draw()` remain available for
compatibility, but are deprecated and will be removed in the next major
release. New code sets bindings and issues draws on `RenderPass`.

`bindings` is a flat `Record<string, Binding>`; `bindGroups` is grouped by
bind-group index. Flat bindings are partitioned using
`shaderLayout.bindings[].group`.

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

Draw through the render pass:

```ts
renderPass.setPipeline(pipeline);
renderPass.setBindings({
    0: {frameUniforms},
    2: {lightingUniforms},
    3: {materialUniforms}
});
renderPass.setVertexArray(vertexArray);
renderPass.draw({vertexCount});
```

Flat bindings are also accepted:

```ts
renderPass.setBindings({
  frameUniforms,
  lightingUniforms,
  materialUniforms
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
- `bindings?: Bindings` (deprecated)
- `bindGroups?: BindingsByGroup` (deprecated)
- `varyings?: string[]`
- `bufferMode?: number`

### `bindings`

Deprecated default flat bindings stored on the pipeline for compatibility paths.

### `bindGroups`

Deprecated default grouped bindings stored on the pipeline.

## `draw()` (deprecated)

This compatibility adapter forwards to the supplied render pass. Prefer
`renderPass.setPipeline()`, `setBindings()`, `setVertexArray()`, and
`draw()`. It accepts:

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

WebGPU maps pass bindings to native bind groups. WebGL emulates the same
pass-owned state using uniform-buffer and texture-unit bindings at draw time.

## Related Pages

- [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings)
- [Bindings](/docs/api-reference/core/bindings)
- [ShaderLayout](/docs/api-reference/core/shader-layout)
