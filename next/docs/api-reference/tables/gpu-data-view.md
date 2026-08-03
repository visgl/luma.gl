# GPUDataView

[Overview](https://luma.gl/next/docs/api-reference/tables.md)[Structure](https://luma.gl/next/docs/api-reference/tables/gpu-table-structure.md)[Lifecycle](https://luma.gl/next/docs/api-reference/tables/gpu-table-lifecycle.md)[GPUTable](https://luma.gl/next/docs/api-reference/tables/gpu-table.md)[GPUConstant](https://luma.gl/next/docs/api-reference/tables/gpu-constant.md)[GPURecordBatch](https://luma.gl/next/docs/api-reference/tables/gpu-record-batch.md)[GPUVector](https://luma.gl/next/docs/api-reference/tables/gpu-vector.md)[GPUData](https://luma.gl/next/docs/api-reference/tables/gpu-data.md)[GPUDataView](https://luma.gl/next/docs/api-reference/tables/gpu-data-view.md)[GPUSchema](https://luma.gl/next/docs/api-reference/tables/gpu-schema.md)[GPUInputSchema](https://luma.gl/next/docs/api-reference/tables/gpu-input-schema.md)[Shader Bindings](https://luma.gl/next/docs/api-reference/tables/gpu-table-shader-bindings.md)[GPUVectorFormat](https://luma.gl/next/docs/api-reference/tables/gpu-vector-format.md)[Buffer Planner](https://luma.gl/next/docs/api-reference/tables/gpu-table-buffer-planner.md)

![From: v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`GPUDataView` describes borrowed fixed-width values over a GPU buffer-like resource. A view has one physical format, value count, byte offset, and byte stride. It does not own its buffer or carry logical list topology, validity, or adapter metadata.

[`GPUData.getChild()`](https://luma.gl/next/docs/api-reference/tables/gpu-data.md) returns a `GPUDataView` for one named field in an interleaved struct. Views can also be constructed directly or derived from an explicit `BufferLayout` attribute.

## Usage[​](#usage "Direct link to Usage")

```
import {GPUDataView, makeGPUDataViewFromAttribute} from '@luma.gl/tables';

const positions = new GPUDataView({
  buffer,
  format: 'float32x3',
  length: vertexCount,
  byteOffset: 4,
  byteStride: 16
});

const colors = makeGPUDataViewFromAttribute({
  buffer,
  bufferLayout,
  attributeName: 'colors',
  length: vertexCount
});
```

## Constructor[​](#constructor "Direct link to Constructor")

### `new GPUDataView(props)`[​](#new-gpudataviewprops "Direct link to new-gpudataviewprops")

| Prop         | Type                                           | Default            | Meaning                                     |
| ------------ | ---------------------------------------------- | ------------------ | ------------------------------------------- |
| `buffer`     | `Buffer \| DynamicBuffer \| GPUDataViewBuffer` | Required           | Buffer-like resource containing the values. |
| `format`     | `VertexFormat`                                 | Required           | Fixed-width physical format for one value.  |
| `length`     | `number`                                       | Required           | Number of values in the view.               |
| `byteOffset` | `number`                                       | `0`                | Byte offset of the first value.             |
| `byteStride` | `number`                                       | Format byte length | Byte distance between consecutive values.   |

Construction rejects negative or unsafe integer values, strides smaller than the physical format, and ranges that exceed the backing buffer.

## Properties[​](#properties "Direct link to Properties")

| Property            | Type                | Meaning                                                          |
| ------------------- | ------------------- | ---------------------------------------------------------------- |
| `buffer`            | `GPUDataViewBuffer` | Borrowed backing resource.                                       |
| `format`            | `VertexFormat`      | Fixed-width physical value format.                               |
| `length`            | `number`            | Number of values in the view.                                    |
| `byteOffset`        | `number`            | Byte offset of the first value.                                  |
| `byteStride`        | `number`            | Byte distance between consecutive values.                        |
| `elementByteLength` | `number`            | Byte length of one physical value.                               |
| `byteLength`        | `number`            | Byte range from the first value through the final value payload. |

## Attribute Views[​](#attribute-views "Direct link to Attribute Views")

### `makeGPUDataViewFromAttribute(props): GPUDataView`[​](#makegpudataviewfromattributeprops-gpudataview "Direct link to makegpudataviewfromattributeprops-gpudataview")

| Prop            | Type                                           | Default  | Meaning                                                |
| --------------- | ---------------------------------------------- | -------- | ------------------------------------------------------ |
| `buffer`        | `Buffer \| DynamicBuffer \| GPUDataViewBuffer` | Required | Buffer-like resource described by `bufferLayout`.      |
| `bufferLayout`  | `BufferLayout`                                 | Required | Interleaved layout containing the requested attribute. |
| `attributeName` | `string`                                       | Required | Attribute to expose as a view.                         |
| `length`        | `number`                                       | Required | Number of attribute values.                            |
| `byteOffset`    | `number`                                       | `0`      | Base byte offset added before the attribute offset.    |

The helper combines the base and attribute offsets and uses the layout's shared `byteStride`. It throws when the attribute, its format, or the layout stride is missing.

## Ownership[​](#ownership "Direct link to Ownership")

A `GPUDataView` never destroys its buffer. The object that owns the backing `GPUData`, `Buffer`, or `DynamicBuffer` remains responsible for its lifetime.
