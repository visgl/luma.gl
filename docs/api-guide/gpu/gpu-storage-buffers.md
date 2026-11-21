# Storage Buffers

[GPU Memory](https://luma.gl/docs/api-guide/gpu/gpu-memory.md)[GPU Buffers](https://luma.gl/docs/api-guide/gpu/gpu-buffers.md)[Memory Layouts](https://luma.gl/docs/api-guide/gpu/gpu-memory-layouts.md)[Storage Buffers](https://luma.gl/docs/api-guide/gpu/gpu-storage-buffers.md)

Storage buffers are the flexible WebGPU path for shader-visible data that should be read or written as ordinary WGSL arrays and structs. They are not available in WebGL, so applications that need cross-backend rendering should still understand the attribute path described in [Attributes](https://luma.gl/docs/api-guide/gpu/gpu-attributes.md).

For a side-by-side treatment of tabular columns through attributes and storage, including packed integers and storage alignment, see [Tabular Data in WGSL](https://luma.gl/docs/api-guide/gpu/tabular-data-in-wgsl.md).

## Storage Buffer Basics[​](#storage-buffer-basics "Direct link to Storage Buffer Basics")

Declare storage bindings in the shader layout:

```
const shaderLayout = {

  attributes: [],

  bindings: [

    {name: 'positions', type: 'storage', group: 0, location: 0},

    {name: 'velocities', type: 'storage', group: 0, location: 1}

  ]

};
```

Bind GPU buffers by the same names:

```
model.setBindings({

  positions: positionBuffer,

  velocities: velocityBuffer

});
```

or, for compute:

```
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

```
@group(0) @binding(auto)

var<storage, read_write> positions: array<vec2<f32>>;



@group(0) @binding(auto)

var<storage, read_write> velocities: array<vec2<f32>>;
```

Use `'read-only-storage'` when the shader only reads from a binding.

## Arrays, Records, and Matrices[​](#arrays-records-and-matrices "Direct link to Arrays, Records, and Matrices")

Storage buffers become especially useful when the shader reads a well-structured record array:

```
struct InstanceRecord {

  modelMatrix: mat4x4<f32>,

  tint: vec4<f32>,

};



@group(0) @binding(auto)

var<storage, read> instances: array<InstanceRecord>;
```

This is not the same thing as vertex attribute layout:

* storage shaders read raw WGSL memory layouts;
* vertex fetch decodes `VertexFormat` values such as normalized colors;
* padding rules matter for storage arrays, structs, and matrix columns.

When one logical row may need both interpretations, choose names and row layouts with the record view in mind. Describe attribute-side views directly with `BufferLayout`; keep the corresponding WGSL struct or matrix layout explicit in the shader.

## Compute Pattern[​](#compute-pattern "Direct link to Compute Pattern")

For table vectors, use `GPUTableComputation` when storage bindings should come from `GPUVector` objects:

```
const computation = new GPUTableComputation(device, {

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

Single-buffer vectors bind directly. Aggregate multi-batch vectors are rebound batch-by-batch before dispatch.

## Practical Guidance[​](#practical-guidance "Direct link to Practical Guidance")

* Use storage buffers when WGSL array or struct access is the natural shader interface.
* Use attributes when portable WebGL/WebGPU render inputs are required.
* Prefer explicit storage-friendly padding for records that will be read as WGSL structs or matrices.
* Do not expect normalized vertex formats such as `unorm8x4` to decode automatically in storage shaders.
* Keep storage binding names distinct from attribute input names in the same table-backed shader layout.

## Related References[​](#related-references "Direct link to Related References")

* [Attributes](https://luma.gl/docs/api-guide/gpu/gpu-attributes.md)
* [Tabular Data in WGSL](https://luma.gl/docs/api-guide/gpu/tabular-data-in-wgsl.md)
* [GPU Tables](https://luma.gl/docs/api-guide/gpu/gpu-tables.md)
* [GPU Table Lifecycle](https://luma.gl/docs/api-reference/experimental/gpu-tables/gpu-table-lifecycle.md)
