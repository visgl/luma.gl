# @luma.gl/effects

A set of ShaderPasses implementing post processing effects for luma.gl

Advanced WebGPU-first scene-aware pipelines include SSAO, temporally stabilized GTAO, scene
outlines, temporal AA, motion blur, screen-space reflections, volumetric fog, and reusable
depth-aware blur. Applications keep ownership of scene rendering and provide matching color,
depth, normal/roughness, and velocity textures to `ShaderPassRenderer`.

Notable exports include:

- `bloom` and `bloomShaderPassPipeline`
- `dof` and `dofShaderPassPipeline`

See [luma.gl](http://luma.gl) for documentation.
