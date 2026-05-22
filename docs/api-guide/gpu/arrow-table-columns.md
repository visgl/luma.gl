# Using Arrow Table Columns with Shaders

Apache Arrow tables store data in typed columns. luma.gl can expose selected
columns as typed vertex attributes, WebGPU storage bindings, or higher-level
table-backed render and compute objects. The `@luma.gl/arrow` helpers connect
those models by deriving a `BufferLayout`, GPU table objects, and storage-buffer
bindings from Arrow data plus a shader `ShaderLayout`.

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
attribute without an additional conversion step. `ArrowPathModel` provides the
attribute-backed conversion for prepared Float32 XY, XYZ, and XYZM path coordinate
rows, expanding each logical path into segment instances while keeping row-level
style columns at the path boundary. `ArrowStoragePathModel` provides the WebGPU
storage-backed form: compute expands GPU-resident path values into compact indexed
segment records from copied list-offset metadata, render shaders fetch coordinates
from the original path-value storage buffer, and per-path style rows remain storage
bindings instead of being repeated for every generated segment. Use
`ArrowPathModel.prepareGPUVectors()` or `prepareArrowPathGPUVectors()` to turn raw
Float32 or Float64 Arrow path vectors into prepared attribute-path inputs. Use
`ArrowStoragePathModel.prepareGPUVectors()` or `prepareArrowStoragePathGPUVectors()`
when WebGPU storage rendering should convert Float64 path payloads into Float32
deltas on the GPU before rendering.

## Arrow Column Support

Support depends on how the column is consumed. A column can be uploadable as a
`GPUVector` without also being usable as a generic vertex attribute.

