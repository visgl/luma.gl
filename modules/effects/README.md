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
requiring application-owned intermediate textures. The source texture must allow both sampling and,
when it is produced by an offscreen scene pass, rendering.

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
      fireflyReduction: 0.15
    }),
    toneMapping
  ]
});

renderer.renderToScreen({
  sourceTexture,
  uniforms: {
    toneMapping: {exposure: 1}
  }
});
```

See [Rendering Techniques and Tradeoffs](https://luma.gl/docs/api-guide/shaders/rendering-techniques)
for comparisons between related effects, their GPU inputs, backend support, and composition order.
