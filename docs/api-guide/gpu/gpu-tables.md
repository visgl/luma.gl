# GPU Tables

`@luma.gl/tables` represents row-aligned application data as typed GPU columns. A
`GPUTable` is useful when the same data must feed rendering, transforms, or compute
without first converting every row into JavaScript objects or one model-specific
buffer structure.

Use a GPU table when:

- application data already has a columnar shape, commonly from Apache Arrow;
- columns must remain aligned while source record batches stream independently;
- one model may consume columns as attributes while another consumes storage buffers;
- optional style columns should be replaceable by one constant value;
- GPU buffer ownership, packing, and destruction must be explicit.

Use ordinary buffers or geometry when the input is already one fixed mesh. Use
uniforms for model-wide values that are not part of a tabular input contract. Keep
using an Arrow `Table` when the CPU still needs Arrow queries or row access: a
`GPUTable` is a GPU representation, not a CPU dataframe.

## Object Model

| Object | Meaning |
| --- | --- |
| `GPUTable` | Logical schema, columns, row count, and preserved physical batches. |
| `GPUVector` | One varying logical column over ordered `GPUData` chunks. |
| `GPUConstant` | One fixed-width value shared by every logical table row. |
| `GPURecordBatch` | One physical row range containing batch-local `GPUData`. |
| `GPUData` | One owned or borrowed GPU buffer range and its row layout. |
| `GPUInputSchema` | A model's mapping from logical columns to shader inputs. |
| `GPUTableShaderBindings` | Backend-specific, draw-ready resources prepared from a table. |

The central distinction is logical versus physical state. `table.gpuColumns`
contains both vectors and constants. `table.batches[n].gpuData` contains only
physical varying chunks. Constants do not pretend to be repeated `GPUData` and do
not appear in `table.bufferLayout`.

## Constructing A Table

```ts
import {GPUConstant, GPUTable} from '@luma.gl/tables';

const table = new GPUTable({
  columns: {
    positions,
    colors: new GPUConstant({
      format: 'unorm8x4',
      value: new Uint8Array([60, 150, 255, 220])
    }),
    radii: new GPUConstant({
      format: 'float32',
      value: new Float32Array([4])
    })
  }
});
```

The varying `positions` vector determines `numRows`. If every column is constant,
provide it explicitly:

```ts
const table = new GPUTable({
  columns: {color: constantColor},
  numRows: 10_000
});
```

`GPUConstant` stores raw bytes in the declared `VertexFormat`. Normalized formats
therefore use integer payloads, such as `Uint8Array` for `unorm8x4`.

## Declaring Shader Inputs

A model publishes one `GPUInputSchema` independent of the backend:

```ts
const pointInputs = [
  {
    columnName: 'positions',
    attributeName: 'positions',
    storageBindingName: 'pointPositions',
    kind: 'positions',
    required: true,
    formats: ['float32x2']
  },
  {
    columnName: 'colors',
    attributeName: 'colors',
    storageBindingName: 'pointColors',
    kind: 'colors',
    required: false,
    formats: ['unorm8x4']
  }
] as const satisfies GPUInputSchema;
```

Required inputs must be varying vectors. Optional fixed-width inputs may be vectors,
constants, or absent. `attributeName` and `storageBindingName` allow the same logical table
to feed attribute-backed and storage-backed shaders.

## Preparing Bindings

```ts
const prepared = new GPUTableShaderBindings(device, {
  table,
  gpuInputSchema: pointInputs,
  shaderLayout
});

for (const batch of prepared.batches) {
  model.setBufferLayout(prepared.bufferLayout);
  model.setAttributes(batch.attributes);
  model.setBindings(batch.bindings);
  model.setConstantAttributes(prepared.constantAttributes);
  model.draw(renderPass);
}

prepared.destroy();
table.destroy();
```

`GPUTableModel` performs this preparation and batch rebinding automatically when
given `gpuInputSchema`.

## Backend Behavior

| Input path | Varying column | Constant column |
| --- | --- | --- |
| WebGL attribute | Enabled vertex attribute array. | Disabled array plus the context constant attribute value. |
| WebGPU attribute | Ordinary vertex buffer layout. | One payload buffer with `arrayStride: 0`. |
| WebGPU storage | Batch-local storage range indexed by row. | One-row storage buffer indexed with row multiplier `0`. |

WebGPU storage shaders use the generated module:

```wgsl
let color = pointColors[
  gpuTable_getRowIndex(
    rowIndex,
    gpuTableColumns.pointColorsRowMultiplier
  )
];
```

The multiplier is `1` for a varying column and `0` for a constant. Shader code is
therefore identical for both table representations.

## Interleaving And Constants

Interleaving is physical layout, while a constant is a logical column choice.
Binding preparation removes constant attributes from an interleaved varying layout,
drops empty layouts, and creates backend-specific constant state. Compatible WebGPU
attribute constants are packed into zero-stride buffers by step mode.

Do not encode constants by setting a `GPUData.byteStride` to zero. `GPUData` describes
physical varying chunks. Constant semantics belong to `GPUConstant` and are lowered
only after a shader contract and backend are known.

## Streaming, Packing, And Updates

Arrow conversion preserves source record batches. Drawing therefore binds one
prepared batch at a time. Call `table.packBatches()` explicitly when fewer, larger
GPU batches are preferable. Table-level constants survive packing unchanged.

`GPUTableShaderBindings.updateBindings(nextTable)` replaces table-derived resources
without changing its `GPUInputSchema` or `ShaderLayout`. Compatible owned allocations
are reused. Construct a new bindings object when the shader contract changes.

## Ownership And Memory

- `GPUData` owns or borrows one buffer.
- `GPURecordBatch` owns its retained `GPUData` chunks.
- `GPUTable` owns its retained batches, but constants contain CPU bytes only.
- `GPUTableShaderBindings` owns zero-stride, one-row storage, and multiplier buffers.
- Destroy bindings before or with the model; destroy the table when its physical data
  is no longer needed.

A constant column has the logical length of the table but one payload row. Memory
metrics should distinguish logical expansion from physical allocation. For 10,000
`unorm8x4` colors, a varying vector uses 40,000 payload bytes; a constant uses four
payload bytes plus any backend alignment or multiplier-buffer overhead.

## Diagnostics

- **Mismatched rows:** varying chunks at the same batch index must have equal lengths.
- **Wrong constant type:** the typed-array constructor and byte length must exactly
  match the declared vertex format.
- **Constant required input:** change the schema declaration to optional only when the
  model genuinely supports constant semantics.
- **Missing storage binding:** optional absence still needs a model-specific fallback
  if the shader statically declares and reads the binding.
- **Stale layout:** call `updateBindings()` or `GPUTableModel.setProps({table})` after
  replacing a table.
- **Growing memory:** destroy superseded binding objects and tables; neither relies on
  garbage collection for GPU resources.

See the [`GPUTable`](/docs/api-reference/tables/gpu-table),
[`GPUConstant`](/docs/api-reference/tables/gpu-constant), and
[`GPUTableShaderBindings`](/docs/api-reference/tables/gpu-table-shader-bindings)
references for exact contracts.
