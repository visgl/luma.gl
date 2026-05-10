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

luma.gl provides separate descriptions of shader attributes and the buffers that are provided to provide the data for those attributes. The key observation here is that shaders only work with four types ('f32', 'f16', 'i32' and 'u32') and there is some flexibility in what binary buffer layouts can feed these declarations.

- `ShaderLayout` describes what the shader can accept, such as `vec4<f32>`.
- `BufferLayout` describes how the current table column is stored in memory, such as
  `float32x4`, `float16x4`, or `unorm8x4`.

This means the shader does not need to be written specifically for every memory representation. A shader
attribute is declared using the type used in the shader source code:

```ts
const shaderLayout = {
  attributes: [{name: 'colors', location: 0, type: 'vec4<f32>'}],
  bindings: []
};
```

Then different Arrow table schemas can use different buffer layouts. For the `vec4<f32>` described in the shader layout, the following buffer formats are all accepted by the GPU. 

| Arrow column type           | Buffer layout format | Notes                                      |
| --------------------------- | -------------------- | ------------------------------------------ |
| `FixedSizeList<Float32, 4>` | `float32x4`          | |
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