| Arrow vector type | Generic GPU upload | Shader-facing use | Higher-level model support |
| --- | --- | --- | --- |
| `Vector<Int8 \| Uint8 \| Int16 \| Uint16 \| Int32 \| Uint32 \| Float16 \| Float32>` | Yes, as scalar `GPUVector` or selected `GPUTable` columns. | Scalar attributes or storage rows, subject to shader type and vertex format compatibility. | Numeric table workflows and scalar style rows such as text angles, text sizes, and path widths. |
| `Vector<Uint64>` carrying DGGS cell keys | Yes, through DGGS WebGPU helpers that retain Uint64 rows as word-pair storage. | Read through DGGS WGSL helpers or expand through `prepareDggsCellPathGPUVector()`; not a generic vertex attribute. | Global grid cell keys parsed from UTF-8 geohash, quadkey, S2, A5, or H3 IDs. |
| `Vector<FixedSizeList<numeric, 1 \| 2 \| 3 \| 4>>` | Yes, as fixed-width GPU rows. | Vector attributes or storage rows; 3-component 8-bit and 16-bit integer formats are WebGL-only unless padded. | Positions, colors, pixel offsets, clip rectangles, mesh attributes, and path style rows. |
| `Vector<FixedSizeList<Float32 \| Float64, 4>>` with luma `mat2x2` metadata | Yes, through `prepareArrowMatrixGPUVector()`. Canonical output is Float32 column-major `wgsl-storage`; Float64 truncates to Float32 during preparation. | `mat2x2<f32>` storage rows or two lowered matrix-column attributes. | Compact 2D linear transforms. |
| `Vector<FixedSizeList<Float32 \| Float64, 6 packed \| 8 wgsl-storage>>` with luma `mat2x3` metadata | Yes, through `prepareArrowMatrixGPUVector()`. Packed sources normalize to eight-float Float32 WGSL-storage rows. | `mat2x3<f32>` storage rows or two lowered matrix-column attributes with WGSL three-row padding. | 2-column affine-style transforms with three row components. |
| `Vector<FixedSizeList<Float32 \| Float64, 6>>` with luma `mat3x2` metadata | Yes, through `prepareArrowMatrixGPUVector()`. Canonical output is Float32 column-major `wgsl-storage`; Float64 truncates to Float32 during preparation. | `mat3x2<f32>` storage rows or three lowered matrix-column attributes. | Three-column transforms with two row components. |
| `Vector<FixedSizeList<Float32 \| Float64, 9 packed \| 12 wgsl-storage>>` with luma `mat3x3` metadata | Yes, through `prepareArrowMatrixGPUVector()`. Packed sources normalize to twelve-float Float32 WGSL-storage rows. | `mat3x3<f32>` storage rows or three lowered matrix-column attributes with WGSL three-row padding. | 2D/3D linear transforms and rotation/scale bases. |
| `Vector<FixedSizeList<Float32 \| Float64, 12 packed \| 16 wgsl-storage>>` with luma `mat4x3` metadata | Yes, through `prepareArrowMatrixGPUVector()`. Packed sources normalize to sixteen-float Float32 WGSL-storage rows. | `mat4x3<f32>` storage rows or four lowered matrix-column attributes with WGSL three-row padding. | deck.gl `SimpleMeshLayer` and `ScenegraphLayer` consume a 4x4 accessor as this affine GPU payload: three model-matrix `vec3` columns plus one translation `vec3`. |
| `Vector<FixedSizeList<Float32 \| Float64, 12>>` with luma `mat3x4` metadata | Yes, through `prepareArrowMatrixGPUVector()`. Canonical output is Float32 column-major `wgsl-storage`; Float64 truncates to Float32 during preparation. | `mat3x4<f32>` storage rows or three lowered matrix-column attributes. | Three-column transforms with four row components. |
| `Vector<FixedSizeList<Float32 \| Float64, 16>>` with luma `mat4x4` metadata | Yes, through `prepareArrowMatrixGPUVector()`. Canonical output is Float32 column-major `wgsl-storage`; Float64 truncates to Float32 during preparation. | `mat4x4<f32>` storage rows or four lowered matrix-column attributes. | Full homogeneous 3D transforms when the consumer retains all four rows. |
| `Vector<Date \| Time \| Timestamp \| Duration>` | Yes, through `prepareArrowTemporalGPUVector()`, which emits relative `Float32` values plus persisted temporal origin metadata. | Scalar relative-time attributes or storage rows in the source Arrow unit. | Generic animated or filtered rows that compare one time value per source row; see the [Time Columns example](/examples/gpu-tables/arrow-time-columns) and [Blinking Stars example](/examples/gpu-tables/arrow-temporal-starfield). |
| `Vector<List<Date \| Time \| Timestamp \| Duration>>` | Yes, through `prepareArrowTemporalGPUVector()`, which preserves list offsets while emitting relative `List<Float32>` values. | Not a single generic vertex attribute; consume through storage/compute code or model-specific expansion. | Trips-style per-path timestamp streams aligned with path vertices, including `ArrowStorageTripsPathModel`. |
| `Vector<Interval>` | No in v1. `Interval` is a compound logical value rather than one scalar time value: Arrow interval variants carry calendar/month and day-time or month-day-nanosecond fields, so there is no single preserved source unit or origin subtraction rule for `prepareArrowTemporalGPUVector()`. | Not supported as a generic scalar temporal attribute or storage row until an explicit interval shader/storage contract exists. | Deferred; callers should lower intervals into application-defined scalar columns when that is the intended comparison model. |
| `Vector<List<Interval>>` | No in v1. The leaf interval value has the same unresolved compound/calendar semantics, and the list form also needs a model-specific variable-length consumption path. | Not supported as generic temporal storage or Trips-style timestamps. | Deferred; Trips-style streams require scalar `Date`, `Time`, `Timestamp`, or `Duration` leaves that normalize to relative `Float32`. |
| `arrow.Vector<List<FixedSizeList<Float32, 2 \| 3 \| 4>>>` | Yes, as flattened GPU path-coordinate values plus copied list-offset metadata. | Not a single generic vertex attribute; `ArrowPathModel` expands prepared rows into segment attributes, while `ArrowStoragePathModel` keeps prepared path values in storage and renders indexed segment records. | `ArrowPathModel.prepareGPUVectors()` uploads these rows unchanged unless closed-path normalization is requested. The resulting `pathProps` and `storagePathProps` feed `ArrowPathModel` and `ArrowStoragePathModel`. |
| `arrow.Vector<List<FixedSizeList<Float64, 2 \| 3 \| 4>>>` | Yes, through path preparation as per-row Float32 deltas plus copied list-offset metadata. CPU Float64 per-row origins are retained separately. | Not a generic vertex attribute. Attribute paths prepare deltas on the CPU; WebGPU storage paths can prepare them once with `fp64arithmetic` `sub_fp64u32_to_f32` before rendering. | `ArrowPathModel.prepareGPUVectors()` and `prepareArrowPathGPUVectors()` prepare attribute paths. `ArrowStoragePathModel.prepareGPUVectors()` and `prepareArrowStoragePathGPUVectors()` prepare storage paths with GPU Float64 subtraction on WebGPU. |
| `Vector<List<numeric \| FixedSizeList<numeric, 1 \| 2 \| 3 \| 4>>>` | Yes, as flattened GPU values plus copied list-offset metadata. | Not a single generic vertex attribute; consume through storage/compute code or model-specific expansion. | Generic variable-length numeric storage/readback. Model support is documented by the model-specific rows above. |
| `Vector<Utf8>` | Yes, as UTF-8 value bytes plus readback metadata. | Not a generic vertex attribute; consume through text-specific UTF-8 and glyph expansion, or parse DGGS cell keys through `prepareDggsCellKeyGPUVector()` when the encoding is supplied. | `ArrowTextModel`, `ArrowStorageTextModel`, and DGGS key parsing. |
| `Vector<Dictionary<Utf8, Int8 \| Int16 \| Int32 \| Uint8 \| Uint16 \| Uint32>>` | Yes, as dictionary index rows; callers keep CPU source vectors for dictionary values when glyph layout needs them. | Not a generic vertex attribute; consume through dictionary-aware text expansion. | `ArrowTextModel`, `ArrowStorageTextModel`, and `ArrowDictionaryTextModel`/`ArrowDictionaryStorageTextModel`. |
| Other Arrow logical types such as `Bool`, `Binary`, `Struct`, `Map`, `Decimal`, `LargeUtf8`, and non-UTF-8 dictionaries | No generic table/vector upload path unless a helper documents a specific use. | Not supported as generic shader columns. | Adapter-specific only; for example `closeArrowPaths()` accepts `Vector<Bool>` closed-path flags as CPU row metadata. |

