# ComputePipeline

:::info
`ComputePipeline` is only available on WebGPU.
:::

A `ComputePipeline` holds a compiled compute shader plus the
[`ComputeShaderLayout`](/docs/api-reference/core/shader-layout) that describes
its bindings.

## Bindings and bind groups

`ComputePipeline.setBindings()` accepts either:

- flat `bindings`
- grouped `bindGroups`

Grouped bindings are keyed by bind-group index, and sparse groups are valid.

## Usage

```ts
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

```ts
computePipeline.setBindings({
  data: workBuffer,
  sceneUniforms
});
```

When flat bindings are used, luma.gl partitions them into groups using the
shader layout.

## `ComputePipelineProps`

Important properties:

- `shader: Shader`
- `entryPoint?: string`
- `constants?: Record<string, number>`
- `shaderLayout?: ComputeShaderLayout | null`

Unlike `RenderPipeline`, grouped bindings are not configured through
`ComputePipelineProps`. They are supplied through `setBindings()`.

## Methods

### `setBindings(bindingsOrBindGroups)`

```ts
computePipeline.setBindings(bindingsOrBindGroups);
```

Accepts either:

- `Bindings`
- `BindingsByGroup`

### `destroy()`

Releases the pipeline resources immediately.

## Performance

Creating compute pipelines can be expensive. Applications that create compatible
pipelines repeatedly should prefer `PipelineFactory` over
`device.createComputePipeline()` directly.

## Related Pages

- [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings)
- [Bindings](/docs/api-reference/core/bindings)
- [ShaderLayout](/docs/api-reference/core/shader-layout)
