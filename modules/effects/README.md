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
Scene-aware intermediate framebuffers default to full resolution; applications can pass
`resolutionScale` to explicitly select a lower quality/performance tradeoff.

Notable exports include:

- `bloom`, `bloomShaderPassPipeline`, and `createBloomShaderPassPipeline`
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

See [Rendering Techniques and Tradeoffs](https://luma.gl/docs/api-guide/shaders/rendering-techniques)
for comparisons between related effects, their GPU inputs, backend support, and composition order.