The [Time Columns example](/examples/gpu-tables/arrow-time-columns) prepares aligned
`DateDay`, `TimeMillisecond`, `TimestampMillisecond`, and
`DurationMillisecond` event rows together with `prepareArrowTemporalGPUVectors()`,
then renders the same relative `Float32` columns as instanced attributes or
WebGPU storage rows. The [Blinking Stars example](/examples/gpu-tables/arrow-temporal-starfield)
uses aligned `TimestampMillisecond` and `DurationMillisecond` rows as per-instance
visibility windows and pulse periods through the same attribute/storage modes.
The path example remains the separate variable-length
`List<FixedSizeList<Float32, 4>>` plus `List<Timestamp>` Trips-style stream
example.

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

## Choosing a Columnar GPU Shape

The main decision is how the shader should read each selected Arrow column.

| GPU-facing shape | Use when | Typical Arrow input |
| --- | --- | --- |
| Vertex attribute | Render or WebGL transform shaders should use fixed scalar/vector inputs | Scalar numeric columns or 2-, 3-, and 4-component fixed-size lists |
| Storage binding | WebGPU render or compute shaders should read/write column arrays directly | Numeric vectors that map cleanly to WGSL storage values |
| Matrix record | One logical matrix should stay one storage binding on WebGPU but split into vector attributes where needed | Arrow matrix vectors created by `makeArrowMatrix*Vector()` |
| Expanded vector | A compact lookup table must become one row per vertex/instance for attribute paths | `expandArrowVector()` plus an integer row map |

Use [Buffer Schemas and Columnar Records](./buffer-schemas) when one logical row
needs several attribute views or when you want record-oriented naming that also
makes sense next to WGSL storage structs.

The GPU representation does not always stay byte-for-byte identical to the
source Arrow representation:

- attribute paths may expand one logical row into several vertex or instance
  records so draw-time buffers match shader stepping;
- storage paths may need type or layout conversion before data becomes
  WGSL-compatible storage;
- device buffer-size limits can require preserved or synthetic batching instead
  of one monolithic GPU upload.

## Matrix Columns

`@luma.gl/arrow` provides explicit matrix vector helpers for the WGSL floating
point matrix shapes used by GPU table workflows:

| Helper | Logical shape |
| --- | --- |
| `makeArrowMatrix2x2Vector()` | `mat2x2<f32>` |
| `makeArrowMatrix2x3Vector()` | `mat2x3<f32>` |
| `makeArrowMatrix3x2Vector()` | `mat3x2<f32>` |
| `makeArrowMatrix3x3Vector()` | `mat3x3<f32>` |
| `makeArrowMatrix4x3Vector()` | `mat4x3<f32>` |
| `makeArrowMatrix3x4Vector()` | `mat3x4<f32>` |
| `makeArrowMatrix4x4Vector()` | `mat4x4<f32>` |

The generic `makeArrowMatrixVector(shape, values, options)` form is available
when the shape is selected dynamically.

```ts
import {makeArrowMatrix4x4Vector} from '@luma.gl/arrow';

const instanceModelMatrix = makeArrowMatrix4x4Vector(matrixValues, {
  order: 'column-major',
  layout: 'wgsl-storage'
});
```

Matrix options:

| Option | Values | Default | Meaning |
| --- | --- | --- | --- |
| `order` | `'column-major' \| 'row-major'` | `'column-major'` | Order of the supplied logical matrix values. GPU-facing vectors are normalized to column-major order. |
| `layout` | `'wgsl-storage' \| 'packed'` | `'wgsl-storage'` | Physical row layout. Three-row matrix columns are padded to four floats for WGSL-compatible storage layout. |

