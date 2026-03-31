# Bind Groups and Bindings

luma.gl uses the term **binding** for GPU resources that shaders read through
named binding declarations: uniform buffers, storage buffers, textures, and
samplers.

On WebGPU these bindings are organized into **bind groups**. luma.gl exposes the
same grouped model across both WebGPU and WebGL:

- WebGPU uses native bind groups.
- WebGL has no native bind groups, so luma.gl emulates them logically from
  shader layout metadata.

This page explains how to describe grouped bindings in luma.gl and how to pass
them to pipelines and models.

## Quick Rule

For WGSL that goes through `Model` or shadertools assembly, prefer
`@binding(auto)` and pass bindings by name.

```wgsl
@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var colorTexture: texture_2d<f32>;
@group(0) @binding(auto) var colorTextureSampler: sampler;
```

```ts
model.setBindings({
  app: uniformBuffer,
  colorTexture: texture
});
```

In that flow, luma.gl assigns the numeric binding locations for you. The rest
of this page is mainly for custom grouping, low-level pipeline work, and
understanding how those names map to bind groups.

## Core Concepts

The main public concepts are:

- `ShaderLayout.bindings[]` declares the static bindings a shader expects.
- `BindingDeclaration.group` assigns each binding to a logical bind-group index.
- `Bindings` is a flat map of binding names to GPU resources.
- `BindingsByGroup` is a grouped map keyed by bind-group index.
- `bindGroups` is the grouped binding input accepted by render paths that want
  to bind by group explicitly.

In practice, a shader layout might assign:

- group `0` to core per-draw engine state
- group `1` to application-defined shared state
- group `2` to lighting and other scene invariants
- group `3` to material bindings

This is the current recommended organization in luma.gl, not a hard rule.

## Recommended Grouping Convention

The current luma.gl convention is:

- group `0` for core engine-owned per-draw state
- group `1` for application-defined shared state
- group `2` for lighting and other scene invariants reused across many materials
- group `3` for per-material surface state

### Modules That Usually Belong In Group `0`

- `picking`
- mixed projection-style blocks such as `project` or `pbrProjection` when they
  also include object-dependent matrices such as `modelMatrix`,
  `normalMatrix`, or model-view-projection derivatives
- skinning data
- transform or object data
- other core per-draw engine data

Current explicit examples in the repo:

- `pbrProjection`
- `skin`

If a renderer splits out a pure camera or view-projection block with no
object-dependent data, that block could reasonably live in group `1` or group
`2`. luma.gl's current stock projection-style modules remain in group `0`
because they are mixed camera-and-object blocks.

### Group `1` As An Extension Layer

Group `1` is intentionally left open as an application-defined shared layer.

Typical uses include:

- renderer feature blocks shared by a subset of draws
- app-specific environment or simulation state
- terrain, atmosphere, or dataset-level state
- other state reused across many draw calls but not treated as core engine
  state and not universally scene-wide like lighting

### Modules That Usually Belong In Group `2`

- `lighting`
- shared IBL or environment data
- other scene-wide invariants reused across many materials and draws
- shadow maps and shadow parameters

Current explicit examples in the repo:

- `lighting`
- `dirlight`
- `ibl`

### Modules That Usually Belong In Group `3`

- material uniform blocks
- material textures and samplers
- per-material overrides of otherwise shared scene shading data

Current explicit examples in the repo:

- `pbrMaterial`
- `lambertMaterial`
- `phongMaterial`
- `gouraudMaterial`

For a conceptual explanation of what should and should not be treated as a
material, see the [Materials guide](/docs/api-guide/engine/materials).

### Effects And Postprocessing

For effects and postprocessing, prefer group `0` for now, not group `3`.

Reason:

- group `3` is becoming the dedicated home for per-material surface state
- postprocess effects are pass-local state, not material state
- overloading group `3` for both materials and effects would blur the convention immediately

If luma.gl later adopts a dedicated postprocess grouping convention, it should
be documented explicitly rather than inferred from the material convention.

## Declaring Groups in `ShaderLayout`

The `group` field lives on each binding declaration.

```ts
const shaderLayout = {
  attributes: [{name: 'positions', location: 0, type: 'vec3<f32>'}],
  bindings: [
    {name: 'frameUniforms', type: 'uniform', group: 0, location: 0},
    {name: 'lightingUniforms', type: 'uniform', group: 2, location: 0},
    {name: 'materialUniforms', type: 'uniform', group: 3, location: 0},
    {name: 'baseColorTexture', type: 'texture', group: 3, location: 1},
    {name: 'baseColorSampler', type: 'sampler', group: 3, location: 2}
  ]
};
```

Two important points:

- `location` is the binding index **within that group**.
- Groups can be sparse. If a shader uses groups `0`, `2`, and `3`, luma.gl
  treats that as valid.

## Flat `bindings` vs grouped `bindGroups`

You can provide resources in either form.

Flat bindings:

```ts
const bindings = {
  frameUniforms,
  lightingUniforms,
  materialUniforms,
  baseColorTexture: textureView,
  baseColorSampler: sampler
};
```

Grouped bindings:

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

Flat `bindings` remain supported for compatibility. When you pass flat bindings,
luma.gl partitions them into groups using the `group` metadata from the
`ShaderLayout`.

