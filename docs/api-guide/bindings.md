# Understanding Bindings

luma.gl offers support for setting up ("binding") data required by the GPU during shader execution, including: 
- attribute buffers
- bindings (uniform buffers, textures, samplers, ...)
- uniforms

## Background

A key responsibility of any GPU framework is to make enable the application to
set up (or "bind") data so that it can be accessed by shader code running on the GPU. 

Shaders contain declarations of external inputs such as attributes, uniform blocks, samplers etc.
Collectively, these inputs define data that the CPU (the application) needs to be provide to the GPU
(typically by "binding" data to the right "locations").
## Shader Layout

luma.gl needs a certain amount of metadata describing what bindings a specific shader (or pair of vertex and fragment shaders) expects.

luma.gl expects this metadata to be conform to the `ShaderLayout` type, and a `ShaderLayout`-conforming object
is required when creating a `RenderPipeline` or `ComputePipeline`. 
Note that while `ShaderLayout`s must be created manually for WebGPU devices, 
luma.gl can generate them automatically on WebGL devices (using WebGL program introspection APIs).

Shaders expose numeric bindings, however in applications, named bindings tend to be more convenient,
and the ShaderLayout does include information on both names, locations and formats.


```typescript
type ShaderLayout = {
  attributes: {
    {name: 'instancePositions', location: 0, format: 'float32x2', stepMode: 'instance'},
    {name: 'instanceVelocities', location: 1, format: 'float32x2', stepMode: 'instance'},
    {name: 'vertexPositions', location: 2, format: 'float32x2', stepMode: 'vertex'}
  },

  bindings: {
    {name: 'projectionUniforms', location: 0, type: 'uniforms'},
    {name: 'textureSampler', location: 1, type: 'sampler'},
    {name: 'texture', location: 2, type: 'texture'}
  }
}

device.createRenderPipeline({
  layout,
  attributes,
  bindings
});
```

### Attribute Layout

```typescript
const shaderLayout: ShaderLayout = {
  attributes: [
    {name: 'instancePositions', location: 0, format: 'float32x2', stepMode: 'instance'},
    {name: 'instanceVelocities', location: 1, format: 'float32x2', stepMode: 'instance'},
    {name: 'vertexPositions', location: 2, format: 'float32x2', stepMode: 'vertex'}
  ],
  ...
};
```

### Buffer Mapping

For many use cases, supplying a single, "canonically" formatted buffer per attribute is sufficient. 
However, sometimes an application may want to use more sophisticated GPU buffer layouts,
controlling GPU buffer offsets, strides, interleaving etc.

Buffer mapping is an optional feature enabling custom buffer layouts and buffer interleaving.

Note that buffer mappings need to be defined when a pipeline is created, 
and all buffers subsequently supplied to that pipeline need to conform to the buffer mapping.

Example: The `bufferLayout` field in the example below specifies that both the 
`instancePositions` and `instanceVelocities` attributes should be read from a single,
interleaved buffer. In this example, since no strides are provided, supplied buffers are assumed to be "packed",
with alternating "position" and "velocity" values with no padding in between.

```typescript
device.createRenderPipeline({
  shaderLayout: {
    attributes: [
      {name: 'instancePositions', location: 0, format: 'float32x2', stepMode: 'instance'},
      {name: 'instanceVelocities', location: 1, format: 'float32x2', stepMode: 'instance'},
      {name: 'vertexPositions', location: 2, format: 'float32x2', stepMode: 'vertex'}
    ],
    ...
  },
  // We want to use "non-standard" buffers: two attributes interleaved in same buffer
  bufferLayout: [
    {name: 'particles', attributes: [
      {name: 'instancePositions'},
      {name: 'instanceVelocities'}
    ]
  ],
  attributes: {
    particles: device.createBuffer(...)
  },
  bindings: {}
});
```

## Model usage

```typescript
new Model(device, {
  shaderLayout: {
    attributes: {
      instancePositions: {location: 0, format: 'float32x2', stepMode: 'instance'},
      instanceVelocities: {location: 1, format: 'float32x2', stepMode: 'instance'},
      vertexPositions: {location: 2, format: 'float32x2', stepMode: 'vertex'}
    }
  }
});
```

## Types

### `ShaderLayout`

```typescript
export type ShaderLayout = {
  attributes: AttributeLayout[];
  bindings: BindingLayout[];
}
```

### `AttributeLayout`

- name = `string`
- location - `number`
- format - `VertexFormat`
- stepMode - `'vertex' \| 'instance'`


## Advanced Example

WGSL vertex shader

```rust
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>;
};
[[binding(0), group(0)]] var<uniform> uniforms : Uniforms; // BINDING 0

struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] fragUV : vec2<f32>;
  [[location(1)]] fragPosition: vec4<f32>;
};

[[stage(vertex)]]
fn main([[location(0)]] position : vec4<f32>,
        [[location(1)]] uv : vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix * position;
  output.fragUV = uv;
  output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));
  return output;
}
```

WGSL Fragment Shader

```rust
[[group(0), binding(1)]] var mySampler: sampler; // BINDING 1
[[group(0), binding(2)]] var myTexture: texture_2d<f32>; // BINDING 2

[[stage(fragment)]]
fn main([[location(0)]] fragUV: vec2<f32>,
        [[location(1)]] fragPosition: vec4<f32>) -> [[location(0)]] vec4<f32> {
  return textureSample(myTexture, mySampler, fragUV) * fragPosition;
}
 ```
