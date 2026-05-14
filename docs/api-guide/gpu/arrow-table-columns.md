# Using Arrow Table Columns with Shaders

Apache Arrow tables store data in typed columns. luma.gl shaders consume typed vertex
attributes. The `@luma.gl/arrow` helpers connect those two models by deriving a
`BufferLayout` from an Arrow table and a shader `ShaderLayout`.

## Apache Arrow Preliminaries

Apache Arrow has a rich type system that can represent a wide variety of binary
data columns. A subset of these column types can be used directly as GPU vertex
attribute data, meaning that such arrow columns can be uploaded efficiently to the GPU.

Apache Arrow supports primitive types like `Float32`, `Uint32`, and `Uint8` that
describe the value stored in each row. It also supports fixed-length vectors of
these types with `FixedSizeList`. These scalar and fixed-length vector types map
directly to the memory layouts used by GPU vertex attributes.

Arrow also supports variable-length `List` columns. These are useful for data
such as polygons and paths, but they do not map directly to a single vertex
attribute without an additional conversion step.

## Shader and Buffer Layout Preliminaries

luma.gl provides separate descriptions of shader attributes and the buffers that
provide data for those attributes. The key observation here is that shaders only
work with four vertex attribute scalar types (`f32`, `f16`, `i32`, and `u32`),
and there is some flexibility in what binary buffer layouts can feed these
declarations.

- `ShaderLayout` describes what the shader can accept, such as `vec4<f32>`.
- `BufferLayout` describes how the current table column is stored in memory, such as
  `float32x4`, `float16x4`, or `unorm8x4`.

This means the shader does not need to be written specifically for every memory
representation. A shader attribute is declared using the type used in the shader
source code:

```ts
const shaderLayout = {
  attributes: [{name: 'colors', location: 0, type: 'vec4<f32>'}],
  bindings: []
};
```

Then different Arrow table schemas can use different buffer layouts. For the
`vec4<f32>` described in the shader layout, the following buffer formats are all
accepted by the GPU.

| Arrow column type           | Buffer layout format | Notes                                      |
| --------------------------- | -------------------- | ------------------------------------------ |
| `FixedSizeList<Float32, 4>` | `float32x4`          |                                            |
| `FixedSizeList<Float16, 4>` | `float16x4`          | Shader sees f32                            |
| `FixedSizeList<Int16, 4>`   | `snorm16x4`          | Shader sees f32, normalized to [-1.0, 1.0] |
| `FixedSizeList<Uint16, 4>`  | `unorm16x4`          |
| `FixedSizeList<Int8, 4>`    | `snorm8x4`           |
| `FixedSizeList<Uint8, 4>`   | `unorm8x4`           |

## Creating a BufferLayout

Use `getArrowBufferLayout()` with an Arrow table when Arrow column names match
shader attribute names:

```ts
import {getArrowBufferLayout} from '@luma.gl/arrow';

const bufferLayout = getArrowBufferLayout(shaderLayout, {
  arrowTable: table,
  arrowPaths: {
    instanceColors: 'properties.color'
  }
});

const model = new Model(device, {
  vs,
  fs,
  shaderLayout,
  bufferLayout,
  vertexCount
});
```

You can also provide Arrow vectors directly. In this mode, object keys are shader
attribute names:

```ts
const bufferLayout = getArrowBufferLayout(shaderLayout, {
  arrowVectors: {
    instanceColors: table.getChild('properties').getChild('color')
  }
});
```

The generated layouts use shader attribute names as buffer names:

```ts
[
  {name: 'instanceColors', format: 'unorm8x4'}
]
```

## Arrow GPU Object Model

`GPUData`, `GPUVector`, `GPURecordBatch`, and `GPUTable`
are GPU-side representations derived from Apache Arrow data. Arrow vectors,
record batches, and tables are construction inputs; the GPU objects do not
retain references to those sources after extracting the buffer data and metadata
they need.

The object model is batch-preserving by default:

- `GPUTable.batches[]` contains real GPU record batches with batch-local
  buffers.