`getArrowMatrixVectorInfo(vector)` recovers the stored matrix metadata, including
shape, row/column counts, matrix order, physical component count, column stride,
value type, and byte stride. `prepareArrowMatrixGPUVector()` accepts metadata-tagged
`FixedSizeList<Float32>` and `FixedSizeList<Float64>` matrix columns, then emits
canonical Float32 WGSL-storage rows for attribute or storage-buffer use.

deck.gl `SimpleMeshLayer` and `ScenegraphLayer` expose `getTransformMatrix` as a
4x4 accessor, but their attribute updater drops the final row and uploads three
`vec3` model-matrix columns plus one `vec3` translation. Arrow callers targeting
those layers can store that GPU-facing affine payload directly as `mat4x3`, or
accept a 4x4 source and explicitly truncate to the affine `mat4x3` payload before
binding it.

Public matrix types:

| Type | Meaning |
| --- | --- |
| `ArrowMatrixShape` | Supported shape identifier such as `'mat4x4'`. |
| `ArrowMatrixOrder` | Input value order: `'column-major'` or `'row-major'`. |
| `ArrowMatrixLayout` | Physical vector layout: `'wgsl-storage'` or `'packed'`. |
| `ArrowMatrixVectorOptions` | Options accepted by the matrix builders. |
| `ArrowMatrixVectorInfo` | Metadata recovered by `getArrowMatrixVectorInfo()`. |
| `ArrowFloat32Matrix2x2` through `ArrowFloat32Matrix4x4` | Fixed-size Arrow row types for each supported matrix shape. |

### One Matrix Column, Two Consumption Paths

On WebGPU, one matrix Arrow column can remain one storage binding:

```ts
const shaderLayout = {
  attributes: [],
  bindings: [
    {
      name: 'instanceModelMatrix',
      type: 'read-only-storage',
      group: 0,
      location: 0
    }
  ]
};
```

```wgsl
@group(0) @binding(auto)
var<storage, read> instanceModelMatrix: array<mat4x4<f32>>;
```

On attribute-oriented paths, map each vector attribute back to the same matrix
column:

```ts
const shaderLayout = {
  attributes: [
    {name: 'instanceModelMatrixCol0', location: 0, type: 'vec4<f32>'},
    {name: 'instanceModelMatrixCol1', location: 1, type: 'vec4<f32>'},
    {name: 'instanceModelMatrixCol2', location: 2, type: 'vec4<f32>'},
    {name: 'instanceModelMatrixCol3', location: 3, type: 'vec4<f32>'}
  ],
  bindings: []
};

const bufferLayout = getArrowBufferLayout(shaderLayout, {
  arrowTable,
  arrowPaths: {
    instanceModelMatrixCol0: 'instanceModelMatrix',
    instanceModelMatrixCol1: 'instanceModelMatrix',
    instanceModelMatrixCol2: 'instanceModelMatrix',
    instanceModelMatrixCol3: 'instanceModelMatrix'
  }
});
```

The Arrow helper recognizes the matrix metadata and lowers the matrix row through
the engine [`BufferSchema`](/docs/api-reference/engine/buffer-schema) path into
one shared interleaved buffer layout.

## Temporal Columns

`prepareArrowTemporalGPUVector()` and `prepareArrowTemporalGPUVectors()` normalize
supported Arrow temporal logical columns into relative Float32 GPU vectors while
retaining the original Arrow unit:

```ts
const preparedTemporalColumns = await prepareArrowTemporalGPUVectors(device, {
  eventStarts,
  eventDurations
});

const eventTable = new GPUTable({
  vectors: {
    eventStarts: preparedTemporalColumns.eventStarts.temporal,
    eventDurations: preparedTemporalColumns.eventDurations.temporal
  }
});
```

Absolute `Date`, `Time`, and `Timestamp` columns choose the first valid scalar
or flattened list value as their relative origin when prepared metadata does not
already carry one. `Duration` columns use origin `0`. The chosen kind, unit,
origin, origin policy, and timestamp timezone metadata are persisted on the
prepared field so repeated transforms and append flows can reuse the same
comparison domain.

Prepared scalar temporal rows can be instanced attributes or WebGPU storage rows.
Prepared `List<temporal>` rows preserve list offsets and are intended for
storage/compute or model-specific expansion, such as
`ArrowStorageTripsPathModel`. `Interval` and `List<Interval>` are intentionally
deferred because Arrow interval leaves have compound calendar semantics rather
than one scalar source unit that can be origin-subtracted without an explicit
application contract.

## DGGS Cell Keys

DGGS helpers provide a WebGPU-only path from compact global grid IDs to Uint64 key
storage and rendered cell boundaries:

```ts
const preparedKeys = prepareDggsCellKeyGPUVector(device, cellIds, {
  encoding: 'geohash'
});
const preparedPaths = prepareDggsCellPathGPUVector(device, preparedKeys.keys, {
  encoding: 'geohash'
});
```

