# ShaderBlockLayout

[ShaderLayout](https://luma.gl/docs/api-reference/core/shader-layout.md)[Bindings](https://luma.gl/docs/api-reference/core/bindings.md)[Block layout](https://luma.gl/docs/api-reference/core/shader-block-layout.md)[BufferLayout](https://luma.gl/docs/api-reference/core/buffer-layout.md)[UniformStore](https://luma.gl/docs/api-reference/core/uniform-store.md)

`ShaderBlockLayout` is the portable description of how luma.gl packs uniform-style and storage-style shader blocks on the CPU before uploading them to GPU buffers.

Use [`makeShaderBlockLayout()`](https://luma.gl/docs/api-reference/core/shader-block-layout.md) to build the immutable layout metadata, then pass that layout to `ShaderBlockWriter` to flatten nested values and serialize binary block data.

## Usage[​](#usage "Direct link to Usage")

Create layout metadata that matches the block declaration in your shader:

```
#version 300 es

layout(std140) uniform matrixBlock {

  mat4 mvp;

} matrix;
```

```
import {makeShaderBlockLayout, ShaderBlockWriter} from '@luma.gl/core';



const shaderBlockLayout = makeShaderBlockLayout({

  mvp: 'mat4x4<f32>'

});



const shaderBlockWriter = new ShaderBlockWriter(shaderBlockLayout);

const data = shaderBlockWriter.getData({

  mvp: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

});
```

Allocate a GPU buffer using the computed byte length:

```
const uniformBuffer = device.createBuffer({

  usage: Buffer.UNIFORM | Buffer.COPY_DST,

  byteLength: shaderBlockLayout.byteLength

});



uniformBuffer.write(data);
```

## `makeShaderBlockLayout(uniformTypes, options?)`[​](#makeshaderblocklayoutuniformtypes-options "Direct link to makeshaderblocklayoutuniformtypes-options")

Builds a pure `ShaderBlockLayout` object.

* `uniformTypes` uses the composite shader-type descriptors documented in [Shader Types](https://luma.gl/docs/api-reference/core/shader-types.md)

* `options.layout` selects the packing rules:

  <!-- -->

  * `'std140'`
  * `'wgsl-uniform'`
  * `'wgsl-storage'`

The returned layout includes:

* `layout`
* `byteLength`
* `uniformTypes`
* `fields`

Each `fields[name]` entry describes one flattened leaf field with:

* `offset`
* `size`
* `components`
* `columns`
* `rows`
* `columnStride`
* `shaderType`
* `type`

All offsets and sizes are expressed in 32-bit words.

## `ShaderBlockWriter`[​](#shaderblockwriter "Direct link to shaderblockwriter")

`ShaderBlockWriter` serializes nested JavaScript values using a precomputed `ShaderBlockLayout`.

### `new ShaderBlockWriter(layout)`[​](#new-shaderblockwriterlayout "Direct link to new-shaderblockwriterlayout")

Creates a writer for an existing `ShaderBlockLayout`.

### `has(name): boolean`[​](#hasname-boolean "Direct link to hasname-boolean")

Returns whether the flattened block contains a field path.

### `get(name)`[​](#getname "Direct link to getname")

Returns the `offset` and `size` for a flattened field path.

### `getFlatUniformValues(uniformValues)`[​](#getflatuniformvaluesuniformvalues "Direct link to getflatuniformvaluesuniformvalues")

Flattens nested struct and fixed-size array values into leaf-path uniforms.

### `getData(uniformValues): Uint8Array`[​](#getdatauniformvalues-uint8array "Direct link to getdatauniformvalues-uint8array")

Returns serialized block data ready to upload into a GPU buffer.

## Remarks[​](#remarks "Direct link to Remarks")

* WebGL uniform buffers should use `layout(std140)` in GLSL to match host-side std140 packing.
* `ShaderBlockLayout` is the portable block-packing API. The separate [`BufferLayout`](https://luma.gl/docs/api-reference/core/buffer-layout.md) type still describes vertex buffer attribute layout.
* [`UniformStore`](https://luma.gl/docs/api-reference/core/uniform-store.md) uses `ShaderBlockLayout` and `ShaderBlockWriter` internally.

### ⚖️ Shader Block Layout Comparison[​](#️-shader-block-layout-comparison "Direct link to ⚖️ Shader Block Layout Comparison")

| Layout    | Usage          | WebGPU | WebGL2 | Deterministic | Efficient | Notes                                                                                |
| --------- | -------------- | ------ | ------ | ------------- | --------- | ------------------------------------------------------------------------------------ |
| `uniform` | WGSL (uniform) | ✅     | ❌     | ✅            | ⚠️        | Conservative alignment (partially std140-like)                                       |
| `storage` | WGSL (storage) | ✅     | ❌     | ✅            | ✅        | Tight packing, close to hardware                                                     |
| `std140`  | GLSL (uniform) | ❌     | ✅     | ✅            | ❌        | WebGL standard, over-aligned (legacy constraints)                                    |
| `std430`  | GLSL (storage) | ❌     | ❌     | ✅            | ✅        | Vulkan / modern APIs, tighter packing; storage not available in GLSL ES 3.0 / WebGL2 |
| `native`  | GLSL (uniform) | ❌     | ⚠️     | ❌            | ✅        | Implementation-defined, requires reflection                                          |

***

### 🧠 Remarks[​](#-remarks "Direct link to 🧠 Remarks")

* WGSL (uniform) uses **conservative alignment rules** to ensure portability; some padding remains compared to fully tight layouts
* WGSL (storage) provides **tight packing** similar to modern GPU-native layouts and is the most efficient option in WebGPU
* `std140` provides **predictable layout rules** for WebGL, but introduces **significant padding** and reflects legacy GPU constraints
* `std430` represents **modern, tightly packed layouts** (Vulkan/Metal/DXC); however, storage buffers are not available in GLSL ES 3.0 / WebGL2
* GLSL “native” layouts are efficient but **not portable**; they require querying offsets via WebGL reflection APIs and are unsuitable for deterministic engines like luma.gl
