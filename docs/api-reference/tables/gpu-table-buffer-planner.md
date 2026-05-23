# GPUTableBufferPlanner

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GPUTableBufferPlanner` builds deterministic GPU buffer allocation plans from
abstract table column descriptors. It is the lower-level planner used when a
table-backed renderer needs to decide which columns become dedicated vertex
buffers, interleaved vertex buffers, storage buffers, or externally managed
attributes.

The planner does not inspect Arrow vectors, allocate GPU buffers, upload data,
pack typed arrays, or bind model resources. Callers derive descriptors from
their own table and shader metadata, then consume the returned plan.

## Usage

```ts
import {GPUTableBufferPlanner, type GPUTableColumnDescriptor} from '@luma.gl/tables';

const columns: GPUTableColumnDescriptor[] = [
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
];

const plan = GPUTableBufferPlanner.getAllocationPlan({
  device,
  columns,
  modelInfo: {
    isInstanced: true,
    reservedVertexBufferCount: 1
  },
  generateConstantAttributes: device.type === 'webgpu'
});
```

Use `plan.groups` to allocate and publish buffers, and use
`plan.mappingsByColumnId` to connect source columns to shader-visible attribute
names or storage-buffer offsets.

## Methods

### `GPUTableBufferPlanner.getAllocationPlan(props)`

Classifies columns, assigns allocation groups, validates device limits, and
returns a `GPUTableBufferPlan`.

| Prop | Type | Default | Meaning |
| --- | --- | --- | --- |
| `device` | `Device` | Required | Device whose vertex-buffer and storage-buffer limits constrain the plan. |
| `columns` | `GPUTableColumnDescriptor[]` | Required | Candidate source table columns. |
| `modelInfo` | `GPUTableBufferPlannerModelInfo` | `{}` | Model geometry hints, including instancing and already-reserved vertex-buffer slots. |
| `mode` | `GPUTableBufferPlannerMode` | Derived from `modelInfo.isInstanced` | Explicit table-to-geometry mapping mode. |
| `useStorageBuffers` | `boolean` | `false` | Enables WebGPU storage-buffer planning for row-geometry table columns. |
| `generateConstantAttributes` | `boolean` | `false` | Materializes constant columns, and fp64 position low components, into small planner-owned buffers. |

### `GPUTableBufferPlanner.shouldSkipColumnBuffer(column)`

Returns whether a caller should compute CPU values for a column but skip
creating its own standalone GPU buffer because the planner can publish that
column through planner-managed buffers.

The method returns `false` for indexed columns, transition-owned columns,
external-buffer-only columns, non-position fp64 columns, unsupported `noAlloc`
columns, and columns whose `stepMode` is not `vertex` or `instance`.

## Planner Modes

| Mode | Use when | Behavior |
| --- | --- | --- |
| `table-with-shared-geometry` | One reusable geometry is drawn once for each table row. | Vertex-rate columns describe shared geometry; table columns usually become instance-rate attributes. |
| `table-with-row-geometries` | Each table row expands into its own generated vertices, such as paths or polygons. | Position columns stay vertex attributes; ordinary data columns may use WebGPU storage buffers when enabled. |

If `mode` is omitted, `modelInfo.isInstanced === false` selects
`table-with-row-geometries`; all other values select
`table-with-shared-geometry`.

## Column Descriptors

`GPUTableColumnDescriptor` is the planner input for one source table column.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | Stable source column id, usually the shader attribute id. |
| `byteStride` | `number` | Bytes this column contributes to an interleaved vertex attribute buffer. |
| `byteLength` | `number` | Byte length of the original column when represented as storage data. |
| `rowCount` | `number` | Number of rows materialized for this column. |
| `stepMode` | `'vertex' \| 'instance'` | Vertex input step mode this column would publish to a model. |
| `isPosition` | `boolean` | Marks a geometry-defining position column. |
| `isConstant` | `boolean` | Marks a column currently represented by one constant value. |
| `isIndexed` | `boolean` | Marks an index buffer column, which remains unmanaged. |
| `isTransition` | `boolean` | Marks a column currently controlled by transitions, which remains unmanaged. |
| `isExternalBufferOnly` | `boolean` | Marks a column backed only by an external GPU buffer and no CPU value to pack. |
| `isDoublePrecision` | `boolean` | Marks an fp64 source column. Only position fp64 columns are planner-managed. |
| `noAlloc` | `boolean` | Requests that the column avoid standalone GPU allocation. |
| `allowNoAllocManaged` | `boolean` | Allows a generated, CPU-backed `noAlloc` column to be packed by the planner. |
| `supportsPackedBuffer` | `boolean` | Whether the column can be copied into planner-owned packed buffers. |
| `isGeneratedRowGeometry` | `boolean` | Keeps a generated row-geometry column as a vertex attribute instead of storage data. |
| `priority` | `'high' \| 'medium' \| 'low'` | Priority for receiving a separate vertex-buffer binding. |

## Allocation Groups

`plan.groups` is an ordered list of `GPUTableBufferGroup` objects. Each group
describes one physical allocation, or one externally managed column that the
caller must keep publishing through its existing path.

| Group kind | Meaning |
| --- | --- |
| `interleaved-shared-geometry-columns` | One interleaved vertex buffer for reusable shared-geometry columns. |
| `position-attribute-columns` | Position columns, including fp64 high components for position attributes. |
| `interleaved-constant-attribute-columns` | One small interleaved buffer for constant columns and fp64 position low components. |
| `separate-attribute-column` | One dedicated vertex-buffer binding for one attribute column. |
| `interleaved-attribute-columns` | One interleaved vertex-buffer binding shared by lower-priority attribute columns. |
| `separate-storage-column` | One WebGPU storage-buffer binding dedicated to one original table column. |
| `stacked-storage-columns` | One WebGPU storage-buffer binding containing multiple whole-column slices at aligned offsets. |
| `unmanaged-attribute-column` | A column that keeps its existing external allocation or publication path. |

For vertex-buffer groups, `columns` identifies the planned attribute views in
that allocation. For storage-buffer groups, `byteLength` and `byteOffsets`
describe whole-column storage slices.

## Planner Output

`GPUTableBufferPlan` contains forward and reverse lookup tables for downstream
buffer publication.

| Field | Type | Meaning |
| --- | --- | --- |
| `groups` | `GPUTableBufferGroup[]` | Ordered allocation groups to publish to a model. |
| `groupsByColumnId` | `Record<string, GPUTableBufferGroup[]>` | Reverse lookup from source column id to groups containing that column. |
| `mappingsByColumnId` | `Record<string, GPUTableBufferMapping[]>` | Reverse lookup from source column id to shader/model binding names and offsets. |
| `packedColumnIds` | `Set<string>` | Columns represented by planner-owned vertex buffers. |
| `storageColumnIds` | `Set<string>` | Columns represented by storage-buffer groups. |

`GPUTableBufferMapping.attributeName` is normally the source column id. For fp64
position low components, the planner appends `64Low`, for example
`instanceSourcePositions64Low`.

## Storage Buffer Planning

Storage-buffer planning is opt-in and only applies when all of these are true:

- `useStorageBuffers` is `true`.
- `device.type` is `webgpu`.
- The active mode is `table-with-row-geometries`.
- The column is an ordinary data column, not a position, constant, generated
  row-geometry, unmanaged, or unsupported column.

Eligible row-geometry data columns use `separate-storage-column` while storage
bindings are available. Overflow columns may be packed into one
`stacked-storage-columns` group with 256-byte-aligned offsets. Columns fall back
to vertex-buffer planning when storage binding count or binding size limits
would be exceeded.

The planner returns storage-buffer groups only as a layout decision. Callers
still need to allocate GPU buffers, upload data, and bind those storage buffers
in their shader pipeline.

## Validation

`getAllocationPlan()` validates the plan against these device limits:

- `maxVertexBuffers`, after accounting for
  `modelInfo.reservedVertexBufferCount`.
- `maxVertexBufferArrayStride`, for planner-owned interleaved vertex groups.
- `maxStorageBuffersPerShaderStage`, for WebGPU storage-buffer groups.
- `maxStorageBufferBindingSize`, for separate and stacked storage-buffer
  groups.

The planner sorts columns by id and priority before assigning scarce dedicated
buffer bindings, so equivalent inputs produce stable plans regardless of input
order.
