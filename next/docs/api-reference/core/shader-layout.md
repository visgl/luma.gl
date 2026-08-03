# ShaderLayout

[ShaderLayout](https://luma.gl/next/docs/api-reference/core/shader-layout.md)[Bindings](https://luma.gl/next/docs/api-reference/core/bindings.md)[ShaderBlockLayout](https://luma.gl/next/docs/api-reference/core/shader-block-layout.md)[BufferLayout](https://luma.gl/next/docs/api-reference/core/buffer-layout.md)[UniformStore](https://luma.gl/next/docs/api-reference/core/uniform-store.md)

A `ShaderLayout` describes the static interface of a shader pipeline:

* vertex attributes
* bindings such as uniform buffers, storage buffers, textures, and samplers

luma.gl uses `ShaderLayout` to match named JavaScript resources to the numeric binding locations used by GPU shaders.

## Usage[​](#usage "Direct link to Usage")

```
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

## Types[​](#types "Direct link to Types")

### `ShaderLayout`[​](#shaderlayout-1 "Direct link to shaderlayout-1")

```
type ShaderLayout = {
  attributes: AttributeDeclaration[];
  bindings: BindingDeclaration[];
  uniforms?: any[];
  varyings?: VaryingBinding[];
};
```

### `ComputeShaderLayout`[​](#computeshaderlayout "Direct link to computeshaderlayout")

```
type ComputeShaderLayout = {
  bindings: BindingDeclaration[];
};
```

## Attributes[​](#attributes "Direct link to Attributes")

```
type AttributeDeclaration = {
  name: string;
  location: number;
  type: AttributeShaderType;
  stepMode?: 'vertex' | 'instance';
};
```

Example:

```
const shaderLayout = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'instanceOffsets', location: 1, type: 'vec2<f32>', stepMode: 'instance'}
  ],
  bindings: []
};
```

## Bindings[​](#bindings "Direct link to Bindings")

Bindings are declared as `BindingDeclaration` variants such as:

* `UniformBufferBindingLayout`
* `StorageBufferBindingLayout`
* `TextureBindingLayout`
* `SamplerBindingLayout`
* `StorageTextureBindingLayout`

All binding declarations include these core fields:

```
{
  name: string;
  group: number;
  location: number;
  type: ...;
}
```

### `group`[​](#group "Direct link to group")

`group` is the logical bind-group index for the binding.

Example:

```
bindings: [
  {name: 'frameUniforms', type: 'uniform', group: 0, location: 0},
  {name: 'lightingUniforms', type: 'uniform', group: 2, location: 0},
  {name: 'materialUniforms', type: 'uniform', group: 3, location: 0},
  {name: 'baseColorTexture', type: 'texture', group: 3, location: 1},
  {name: 'baseColorSampler', type: 'sampler', group: 3, location: 2}
]
```

Important details:

* `location` is the binding index within its group.
* Groups can be sparse.
* On WebGL, `group` is still meaningful to luma.gl even though WebGL itself has no native bind-group concept.

### Example binding declaration variants[​](#example-binding-declaration-variants "Direct link to Example binding declaration variants")

Uniform buffer:

```
{
  name: 'frameUniforms',
  type: 'uniform',
  group: 0,
  location: 0
}
```

Texture:

```
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

```
{
  name: 'baseColorSampler',
  type: 'sampler',
  group: 3,
  location: 2,
  samplerType: 'filtering'
}
```

## WebGPU vs WebGL[​](#webgpu-vs-webgl "Direct link to WebGPU vs WebGL")

### WebGPU[​](#webgpu "Direct link to WebGPU")

WebGPU can use the `group` and `location` metadata directly as native bind-group and binding indices.

### WebGL[​](#webgl "Direct link to WebGL")

WebGL reflection does not expose bind-group indices. luma.gl can still preserve logical grouping on WebGL, but it relies on explicit shader-layout metadata or other luma-authored binding metadata rather than GLSL reflection alone.

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [Bind Groups and Bindings Guide](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md)
* [Bindings](https://luma.gl/next/docs/api-reference/core/bindings.md)
* [RenderPipeline](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md)
* [ComputePipeline](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md)