`prepareDggsCellKeyGPUVector()` accepts UTF-8 geohash, quadkey, S2, A5, or H3 IDs
and parses them on the GPU into Uint64 rows. `prepareDggsCellPathGPUVector()`
accepts those Uint64 rows and emits closed `List<FixedSizeList<Float32, 2>>`
boundary paths. The `dggs` shader module exposes the matching WGSL Uint64 word
order and cell-boundary helpers when a shader should read keys directly. See the
[Global Grids example](/examples/gpu-tables/dggs-gpu-polygons).

## Storage-Selected Table Columns

`GPURecordBatch` and `GPUTable` also select Arrow columns referenced by shader
bindings of type `'storage'` or `'read-only-storage'`. Selected storage columns:

- appear in `gpuVectors` by binding name;
- appear in `bindings` by binding name;
- contribute fields to the GPU-facing Arrow schema;
- are rebound batch-by-batch by `ArrowModel.drawBatches(renderPass)`.

This keeps table-backed WebGPU render paths compact. A column such as
`instanceModelMatrix` can be uploaded once through the table machinery and bound
directly to a WGSL storage array without four separate matrix-column bindings.

Storage-selected columns and attribute-selected columns must use distinct shader
input names. A single name cannot be both an attribute and a storage binding in
one `GPURecordBatch`.

## Expanding Compact Column Values

`expandArrowVector(vector, rowMapping)` gathers rows from one numeric Arrow
vector into a new contiguous Arrow vector. It accepts either an integer typed
array or an integer Arrow vector as the row mapping.

Use it when a compact table should become vertex- or instance-aligned data for an
attribute path. The Matrices: `FixedSizeList<Float32, 16>` example uses
this idea for WebGL face colors: a six-row face-color vector is expanded by cube
`faceIndex` rows into a vertex-aligned color vector.

Supported source vectors:

- scalar numeric Arrow vectors;
- `FixedSizeList` numeric vectors.

The helper rejects unsupported vector types, non-integer row mappings, negative
indices, and out-of-range indices.

`ArrowVectorRowMapping` is the exported type name for the accepted mapping input.

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
const arrowGPUTable = makeArrowGPUTable(device, table, {shaderLayout});

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
- `GPUData` is the storage-owning layer. A data view may own its `DynamicBuffer`
  or borrow an existing one, but `GPUVector` never owns raw buffers directly.
- `GPUVector` owns or borrows ordered `GPUData[]` chunks. Its `buffer` accessor
  is only a direct-bind convenience for vectors that resolve to one concrete
  backing surface.
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
const gpuData = makeArrowGPUData(device, arrowData);

