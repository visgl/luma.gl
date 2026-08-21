# RenderPipeline

[Shader](https://luma.gl/docs/api-reference/core/resources/shader.md)[RenderPipeline](https://luma.gl/docs/api-reference/core/resources/render-pipeline.md)[ComputePipeline](https://luma.gl/docs/api-reference/core/resources/compute-pipeline.md)[VertexArray](https://luma.gl/docs/api-reference/core/resources/vertex-array.md)[TransformFeedback](https://luma.gl/docs/api-reference/core/resources/transform-feedback.md)

A `RenderPipeline` combines a vertex shader, a fragment shader, a [`ShaderLayout`](https://luma.gl/docs/api-reference/core/shader-layout.md), and fixed render state into a reusable, immutable pipeline descriptor. Select it on a [`RenderPass`](https://luma.gl/docs/api-reference/core/resources/render-pass.md) before drawing.

**RenderPipeline**

* Creation

  Device.createRenderPipeline() or PipelineFactory

* Ownership

  Application-owned; factories may cache shared instances

* Usage

  Select on RenderPass, bind resources, then draw

* Lifecycle

  Immutable pipeline state; reuse across frames

* Backend support

  Portable with backend-compatible shaders and features

* Cost

  Pipeline creation can be expensive; never recreate it per frame

## Deprecated pipeline-owned bindings[​](#deprecated-pipeline-owned-bindings "Direct link to Deprecated pipeline-owned bindings")

`RenderPipelineProps.bindings`, `RenderPipelineProps.bindGroups`, `pipeline.setBindings()`, and `pipeline.draw()` remain available for compatibility, but are deprecated and will be removed in the next major release. New code sets bindings and issues draws on `RenderPass`.

`bindings` is a flat `Record<string, Binding>`; `bindGroups` is grouped by bind-group index. Flat bindings are partitioned using `shaderLayout.bindings[].group`.

## Usage[​](#usage "Direct link to Usage")

```
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

```
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

```
renderPass.setBindings({

  frameUniforms,

  lightingUniforms,

  materialUniforms

});
```

Use one form or the other per draw call.

## `RenderPipelineProps`[​](#renderpipelineprops "Direct link to renderpipelineprops")

Important properties:

* `vs?: Shader | null`
* `fs?: Shader | null`
* `shaderLayout?: ShaderLayout | null`
* `bufferLayout?: BufferLayout[]`
* `topology?: PrimitiveTopology`
* `parameters?: RenderPipelineParameters`
* `bindings?: Bindings` (deprecated)
* `bindGroups?: BindingsByGroup` (deprecated)
* `varyings?: string[]`
* `bufferMode?: number`

### `bindings`[​](#bindings "Direct link to bindings")

Deprecated default flat bindings stored on the pipeline for compatibility paths.

### `bindGroups`[​](#bindgroups "Direct link to bindgroups")

Deprecated default grouped bindings stored on the pipeline.

## `draw()` (deprecated)[​](#draw-deprecated "Direct link to draw-deprecated")

This compatibility adapter forwards to the supplied render pass. Prefer `renderPass.setPipeline()`, `setBindings()`, `setVertexArray()`, and `draw()`. It accepts:

* `renderPass`
* `vertexArray`
* `vertexCount`
* `indexCount`
* `instanceCount`
* `bindings?: Bindings`
* `bindGroups?: BindingsByGroup`
* `parameters?: RenderPipelineParameters`
* `topology?: PrimitiveTopology`

## WebGPU vs WebGL[​](#webgpu-vs-webgl "Direct link to WebGPU vs WebGL")

WebGPU maps pass bindings to native bind groups. WebGL emulates the same pass-owned state using uniform-buffer and texture-unit bindings at draw time.

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [Bind Groups and Bindings Guide](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md)
* [Bindings](https://luma.gl/docs/api-reference/core/bindings.md)
* [ShaderLayout](https://luma.gl/docs/api-reference/core/shader-layout.md)
