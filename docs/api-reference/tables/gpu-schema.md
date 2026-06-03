# GPUSchema

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`GPUSchema` is the structural schema type used by
[`GPUTable`](/docs/api-reference/tables/gpu-table) and
[`GPURecordBatch`](/docs/api-reference/tables/gpu-record-batch).

It is a plain TypeScript type, not a class. GPU table core does not depend on
Apache Arrow schema classes.

## Types

```ts
import type {VertexFormat} from '@luma.gl/core';
import type {GPUVectorFormat, VertexList} from '@luma.gl/tables';

export type GPUTypeMap = Record<string, GPUVectorFormat>;

export type GPUField<
  Name extends string = string,
  Format extends VertexFormat | VertexList<VertexFormat> = GPUVectorFormat
> = {
  name: Name;
  format?: Format;
  nullable?: boolean;
  metadata?: Map<string, string>;
};

export type GPUSchema<T extends GPUTypeMap = GPUTypeMap> = {
  fields: Array<GPUField<keyof T & string>>;
  metadata: Map<string, string>;
};
```

`GPUTypeMap` can be used to type table columns:

```ts
type PointTable = {
  positions: 'float32x3';
  colors: 'unorm8x4';
};

const table: GPUTable<PointTable> = new GPUTable({
  vectors: {
    positions,
    colors
  }
});
```

Variable-length vertex-aligned fields use `VertexList`:

```ts
type PathTable = {
  paths: VertexList<'float32x3'>;
  vertexColors: VertexList<'unorm8x4'>;
};
```

## Semantics

`GPUSchema` describes selected GPU-facing columns, not necessarily every source
column. A table adapter may read many source columns and publish only the ones
that match a `ShaderLayout`, generated geometry plan, or model-specific storage
path.

`GPUField.format` is a memory format:

- fixed vectors use core `VertexFormat` strings such as `float32x3`;
- variable-length vertex lists use `vertex-list<format>`;
- shader values remain in `ShaderLayout`, such as `vec3<f32>` or `vec4<f32>`.

Compatibility between `GPUField.format` and shader values is checked separately
with
[`isGPUVectorFormatCompatibleWithShaderType()`](/docs/api-reference/tables/gpu-vector-format).

`nullable` and `metadata` are adapter-owned. Table core preserves them but does
not interpret Arrow null bitmaps, temporal origins, matrix metadata, or text
dictionary information.

## Why A Type, Not A Class

`GPUSchema` has no behavior that needs identity, inheritance, or lifecycle
management. The objects that need lifecycle management are GPU resource owners:

- [`GPUData`](/docs/api-reference/tables/gpu-data) owns or borrows one buffer.
- [`GPUVector`](/docs/api-reference/tables/gpu-vector) owns or borrows ordered
  `GPUData` chunks.
- [`GPURecordBatch`](/docs/api-reference/tables/gpu-record-batch) owns
  batch-local vectors.
- [`GPUTable`](/docs/api-reference/tables/gpu-table) owns preserved batches.

Keeping schema as plain data lets Arrow, gpgpu, generated-geometry, and
application-specific adapters create schemas without depending on a shared class
hierarchy.

## Arrow Interop

`@luma.gl/arrow` creates `GPUSchema` objects from selected Arrow fields. Arrow
`DataType` values may still be retained on `GPUData` or `GPUVector` as
adapter/readback metadata during migration, but tables and record batches expose
`GPUSchema` instead of `arrow.Schema`.

For example:

```ts
const gpuTable = makeGPUTableFromArrowTable(device, arrowTable, {shaderLayout});

gpuTable.schema.fields[0].name; // shader/table column name
gpuTable.schema.fields[0].format; // GPUVectorFormat, e.g. 'unorm8x4'
```
