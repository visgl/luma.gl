# BufferSchema

`BufferSchema` describes the named fields in one logical GPU buffer record.
It is an engine-level authoring shape for code that already knows its row stride
and field offsets, but does not want to hand-build a verbose
[`BufferLayout`](/docs/api-reference/core/buffer-layout).

The current lowering helper,
`getAttributeLayoutFromBufferSchema()`, converts that record description into a
vertex-attribute `BufferLayout`. The schema vocabulary is intentionally more
general than attributes so future storage-oriented helpers can reuse the same
record model where that is practical.

## Usage

```ts
import {
  getAttributeLayoutFromBufferSchema,
  type BufferSchema
} from '@luma.gl/engine';

const schema: BufferSchema = {
  instanceModelMatrixCol0: {format: 'float32x4', elementOffset: 0},
  instanceModelMatrixCol1: {format: 'float32x4', elementOffset: 4},
  instanceModelMatrixCol2: {format: 'float32x4', elementOffset: 8},
  instanceModelMatrixCol3: {format: 'float32x4', elementOffset: 12}
};

const bufferLayout = getAttributeLayoutFromBufferSchema({
  name: 'instanceModelMatrix',
  byteStride: 64,
  bytesPerElement: Float32Array.BYTES_PER_ELEMENT,
  stepMode: 'instance',
  schema
});
```

The emitted `BufferLayout` binds one buffer named `instanceModelMatrix` and
exposes four shader attributes that read from offsets `0`, `16`, `32`, and `48`.

## Types

### `BufferField`

```ts
export type BufferField = {
  format: VertexFormat;
  recordOffset?: number;
  elementOffset?: number;
};
```

| Field | Meaning |
| --- | --- |
| `format` | Vertex format used by the generated attribute view. |
| `recordOffset?` | Whole-record offset relative to the current row. Use this for neighbor-row reads such as current/next positions. |
| `elementOffset?` | Scalar offset inside one logical record. Use this for matrix columns, packed metadata fields, or other fields stored in one row. |

Offsets must be non-negative integers.

### `BufferSchema`

```ts
export type BufferSchema = Record<string, BufferField>;
```

Each key becomes the generated shader attribute name when the schema is lowered
with `getAttributeLayoutFromBufferSchema()`.

### `AttributeLayoutFromBufferSchemaOptions`

```ts
export type AttributeLayoutFromBufferSchemaOptions = {
  name: string;
  byteStride: number;
  bytesPerElement: number;
  schema: BufferSchema;
  stepMode?: 'vertex' | 'instance';
};
```

| Field | Meaning |
| --- | --- |
| `name` | Buffer binding name used by `Model.setAttributes()` or pipeline attribute binding. |
| `byteStride` | Bytes between consecutive logical records. |
| `bytesPerElement` | Scalar byte size used to convert `elementOffset` into bytes. |
| `schema` | Record fields to expose through generated attribute views. |
| `stepMode?` | Shared step mode for generated attributes. |

`byteStride` must be a non-negative integer, `bytesPerElement` must be a positive
integer, and `schema` must contain at least one field.

## Functions

### `getAttributeLayoutFromBufferSchema(options)`

```ts
function getAttributeLayoutFromBufferSchema(
  options: AttributeLayoutFromBufferSchemaOptions
): BufferLayout;
```

The helper computes each attribute offset as:

```ts
byteOffset =
  recordOffset * byteStride +
  elementOffset * bytesPerElement;
```

Use it when:

- one logical GPU row exposes several attribute views;
- one field needs neighbor-row aliases through `recordOffset`;
- an interleaved row layout should be described once and lowered consistently.

Do not use it to describe storage-buffer bindings themselves. Storage shaders
see raw WGSL memory layout, not vertex-fetch formats. The schema type is named to
leave room for storage-oriented helpers, but this function specifically returns a
vertex `BufferLayout`.

## Examples

### Packed Metadata Row

```ts
const iconSchema: BufferSchema = {
  instanceOffsets: {format: 'float32x2', elementOffset: 0},
  instanceIconFrames: {format: 'float32x4', elementOffset: 2},
  instanceColorModes: {format: 'float32', elementOffset: 6}
};
```

### Neighbor Rows

```ts
const pathSchema: BufferSchema = {
  instanceStartPositions: {format: 'float32x3', recordOffset: 0},
  instanceEndPositions: {format: 'float32x3', recordOffset: 1}
};
```

## Related References

- [BufferLayout](/docs/api-reference/core/buffer-layout)
- [GPU Memory Layouts](/docs/api-guide/gpu/gpu-memory-layouts)
- [Buffer Schemas and Columnar Records](/docs/api-guide/gpu/buffer-schemas)
