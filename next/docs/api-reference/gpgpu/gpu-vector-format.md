# GPUVectorFormat

[GPUConstant](https://luma.gl/next/docs/api-reference/gpgpu/gpu-constant.md)[GPUVector](https://luma.gl/next/docs/api-reference/gpgpu/gpu-vector.md)[GPUData](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data.md)[GPUDataView](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data-view.md)[GPUVectorFormat](https://luma.gl/next/docs/api-reference/gpgpu/gpu-vector-format.md)

From v9.4Experimental API

`GPUVectorFormat` is the canonical memory-layout string for [`GPUVector`](https://luma.gl/next/docs/api-reference/gpgpu/gpu-vector.md). [`GPUData`](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data.md) also accepts an inline record of physical field formats and retains the resulting `GPUDataStructFormat` in its broader `GPUDataFormat` property.

It describes bytes in GPU memory, not the shader value written in WGSL or GLSL. Shader values are declared by `ShaderLayout`, for example `vec4<f32>`.

## Types[​](#types "Direct link to Types")

```
import type {VertexFormat} from '@luma.gl/core';



export type VertexList<Format extends VertexFormat = VertexFormat> =

  `vertex-list<${Format}>`;



export type GPUVectorFormat = VertexFormat | VertexList;



export type GPUDataFormat = GPUVectorFormat | GPUDataStructFormat;
```

Fixed-width vectors reuse core [`VertexFormat`](https://luma.gl/next/docs/api-reference/core/vertex-formats.md) strings:

```
'float32'

'float32x2'

'float32x3'

'float32x4'

'uint32'

'unorm8x4'
```

Variable-length vertex-aligned vectors wrap a fixed element format:

```
'vertex-list<float32x3>'

'vertex-list<unorm8x4>'
```

`vertex-list<format>` means each logical row owns a variable-length sequence of per-vertex element values. The format inside the angle brackets describes one flattened element. Offset buffers, row ranges, closed-path flags, text glyph maps, and similar topology metadata are adapter-owned.

Generic `list<format>` is intentionally reserved for a possible future non-vertex offset-list type.

`GPUDataStructFormat` is an object rather than another format string because it contains named field formats, offsets, and row-stride metadata. It remains a physical memory description; shader value types stay separate. Struct formats currently apply to `GPUData`, while `GPUVectorFormat` remains the scalar or list format of one logical vector.

## Helpers[​](#helpers "Direct link to Helpers")

### `getGPUVectorFormatInfo(format): GPUVectorFormatInfo`[​](#getgpuvectorformatinfoformat-gpuvectorformatinfo "Direct link to getgpuvectorformatinfoformat-gpuvectorformatinfo")

Decodes a fixed or `vertex-list<...>` format string.

```
const info = getGPUVectorFormatInfo('vertex-list<float32x3>');



info.elementFormat; // 'float32x3'

info.vertexList; // true

info.components; // 3

info.byteLength; // 12

info.primitiveType; // 'f32'
```

### `getGPUVectorElementFormat(format): VertexFormat`[​](#getgpuvectorelementformatformat-vertexformat "Direct link to getgpuvectorelementformatformat-vertexformat")

Returns the fixed element format. For fixed vectors this is the input format; for vertex lists this is the format inside `vertex-list<...>`.

### `isVertexListGPUVectorFormat(format): boolean`[​](#isvertexlistgpuvectorformatformat-boolean "Direct link to isvertexlistgpuvectorformatformat-boolean")

Returns true for `vertex-list<...>` formats.

### `isGPUVectorFormatCompatibleWithShaderType(format, shaderType): boolean`[​](#isgpuvectorformatcompatiblewithshadertypeformat-shadertype-boolean "Direct link to isgpuvectorformatcompatiblewithshadertypeformat-shadertype-boolean")

Checks whether the memory format can feed one shader attribute type.

Examples:

| GPU format  | Shader type | Compatible | Reason                                         |
| ----------- | ----------- | ---------- | ---------------------------------------------- |
| `float32x3` | `vec3<f32>` | yes        | Same component count and float primitive type. |
| `unorm8x4`  | `vec4<f32>` | yes        | Normalized bytes become floats.                |
| `uint32x2`  | `vec2<u32>` | yes        | Unsigned integer primitive type matches.       |
| `sint32x2`  | `vec2<u32>` | no         | Signedness mismatch.                           |
| `float32x3` | `vec4<f32>` | no         | Component count mismatch.                      |

## Buffer Layouts[​](#buffer-layouts "Direct link to Buffer Layouts")

Fixed formats can synthesize ordinary `BufferLayout` entries:

```
const positions = new GPUVector({

  type: 'buffer',

  name: 'positions',

  buffer,

  format: 'float32x3',

  length

});
```

This yields a layout like:

```
[{name: 'positions', format: 'float32x3', byteStride: 12}]
```

If the source rows are padded, `GPUVector.byteStride` is preserved:

```
const positions = new GPUVector({

  type: 'buffer',

  name: 'positions',

  buffer,

  format: 'float32x3',

  length,

  byteStride: 16,

  rowByteLength: 12

});
```

`vertex-list<...>` vectors do not synthesize generic vertex-buffer layouts. Path, text, polygon, and geometry adapters must either expand them into renderable fixed vectors or bind them through an explicit storage/offset path.

## Arrow Mapping[​](#arrow-mapping "Direct link to Arrow Mapping")

`@luma.gl/arrow` maps supported Arrow types into these formats:

| Arrow type                                         | GPUVector format         |
| -------------------------------------------------- | ------------------------ |
| `FixedSizeList<Float32, 3>`                        | `float32x3`              |
| `FixedSizeList<Uint8, 4>` as normalized color      | `unorm8x4`               |
| `List<FixedSizeList<Float32, 3>>` path coordinates | `vertex-list<float32x3>` |
| `List<FixedSizeList<Uint8, 4>>` vertex colors      | `vertex-list<unorm8x4>`  |

Arrow data types remain adapter/readback metadata. Table core uses `GPUVectorFormat`.
