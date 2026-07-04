import {GpuGuideDocsTabs} from '@site/src/components/docs/gpu-guide-docs-tabs';

# Tabular Data in WGSL

<GpuGuideDocsTabs group="shader-data" active="tabular-data" />

Many GPU workloads start with tabular data: each logical row describes one
vertex, instance, particle, glyph, path, or record, and each column supplies one
value used by the shader.

WGSL exposes two substantially different ways to read those rows:

- **vertex attributes** map columns through the render pipeline's vertex-fetch
  hardware;
- **storage buffers** map bytes directly to WGSL arrays, matrices, and structs.

The same source table can use both paths, but the memory contracts are not
interchangeable. Vertex fetch converts from `VertexFormat` into shader values.
Storage access reads the declared WGSL storage type without vertex-format
conversion.

## One Table, Two Shader Interfaces

| Question | Vertex attributes | Storage buffers |
| --- | --- | --- |
| Shader declaration | `@location` fields in a vertex input struct | `var<storage>` binding |
| Application layout | `ShaderLayout.attributes` plus `BufferLayout` | Binding plus WGSL storage type |
| Natural table shape | One attribute per column, optionally interleaved | One `array<T>` per column or one `array<Struct>` |
| Type vocabulary | `VertexFormat` for bytes, attribute shader type for the value | WGSL host-shareable storage type |
| Conversion | Vertex fetch can normalize or widen values | No implicit conversion |
| Backends | WebGPU and WebGL | WebGPU only |

Use attributes when rows naturally drive a render draw and portability to WebGL
matters. Use storage buffers when the shader needs arbitrary indexing, writes,
variable-length data through offsets, matrices, or record structs.

## Mapping Columns to Attributes

A columnar vertex table usually binds one buffer per column:

```ts
const shaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'colors', location: 1, type: 'vec4<f32>'}
  ],
  bindings: []
};

const bufferLayout = [
  {name: 'positions', format: 'float32x3'},
  {name: 'colors', format: 'unorm8x4'}
];
```

The corresponding WGSL vertex input sees shader values, not the source byte
formats:

```wgsl
struct VertexInputs {
  @location(0) position: vec3<f32>,
  @location(1) color: vec4<f32>,
};
```

`colors` can occupy four bytes per row as `unorm8x4`; vertex fetch converts
those bytes to `vec4<f32>` values in the range `[0, 1]`.

### Interleaved Attribute Rows

Several logical columns can share one row-major buffer:

```ts
const bufferLayout = [
  {
    name: 'instances',
    byteStride: 16,
    attributes: [
      {attribute: 'instancePositions', format: 'float32x3', byteOffset: 0},
      {attribute: 'instanceColors', format: 'unorm8x4', byteOffset: 12}
    ]
  }
];
```

Each row occupies 16 bytes:

```text
byte offset:  0                       12          16
              | position: float32x3 | color: u8x4 |
```

The shader still receives separate `@location` fields. The interleaved
structure belongs to `BufferLayout`, not to the WGSL vertex input type.

## Constant Columns

A logical table column does not always need one stored value per row. If every
row receives the same value, keep that value as a constant until a pipeline
actually consumes it. The lowering is different for attributes and storage.

### Attribute Constants

Attribute fetch can broadcast one stored value across every vertex or instance.
On WebGPU, bind a one-value buffer through a vertex buffer layout whose array
stride is `0`:

```ts
const bufferLayout = [
  {name: 'instanceColors', format: 'float32x4', byteStride: 0}
];
```

The buffer contains one `float32x4` value. Because the stride is zero, vertex
fetch reads the same bytes for every row.

WebGL does not use zero-stride vertex buffers for this. Its equivalent is an
indirect constant-attribute binding: disable the vertex attribute array and set
the attribute location's global constant value. In luma.gl, model-level
`constantAttributes` and `setConstantAttributes()` provide that path.

This lowering should happen outside the logical table column. A table can keep
one typed constant value without owning a buffer; a render consumer can choose
the WebGPU zero-stride buffer or the WebGL constant-attribute path when it binds
the table.

### Storage Constants

Storage arrays do not have an equivalent to a zero array stride. A declaration
such as `array<vec4<f32>>` advances by the WGSL storage stride whenever the
shader indexes a new element. Binding one value does not make
`values[rowIndex]` safe for every row.

Storage constants therefore need explicit shader support. The simplest pattern
is a separate uniform or one-element storage binding and an accessor that does
not index by row:

```wgsl
struct TableConstants {
  color: vec4<f32>,
};

@group(0) @binding(0)
var<uniform> tableConstants: TableConstants;

fn readColor(_rowIndex: u32) -> vec4<f32> {
  return tableConstants.color;
}
```