- Table-level `gpuVectors` aggregate those batch-local chunks through
  `GPUVector.data[]`.
- `GPUData` is the chunk/range primitive. It always points at a
  `DynamicBuffer`, even when that wrapper adopts an existing static GPU buffer.
- `ArrowModel.drawBatches(renderPass)` draws preserved GPU batches by reusing one
  compatible layout/pipeline and rebinding only each batch's attribute buffers.

This means a multi-batch Arrow table stays multi-batch after GPU upload. If the
application prefers fewer draw units, it packs explicitly:

```ts
const arrowGPUTable = new GPUTable(device, table, {shaderLayout});

// Replace preserved batches with one packed batch.
arrowGPUTable.packBatches();

// Or greedily merge adjacent batches until each emitted batch reaches the threshold.
arrowGPUTable.packBatches({minBatchSize: 50_000});
```

Packing mutates the table in place. It rebuilds `batches[]`, table-level
`gpuVectors`, and `attributes`, then destroys only superseded GPU buffers that
were owned by the removed batches. Borrowed external buffers are not destroyed.

### Ownership Rules

- GPU objects created from Arrow data own the GPU storage they allocate.
- GPU objects wrapping caller-supplied buffers are non-owning by default unless
  `ownsBuffer` is requested.
- `GPUData` views are chunk metadata over `DynamicBuffer` storage. They do
  not imply ownership unless explicitly constructed as owning views.
- Detach operations transfer live objects out of the table instead of destroying
  them.
- `destroy()` always follows the current ownership graph. It never destroys
  borrowed buffers.

## GPUData

`GPUData` describes one Arrow-compatible GPU data range. It stores Arrow
type metadata, logical row count, byte offset, row byte stride, and a stable
`DynamicBuffer` handle.

Construction modes:

```ts
// Upload one Arrow Data chunk into a new owned DynamicBuffer.
const gpuData = new GPUData(device, arrowData);

// Describe an existing DynamicBuffer range.
const gpuDataView = new GPUData({
  buffer: dynamicBuffer,
  arrowType,
  length,
  byteOffset,
  byteStride
});
```

Public state:

| Member | Meaning |
| --- | --- |
| `buffer` | Stable `DynamicBuffer` for the uploaded or wrapped storage |
| `type` | Arrow data type |
| `length` | Logical row count |
| `stride` | Scalar values per logical row |
| `byteOffset` | First logical row in the GPU buffer |
| `byteStride` | Bytes between logical rows |
| `ownsBuffer` | Whether `destroy()` releases the buffer |

Public methods:

| Method | Behavior |
| --- | --- |
| `readAsync()` | Reconstructs one Arrow data chunk for supported numeric and fixed-size-list types |
| `destroy()` | Destroys the owned dynamic buffer, if any |

## GPUVector

`GPUVector` is a logical Arrow vector over one or more `GPUData`
chunks. Its `data[]` array is the authoritative storage surface for batch-aware
code.

Construction modes:

| Mode | Use case |
| --- | --- |
| `new GPUVector(device, arrowVector)` | Upload an Arrow vector into owned GPU storage |
| `{type: 'arrow', ...}` | Named upload form used by table helpers |
| `{type: 'buffer', ...}` | Wrap an existing typed GPU buffer |
| `{type: 'interleaved', ...}` | Wrap one interleaved opaque binary row buffer |
| `{type: 'data', ...}` | Aggregate existing `GPUData[]` chunks |
| `{type: 'appendable', ...}` | Create empty growable `DynamicBuffer` storage |

Public state:

| Member | Meaning |
| --- | --- |
| `name` | Vector/table column name |
| `type` | Arrow logical type |
| `length` | Aggregate logical row count |
| `stride` | Scalar values per logical row |
| `byteOffset` | First row offset when the vector has one direct backing buffer |
| `byteStride` | Bytes between logical rows |
| `bufferLayout` | Optional layout for interleaved vectors |
| `data[]` | Ordered GPU data chunks |
| `buffer` | Directly bindable buffer when the vector has exactly one concrete backing surface |
| `ownsBuffer` | Whether the vector owns storage directly or through retained detached vectors |
| `capacityRows` | Current appendable storage capacity in rows, when applicable |

