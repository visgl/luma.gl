# @luma.gl/effects

A set of ShaderPasses implementing post processing effects for luma.gl

Advanced WebGPU-first scene-aware pipelines include SSAO, temporally stabilized GTAO,
roughness-aware screen-space reflections with temporal reprojection and bilateral denoising,
scene outlines, temporal AA, motion blur, volumetric fog, and reusable depth-aware blur.
Applications keep ownership of scene rendering and provide matching color, depth,
normal/roughness, and velocity textures to `ShaderPassRenderer`.

Notable exports include:

- `bloom` and `bloomShaderPassPipeline`
- `dof` and `dofShaderPassPipeline`
- `createGTAOShaderPassPipeline` and `createSSRShaderPassPipeline`

See [Rendering Techniques and Tradeoffs](https://luma.gl/docs/api-guide/shaders/rendering-techniques)
for comparisons between related effects, their GPU inputs, backend support, and composition order.
