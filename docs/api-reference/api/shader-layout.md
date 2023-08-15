# ShaderLayout

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

luma.gl defines the `ShaderLayout` type to collect a description of a (pair of) shaders. 
A `ShaderLayout` is used when creating a `RenderPipeline` or `ComputePipeline`.

The binding of data is performed in JavaScript on the CPU. For this to work,
a certain amount of metadata is needed in JavaScript that describes the layout of a
render or compute pipeline's specific shaders.

Shader code contains declarations of attributes, uniform blocks, samplers etc in WGSL or GLSL code. After compilation and linking of fragment and vertex shaders into a pipeline, the resolved declarations collectively define the layout of the data that needs to be bound before the shader can execute on the GPU.

`ShaderLayout`s can be created manually by a programmer (by reading the shader code
and copying the relevant declarations).

:::info
A default `ShaderLayout` is be extracted programmatically by the `RenderPipeline` in WebGL, but this is not yet possible in WebGPU. Therefore it is necessary to provide an explicit `layout` property to any `RenderPipeline` that is expected to run in WebGPU. This restriction may be lifted in the future.
:::

```typescript
type ShaderLayout = {
  attributes: [
    instancePositions: {location: 0, format: 'float32x2', stepMode: 'instance'},
    instanceVelocities: {location: 1, format: 'float32x2', stepMode: 'instance'},
    vertexPositions: {location: 2, format: 'float32x2', stepMode: 'vertex'}
  ],

  bindings: {[bindingName: string]: BindingLayout};
    projectionUniforms: {location: 0, type: 'uniforms'},
    textureSampler: {location: 1, type: 'sampler'},
    texture: {location: 2, type: 'texture'}
  }
}

type AttributeLayout =
  {name: , location: number, format: VertexFormat, stepMode: 'vertex' | 'instance'}

type BindingLayout =
  {type: 'uniform', location: number} |
  {type: 'sampler', location: number} |
  {type: 'texture', location: number}
```

## Usage

```typescript
const shaderLayout: ShaderLayout = {
  attributes:
    'instancePositions': {location: 0, format: 'float32x2', stepMode: 'instance'},
    'instanceVelocities': {location: 1, format: 'float32x2', stepMode: 'instance'},
    'vertexPositions': {location: 2, format: 'float32x2', stepMode: 'vertex'}
  },

  bindings: {
    'uniforms': {location: 0, type: 'uniforms'},
    'sampler': {location: 1, type: 'sampler'},
    'texture': {location: 2, type: 'texture'}
  }
}
```

## Fields

### attributes

The attributes field declares structural information about the shader pipeline.
It contains  fixed information about each attribute such as its location (the index in the attribute bank, typically between 0-15) and whether the attribute is instanced.

```typescript
  attributes:
    instancePositions: {location: 0, format: 'float32x2', stepMode: 'instance'},
    instanceVelocities: {location: 1, format: 'float32x2', stepMode: 'instance'},
    vertexPositions: {location: 2, format: 'float32x2', stepMode: 'vertex'}
  }
```

### bindings

Bindings cover textures, samplers and uniform buffers. location (index on the GPU)
and type are the key pieces of information that need to be provided.

```typescript
  bindings?: {
    projectionUniforms: {location: 0, type: 'uniforms'},
    textureSampler: {location: 1, type: 'sampler'},
    texture: {location: 2, type: 'texture'}
  }
```


### uniforms

And "free" uniforms (not part of a uniform buffer) are declared in this field.

:::caution
Uniforms are a WebGL-only concept, and it is strongly recommended to use uniform 
buffers instead.
:::
