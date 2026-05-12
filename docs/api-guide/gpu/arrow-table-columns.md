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

## Arrow GPU Objects

`ArrowGPUVector` and `ArrowGPUTable` are GPU-side representations derived from
Apache Arrow data. Arrow vectors and tables are construction inputs; the GPU
objects do not retain references to those sources after extracting the buffer
data and metadata they need.

An `ArrowGPUTable` owns GPU buffers and a GPU-facing Arrow `Schema` for the
selected shader attributes. Field names, types, nullability, and metadata live in
`arrowGPUTable.schema.fields`. An `ArrowGPUVector` references one GPU buffer and
uses Arrow's type system to describe it through `type`, `length`, and `stride`.
Vectors created from Arrow data own their generated buffers. Vectors wrapping
existing buffers are non-owning by default unless `ownsBuffer` is supplied.
In-place operations may transfer ownership to a new vector view over the same
buffer, so the returned vector becomes responsible for destroying the buffer.

```ts
import {ArrowGPUTable, ArrowGPUVector} from '@luma.gl/arrow';

const arrowGPUTable = new ArrowGPUTable(device, table, {shaderLayout});

// The schema describes the selected GPU columns, not necessarily the full table.
const [colorField] = arrowGPUTable.schema.fields;

// Each GPU vector has a buffer plus Arrow-derived type/shape metadata.
const colorVector: ArrowGPUVector = arrowGPUTable.gpuVectors.instanceColors;
```

`ArrowModel` is the convenience wrapper that combines `ArrowGPUTable` with
`Model`. It accepts an Arrow table as an update source and replaces the GPU
representation when `setProps({arrowTable})` is called.

`StreamingArrowGPUTable` uses the same shader attribute selection model but keeps
`DynamicBuffer` attributes that can grow as record batches arrive. Use it when
the table is append-only and model attribute objects should remain stable across
buffer reallocations.

```ts
import {StreamingArrowGPUTable} from '@luma.gl/arrow';

const streamingTable = new StreamingArrowGPUTable({
  device,
  schema,
  shaderLayout
});

model.setBufferLayout(streamingTable.bufferLayout);
model.setAttributes(streamingTable.attributes);

streamingTable.appendRecordBatch(recordBatch);
model.setInstanceCount(streamingTable.numRows);
```

The constructor can also consume synchronous record batch iterators immediately,
or async record batch iterators when a schema is provided:

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
