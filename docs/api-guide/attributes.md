# Attributes

In traditional 3D graphics, the purpose of *attributes* is typically described 
as providing vertex data to the GPU.

However, luma.gl favors thinking about a GPU as operating on "binary columnar tables". 
- In such a mental model, attributes are "columnar binary arrays" with the same number of elements
that each contain one value for each row. 
- Each column is an array of either floating point values, or signed or unsigned integers.
- A row can use up either a single value, or represent a vector of 2, 3 or 4 elements.
- All rows in a column must be of the same format (single value or vector)

## VertexFormat

The format of a vertex attribute indicates how data from a vertex buffer 
will be interpreted and exposed to the shader. Each format has a name that encodes
the order of components, bits per component, and vertex data type for the component.
The `VertexFormat` type is a string union of all the defined vertex formats.

Each vertex data type can map to any WGSL scalar type of the same base type, regardless of the bits per component:

| Vertex format prefix | Vertex data type      | Compatible WGSL types | Compatible GLSL types |
| -------------------- | --------------------- | --------------------- | --------------------- |
| `uint`               | `unsigned int`        | `u32`                 | `uint`, `uvec2-4`     |
| `sint`               | `signed int`          | `i32`                 | `int`, `ivec2-4`      |
| `unorm`              | `unsigned normalized` | `f16`, `f32`          | `float`, `vec2-4`     |
| `snorm`              | `signed normalized`   | `f16`, `f32`          | `float`, `vec2-4`     |
| `float`              | `floating point`      | `f16`, `f32`          | `float`, `vec2-4`     |

| Vertex Format | Data Type | WGSL types   | GLSL Types        |
| ------------- | --------- | ------------ | ----------------- |
| 'uint8x2'     | `uint8`   | `u32`        | `uint`, `uvec2-4` |
| 'uint8x4'     | `uint8`   | `u32`        | `uint`, `uvec2-4` |
| 'sint8x2'     | `sint8`   | `i32`        | `int`, `ivec2-4`  |
| 'sint8x4'     | `sint8`   | `i32`        | `int`, `ivec2-4`  |
| 'unorm8x2'    | `unorm8`  | `f16`, `f32` | `float`, `vec2-4` |
| 'unorm8x4'    | `unorm8`  | `f16`, `f32` | `float`, `vec2-4` |
| 'snorm8x2'    | `snorm8`  | `f16`, `f32` | `float`, `vec2-4` |
| 'snorm8x4'    | `snorm8`  | `f16`, `f32` | `float`, `vec2-4` |
| 'uint16x2'    | `uint16`  | `u32`        |                   |
| 'uint16x4'    | `uint16`  | `u32`        |                   |
| 'sint16x2'    | `sint16`  | `i32`        | `int`, `ivec2-4`  |
| 'sint16x4'    | `sint16`  | `i32`        | `int`, `ivec2-4`  |
| 'unorm16x2'   | `unorm16` | `f16`, `f32` |                   |
| 'unorm16x4'   | `unorm16` | `f16`, `f32` |                   |
| 'snorm16x2'   | `snorm16` | `f16`, `f32` |                   |
| 'snorm16x4'   | `snorm16` | `f16`, `f32` |                   |
| 'float16x2'   | `float16` | `f16`        |                   |
| 'float16x4'   | `float16` | `f16`        |                   |
| 'float32'     | `float32` | `f32`        |                   |
| 'float32x2'   | `float32` | `f32`        |                   |
| 'float32x3'   | `float32` | `f32`        |                   |
| 'float32x4'   | `float32` | `f32`        |                   |
| 'uint32'      | `uint`    | `u32`        |                   |
| 'uint32x2'    | `uint32`  | `u32`        |                   |
| 'uint32x3'    | `uint32`  | `u32`        |                   |
| 'uint32x4'    | `uint32`  | `u32`        |                   |
| 'sint32'      | `sint`    | `i32`        | `int`, `ivec2-4`  |
| 'sint32x2'    | `sint32`  | `i32`        | `int`, `ivec2-4`  |
| 'sint32x3'    | `sint32`  | `i32`        | `int`, `ivec2-4`  |
| 'sint32x4'    | `sint32`  | `i32`        | `int`, `ivec2-4`  |


Note:
- 8 and 16 bit values only support 2 or 4 components. This is a WebGPU specific limitation that does not exist on WebGL, but is enforced for portability.
- WebGL: GLSL supports `bool` and `bvec*` but these are not portable to WebGPU and not included here.
- WebGL: GLSL types `double` and `dvec*` are not supported in any WebGL version
- WebGPU: WGSL `f64` (hypothetical double type) is not supported. Perhaps in a future extension?