When one shader supports both a real column and a constant, put the choice
behind the same accessor:

```wgsl
struct TableConfig {
  useConstantColor: u32,
  constantColor: vec4<f32>,
};

@group(0) @binding(0)
var<uniform> tableConfig: TableConfig;

@group(0) @binding(1)
var<storage, read> colors: array<vec4<f32>>;

fn readColor(rowIndex: u32) -> vec4<f32> {
  if (tableConfig.useConstantColor != 0u) {
    return tableConfig.constantColor;
  }
  return colors[rowIndex];
}
```

An `override` value or a generated shader variant can remove that branch when
the source kind is known while creating the pipeline. The important rule is
that storage constant semantics live in shader accessors or shader variants,
not in a fake strided storage array.

## Mapping Columns to Storage Buffers

Storage bindings expose ordinary WGSL arrays. A columnar table can bind each
column separately:

```wgsl
@group(0) @binding(0)
var<storage, read> positions: array<vec2<f32>>;

@group(0) @binding(1)
var<storage, read> colors: array<u32>;
```

The shader chooses the storage element type. The producer must upload bytes
whose alignment and stride match that type exactly.

Storage buffers also support row-oriented records:

```wgsl
struct InstanceRecord {
  position: vec3<f32>,
  color: u32,
};

@group(0) @binding(0)
var<storage, read> instances: array<InstanceRecord>;
```

This is the storage equivalent of an interleaved table: `instances[rowIndex]`
selects one row, and `.position` or `.color` selects a field.

## Packed 8- and 16-Bit Integers

There is no portable WGSL `u8`, `i8`, `u16`, or `i16` storage scalar type today.
For 8- or 16-bit data, bind packed words as `array<u32>` and use shifts and
masks to extract logical values:

```wgsl
@group(0) @binding(0)
var<storage, read> packedValues: array<u32>;

fn readU8(index: u32) -> u32 {
  let word = packedValues[index / 4u];
  let shift = (index % 4u) * 8u;
  return (word >> shift) & 0xffu;
}

fn readU16(index: u32) -> u32 {
  let word = packedValues[index / 2u];
  let shift = (index % 2u) * 16u;
  return (word >> shift) & 0xffffu;
}
```

Signed values require sign extension after extraction. Normalized values require
an explicit conversion, for example `f32(readU8(index)) / 255.0`.

Vertex formats such as `uint8x4`, `unorm8x4`, and `uint16x2` only get their
special decoding through vertex fetch. A storage shader reading the same four
bytes as `u32` receives one packed word.

## Storage Alignment and Stride

Storage arrays follow WGSL host-shareable layout rules. Do not infer their
stride from a similarly named `VertexFormat`.

For example, `float32x3` describes a 12-byte vertex payload. In storage,
`array<vec3<f32>>` has a 16-byte element stride because `vec3<f32>` has
16-byte alignment:

```text
array<vec3<f32>>

row 0: bytes  0..11 value, bytes 12..15 padding
row 1: bytes 16..27 value, bytes 28..31 padding
row 2: bytes 32..43 value, bytes 44..47 padding
```

See the [WGSL storage layout rules](https://www.w3.org/TR/2026/CRD-WGSL-20260513/)
for alignment, member offsets, structure size, and array stride.

Matrices and structs have the same requirement. A storage
`array<mat4x4<f32>>` uses the WGSL matrix-column layout; it is not described by
one `float32x4` vertex format unless the application also supplies the correct
64-byte row stride.

## Sharing One Row Layout

One physical row can sometimes support both attribute and storage access:

```wgsl
struct InstanceRecord {
  position: vec3<f32>,
  packedColor: u32,
};
```

The canonical storage layout places `position` at byte offset `0`,
`packedColor` at byte offset `12`, and the next record at byte offset `16`.
The same bytes can be exposed as attributes:

```ts
{
  name: 'instances',
  byteStride: 16,
  attributes: [
    {attribute: 'instancePositions', format: 'float32x3', byteOffset: 0},
    {attribute: 'instanceColors', format: 'unorm8x4', byteOffset: 12}
  ]
}
```

The interpretations remain different:

- the attribute shader receives `instanceColors` as normalized `vec4<f32>`;
- the storage shader receives `packedColor` as raw `u32` and must unpack it.

Design shared layouts from the storage rules first, then describe compatible
attribute views over those bytes. Do not assume an arbitrary interleaved
attribute buffer is a valid WGSL storage struct.

## Related References

- [GPU Memory Layouts](./gpu-memory-layouts)
- [Attributes](./gpu-attributes)
- [Storage Buffers](./gpu-storage-buffers)
- [GPU Tables](./gpu-tables)
- [GPU Table Lifecycle](/docs/api-reference/tables/gpu-table-lifecycle)
