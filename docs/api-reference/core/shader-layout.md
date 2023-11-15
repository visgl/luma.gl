# ShaderLayout

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

A `ShaderLayout` object describes the static structure a `RenderPipeline, "location" and structure of binding points of shaders,
 including attributes, bindings (textures, samplers, uniform buffers), and uniforms (under WebGL) and also lets the application
 assign a name to each binding point (typically matching the name used in the shader code).

Note that a `ShaderLayout` only describes static data and it is typically complemented by a [`BufferLayout`](./buffer-layout.md), which contains
"dynamic" data such as the specific layout and structure of the buffers that will be provided to a `RenderPipeline`. The application
could choose to provide buffers with different vertex formats, strides, and offsets, without changing the shader.

Shader code (WGSL and GLSL) contains declarations of attributes, uniform blocks, samplers etc, describing all required data inputs and outputs. After compilation and linking of fragment and vertex shaders into a pipeline, the resolved declarations collectively define the layout of the data that needs to be bound before the shader can execute on the GPU.

As a preparation to a `RenderPipeline` `draw()` call, the GPU data 
required by the pipeline's shaders must be bound on the CPU via luma.gl calls such as `setAttributes()`, `setIndexBuffer()`, `setBindings()` etc. 
For these calls to work, the metadata in the `ShaderLayout` object is needed in JavaScript.

Note that `ShaderLayout`s are designed to be created manually by a programmer (who needs to make sure all relevant declarations in the shader code are described in the `ShaderLayout`).

Remarks:
- In WebGL, a default `ShaderLayout` is extracted automatically by the `RenderPipeline` in WebGL. 
However this is not yet possible in WebGPU. Therefore it is necessary to provide an explicit `layout` property to any `RenderPipeline` that is expected to run in WebGPU. This restriction may be lifted in the future.
- It is not possible to automatically infer from a shader which attributes should have instanced step modes. The heuristic applied by luma.gl under WebGL is that any attribute which contains the string `instanced` will be assumed to have `stepMode='instance'`.
-  
## Usage

```typescript
type ShaderLayout = {
  attributes: [
    instancePositions: {location: 0, format: 'float32x2', stepMode: 'instance'},
    instanceVelocities: {location: 1, format: 'float32x2', stepMode: 'instance'},
    vertexPositions: {location: 2, format: 'float32x2', stepMode: 'vertex'}
  ],

  bindings: {
    projection: {location: 0, type: 'uniforms'},
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

- `location: number` Compiled pipelines use small integer indices ("locations") to describe binding points (rather than string names). `ShaderLayout` assigns names to each attribute which allows applications to avoid keeping track of these location indices.
- `format: VertexFormat`
- `stepMode: 'vertex' | 'instance'` - 


### bindings

Bindings cover textures, samplers and uniform buffers. location (index on the GPU)
and type are the key pieces of information that need to be provided.

```typescript
  bindings?: {
    projection: {location: 0, type: 'uniforms'},
    textureSampler: {location: 1, type: 'sampler'},
    texture: {location: 2, type: 'texture'}
  }
```

- `location: number` Compiled pipelines use small integer indices ("locations") to describe binding points (rather than string names). `ShaderLayout` assigns names to each attribute which allows applications to avoid keeping track of these location indices.
- `type: 'texture' | 'sampler' | uniform'` The type of bind point (texture, sampler or uniform buffer). WebGPU requires separate bind points for textures and samplers. 


### uniforms

:::caution
Uniforms are a WebGL-only concept. For portability it is recommended to use uniform buffers instead.
:::

Any top-level shader uniforms (not part of a uniform buffer) should be declared in this field.