Public methods:

| Method | Behavior |
| --- | --- |
| `addData(gpuData)` | Appends an existing GPU data chunk to the logical vector without adopting its buffer |
| `addToLastData(arrowData)` | Appends one Arrow data chunk into appendable trailing storage |
| `addVectorToLastBatch(arrowVector)` | Appends every Arrow data chunk from an Arrow vector into appendable storage |
| `resetLastBatch()` | Clears appendable logical rows while retaining allocation |
| `readAsync()` | Reads a packed vector back for supported non-interleaved layouts |
| `transferBufferOwnership(target)` | Moves direct buffer ownership to another same-buffer vector view |
| `destroy()` | Releases owned vector storage |

`addToLastBatch(arrowData)` remains as a deprecated alias for
`addToLastData(arrowData)`.

## GPURecordBatch

`GPURecordBatch` is one drawable GPU batch. It owns batch-local vectors,
schema metadata, buffer layout, and model-ready attributes.

Construction modes:

| Mode | Use case |
| --- | --- |
| `new GPURecordBatch(device, recordBatch, props)` | Upload one Arrow record batch |
| `{vectors, ...}` | Build a GPU batch from existing vectors |
| `{type: 'appendable', schema, shaderLayout, ...}` | Create an empty mutable GPU batch |

Public state:

| Member | Meaning |
| --- | --- |
| `schema` | GPU-facing Arrow schema for the selected columns |
| `numRows` | Batch row count |
| `numCols` | Selected GPU column count |
| `nullCount` | Batch null count |
| `bufferLayout` | Layout entries for model binding |
| `gpuVectors` | Batch-local vectors keyed by selected attribute name |
| `attributes` | Batch-local attribute buffers keyed by shader attribute name |

Public methods:

| Method | Behavior |
| --- | --- |
| `addToLastBatch(recordBatch)` | Appends Arrow rows into an appendable batch |
| `resetLastBatch()` | Clears appendable rows while retaining allocations |
| `destroy()` | Destroys owned vectors and their storage |

## GPUTable

`GPUTable` is the table-level owner and mutation surface. It preserves real
GPU batches, exposes aggregate vectors, and controls packing, detaching, and
appendability.

Construction modes:

| Mode | Use case |
| --- | --- |
| `new GPUTable(device, table, props)` | Upload an Arrow table and preserve source record-batch boundaries |
| `{vectors, ...}` | Build one GPU table/batch from existing vectors |
| `{type: 'appendable', schema, shaderLayout, ...}` | Create an empty table with one mutable trailing GPU batch |

The appendable discriminator matters because this form does not upload an
existing Arrow table. It creates empty schema-selected vectors backed by growable
`DynamicBuffer`s so later `addToLastBatch()` calls can append rows in place.

Public state:

| Member | Meaning |
| --- | --- |
| `schema` | GPU-facing Arrow schema for selected columns |
| `numRows` | Aggregate table row count |
| `numCols` | Selected GPU column count |
| `nullCount` | Aggregate null count |
| `bufferLayout` | Layout entries shared by compatible batches |
| `gpuVectors` | Aggregate vectors keyed by shader attribute name |
| `attributes` | Attribute buffers for the first directly drawable batch surface |
| `batches[]` | Real batch-local `GPURecordBatch` objects |

Public methods:

| Method | Behavior |
| --- | --- |
| `packBatches(options?)` | Greedily merges adjacent batches in place; no options collapses all batches into one |
| `addBatch(gpuRecordBatch)` | Adds an already-created GPU batch and rebuilds aggregate vectors |
| `addToLastBatch(recordBatchOrTable)` | Appends Arrow rows into the current trailing appendable GPU batch |
| `resetLastBatch()` | Clears only the current trailing appendable GPU batch |
| `select(...columnNames)` | Destructively keeps requested columns and destroys dropped batch-local vectors |
| `detachVector(columnName)` | Removes one live column and returns an aggregate vector that owns its detached storage |
| `detachBatches({first, last})` | Removes and returns a half-open batch range `[first, last)` |
| `destroy()` | Destroys owned batches and their vectors |

