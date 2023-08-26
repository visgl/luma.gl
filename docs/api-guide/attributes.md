# Attributes

In traditional 3D graphics, the purpose of GPU **attributes* is to 
provide arrays of vertex data (containing positions, normals, texture coordinates for each vertex) 
describing the 3D models that are to be rendered.

More generally, a GPU can be thought of as operating on "binary columnar tables". In this a mental model:
- attributes are "columnar binary arrays" with the same number of elements that each contain one value for each row. 
- Each column is an array of either floating point values, or signed or unsigned integers.
- A row can use up either a single value, or represent a vector of 2, 3 or 4 elements.
- All rows in a column must be of the same format (single value or vector)

## Structure

In luma.gl attribute structure is described by two complementary concepts:

A `ShaderLayout` describes the static structure of attributes 
declared in the shader source code. This includes:
- the "location" (the index of the attribute in the GPU's attribute bank)
- the type of the attribute declared in the shader (f32, i32, u32), and number of components.
- a step mode ('vertex' or 'instance').
- whether calculations will be performed in integer or floating point arithmetic.

A `BufferLayout` describes the dynamic structure of one buffer (the actual GPU memory) 
that is expected be bound to the pipeline before `draw()` or `run()` is called. 
Specifically it

## Data Formats

A `BufferLayout` enumerates the attributes that will be read from the memory in each bound buffer.
- the data format of the memory in the buffer, i.e: the primitive data type (float, int, short, byte etc)
- and the number of components per "row" or "vertex"
- the data format also describes if the memory represents normalized integers.

Note that data formats are allowed to differ between attributes even when they are stored in the same GPU buffer.

## Interleaved Data

While buffers supplied by applications to define attribute values often contain 
only a contiguous block of memory for a single attribute, a buffer can also be set up to 
contain the memory for multiple attributes, either in sequence, or interleaved.

## Binding Buffers

Attributes define binding points for memory arrays in the form of `Buffer`s. 

The structure (memory layout and format) of these memory contained in these buffers.
must match the constraints imposed by the shader source code, 
and the structure of the data in the buffers must also be communicated to the GPU.

## VertexFormat

The format of a vertex attribute indicates how data from a vertex buffer 
will be interpreted and exposed to the shader. Each format has a name that encodes
the order of components, bits per component, and vertex data type for the component.
The `VertexFormat` type is a string union of all the defined vertex formats.

Each vertex data type can map to any WGSL scalar type of the same base type, regardless of the bits per component:

| Vertex format prefix | Vertex data type      | Compatible WGSL types | Compatible GLSL types             |
| -------------------- | --------------------- | --------------------- | --------------------------------- |
| `uint`               | `unsigned int`        | `u32`                 | `uint`, `uvec2`, `uvec3`, `uvec4` |
| `sint`               | `signed int`          | `i32`                 | `int`, `ivec2`, `ivec3`, `ivec4`  |
| `unorm`              | `unsigned normalized` | `f16`, `f32`          | `float`, `vec2`, `vec3`, `vec4`   |
| `snorm`              | `signed normalized`   | `f16`, `f32`          | `float`, `vec2`, `vec3`, `vec4`   |
| `float`              | `floating point`      | `f16`, `f32`          | `float`, `vec2`, `vec3`, `vec4`   |

| Vertex Format | Data Type | WGSL types   | GLSL Types                       |
| ------------- | --------- | ------------ | -------------------------------- |
| `uint8x2`     | `uint8`   | `u32`        | `uint`, `uvec2-4`                |
| `uint8x4`     | `uint8`   | `u32`        | `uint`, `uvec2-4`                |
| `sint8x2`     | `sint8`   | `i32`        | `int`, `ivec2-4`                 |
| `sint8x4`     | `sint8`   | `i32`        | `int`, `ivec2-4`                 |
| `unorm8x2`    | `unorm8`  | `f16`, `f32` | `float`, `vec2`, `vec3`, `vec4`  |
| `unorm8x4`    | `unorm8`  | `f16`, `f32` | `float`, ...                     |
| `snorm8x2`    | `snorm8`  | `f16`, `f32` | `float`, ...                     |
| `snorm8x4`    | `snorm8`  | `f16`, `f32` | `float`, ...                     |
| `uint16x2`    | `uint16`  | `u32`        |                                  |
| `uint16x4`    | `uint16`  | `u32`        |                                  |
| `sint16x2`    | `sint16`  | `i32`        | `int`, `ivec2-4`                 |
| `sint16x4`    | `sint16`  | `i32`        | `int`, `ivec2-4`                 |
| `unorm16x2`   | `unorm16` | `f16`, `f32` |                                  |
| `unorm16x4`   | `unorm16` | `f16`, `f32` |                                  |
| `snorm16x2`   | `snorm16` | `f16`, `f32` |                                  |
| `snorm16x4`   | `snorm16` | `f16`, `f32` |                                  |
| `float16x2`   | `float16` | `f16`        | ?                                |
| `float16x4`   | `float16` | `f16`        | ?                                |
| `float32`     | `float32` | `f32`        |                                  |
| `float32x2`   | `float32` | `f32`        |                                  |
| `float32x3`   | `float32` | `f32`        |                                  |
| `float32x4`   | `float32` | `f32`        |                                  |
| `uint32`      | `uint`    | `u32`        |                                  |
| `uint32x2`    | `uint32`  | `u32`        |                                  |
| `uint32x3`    | `uint32`  | `u32`        |                                  |
| `uint32x4`    | `uint32`  | `u32`        |                                  |
| `sint32`      | `sint`    | `i32`        | `int`, `ivec2`, `ivec3`, `ivec4` |
| `sint32x2`    | `sint32`  | `i32`        | `int`, ...                       |
| `sint32x3`    | `sint32`  | `i32`        | `int`, ...                       |
| `sint32x4`    | `sint32`  | `i32`        | `int`, ...                       |

## Backend Notes

When it comes to attributes, [WebGPU](https://www.w3.org/TR/webgpu/#vertex-state) is significantly more restrictive than WebGL:

| Feature                       | WebGL | WebGPU | Comment                                                                                                                    |
| ----------------------------- | ----- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| Dynamic `VertexFormat`        | ✅     | ❌      | Buffers with different structure (different `BufferLayout`) can be provided without relinking the `RenderPipeline`      |
| Per-attribute`stepMode`        | ✅     | ❌      | `stepMode` (WebGL: `divisor`, controls whether an attribute is instanced) can be set per-attribute, even when multiple attributes bing to the same buffer. |
| Constant attributes           | ✅     | ❌      | (attribute locations can be disabled in which case a constant value is read from the WebGLRenderingContext)                |
| Component mismatch            | ✅     | ❌      | Use buffers with more or fewer components than expected by the shader (missing values will be filled with `[0, 0, 0, 1]`). |
| Non-normalized integers       | ✅     | ❌      | Non-normalized integer attributes can be assigned to floating point GLSL shader variables (e.g. `vec4`).                   |
| Alignment free 8-bit formats  | ✅     | ❌      | WebGPU 8 bit integers must be aligned to 16 bits (`uint8x1`, `uint8x3`, `unorm8x1`, `unorm8x3` etc` are not supported)      |
| Alignment free 16-bit formats | ✅     | ❌      | WebGPU 16 bit integers must be aligned to 32 bits (`uint16x1`, `uint16x3`, `unorm16x1`, `unorm16x3` etc` are not supported) |
| Normalized 32-bit integers    | ✅     | ❌      | WebGPU 32 bit integer formats cannot be normalized                                                                         |

Presumably, the heavy restrictions in WebGPU support reduced run-time validation overhead, additional optimizations during shader compilation and/or portability across Vulkan/Metal/D3D12.

Note:
- 8 and 16 bit values only support 2 or 4 components. This is a WebGPU specific limitation that does not exist on WebGL.
- WebGL: GLSL supports `bool` and `bvec*` but these are not portable to WebGPU and not included here.
- WebGL: GLSL types `double` and `dvec*` are not supported in any WebGL version (nor is `f64` supported in WebGPU).
