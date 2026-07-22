import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {DeferredRenderingExample} from '@site/src/examples';

# Deferred Lighting

<ExperimentalDocsTabs active="deferred-lighting" />

`deferredLighting` is an experimental WebGPU-only fullscreen shader pass that resolves physically
based opaque lighting from a `GBuffer`. Geometry writes surface properties once; the resolve then
reconstructs view-space position from depth and evaluates one directional light plus up to 64
point lights from a storage buffer.

The pass stays intentionally composable. It does not traverse a scene, own materials, or allocate
the G-buffer. Applications choose their geometry, material packing, light animation, and the
effect passes that run before or after the resolve.

<DeferredRenderingExample embedded showStats={false} />

## Material attachment contract

`deferredLighting` consumes the standard `GBuffer` depth and normal-roughness channels plus two
named extra color attachments:

| G-buffer output | Suggested format | Meaning |
| --- | --- | --- |
| `@location(0)` scene color | `rgba16float` | Background/fallback color when depth contains no opaque surface. |
| `@location(1)` normal-roughness | `rgba8unorm` | View-space normal encoded as `normal * 0.5 + 0.5` in RGB; perceptual roughness in A. |
| `@location(2)` velocity | `rg16float` | Current-minus-previous screen UV velocity for later temporal effects. |
| `@location(3)` `baseColorMetallic` | `rgba8unorm` | Linear base color in RGB; metallic factor in A. |
| `@location(4)` `emissiveOcclusion` | `rgba8uint` | Normalized emissive color in RGB and ambient-occlusion factor in A, packed to 0–255 integers. |
| depth attachment | `depth24plus` | Sampleable depth used to reconstruct view position. |

The extra attachment names are conventions at the application boundary; `GBuffer` itself permits
any names. The resolve bindings use `baseColorMetallicTexture` and
`emissiveOcclusionTexture`. This layout keeps HDR scene color while totaling 32 color-attachment
bytes per sample, so it runs on the portable WebGPU CORE limit without requesting a higher device
limit.

## Usage

```ts
import {Buffer} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  createDeferredLightingShaderPassPipeline,
  GBuffer,
  makeDeferredPointLightBufferData,
  MAX_DEFERRED_POINT_LIGHTS
} from '@luma.gl/experimental';

const gBuffer = new GBuffer(device, {
  width,
  height,
  colorFormat: 'rgba16float',
  extraColorAttachments: [
    {name: 'baseColorMetallic', format: 'rgba8unorm'},
    {name: 'emissiveOcclusion', format: 'rgba8uint'}
  ]
});

const pointLights = device.createBuffer({
  data: makeDeferredPointLightBufferData(lights, MAX_DEFERRED_POINT_LIGHTS),
  usage: Buffer.STORAGE | Buffer.COPY_DST
});

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [createDeferredLightingShaderPassPipeline()]
});

renderer.renderToScreen({
  sourceTexture: gBuffer.colorTexture,
  bindings: {
    depthTexture: gBuffer.depthTexture,
    normalTexture: gBuffer.normalRoughnessTexture,
    baseColorMetallicTexture: gBuffer.getExtraColorTexture('baseColorMetallic'),
    emissiveOcclusionTexture: gBuffer.getExtraColorTexture('emissiveOcclusion'),
    pointLights
  },
  uniforms: {
    deferredLighting: {
      inverseProjectionMatrix,
      ambientColor: [0.03, 0.03, 0.05],
      directionalLightDirectionView,
      directionalLightColor: [1, 0.9, 0.8],
      directionalLightIntensity: 2.5,
      pointLightCount: lights.length
    }
  }
});
```

Point-light positions and the directional-light direction are view-space values. Update the
storage buffer with `pointLights.write(makeDeferredPointLightBufferData(...))` when lights move.

## API

### `deferredLighting`

The exported `ShaderPass` descriptor. It samples:

- `depthTexture`
- `normalTexture`
- `baseColorMetallicTexture`
- `emissiveOcclusionTexture`
- `pointLights`

Its uniforms are `inverseProjectionMatrix`, `ambientColor`,
`directionalLightDirectionView`, `directionalLightColor`, `directionalLightIntensity`, and
`pointLightCount`.

### `createDeferredLightingShaderPassPipeline(): ShaderPassPipeline`

Returns a one-step pipeline that reads the current `previous` color and writes the lighting result
back into `previous`. Put it before SSAO, reflections, temporal accumulation, bloom, and tone
mapping unless a deliberate stylized ordering needs otherwise.

### `makeDeferredPointLightBufferData(lights, maxLightCount?): Float32Array`

Packs each light into two `vec4f` storage records:

```text
position.xyz, range, color.rgb, intensity
```

The returned array is padded to `maxLightCount`, allowing one fixed-size GPU buffer to be reused
across frames. `MAX_DEFERRED_POINT_LIGHTS` is 64 and matches the shader loop bound.

## Related pages

- [`GBuffer`](/docs/api-reference/experimental/g-buffer) owns the MRT attachments and standard
  depth, normal, and velocity bindings.
- [Clustered Lighting](/docs/api-reference/experimental/clustered-lighting) reuses the same
  material attachments with compute-built light lists for hundreds of local lights.
- [Shader Passes](/docs/api-guide/shaders/shader-passes) explains the ordered composable render
  stack.
- [Advanced Effects](/examples/experimental/advanced-effects) shows the broader scene-aware and
  temporal effect chain after opaque rendering.