Low-level incremental assembly can stay ownership-explicit with
`arrowGPUTable.addBatch(gpuRecordBatch)` and
`arrowGPUVector.addData(gpuData)`, which aggregate existing GPU objects instead
of allocating replacement tables.

Appendable regular tables use the same table and batch classes:

```ts
const arrowGPUTable = new GPUTable({
  type: 'appendable',
  device,
  schema,
  shaderLayout,
  initialCapacityRows: 4_096
});

arrowGPUTable.addToLastBatch(recordBatch);
arrowGPUTable.addToLastBatch(nextArrowTable);
```

```ts
import {GPUTable, GPUVector} from '@luma.gl/arrow';

const arrowGPUTable = new GPUTable(device, table, {shaderLayout});

// The schema describes the selected GPU columns, not necessarily the full table.
const [colorField] = arrowGPUTable.schema.fields;

// Each GPU vector exposes Arrow-derived type/shape metadata plus GPU data chunks.
const colorVector: GPUVector = arrowGPUTable.gpuVectors.instanceColors;
```

`ArrowModel` is the convenience wrapper that combines `GPUTable` with
`Model`. It accepts an Arrow table as an update source and replaces the GPU
representation when `setProps({arrowTable})` is called. It can also consume an
existing `arrowGPUTable` without taking ownership of that table. Use
`model.drawBatches(renderPass)` to draw preserved static GPU batches with one
pipeline layout while rebinding only batch-local attribute buffers. Packed tables
naturally reduce that to fewer draw calls.

## Mesh Arrow Geometry

`ArrowGeometry` converts Mesh Arrow tables into `GPUGeometry`. This is intended
for loaders.gl-compatible mesh and point-cloud tables that use glTF-style column
names such as `POSITION`, `NORMAL`, `COLOR_0`, and `TEXCOORD_0`.

```ts
import {ArrowGeometry, ArrowModel, type ArrowMeshTable} from '@luma.gl/arrow';

const geometry = new ArrowGeometry(device, {
  arrowMesh,
  interleaved: true
});

const model = new ArrowModel(device, {
  vs,
  fs,
  shaderLayout,
  arrowMesh
});
```

The local `ArrowMeshTable` type is structural and does not add a dependency on
loaders.gl. It intentionally mirrors loaders.gl `MeshArrowTable`: a wrapper with
`shape: 'arrow-table'`, `topology`, optional top-level `indices`, and raw
`data: arrow.Table`.

Mesh Arrow tables use one row per vertex. Vertex attributes are scalar numeric
or `FixedSizeList<numeric, 1 | 2 | 3 | 4>` columns. `ArrowGeometry` normalizes
common glTF semantics to luma.gl shader attribute names:

| Mesh Arrow column | Shader attribute |
| ----------------- | ---------------- |
| `POSITION`        | `positions`      |
| `NORMAL`          | `normals`        |
| `COLOR_0`         | `colors`         |
| `TEXCOORD_0`      | `texCoords`      |
| `TEXCOORD_1`      | `texCoords1`     |

Unknown column names are preserved unless `arrowPaths` maps a shader attribute
name to a specific Arrow column name.

Indexed Mesh Arrow tables follow the loaders.gl convention: a lowercase
`indices: List<Int32>` column stores the full primitive index list in row `0`,
and remaining vertex rows are null. `ArrowGeometry` uploads those indices as a
separate GPU index buffer. If the wrapper has a top-level `indices` accessor and
the Arrow table has no `indices` column, that accessor is used as a fallback.

By default, `ArrowGeometry` packs all selected vertex attributes into one
interleaved vertex buffer and keeps indices separate. Pass `interleaved: false`
to upload one vertex buffer per attribute.

