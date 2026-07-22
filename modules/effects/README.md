# @luma.gl/effects

A set of ShaderPasses implementing post processing effects for luma.gl

Advanced WebGPU-first scene-aware pipelines include SSAO, temporally stabilized GTAO,
cosine-weighted screen-space diffuse global illumination, roughness-aware screen-space
reflections with temporal reprojection and bilateral denoising, real clustered volumetric
lighting, scene outlines, temporal AA, motion blur, compact height fog, and reusable
depth-aware blur.
Applications keep ownership of scene rendering and provide matching color, depth,
normal/roughness, and velocity textures to `ShaderPassRenderer`.

Notable exports include:

- `bloom` and `bloomShaderPassPipeline`
- `dof` and `dofShaderPassPipeline`
- `createGTAOShaderPassPipeline`, `createSSGIShaderPassPipeline`, and
  `createSSRShaderPassPipeline`
- `createClusteredVolumetricLightingShaderPassPipeline` for light-driven participating media;
  `createVolumetricFogShaderPassPipeline` remains the simpler, lower-cost height-fog option.

The [Visualization City](https://luma.gl/examples/experimental/advanced-effects) example
emphasizes geometric shadows and the breadth of composable effects. The
[Illumination Lab](https://luma.gl/examples/experimental/deferred-rendering) emphasizes clustered
deferred lighting, higher-quality ambient visibility, diffuse bounce, specular reflections, and
participating-media scattering. Shared effects such as SSR use the same exported implementation
in both scenes.

See [Rendering Techniques and Tradeoffs](https://luma.gl/docs/api-guide/shaders/rendering-techniques)
for comparisons between related effects, their GPU inputs, backend support, and composition order.