// Describe an existing DynamicBuffer range.
const gpuDataView = new GPUData({
  buffer: dynamicBuffer,
  dataType,
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
| `readArrowGPUDataAsync(gpuData)` | Reconstructs one Arrow data chunk for supported numeric and fixed-size-list types |
| `destroy()` | Destroys the owned dynamic buffer, if any |

## GPUVector

`GPUVector` is a logical Arrow vector over one or more `GPUData`
chunks. Its `data[]` array is the authoritative storage surface for batch-aware
code.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeArrowGPUVector(device, arrowVector)` | Upload an Arrow vector into owned GPU storage |
| `makeArrowGPUVector(device, arrowVector, {name})` | Named Arrow upload form used by table helpers |
| `{type: 'buffer', ...}` | Wrap an existing typed GPU buffer |
| `{type: 'interleaved', ...}` | Wrap one interleaved opaque binary row buffer |
| `{type: 'data', ...}` | Aggregate existing `GPUData[]` chunks |
| `makeAppendableArrowGPUVector(device, dataType, props)` | Create empty growable Arrow-backed `DynamicBuffer` storage |

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
| `ownsBuffer` | Whether destruction follows any owning `GPUData` retained by this vector |
| `capacityRows` | Current appendable storage capacity in rows, when applicable |

Public methods:

| Method | Behavior |
| --- | --- |
| `addData(gpuData)` | Appends an existing GPU data chunk to the logical vector without adopting its buffer |
| `appendArrowDataToGPUVector(gpuVector, arrowData)` | Appends one Arrow data chunk into appendable trailing storage |
| `appendArrowVectorToGPUVector(gpuVector, arrowVector)` | Appends every Arrow data chunk from an Arrow vector into appendable storage |
| `resetLastBatch()` | Clears appendable logical rows while retaining allocation |
| `readArrowGPUVectorAsync(gpuVector)` | Reads a packed vector back for supported non-interleaved layouts |
| `transferBufferOwnership(target)` | Moves same-buffer `GPUData` ownership to another vector view |
| `destroy()` | Releases owned vector storage |

## GPURecordBatch

`GPURecordBatch` is one drawable GPU batch. It owns batch-local vectors,
schema metadata, buffer layout, and model-ready attributes.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeArrowGPURecordBatch(device, recordBatch, props)` | Upload one Arrow record batch |
| `{vectors, ...}` | Build a GPU batch from existing vectors |
| `makeAppendableArrowGPURecordBatch({...})` | Create an empty mutable GPU batch |

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
| `bindings` | Batch-local storage buffers keyed by shader binding name |

Public methods:

| Method | Behavior |
| --- | --- |
| `appendArrowRecordBatchToGPURecordBatch(batch, recordBatch)` | Appends Arrow rows into an appendable batch |
| `resetLastBatch()` | Clears appendable rows while retaining allocations |
| `destroy()` | Destroys owned vectors and their storage |

## GPUTable

`GPUTable` is the table-level owner and mutation surface. It preserves real
GPU batches, exposes aggregate vectors, and controls packing, detaching, and
appendability.

Construction modes:

| Mode | Use case |
| --- | --- |
| `makeArrowGPUTable(device, table, props)` | Upload an Arrow table and preserve source record-batch boundaries |
| `{vectors, ...}` | Build one GPU table/batch from existing vectors |
| `makeAppendableArrowGPUTable({...})` | Create an empty table with one mutable trailing GPU batch |

The appendable discriminator matters because this form does not upload an
existing Arrow table. It creates empty schema-selected vectors backed by growable
`DynamicBuffer`s so later `appendArrowBatchToGPUTable()` calls can append rows in place.

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
| `bindings` | Storage buffers for the first directly bindable batch surface |
| `batches[]` | Real batch-local `GPURecordBatch` objects |

Public methods:

| Method | Behavior |
| --- | --- |
| `packBatches(options?)` | Greedily merges adjacent batches in place; no options collapses all batches into one |
| `addBatch(gpuRecordBatch)` | Adds an already-created GPU batch and rebuilds aggregate vectors |
| `appendArrowBatchToGPUTable(table, recordBatchOrTable)` | Appends Arrow rows into the current trailing appendable GPU batch |
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
const arrowGPUTable = makeAppendableArrowGPUTable({
  device,
  schema,
  shaderLayout,
  initialCapacityRows: 4_096
});

appendArrowBatchToGPUTable(arrowGPUTable, recordBatch);
appendArrowBatchToGPUTable(arrowGPUTable, nextArrowTable);
```

```ts
import {makeArrowGPUTable} from '@luma.gl/arrow';
import {GPUVector} from '@luma.gl/tables';

const arrowGPUTable = makeArrowGPUTable(device, table, {shaderLayout});

// The schema describes the selected GPU columns, not necessarily the full table.
const [colorField] = arrowGPUTable.schema.fields;

// Each GPU vector exposes Arrow-derived type/shape metadata plus GPU data chunks.
const colorVector: GPUVector = arrowGPUTable.gpuVectors.instanceColors;
```

## Closing Nested Arrow Paths

`closeArrowPaths()` turns logical closed-path flags into explicit closing
vertices without mutating the input vector. The helper accepts GPU-resident
`List<FixedSizeList<Float32>>` path rows with one to four components per vertex,
an Arrow Bool vector with one closed flag per row, and a non-negative epsilon.
Those Float32 rows can be absolute path coordinates or origin-relative delta
coordinates produced from Float64 path preparation.

```ts
import {closeArrowPaths} from '@luma.gl/arrow';

const normalizedPaths = await closeArrowPaths(device, {
  paths,
  closed,
  epsilon: 1e-5
});
```

The output preserves Arrow chunk boundaries. Open rows, rows already closed
within epsilon, empty rows, and single-point rows are unchanged. Closed rows
whose first and last vertices differ receive one appended copy of the first
vertex. For Float64 source paths, closure happens after CPU conversion to
delta space; if the original last point equals the first, both deltas are zero,
and injected closing vertices append the first delta, usually `[0, 0, ...]`.

## Preparing Arrow Paths for Rendering

Use `ArrowPathModel.prepareGPUVectors()` when raw Arrow vectors need to become
attribute-renderer inputs. Float32 paths upload unchanged unless `closed` flags
are supplied. Float64 paths are converted on the CPU into stable per-row Float32
deltas from the first point of each path. The prepared object also owns CPU
Float64 origins and updates view-space origin buffers when the view or model
matrix changes.

```ts
const prepared = await ArrowPathModel.prepareGPUVectors(device, {
  paths,
  colors,
  widths,
  closed
}, {
  closeEpsilon: 1e-5
});

const pathModel = new ArrowPathModel(device, prepared.pathProps);
const storagePathModel = new ArrowStoragePathModel(device, prepared.storagePathProps);

prepared.updateViewOrigins({modelViewMatrix});

pathModel.destroy();
storagePathModel.destroy();
prepared.destroy();
```

For storage-only WebGPU paths, use the storage preparation entrypoint instead:

```ts
const preparedStorage = await ArrowStoragePathModel.prepareGPUVectors(device, {
  paths,
  colors,
  widths,
  closed
}, {
  closeEpsilon: 1e-5
});

const storagePathModel = new ArrowStoragePathModel(device, preparedStorage.storagePathProps);
```

That path uploads raw Float64 list payloads temporarily, converts them once into
Float32 per-row deltas with `sub_fp64u32_to_f32`, then discards the transient
Float64 GPU upload before returning the prepared storage props.

Path constructors stay `GPUVector`/prepared-state only; raw Arrow path vectors
belong at the preparation boundary. For Float64 paths, shaders should transform
deltas with a zero homogeneous component and add the CPU-updated view origin
before projection.

`ArrowStoragePathModel` keeps the default storage path record compact: each
generated segment stores three `u32` words (`segmentStartPointIndex`,
`segmentFlags`, and `globalRowIndex`) plus a persistent `vec4<u32>` path range
per source row. The storage shader receives `pathRanges` automatically and can
derive end, previous, and next point indices from those ranges and flags.
Custom storage shader layouts that request `segmentEndPointIndices`,
`segmentPreviousPointIndices`, or `segmentNextPointIndices` keep the legacy
six-word segment record layout.

`GPUTableModel` is the generic tables-layer wrapper that combines `GPUTable`
with `Model`. It draws preserved GPU batches, syncs table row counts into the
selected draw count, and leaves table ownership with the caller. `ArrowModel`
keeps the Arrow-facing convenience surface: it accepts an Arrow table as an
update source, replaces the GPU representation when `setProps({arrowTable})`
is called, and can also consume an existing `arrowGPUTable`.

Use `model.drawBatches(renderPass)` to draw preserved static GPU batches with one
pipeline layout while rebinding only batch-local attribute buffers and storage
bindings. Packed tables naturally reduce that to fewer draw calls.

## Table-Backed Render, Transform, and Compute Helpers

The table APIs are meant to feed more than one execution style.

### `GPUTableModel` and `ArrowModel`

Use `GPUTableModel` when a prepared GPU table should drive ordinary rendering:

```ts
const model = new GPUTableModel(device, {
  source,
  shaderLayout,
  table,
  tableCount: 'instance'
});
```

Use `ArrowModel` when selected Arrow table columns should first be adapted into
GPU table storage:

```ts
const model = new ArrowModel(device, {
  source,
  shaderLayout,
  arrowTable,
  arrowCount: 'instance'
});
```

`tableCount` and Arrow's compatibility `arrowCount` choose whether table row
counts become `instanceCount`, `vertexCount`, or neither. Existing `GPUTable`
instances can be supplied through `arrowGPUTable` when ownership should stay
with the caller.

### `TableTransform`

`TableTransform` is the WebGL transform-feedback counterpart. It consumes a
generic `GPUTable`, merges the table attribute layouts into the underlying
`BufferTransform`, accepts already-created `GPUVector` inputs, and can run one
preserved GPU batch at a time. Use `makeArrowGPUTable()` before construction
when the source data starts as an Arrow table:

```ts
const transform = new TableTransform(device, {
  vs,
  varyings,
  shaderLayout,
  table: makeArrowGPUTable(device, arrowTable, {shaderLayout}),
  tableCount: 'vertex'
});

transform.runBatches({
  outputBuffers: (batch, batchIndex) => makeOutputBuffers(batch, batchIndex)
});
```

For a compute-like update path, pass `inputVectors` plus
`copyOutputToInputVectors`. `outputs` is inferred from the copy map when it is
omitted:

```ts
const transform = new TableTransform(device, {
  vs,
  shaderLayout,
  inputVectors: {
    particlePositions,
    particleVelocities
  },
  copyOutputToInputVectors: {
    nextParticlePositions: 'particlePositions',
    nextParticleVelocities: 'particleVelocities'
  }
});
```

Transform feedback writes a dense output stream, so automatic copy-back targets
tightly packed, directly bindable GPUVectors. It can not scatter-copy into
padded or interleaved rows.

Use `TableTransform` only for attribute-backed WebGL transform feedback. It is
not a storage-buffer compute abstraction.

Relevant public types:

| Type | Meaning |
| --- | --- |
| `TableTransformProps` | Construction props, including `table`, `inputVectors`, `copyOutputToInputVectors`, and `tableCount`. |
| `TableTransformBatchOptions` | `runBatches()` options, including fixed or per-batch `outputBuffers`. |

### `TableComputation`

`TableComputation` is the WebGPU compute helper for table vectors exposed as
storage bindings. Supply `GPUVector` objects by binding name:

```ts
const computation = new TableComputation(device, {
  source: computeShader,
  shaderLayout: computeShaderLayout,
  inputVectors: {
    particlePositions,
    particleVelocities
  }
});
```

Direct single-buffer vectors bind once. Multi-batch aggregate vectors use
`dispatchBatches(computePass, batch => workgroupCount)` so each batch is rebound
with the correct storage-buffer range before dispatch.

Relevant public types:

| Type | Meaning |
| --- | --- |
| `TableComputationProps` | Construction props, including ordinary `bindings` plus `inputVectors`. |
| `TableComputationBatch` | Batch metadata passed to a dynamic workgroup-count callback. |

## Mesh Arrow Geometry

`GPUTableGeometry` exposes one packed static `GPUTable` as `GPUGeometry`.
`ArrowTableGeometry` and `makeGPUGeometryFromArrow()` convert loaders.gl-
compatible Mesh Arrow tables into that generic geometry surface. These helpers
support mesh and point-cloud tables that use glTF-style column names such as
`POSITION`, `NORMAL`, `COLOR_0`, and `TEXCOORD_0`.

```ts
import {
  ArrowModel,
  ArrowTableGeometry,
  makeGPUGeometryFromArrow,
  type ArrowMeshTable
} from '@luma.gl/arrow';

const geometry = new ArrowTableGeometry(device, {
  arrowMesh,
  interleaved: true
});

const equivalentGeometry = makeGPUGeometryFromArrow(device, {
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
or `FixedSizeList<numeric, 1 | 2 | 3 | 4>` columns. `ArrowTableGeometry`
normalizes common glTF semantics to luma.gl shader attribute names:

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
and remaining vertex rows are null. `ArrowTableGeometry` uploads those indices
as a separate GPU index buffer. If the wrapper has a top-level `indices`
accessor and the Arrow table has no `indices` column, that accessor is used as a
fallback.

By default, `ArrowTableGeometry` packs all selected vertex attributes into one
interleaved vertex buffer and keeps indices separate. Pass `interleaved: false`
to upload one vertex buffer per attribute. `ArrowGeometry` is retained as a
deprecated compatibility alias.

Append-only tables can use the regular `GPUTable` API with one appendable
trailing GPU batch. The trailing batch keeps `DynamicBuffer` attributes stable
across reallocations while the table still participates in ordinary batch
packing, detaching, and `drawBatches()` workflows.

```ts
import {
  appendArrowBatchToGPUTable,
  makeAppendableArrowGPUTable
} from '@luma.gl/arrow';

const arrowGPUTable = makeAppendableArrowGPUTable({
  device,
  schema,
  shaderLayout
});

model.setBufferLayout(arrowGPUTable.bufferLayout);
model.setAttributes(arrowGPUTable.attributes);

appendArrowBatchToGPUTable(arrowGPUTable, recordBatch);
model.setInstanceCount(arrowGPUTable.numRows);
```

Asynchronous sources stay application-owned. Append yielded record batches into
the same appendable table as they arrive:

```ts
for await (const recordBatch of asyncRecordBatches) {
  appendArrowBatchToGPUTable(arrowGPUTable, recordBatch);
  model.setInstanceCount(arrowGPUTable.numRows);
}
```

If downstream work should preserve source batch boundaries instead of extending
one mutable trailing batch, convert each yielded Arrow batch once and add the
resulting GPU batch:

```ts
import {makeArrowGPURecordBatch, makeArrowGPUTable} from '@luma.gl/arrow';

const arrowGPUTable = makeArrowGPUTable(device, new arrow.Table([firstRecordBatch]), {
  shaderLayout
});

for await (const recordBatch of remainingRecordBatches) {
  arrowGPUTable.addBatch(makeArrowGPURecordBatch(device, recordBatch, {shaderLayout}));
}
```

Text and other generated-geometry paths can then expand each preserved source
GPU batch independently, and may fan one source `GPURecordBatch` out into
multiple generated render batches when device buffer limits require splitting.

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
import {TableBufferPlanner} from '@luma.gl/tables';

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
- [Storage Buffers](./gpu-storage-buffers)
- [Buffer Schemas and Columnar Records](./buffer-schemas)
- [BufferSchema API Reference](/docs/api-reference/engine/buffer-schema)
- [ShaderLayout](/docs/api-reference/core/shader-layout)
- [BufferLayout](/docs/api-reference/core/buffer-layout)
- [Vertex Formats](/docs/api-reference/core/vertex-formats)