Append-only tables can use the regular `GPUTable` API with one appendable
trailing GPU batch. The trailing batch keeps `DynamicBuffer` attributes stable
across reallocations while the table still participates in ordinary batch
packing, detaching, and `drawBatches()` workflows.

```ts
import {GPUTable} from '@luma.gl/arrow';

const arrowGPUTable = new GPUTable({
  type: 'appendable',
  device,
  schema,
  shaderLayout
});

model.setBufferLayout(arrowGPUTable.bufferLayout);
model.setAttributes(arrowGPUTable.attributes);

arrowGPUTable.addToLastBatch(recordBatch);
model.setInstanceCount(arrowGPUTable.numRows);
```

The existing `StreamingArrowGPUTable` wrapper now delegates to the appendable
`GPUTable` path and only preserves constructor-time synchronous and asynchronous
record batch iterator helpers:

```ts
const streamingTable = new StreamingArrowGPUTable({
  device,
  schema,
  asyncRecordBatches,
  shaderLayout
});

await streamingTable.ready;
```

## Planning Table Buffer Groups

`TableBufferPlanner` is a lower-level helper for applications that already have
column descriptors and need to decide how those columns should consume GPU
buffer bindings. It does not upload buffers, interleave data, or bind storage
buffers. It only returns a plan that describes allocation groups, column
mappings, and which columns should be represented by planner-owned packed or
storage buffers.

Use it when a table has more columns than the target device can expose as
separate vertex buffers, or when row-geometry data may later be read from WebGPU
storage buffers instead of expanded into per-vertex attributes.

```ts
import {TableBufferPlanner} from '@luma.gl/arrow';

const plan = TableBufferPlanner.getAllocationPlan({
  device,
  modelInfo: {isInstanced: true},
  generateConstantAttributes: device.type === 'webgpu',
  columns: [
    {
      id: 'positions',
      byteStride: 8,
      byteLength: 8 * 4,
      rowCount: 4,
      stepMode: 'vertex',
      supportsPackedBuffer: true
    },
    {
      id: 'instancePositions',
      byteStride: 12,
      byteLength: 12 * table.numRows,
      rowCount: table.numRows,
      stepMode: 'instance',
      isPosition: true,
      supportsPackedBuffer: true,
      priority: 'high'
    },
    {
      id: 'instanceColors',
      byteStride: 4,
      byteLength: 4 * table.numRows,
      rowCount: table.numRows,
      stepMode: 'instance',
      supportsPackedBuffer: true
    }
  ]
});
```

The planner supports two modes:

- `table-with-shared-geometry`: one reusable geometry is drawn once for each
  table row. Vertex-rate columns describe the shared geometry; table columns are
  usually instance-rate attributes.
- `table-with-row-geometries`: each table row expands into its own generated
  vertices, such as paths or polygons. Constants are planned as a one-row
  instance-rate group.

The returned `plan.groups` describe physical allocation groups such as
`separate-attribute-column`, `interleaved-attribute-columns`,
`position-attribute-columns`, and `interleaved-constant-attribute-columns`.
`plan.mappingsByColumnId` maps each source column to shader-visible attribute
names and group ids. `plan.packedColumnIds` identifies columns that callers may
pack into planner-owned vertex buffers.

When `useStorageBuffers` is enabled, WebGPU row-geometry data columns may be
assigned to `separate-storage-column` or `stacked-storage-columns` groups. This
is planner output only in the current arrow module; callers still need their own
storage-buffer upload and shader binding path. Storage planning observes
`maxStorageBuffersPerShaderStage`, `maxStorageBufferBindingSize`, and uses
256-byte alignment for stacked column offsets.

## Supported Shader Types

Arrow scalar numeric columns map to scalar shader attributes. Arrow
`FixedSizeList<numeric, 2 | 3 | 4>` columns map to vector shader attributes.

