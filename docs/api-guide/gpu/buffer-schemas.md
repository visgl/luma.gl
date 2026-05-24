# Buffer Schemas and Columnar Records

Columnar GPU workflows often start with separate typed columns, but shaders do
not always consume those columns one-for-one. Common cases include:

- one logical transform record exposed as several vertex attributes;
- one packed metadata row split into multiple shader inputs;
- one current row plus a neighboring next row for segment processing;
- one storage-friendly record representation that should remain easy to reason
  about in WGSL.

`@luma.gl/engine` provides `BufferSchema` as a small record description for
those cases. Today the public lowering helper,
`getAttributeLayoutFromBufferSchema()`, turns a schema into a vertex
[`BufferLayout`](/docs/api-reference/core/buffer-layout). The schema itself is
named around records rather than attributes so storage-oriented workflows can
use the same mental model where that remains practical.

## When to Use a Buffer Schema

Use `BufferSchema` when all of these are true:

- you have one logical row stride;
- several shader-visible fields read from that same row storage;
- field locations can be described with row offsets and scalar offsets.

Do not use it for every buffer. A single packed attribute such as positions or
colors is clearer as an ordinary `BufferLayout` entry. `BufferSchema` earns its
keep when one logical record fans out into multiple named views.

## Record-Oriented Vocabulary

```ts
import {
  getAttributeLayoutFromBufferSchema,
  type BufferSchema
} from '@luma.gl/engine';
```

`BufferSchema` is a name-to-field map:

```ts
const schema: BufferSchema = {
  currentPositions: {format: 'float32x3', recordOffset: 0},
  nextPositions: {format: 'float32x3', recordOffset: 1},
  nextWeight: {format: 'float32', recordOffset: 1, elementOffset: 3}
};
```

- `recordOffset` advances whole logical rows.
- `elementOffset` advances scalar values within a row.
- `format` states the generated vertex format for the attribute view.

Lowering to attributes uses:

```ts
const bufferLayout = getAttributeLayoutFromBufferSchema({
  name: 'segments',
  byteStride: 16,
  bytesPerElement: Float32Array.BYTES_PER_ELEMENT,
  schema
});
```

The generated attribute byte offsets are:

```ts
recordOffset * byteStride + elementOffset * bytesPerElement
```

## Packed Metadata Example

This pattern mirrors icon or glyph metadata stored in one row:

```ts
const iconSchema: BufferSchema = {
  instanceOffsets: {format: 'float32x2', elementOffset: 0},
  instanceIconFrames: {format: 'float32x4', elementOffset: 2},
  instanceColorModes: {format: 'float32', elementOffset: 6}
};

const iconBufferLayout = getAttributeLayoutFromBufferSchema({
  name: 'instanceIconRecord',
  byteStride: 28,
  bytesPerElement: Float32Array.BYTES_PER_ELEMENT,
  stepMode: 'instance',
  schema: iconSchema
});
```

The renderer binds one buffer named `instanceIconRecord`, while the shader keeps
clear field names.

## Matrix Columns as One Record

Matrices are a common reason to describe a record once and generate several
attribute views:

```ts
const matrixSchema: BufferSchema = {
  instanceModelMatrixCol0: {format: 'float32x4', elementOffset: 0},
  instanceModelMatrixCol1: {format: 'float32x4', elementOffset: 4},
  instanceModelMatrixCol2: {format: 'float32x4', elementOffset: 8},
  instanceModelMatrixCol3: {format: 'float32x4', elementOffset: 12}
};
```

Arrow matrix vectors use this same lowering internally. A single
`FixedSizeList<Float32, 16>` matrix row can become four generated attribute
views for WebGL-style vertex input, while the same logical matrix remains easy
to bind as one storage-buffer array on WebGPU.

## Storage-Buffer Viewpoint

Storage buffers are often nicest when WGSL reads a record array directly:

```wgsl
struct InstanceRecord {
  modelMatrix: mat4x4<f32>,
  tint: vec4<f32>,
};

@group(0) @binding(3)
var<storage, read> instances: array<InstanceRecord>;
```

`BufferSchema` does not try to generate this WGSL struct today, and it does not
claim to make storage and attribute layouts portable. The useful design rule is
simpler:

- choose row layouts that are easy to describe consistently;
- keep names and offsets record-oriented;
- use explicit storage-friendly padding when the same data will be read as WGSL
  structs or matrices.

That is why the schema uses `recordOffset` rather than `vertexOffset`, and why
Arrow matrix helpers expose a storage-aware physical layout option.

## Relationship to Arrow GPU Tables

`@luma.gl/arrow` uses the same record-view idea when a single Arrow matrix column
feeds several attribute declarations. Arrow tables remain columnar at the API
boundary, while `BufferSchema` provides the local row interpretation needed by a
particular render path.

For complete Arrow table workflows, including `GPUVector`, `GPUTable`,
`ArrowModel`, storage-buffer bindings, and table-backed compute helpers, see
[Supported Arrow Types](/docs/api-reference/arrow/supported-arrow-types) and
[GPUTable Object Model](/docs/api-reference/tables/gpu-table-object-model).

## Related References

- [BufferSchema](/docs/api-reference/engine/buffer-schema)
- [GPU Memory Layouts](./gpu-memory-layouts)
- [Storage Buffers](./gpu-storage-buffers)
- [Supported Arrow Types](/docs/api-reference/arrow/supported-arrow-types)
- [GPUTable Object Model](/docs/api-reference/tables/gpu-table-object-model)
