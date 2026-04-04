# ShaderLayout

A `ShaderLayout` describes the static interface of a shader pipeline:

- vertex attributes
- bindings such as uniform buffers, storage buffers, textures, and samplers

luma.gl uses `ShaderLayout` to match named JavaScript resources to the numeric
binding locations used by GPU shaders.

## Types

### `ShaderLayout`

```ts
type ShaderLayout = {
  attributes: AttributeDeclaration[];
  bindings: BindingDeclaration[];
  uniforms?: any[];
  varyings?: VaryingBinding[];
};
```

### `ComputeShaderLayout`

```ts
type ComputeShaderLayout = {
  bindings: BindingDeclaration[];
};
```

## Attributes

```ts
type AttributeDeclaration = {
  name: string;
  location: number;
  type: AttributeShaderType;
  stepMode?: 'vertex' | 'instance';
};
```

Example:

```ts
const shaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'instanceOffsets', location: 1, type: 'vec2<f32>', stepMode: 'instance'}
  ],
  bindings: []
};
```

## Bindings

Bindings are declared as `BindingDeclaration` variants such as:

- `UniformBufferBindingLayout`
- `StorageBufferBindingLayout`
- `TextureBindingLayout`
- `SamplerBindingLayout`
- `StorageTextureBindingLayout`

All binding declarations include these core fields:

```ts
{
  name: string;
  group: number;
  location: number;
  type: ...;
}
```

### `group`

`group` is the logical bind-group index for the binding.

Example:

```ts
bindings: [
  {name: 'frameUniforms', type: 'uniform', group: 0, location: 0},
  {name: 'lightingUniforms', type: 'uniform', group: 2, location: 0},
  {name: 'materialUniforms', type: 'uniform', group: 3, location: 0},
  {name: 'baseColorTexture', type: 'texture', group: 3, location: 1},
  {name: 'baseColorSampler', type: 'sampler', group: 3, location: 2}
]
```

Important details:

- `location` is the binding index within its group.
- Groups can be sparse.
- On WebGL, `group` is still meaningful to luma.gl even though WebGL itself has
  no native bind-group concept.

### Example binding declaration variants

Uniform buffer:

```ts
{
  name: 'frameUniforms',
  type: 'uniform',
  group: 0,
  location: 0
}
```

Texture:

```ts
{
  name: 'baseColorTexture',
  type: 'texture',
  group: 3,
  location: 1,
  viewDimension: '2d',
  sampleType: 'float'
}
```

Sampler:

```ts
{
  name: 'baseColorSampler',
  type: 'sampler',
  group: 3,
  location: 2,
  samplerType: 'filtering'
}
```

## Usage

```ts
const shaderLayout = {
  attributes: [{name: 'positions', location: 0, type: 'vec3<f32>'}],
  bindings: [
    {name: 'frameUniforms', type: 'uniform', group: 0, location: 0},
    {name: 'lightingUniforms', type: 'uniform', group: 2, location: 0},
    {name: 'materialUniforms', type: 'uniform', group: 3, location: 0}
  ]
};

const pipeline = device.createRenderPipeline({
  vs,
  fs,
  shaderLayout
});
```

## WebGPU vs WebGL

### WebGPU

WebGPU can use the `group` and `location` metadata directly as native bind-group
and binding indices.

### WebGL

WebGL reflection does not expose bind-group indices. luma.gl can still preserve
logical grouping on WebGL, but it relies on explicit shader-layout metadata or
other luma-authored binding metadata rather than GLSL reflection alone.

## Related Pages

- [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings)
- [Bindings](/docs/api-reference/core/bindings)
- [RenderPipeline](/docs/api-reference/core/resources/render-pipeline)
- [ComputePipeline](/docs/api-reference/core/resources/compute-pipeline)
