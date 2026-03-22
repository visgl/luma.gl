# Bindings

Bindings are the GPU resources that shader code accesses through declared
binding points:

- uniform buffers
- storage buffers
- textures
- samplers

In luma.gl, bindings are passed by **name** and matched against a
[`ShaderLayout`](/docs/api-reference/core/shader-layout).

## Types

### `Binding`

```ts
type Binding =
  | TextureView
  | Texture
  | Sampler
  | Buffer
  | {buffer: Buffer; offset?: number; size?: number};
```

This is the value type for one named binding.

### `Bindings`

```ts
type Bindings = Record<string, Binding>;
```

This is the flat binding map used throughout luma.gl for compatibility and
convenience.

Example:

```ts
const bindings = {
  frameUniforms,
  lightingUniforms,
  materialUniforms,
  baseColorTexture: textureView,
  baseColorSampler: sampler
};
```

### `BindingsByGroup`

```ts
type BindingsByGroup = Partial<Record<number, Bindings>>;
```

This is the grouped binding map keyed by bind-group index.

Example:

```ts
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

## How luma.gl uses groups

The `group` field is declared on each binding in the
[`ShaderLayout`](/docs/api-reference/core/shader-layout).

When you pass flat `bindings`, luma.gl partitions them into groups using that
layout metadata. When you pass grouped `bindGroups`, luma.gl uses the grouping
you provide directly.

This means:

- flat `bindings` remain supported
- grouped `bindGroups` are available when you want explicit bind-group structure
- the shader layout is the source of truth for which group each named binding
  belongs to

## WebGPU vs WebGL

### WebGPU

WebGPU uses native bind groups, so luma.gl maps each logical group to the
corresponding WebGPU bind-group slot.

### WebGL

WebGL does not support bind groups natively. luma.gl emulates them logically and
then applies the actual bindings through WebGL uniform blocks and texture units.

WebGL reflection does not expose group indices, so grouped behavior on WebGL
depends on explicit shader-layout metadata.

## Where bindings are accepted

- [`RenderPipeline`](/docs/api-reference/core/resources/render-pipeline)
  - `bindings`
  - `bindGroups`
- [`ComputePipeline`](/docs/api-reference/core/resources/compute-pipeline)
  - `setBindings(bindingsOrBindGroups)`

## Related Pages

- [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings)
- [ShaderLayout](/docs/api-reference/core/shader-layout)
