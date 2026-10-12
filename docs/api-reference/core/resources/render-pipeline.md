import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# RenderPipeline

<CoreDocsTabs group="pipelines" active="render-pipeline" />

A `RenderPipeline` combines a vertex shader, a fragment shader, a
[`ShaderLayout`](/docs/api-reference/core/shader-layout), and fixed render
state into a reusable, immutable pipeline descriptor. Select it on a
[`RenderPass`](/docs/api-reference/core/resources/render-pass) before drawing.

<DocumentationContract title="RenderPipeline" rows={[
  {label: 'Creation', value: 'Device.createRenderPipeline() or PipelineFactory'},
  {label: 'Ownership', value: 'Application-owned; factories may cache shared instances'},
  {label: 'Usage', value: 'Select on RenderPass, bind resources, then draw'},
  {label: 'Lifecycle', value: 'Immutable pipeline state; reuse across frames'},
  {label: 'Backend support', value: 'Portable with backend-compatible shaders and features'},
  {label: 'Cost', value: 'Pipeline creation can be expensive; never recreate it per frame'}
]} />

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

### WebGL uniform block binding points

On WebGL, luma.gl owns the uniform block binding points of the `WebGLProgram`
behind a render pipeline (`renderPipeline.handle`). At draw time it assigns each
uniform block the binding point of its position in `shaderLayout.bindings`, and
it skips the `gl.uniformBlockBinding()` call when the block already has the
binding point that luma.gl last assigned to it. luma.gl tracks these assignments
per program, so render pipelines that share one program (for example through
`PipelineFactory`) each get their own binding points, even when they order
their bindings differently.

luma.gl does not read binding points back from the program. Application code
that calls `gl.uniformBlockBinding()` on `renderPipeline.handle` must then call
`renderPipeline.invalidateUniformBlockBindings()`, so that the next draw assigns
every uniform block again:

```ts
import type {WebGLDevice, WEBGLRenderPipeline} from '@luma.gl/webgl';

const webglPipeline = renderPipeline as WEBGLRenderPipeline;
const gl = (device as WebGLDevice).gl;
gl.uniformBlockBinding(webglPipeline.handle, blockIndex, 7);
// ... raw WebGL draws ...
webglPipeline.invalidateUniformBlockBindings();
```

The invalidation applies to the program, so it covers every render pipeline
that shares it.

## Related Pages

- [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings)
- [Bindings](/docs/api-reference/core/bindings)
- [ShaderLayout](/docs/api-reference/core/shader-layout)
