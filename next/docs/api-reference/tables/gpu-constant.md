# GPUConstant

[Overview](https://luma.gl/next/docs/api-reference/tables.md)[Structure](https://luma.gl/next/docs/api-reference/tables/gpu-table-structure.md)[Lifecycle](https://luma.gl/next/docs/api-reference/tables/gpu-table-lifecycle.md)[GPUTable](https://luma.gl/next/docs/api-reference/tables/gpu-table.md)[GPUConstant](https://luma.gl/next/docs/api-reference/tables/gpu-constant.md)[GPURecordBatch](https://luma.gl/next/docs/api-reference/tables/gpu-record-batch.md)[GPUVector](https://luma.gl/next/docs/api-reference/tables/gpu-vector.md)[GPUData](https://luma.gl/next/docs/api-reference/tables/gpu-data.md)[GPUDataView](https://luma.gl/next/docs/api-reference/tables/gpu-data-view.md)[GPUSchema](https://luma.gl/next/docs/api-reference/tables/gpu-schema.md)[GPUInputSchema](https://luma.gl/next/docs/api-reference/tables/gpu-input-schema.md)[Shader Bindings](https://luma.gl/next/docs/api-reference/tables/gpu-table-shader-bindings.md)[GPUVectorFormat](https://luma.gl/next/docs/api-reference/tables/gpu-vector-format.md)[Buffer Planner](https://luma.gl/next/docs/api-reference/tables/gpu-table-buffer-planner.md)

`GPUConstant<T extends VertexFormat>` is one immutable fixed-width value shared by every logical row in a `GPUTable` column. It is device-independent and retains an owned CPU copy so WebGL can set a context constant attribute without allocating a vertex buffer.

## Constructor[​](#constructor "Direct link to Constructor")

```
new GPUConstant({

  format: 'unorm8x4',

  value: new Uint8Array([60, 150, 255, 220])

});
```

```
type GPUConstantProps<T extends VertexFormat> = {

  format: T;

  value: TypedArray;

};
```

The value must encode exactly one complete row. Its typed-array component type and byte length must match the format. `vertex-list` and `value-list` formats are not accepted because a variable-length row cannot be represented by one fixed payload.

## Properties[​](#properties "Direct link to Properties")

| Property     | Type         | Meaning                            |
| ------------ | ------------ | ---------------------------------- |
| `format`     | `T`          | Raw GPU memory format.             |
| `value`      | `TypedArray` | Owned copy of the one-row payload. |
| `byteLength` | `number`     | Physical payload byte length.      |
| `isConstant` | `true`       | Discriminator from `GPUVector`.    |

## Row Semantics[​](#row-semantics "Direct link to Row Semantics")

`GPUConstant` has no independent `length`. The containing table supplies its logical row count. This makes one constant reusable when constructing tables of different lengths and prevents constant objects from participating in physical batch alignment.

An all-constant table must provide `numRows`:

```
const table = new GPUTable({

  columns: {radius: new GPUConstant({format: 'float32', value: new Float32Array([3])})},

  numRows: 1000

});
```

## Backend Materialization[​](#backend-materialization "Direct link to Backend Materialization")

`GPUConstant` does not allocate GPU resources. `GPUTableShaderBindings` lowers it to:

* a WebGL constant attribute value;
* a WebGPU zero-stride vertex buffer;
* a WebGPU one-row storage buffer and row multiplier.

This split keeps constants reusable and ensures resource ownership remains explicit. The binding object, not the constant or table, owns materialized backend buffers.

## Remarks[​](#remarks "Direct link to Remarks")

* The constructor copies `value`; later mutations of the source array have no effect.
* Normalized formats store raw integer bytes, not normalized JavaScript floats.
* Physical allocation may be larger than `byteLength` because WebGPU buffers and storage bindings require alignment.
* Constants apply to the whole table. Different values per record batch require separate tables or varying vectors.
* Replacing a constant requires a replacement table and `GPUTableShaderBindings.updateBindings()`.
