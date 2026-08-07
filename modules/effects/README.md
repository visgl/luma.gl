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
levels. `exposure` and photographic `exposureCompensation` adjust the scene-referred threshold as
`threshold / (exposure * 2 ** exposureCompensation)`. Choose normalized nine-tap tent filtering or
four-fetch bicubic B-spline reconstruction with `reconstruction`. `scatter`, `softKnee`,
`fireflyReduction`, `anamorphicRatio`, and `tint` shape the resulting glow without requiring
application-owned intermediate textures.

By default, `downsample: 'auto'` replaces the complete extraction/downsampling chain with one
workgroup-local compute dispatch on supported WebGPU devices. WebGL and devices without enough
floating-point storage bindings retain the complete render-pass implementation. Use
`downsample: 'render'` to force portable fragment passes, or `downsample: 'compute'` to request
compute while retaining the same capability fallback. `reuseRenderTargets` defaults to `true` and
reuses expired extraction textures during reconstruction.

| Quality | Pyramid levels | Portable render passes | Fused WebGPU work | Physical targets with / without reuse |
| --- | --- | --- | --- | --- |
| `low` | 2 | 8 | 6 render + 1 compute | 6 / 7 |
| `medium` | 3 | 12 | 9 render + 1 compute | 9 / 11 |
| `high` | 4 | 16 | 12 render + 1 compute | 12 / 15 |
| `ultra` | 5 | 20 | 15 render + 1 compute | 15 / 19 |

Optional `lens` controls add aperture diffraction, spectral lens-element ghosts, a radial halo,
and sampled lens dirt. Set `temporalStability` to accumulate neighborhood-clamped glow history.
Every lens feature and temporal history is disabled by default.

| Feature | Added render passes | Additional targets | Main sampling cost |
| --- | --- | --- | --- |
| Exposure-aware threshold | 0 | 0 | One exposure-scaled scalar threshold. |
| Bicubic reconstruction | 0 | 0 | Four bilinear fetches instead of nine tent-filter taps per level. |
| Lens dirt | 0 | 0 | One full-resolution mask sample in the existing composite. |
| Spectral ghosts | 1 shared half-resolution lens pass | 1 artifact target and 1 retained highlight target when reuse is enabled | One sample per ghost, or three with chromatic separation. |
| Lens halo | Shares the same lens pass | Shares the same target | One sample, or three with chromatic separation. |
| Diffraction starburst | Shares the same lens pass | Shares the same target | Eight samples per configured diffraction ray. |
| Temporal stability | 1 half-resolution history pass | 2 persistent half-resolution textures | Five current-neighborhood samples and one history sample. |

The lens pass exists only when at least one of `starburstIntensity`, `ghostIntensity`, or
`haloIntensity` is positive. Dirt-only configurations therefore preserve the base pass count. Reduce
`quality`, `resolutionScale`, `starburstSpikes`, or `ghostCount` to trade optical detail for
throughput. For physically based full-kernel diffraction, the separately owned
`GPUConvolutionBloom` renderer in `@luma.gl/experimental` applies true RGB FFT convolution instead
of the lower-cost screen-space starburst approximation.

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
      exposure: 1,
      exposureCompensation: 0,
      intensity: 1.25,
      reconstruction: 'bicubic',
      downsample: 'auto',
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