| Shader attribute type | Portable Arrow columns                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `f32`                 | `Float32`, `Float16`, `Int8`, `Uint8`, `Int16`, `Uint16`                                                                                                             |
| `vec2<f32>`           | `FixedSizeList<Float32, 2>`, `FixedSizeList<Float16, 2>`, `FixedSizeList<Int8, 2>`, `FixedSizeList<Uint8, 2>`, `FixedSizeList<Int16, 2>`, `FixedSizeList<Uint16, 2>` |
| `vec3<f32>`           | `FixedSizeList<Float32, 3>`                                                                                                                                          |
| `vec4<f32>`           | `FixedSizeList<Float32, 4>`, `FixedSizeList<Float16, 4>`, `FixedSizeList<Int8, 4>`, `FixedSizeList<Uint8, 4>`, `FixedSizeList<Int16, 4>`, `FixedSizeList<Uint16, 4>` |
| `f16`                 | `Float16`, `Int8`, `Uint8`, `Int16`, `Uint16`                                                                                                                        |
| `vec2<f16>`           | `FixedSizeList<Float16, 2>`, `FixedSizeList<Int8, 2>`, `FixedSizeList<Uint8, 2>`, `FixedSizeList<Int16, 2>`, `FixedSizeList<Uint16, 2>`                              |
| `vec3<f16>`           | None in portable WebGPU layouts                                                                                                                                      |
| `vec4<f16>`           | `FixedSizeList<Float16, 4>`, `FixedSizeList<Int8, 4>`, `FixedSizeList<Uint8, 4>`, `FixedSizeList<Int16, 4>`, `FixedSizeList<Uint16, 4>`                              |
| `i32`                 | `Int8`, `Int16`, `Int32`                                                                                                                                             |
| `vec2<i32>`           | `FixedSizeList<Int8, 2>`, `FixedSizeList<Int16, 2>`, `FixedSizeList<Int32, 2>`                                                                                       |
| `vec3<i32>`           | `FixedSizeList<Int32, 3>`                                                                                                                                            |
| `vec4<i32>`           | `FixedSizeList<Int8, 4>`, `FixedSizeList<Int16, 4>`, `FixedSizeList<Int32, 4>`                                                                                       |
| `u32`                 | `Uint8`, `Uint16`, `Uint32`                                                                                                                                          |
| `vec2<u32>`           | `FixedSizeList<Uint8, 2>`, `FixedSizeList<Uint16, 2>`, `FixedSizeList<Uint32, 2>`                                                                                    |
| `vec3<u32>`           | `FixedSizeList<Uint32, 3>`                                                                                                                                           |
| `vec4<u32>`           | `FixedSizeList<Uint8, 4>`, `FixedSizeList<Uint16, 4>`, `FixedSizeList<Uint32, 4>`                                                                                    |

Component counts must match. For example, `FixedSizeList<Uint8, 4>` can feed
`vec4<f32>`, but not `vec3<f32>`.

For `f32` and `f16` shader attributes, integer Arrow columns are read through
normalized vertex formats (`snorm*` for signed integers and `unorm*` for unsigned
integers).

## WebGPU Portability

WebGPU does not support every vertex format that WebGL can read. In particular,
3-component 8-bit and 16-bit integer-backed columns are not portable. By default,
`getArrowBufferLayout()` rejects those mappings with an error.

Shaders that declare `f16` attributes have an additional capability requirement.
Before creating a WebGPU device, check `adapter.features.has('shader-f16')`, request
that feature when creating the device, and include `enable f16;` in WGSL. Without
that feature, WebGPU rejects shader modules that use `f16` types.

For WebGL-only use cases, opt in to WebGL-only formats:

```ts
const bufferLayout = getArrowBufferLayout(shaderLayout, {
  arrowTable: table,
  allowWebGLOnlyFormats: true
});
```

For portable WebGPU layouts, prefer `Float32` for `vec3<f32>` attributes or pad
8-bit and 16-bit vector data to four components.

## Related References

- [Attributes](./gpu-attributes)
- [ShaderLayout](/docs/api-reference/core/shader-layout)
- [BufferLayout](/docs/api-reference/core/buffer-layout)
- [Vertex Formats](/docs/api-reference/core/vertex-formats)