Use `bindGroups` when you want explicit grouping in application code. Use flat
`bindings` when that is more convenient or when higher-level engine APIs already
produce a flat binding map.

## WebGPU vs WebGL

### WebGPU

WebGPU uses native bind groups. luma.gl maps each `group` in the shader layout
to a WebGPU bind-group slot and binds each populated group before drawing or
dispatching.

### WebGL

WebGL shaders do not declare bind groups. WebGL only exposes flat binding
mechanisms such as uniform blocks and texture units.

luma.gl therefore emulates bind groups logically on WebGL:

- the `group` field still exists in `ShaderLayout`
- flat bindings can still be partitioned into logical groups
- actual WebGL binding still happens through uniform-block bindings and texture
  units at draw time

Because GLSL/WebGL reflection does not expose groups, WebGL grouping depends on
luma-authored layout metadata rather than shader introspection alone.

## End-to-End `RenderPipeline` Example

This example shows a WGSL-style layout using group `0` for frame data, group `2`
for lighting, and group `3` for material state.

```ts
const vs = device.createShader({
  stage: 'vertex',
  source: /* wgsl */ `
  struct FrameUniforms {
    modelViewProjectionMatrix: mat4x4<f32>
  };

  @group(0) @binding(0) var<uniform> frameUniforms: FrameUniforms;

  @vertex
  fn vertexMain(@location(0) positions: vec3f) -> @builtin(position) vec4f {
    return frameUniforms.modelViewProjectionMatrix * vec4f(positions, 1.0);
  }
  `
});

const fs = device.createShader({
  stage: 'fragment',
  source: /* wgsl */ `
  struct LightingUniforms {
    ambientColor: vec3f
  };

  struct MaterialUniforms {
    baseColorFactor: vec4f
  };

  @group(2) @binding(0) var<uniform> lightingUniforms: LightingUniforms;
  @group(3) @binding(0) var<uniform> materialUniforms: MaterialUniforms;
  @group(3) @binding(1) var baseColorTexture: texture_2d<f32>;
  @group(3) @binding(2) var baseColorSampler: sampler;

  @fragment
  fn fragmentMain() -> @location(0) vec4f {
    let textureColor = textureSample(baseColorTexture, baseColorSampler, vec2f(0.5, 0.5));
    return vec4f(textureColor.rgb * lightingUniforms.ambientColor, textureColor.a) *
      materialUniforms.baseColorFactor;
  }
  `
});

const pipeline = device.createRenderPipeline({
  vs,
  fs,
  shaderLayout: {
    attributes: [{name: 'positions', location: 0, type: 'vec3<f32>'}],
    bindings: [
      {name: 'frameUniforms', type: 'uniform', group: 0, location: 0},
      {name: 'lightingUniforms', type: 'uniform', group: 2, location: 0},
      {name: 'materialUniforms', type: 'uniform', group: 3, location: 0},
      {name: 'baseColorTexture', type: 'texture', group: 3, location: 1},
      {name: 'baseColorSampler', type: 'sampler', group: 3, location: 2}
    ]
  },
  bindGroups: {
    0: {frameUniforms},
    2: {lightingUniforms},
    3: {
      materialUniforms,
      baseColorTexture: textureView,
      baseColorSampler: sampler
    }
  }
});
```

You can also pass the same resources as flat `bindings`; luma.gl will route them
to the correct groups using the shader layout.

## Engine Example

At the engine level, `Model` still primarily works with flat bindings. Grouping
comes from shader layout and shader-module metadata rather than a separate model
API.

```ts
import {Model, ShaderInputs} from '@luma.gl/engine';
import {lighting, pbrMaterial} from '@luma.gl/shadertools';

const shaderInputs = new ShaderInputs({lighting, pbrMaterial});

const model = new Model(device, {
  vs,
  fs,
  modules: [lighting, pbrMaterial],
  shaderInputs
});

shaderInputs.setProps({
  lighting: {
    useByteColors: false,
    lights: [{type: 'ambient', color: [1, 1, 1], intensity: 0.2}]
  },
  pbrMaterial: {
    baseColorFactor: [1, 0.8, 0.7, 1]
  }
});

model.setBindings({
  pbr_baseColorSampler: textureView
});
```

Here `Model` manages the module uniform buffers internally through
`shaderInputs`, while the explicitly supplied texture binding still uses a flat
binding map. The `lighting` module declares its bindings in group `2` and
`pbrMaterial` declares its bindings in group `3`, so luma.gl can preserve the
logical grouping internally.

## Migration Notes

- Existing code that passes flat `bindings` does not need to change immediately.
- To start organizing bindings by group, add `group` metadata to shader layouts
  or shader modules first.
- Move to `bindGroups` when explicit grouping is useful in your application or
  when you want your code structure to mirror the shader layout more closely.

## Related Pages

- [Bindings Reference](/docs/api-reference/core/bindings)
- [ShaderLayout](/docs/api-reference/core/shader-layout)
- [RenderPipeline](/docs/api-reference/core/resources/render-pipeline)
- [ComputePipeline](/docs/api-reference/core/resources/compute-pipeline)
- [Shader Module Conventions](/docs/api-reference/shadertools/shader-conventions)
