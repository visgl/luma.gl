# Bindings

[ShaderLayout](https://luma.gl/next/docs/api-reference/core/shader-layout.md)[Bindings](https://luma.gl/next/docs/api-reference/core/bindings.md)[ShaderBlockLayout](https://luma.gl/next/docs/api-reference/core/shader-block-layout.md)[BufferLayout](https://luma.gl/next/docs/api-reference/core/buffer-layout.md)[UniformStore](https://luma.gl/next/docs/api-reference/core/uniform-store.md)

Bindings are the GPU resources that shader code accesses through declared binding points:

* uniform buffers
* storage buffers
* textures
* samplers

In luma.gl, bindings are passed by **name** and matched against a [`ShaderLayout`](https://luma.gl/next/docs/api-reference/core/shader-layout.md).

For WGSL assembled through `Model` or shadertools, the recommended style is to use `@binding(auto)` in the shader and keep JavaScript code focused on binding names rather than numeric binding locations.

## Types[​](#types "Direct link to Types")

### `Binding`[​](#binding "Direct link to binding")

```
type Binding =
  | TextureView
  | Texture
  | Sampler
  | Buffer
  | {buffer: Buffer; offset?: number; size?: number};
```

This is the value type for one named binding.

### `Bindings`[​](#bindings-1 "Direct link to bindings-1")

```
type Bindings = Record<string, Binding>;
```

This is the flat binding map used throughout luma.gl for compatibility and convenience.

Example:

```
const bindings = {
  frameUniforms,
  lightingUniforms,
  materialUniforms,
  baseColorTexture: textureView,
  baseColorSampler: sampler
};
```

### `BindingsByGroup`[​](#bindingsbygroup "Direct link to bindingsbygroup")

```
type BindingsByGroup = Partial<Record<number, Bindings>>;
```

This is the grouped binding map keyed by bind-group index.

Example:

```
const bindGroups = {
  0: {frameUniforms},
  2: {lightingUniforms},
  3: {
    materialUniforms,
    baseColorTexture: textureView,
    baseColorSampler: sampler
  }
};
```

Groups can be sparse. For example, `{0: ..., 2: ..., 3: ...}` is valid.

## How luma.gl uses groups[​](#how-lumagl-uses-groups "Direct link to How luma.gl uses groups")

The `group` field is declared on each binding in the [`ShaderLayout`](https://luma.gl/next/docs/api-reference/core/shader-layout.md).

When you pass flat `bindings`, luma.gl partitions them into groups using that layout metadata. When you pass grouped `bindGroups`, luma.gl uses the grouping you provide directly.

This means:

* flat `bindings` remain supported
* grouped `bindGroups` are available when you want explicit bind-group structure
* the shader layout is the source of truth for which group each named binding belongs to

## WebGPU vs WebGL[​](#webgpu-vs-webgl "Direct link to WebGPU vs WebGL")

### WebGPU[​](#webgpu "Direct link to WebGPU")

WebGPU uses native bind groups, so luma.gl maps each logical group to the corresponding WebGPU bind-group slot.

### WebGL[​](#webgl "Direct link to WebGL")

WebGL does not support bind groups natively. luma.gl emulates them logically and then applies the actual bindings through WebGL uniform blocks and texture units.

WebGL reflection does not expose group indices, so grouped behavior on WebGL depends on explicit shader-layout metadata.

## Where bindings are accepted[​](#where-bindings-are-accepted "Direct link to Where bindings are accepted")

* [`RenderPass`](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md)
  * `setBindings(bindingsOrBindGroups)`
* [`RenderPipeline`](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md)
  * `bindings`, `bindGroups`, and `setBindings()` are deprecated compatibility APIs
* [`ComputePipeline`](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md)
  * `setBindings(bindingsOrBindGroups)`

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [Bind Groups and Bindings Guide](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md)
* [ShaderLayout](https://luma.gl/next/docs/api-reference/core/shader-layout.md)
