# ComputePipeline

[Shader](https://luma.gl/next/docs/api-reference/core/resources/shader.md)[RenderPipeline](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md)[ComputePipeline](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md)[VertexArray](https://luma.gl/next/docs/api-reference/core/resources/vertex-array.md)[TransformFeedback](https://luma.gl/next/docs/api-reference/core/resources/transform-feedback.md)

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

A `ComputePipeline` holds a compiled compute shader plus the [`ComputeShaderLayout`](https://luma.gl/next/docs/api-reference/core/shader-layout.md) that describes its bindings.

## Bindings and bind groups[​](#bindings-and-bind-groups "Direct link to Bindings and bind groups")

`ComputePipeline.setBindings()` accepts either:

* flat `bindings`
* grouped `bindGroups`

Grouped bindings are keyed by bind-group index, and sparse groups are valid.

## Usage[​](#usage "Direct link to Usage")

```
const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> data: array<i32>;

struct SceneUniforms {
  addend: i32
};

@group(2) @binding(0) var<uniform> sceneUniforms: SceneUniforms;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  data[i] = data[i] + sceneUniforms.addend;
}
`;

const shader = webgpuDevice.createShader({source});
const computePipeline = webgpuDevice.createComputePipeline({
  shader,
  shaderLayout: {
    bindings: [
      {name: 'data', type: 'storage', group: 0, location: 0},
      {name: 'sceneUniforms', type: 'uniform', group: 2, location: 0}
    ]
  }
});

computePipeline.setBindings({
  0: {data: workBuffer},
  2: {sceneUniforms}
});
```

Flat bindings work as well:

```
computePipeline.setBindings({
  data: workBuffer,
  sceneUniforms
});
```

When flat bindings are used, luma.gl partitions them into groups using the shader layout.

## `ComputePipelineProps`[​](#computepipelineprops "Direct link to computepipelineprops")

Important properties:

* `shader: Shader`
* `entryPoint?: string`
* `constants?: Record<string, number>`
* `shaderLayout?: ComputeShaderLayout | null`

Unlike `RenderPipeline`, grouped bindings are not configured through `ComputePipelineProps`. They are supplied through `setBindings()`.

## Methods[​](#methods "Direct link to Methods")

### `setBindings(bindingsOrBindGroups)`[​](#setbindingsbindingsorbindgroups "Direct link to setbindingsbindingsorbindgroups")

```
computePipeline.setBindings(bindingsOrBindGroups);
```

Accepts either:

* `Bindings`
* `BindingsByGroup`

### `destroy()`[​](#destroy "Direct link to destroy")

Releases the pipeline resources immediately.

## Performance[​](#performance "Direct link to Performance")

Creating compute pipelines can be expensive. Applications that create compatible pipelines repeatedly should prefer `PipelineFactory` over `device.createComputePipeline()` directly.

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [Bind Groups and Bindings Guide](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md)
* [Bindings](https://luma.gl/next/docs/api-reference/core/bindings.md)
* [ShaderLayout](https://luma.gl/next/docs/api-reference/core/shader-layout.md)
