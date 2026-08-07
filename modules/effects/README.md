# @luma.gl/effects

A set of ShaderPasses implementing post processing effects for luma.gl

Advanced WebGPU-first scene-aware pipelines include SSAO, temporally stabilized GTAO,
cosine-weighted screen-space diffuse global illumination, roughness-aware screen-space
reflections with temporal reprojection and bilateral denoising, real clustered volumetric
lighting with depth-occluded crepuscular god rays, scene outlines, temporal AA, motion blur,
compact height fog, GPU-resident adaptive HDR exposure, floating-point multiscale bloom,
and reusable depth-aware blur.
Applications keep ownership of scene rendering and provide matching color, depth,
normal/roughness, and velocity textures to `ShaderPassRenderer`.
Clustered volumetric history additionally uses current inverse and previous view-projection
matrices so empty-space scattering follows camera motion, while opaque surfaces retain their
G-buffer velocity.
SSAO, GTAO, SSGI, SSR, and clustered volumetric lighting default their intermediate
framebuffers to full resolution; pass `resolutionScale` to trade edge fidelity for lower GPU cost.
GTAO additionally supports `composition: 'ambient-only'` with an explicit
`ambientLightingTexture`, preserving direct lighting and emissive scene contributions.

Notable exports include:

- `bloom`, `bloomShaderPassPipeline`, and `createBloomShaderPassPipeline`
- `toneMapping`, `ToneMappingProps`, and `ToneMappingUniforms`
- `dof` and `dofShaderPassPipeline`
- `createGTAOShaderPassPipeline`, `createSSGIShaderPassPipeline`, and
  `createSSRShaderPassPipeline`
- `createClusteredVolumetricLightingShaderPassPipeline` for light-driven participating media;
  `createVolumetricFogShaderPassPipeline` remains the simpler, lower-cost height-fog option.
- `createHDRAutoExposureShaderPassPipeline` for center-weighted GPU luminance metering and
  temporally adapted exposure.

The [Visualization City](https://luma.gl/examples/experimental/advanced-effects) example
emphasizes geometric shadows and the breadth of composable effects. The
[Illumination Lab](https://luma.gl/examples/experimental/deferred-rendering) emphasizes clustered
deferred lighting, higher-quality ambient visibility, diffuse bounce, specular reflections, and
participating-media scattering. Shared effects such as SSR use the same exported implementation
in both scenes.

`createBloomShaderPassPipeline` builds an HDR bloom pyramid with quality presets from two to five
levels. The pyramid progressively reconstructs its levels with normalized tent filtering; `scatter`,
`softKnee`, `fireflyReduction`, `anamorphicRatio`, and `tint` control the resulting glow without
requiring application-owned intermediate textures. Optional `lens` controls add aperture
diffraction, spectral lens-element ghosts, a radial halo, and sampled lens dirt. Set
`temporalStability` to accumulate neighborhood-clamped glow history. Every lens feature and temporal
history is disabled by default. The source texture must allow both sampling and, when it is produced
by an offscreen scene pass, rendering.

| Feature | Added render passes | Additional targets | Main sampling cost |
| --- | --- | --- | --- |
| Base bloom: low / medium / high / ultra | 8 / 12 / 16 / 20 total | 7 / 11 / 15 / 19 | Separable blur and normalized pyramid reconstruction. |
| Lens dirt | 0 | 0 | One full-resolution mask sample in the existing composite. |
| Spectral ghosts | 1 shared half-resolution lens pass | 1 half-resolution target | One sample per ghost, or three with chromatic separation. |
| Lens halo | Shares the same lens pass | Shares the same target | One sample, or three with chromatic separation. |
| Diffraction starburst | Shares the same lens pass | Shares the same target | Eight samples per configured diffraction ray. |
| Temporal stability | 1 half-resolution history pass | 2 persistent half-resolution textures | Five current-neighborhood samples and one history sample. |

The lens pass exists only when at least one of `starburstIntensity`, `ghostIntensity`, or
`haloIntensity` is positive. Dirt-only configurations therefore preserve the base pass count. Reduce
`quality`, `resolutionScale`, `starburstSpikes`, or `ghostCount` to trade optical detail for
throughput.

`toneMapping` applies an ACES filmic curve after exposure and preserves the source alpha channel.
Place it after bloom or other HDR effects so bright highlights roll off before presentation:

```typescript
import {ShaderPassRenderer} from '@luma.gl/engine';
import {createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';

const renderer = new ShaderPassRenderer(device, {
  shaderPasses: [
    createBloomShaderPassPipeline({
      quality: 'high',
      threshold: 0.8,
      intensity: 1.25,
      scatter: 0.55,
      softKnee: 0.5,
      fireflyReduction: 0.15,
      temporalStability: 0.55,
      lens: {
        starburstIntensity: 0.65,
        starburstSpikes: 4,
        ghostIntensity: 0.3,
        ghostCount: 3,
        haloIntensity: 0.2,
        chromaticAberration: 0.35,
        dirtIntensity: 0.4
      }
    }),
    toneMapping
  ]
});

renderer.renderToScreen({
  sourceTexture,
  bindings: {lensDirtTexture},
  uniforms: {
    toneMapping: {exposure: 1}
  }
});
```

`lensDirtTexture` is an application-owned, sampled color texture. Omit the binding when
`lens.dirtIntensity` is zero. Like other persistent effects, temporal bloom history is reset by
`renderer.resetHistory()`, `resetHistory: true`, or resizing the renderer.

See [Rendering Techniques and Tradeoffs](https://luma.gl/docs/api-guide/shaders/rendering-techniques)
for comparisons between related effects, their GPU inputs, backend support, and composition order.
