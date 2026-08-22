# Vertex Formats

[Shader Types](https://luma.gl/next/docs/api-reference/core/shader-types.md)[Vertex Formats](https://luma.gl/next/docs/api-reference/core/vertex-formats.md)[Texture Formats](https://luma.gl/next/docs/api-reference/core/texture-formats.md)

The format of a vertex attribute indicates how data in a vertex buffer is laid out, and how it will exposed to the shader. Each format has a name that encodes

* the order of components
* bits per component
* and vertex data type for the component.

The `VertexFormat` type is a string union of all the defined vertex formats.

<!-- -->

| Vertex Format     | Availability Check | WGSL types               | GLSL Types | Notes                                                                                                                       |
| ----------------- | ------------------ | ------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `uint8`           | N/A                | `u32`                    | `uint`     | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `uint8x2`         | N/A                | `vec2<u32>`              | `uvec2`    | —                                                                                                                           |
| `uint8x4`         | N/A                | `vec2<u32>`              | `uvec4`    | —                                                                                                                           |
| `sint8`           | N/A                | `i32`                    | `int`      | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `sint8x2`         | N/A                | `vec2<i32>`              | `ivec2`    | —                                                                                                                           |
| `sint8x4`         | N/A                | `vec2<i32>`              | `ivec4`    | —                                                                                                                           |
| `unorm8`          | N/A                | `f16`, `f32`             | `float`    | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `unorm8x2`        | N/A                | `vec2<f16>`, `vec2<f32>` | `vec2`     | —                                                                                                                           |
| `unorm8x4`        | N/A                | `vec2<f16>`, `vec2<f32>` | `vec4`     | —                                                                                                                           |
| `unorm8x4-bgra`   | N/A                | `vec4<f16>`, `vec4<f32>` | ❌         | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `unorm10-10-10-2` | N/A                | `vec4<f16>`, `vec4<f32>` | ❌         | [Chrome v119+](https://developer.chrome.com/blog/new-in-webgpu-119#unorm10-10-10-2_vertex_format)                           |
| `snorm8`          | N/A                | `f16`, `f32`             | `float`    | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `snorm8x2`        | N/A                | `vec2<f16>`, `vec2<f32>` | `vec2`     | —                                                                                                                           |
| `snorm8x4`        | N/A                | `vec2<f16>`, `vec2<f32>` | `vec4`     | —                                                                                                                           |
| `uint16`          | N/A                | `u32`                    | `uint`     | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `uint16x2`        | N/A                | `vec2<u32>`              | `ivec2`    | —                                                                                                                           |
| `uint16x4`        | N/A                | `vec3<u32>`              | `ivec4`    | —                                                                                                                           |
| `sint16`          | N/A                | `i32`                    | `int`      | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `sint16x2`        | N/A                | `vec2<i32>`              | `ivec2`    | —                                                                                                                           |
| `sint16x4`        | N/A                | `vec2<i32>`              | `ivec4`    | —                                                                                                                           |
| `unorm16`         | N/A                | `f16`, `f32`             | `float`    | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `unorm16x2`       | N/A                | `vec2<f16>`, `vec2<f32>` | `vec2`     | —                                                                                                                           |
| `unorm16x4`       | N/A                | `vec3<f16>`, `vec4<f32>` | `vec4`     | —                                                                                                                           |
| `snorm16`         | N/A                | `f16`, `f32`             | `float`    | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `snorm16x2`       | N/A                | `vec2<f16>`, `vec2<f32>` | `vec2`     | —                                                                                                                           |
| `snorm16x4`       | N/A                | `vec4<f16>`, `vec4<f32>` | `vec4`     | —                                                                                                                           |
| `float16`         | N/A                | `f16`, `f32`             | ❌         | [Chrome v133+](https://developer.chrome.com/blog/new-in-webgpu-133#additional_unorm8x4-bgra_and_1-component_vertex_formats) |
| `float16x2`       | N/A                | `vec2<f16>`, `vec2<f32>` | ❌         | —                                                                                                                           |
| `float16x4`       | N/A                | `vec4<f16>`, `vec4<f32>` | ❌         | —                                                                                                                           |
| `float32`         | N/A                | `f32`                    | `float`    | —                                                                                                                           |
| `float32x2`       | N/A                | `vec2<f32>`              | `vec2`     | —                                                                                                                           |
| `float32x3`       | N/A                | `vec3<f32>`              | `vec3`     | —                                                                                                                           |
| `float32x4`       | N/A                | `vec4<f32>`              | `vec4`     | —                                                                                                                           |
| `uint32`          | N/A                | `u32`                    | `uint`     | —                                                                                                                           |
| `uint32x2`        | N/A                | `vec2<u32>`              | `uvec2`    | —                                                                                                                           |
| `uint32x3`        | N/A                | `vec3<u32>`              | `uvec3`    | —                                                                                                                           |
| `uint32x4`        | N/A                | `vec4<u32>`              | `uvec4`    | —                                                                                                                           |
| `sint32`          | N/A                | `i32`                    | `int`      | —                                                                                                                           |
| `sint32x2`        | N/A                | `vec2<i32>`              | `ivec2`    | —                                                                                                                           |
| `sint32x3`        | N/A                | `vec3<i32>`              | `ivec3`    | —                                                                                                                           |
| `sint32x4`        | N/A                | `vec4<i32>`              | `ivec4`    | —                                                                                                                           |

## Shader Type mappings[​](#shader-type-mappings "Direct link to Shader Type mappings")

Each vertex data type can map to any WGSL scalar type of the same base type, regardless of the bits per component:

| Vertex format prefix | Vertex data type      | Compatible WGSL types | Compatible GLSL types             |
| -------------------- | --------------------- | --------------------- | --------------------------------- |
| `uint`               | `unsigned int`        | `u32`                 | `uint`, `uvec2`, `uvec3`, `uvec4` |
| `sint`               | `signed int`          | `i32`                 | `int`, `ivec2`, `ivec3`, `ivec4`  |
| `unorm`              | `unsigned normalized` | `f16`, `f32`          | `float`, `vec2`, `vec3`, `vec4`   |
| `snorm`              | `signed normalized`   | `f16`, `f32`          | `float`, `vec2`, `vec3`, `vec4`   |
| `float16`            | `floating point`      | `f16`, `f32`          | `float`, `vec2`, `vec3`, `vec4`   |
| `float32`            | `floating point`      | `f32`                 | `float`, `vec2`, `vec3`, `vec4`   |

## GPU Backend Differences[​](#gpu-backend-differences "Direct link to GPU Backend Differences")

luma.gl attempts to provide a consistent API across WebGPU and WebGL, but there are significant differences in vertex format supported across the two APIs.

* The multi-component formats specify the number of components after "x".
* **Mismatches in the number of components between the vertex format and shader type are allowed**, with components being either dropped or filled with default values to compensate.

When it comes to attributes, [WebGPU](https://www.w3.org/TR/webgpu/#vertex-state) is significantly more restrictive than WebGL:

| Feature                    | WebGL | WebGPU | Comment                                                                                                                                                        |
| -------------------------- | ----- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8-bit x1 alignment         | ✅    | (✅)   | WebGPU 8 bit integers must be aligned to 16, 32 bits (`uint8x1`, `uint8x3`, `unorm8x1`, `unorm8x3` etc\` are not supported)                                    |
| 8-bit x3 alignment         | ✅    | ❌     | WebGPU 8 bit integers must be aligned to 8, 16, 32 bits (`uint8x1`, `uint8x3`, `unorm8x1`, `unorm8x3` etc\` are not supported)                                 |
| 16-bit x1 alignment        | ✅    | (✅)   | WebGPU 16 bit integers must be aligned to 32 bits (`uint16x1`, `uint16x3`, `unorm16x1`, `unorm16x3` etc\` are not supported)                                   |
| 16-bit x3 alignment        | ✅    | ❌     | WebGPU 16 bit integers must be aligned to 32 bits (`uint16x1`, `uint16x3`, `unorm16x1`, `unorm16x3` etc\` are not supported)                                   |
| Component mismatch         | ✅    | (✅)   | Use buffers with more or fewer components than expected by the shader (missing values will be filled with `[0, 0, 0, 1]`).                                     |
| Normalized 32-bit integers | ✅    | ❌     | WebGPU 32 bit integer formats cannot be normalized                                                                                                             |
| Per-attribute`stepMode`    | ✅    | ❌     | `stepMode` (WebGL: `divisor`, controls whether an attribute is instanced) can be set per-attribute, even when multiple attributes bind to the same buffer.     |
| Per-attribute`byteStride`  | ✅    | ❌     | `byteStride` (controls byte distance between two successive values in memory) can be set per-attribute, even when multiple attributes bind to the same buffer. |
| Dynamic `VertexFormat`     | ✅    | ❌     | Buffers with different structure (different `BufferLayout`) can be provided without relinking the `RenderPipeline`                                             |
| Constant attributes        | ✅    | ❌     | (attribute locations can be disabled in which case a constant value is read from the WebGLRenderingContext)                                                    |
| Non-normalized integers    | ✅    | ❌     | Non-normalized integer attributes can be assigned to floating point GLSL shader variables (e.g. `vec4`).                                                       |

Presumably, the heavy restrictions in WebGPU are motivated by:

* portability across Vulkan/Metal/D3D12.
* additional optimizations during shader compilation
* reduced run-time validation overhead

In general, an argument can be made that in WebGPU / WGLS, attributes are less important since storage buffers are much more flexible, allowing arbitrary memory layouts, random access, and less limitations on number of bindings etc. Attributes **may** be faster than storage bindings, but at the moment there is no clear evidence that this is the case.

Notes:

* WebGPU: 8 and 16 bit formats only support 1, 2 or 4 components (only 2 or 4 components pre Chrome c133).
* WebGL: GLSL supports `bool` and `bvec*` but these are not portable to WebGPU and are not included by luma.gl.
* WebGL: GLSL types `double` and `dvec*` are not supported in any WebGL version (nor is `f64` supported in WebGPU).
