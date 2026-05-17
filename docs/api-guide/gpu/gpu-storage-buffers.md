# Storage Buffers

Storage buffers are the flexible WebGPU path for shader-visible data that should
be read or written as ordinary WGSL arrays and structs. They are not available in
WebGL, so applications that need cross-backend rendering should still understand
the attribute path described in [Attributes](./gpu-attributes).

## Storage Buffer Basics

Declare storage bindings in the shader layout:

```ts
const shaderLayout = {
  attributes: [],
  bindings: [
    {name: 'positions', type: 'storage', group: 0, location: 0},
    {name: 'velocities', type: 'storage', group: 0, location: 1}
  ]
};
```

Bind GPU buffers by the same names:

```ts
model.setBindings({
  positions: positionBuffer,
  velocities: velocityBuffer
});
```

or, for compute:

```ts
const computation = new Computation(device, {
  source,
  shaderLayout,
  bindings: {
    positions: positionBuffer,
    velocities: velocityBuffer
  }
});
```

WGSL then sees the raw storage arrays:

```wgsl
@group(0) @binding(auto)
var<storage, read_write> positions: array<vec2<f32>>;

@group(0) @binding(auto)
var<storage, read_write> velocities: array<vec2<f32>>;
```

Use `'read-only-storage'` when the shader only reads from a binding.

## Arrays, Records, and Matrices

Storage buffers become especially useful when the shader reads a well-structured
record array:

```wgsl
struct InstanceRecord {
  modelMatrix: mat4x4<f32>,
  tint: vec4<f32>,
};

@group(0) @binding(auto)
var<storage, read> instances: array<InstanceRecord>;
```

This is not the same thing as vertex attribute layout:

- storage shaders read raw WGSL memory layouts;
- vertex fetch decodes `VertexFormat` values such as normalized colors;
- padding rules matter for storage arrays, structs, and matrix columns.

When one logical row may need both interpretations, choose names and row layouts
with the record view in mind. The engine [`BufferSchema`](./buffer-schemas)
helpers do not generate WGSL structs today, but they intentionally use
record-oriented vocabulary so attribute-side lowering does not fight the storage
mental model.

## Columnar Arrow Data

`@luma.gl/arrow` can upload numeric Arrow columns through `GPUVector`, preserve
them in `GPUTable`, and bind selected columns as storage buffers when the shader
layout declares `storage` or `read-only-storage` inputs.

That supports patterns such as:

- one Arrow matrix column bound as `array<mat4x4<f32>>` for rendering;
- particle positions and velocities updated in place by compute;
- batch-preserving compute dispatch through `TableComputation`.

See [Using Arrow Table Columns with Shaders](./arrow-table-columns) for the full
columnar workflow.

## Compute Pattern

For table vectors, use `TableComputation` when storage bindings should come from
`GPUVector` objects:

```ts
const computation = new TableComputation(device, {
  source: computeShader,
  shaderLayout,
  inputVectors: {
    particlePositions,
    particleVelocities
  }
});

const computePass = device.beginComputePass({});
computation.dispatchBatches(computePass, batch =>
  Math.ceil(batch.numRows / WORKGROUP_SIZE)
);
computePass.end();
```

Single-buffer vectors bind directly. Aggregate multi-batch vectors are rebound
batch-by-batch before dispatch.

## Practical Guidance

- Use storage buffers when WGSL array or struct access is the natural shader
  interface.
- Use attributes when portable WebGL/WebGPU render inputs are required.
- Prefer explicit storage-friendly padding for records that will be read as WGSL
  structs or matrices.
- Do not expect normalized vertex formats such as `unorm8x4` to decode
  automatically in storage shaders.
- Keep storage binding names distinct from attribute input names in the same
  table-backed shader layout.

## Related References

- [Attributes](./gpu-attributes)
- [Buffer Schemas and Columnar Records](./buffer-schemas)
- [Using Arrow Table Columns with Shaders](./arrow-table-columns)
