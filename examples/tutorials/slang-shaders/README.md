# Slang: Orbital sculpture

An animated ray-marched sculpture with three deforming rings, an iridescent material,
a glowing core, and a floor reflection. There is no mesh: a fullscreen triangle launches
camera rays, and signed-distance functions find the surfaces entirely in the fragment shader.
The same Slang sources run on WebGL 2 and WebGPU.

Drag to orbit the camera. Change the material, twist, exposure, and native grain; pause to inspect the
sculpture. Select **Show shaders** to compare the Slang source with the assembled shaders
used by the active backend. The source selector includes the main shader and both reusable
modules. WebGPU shows one WGSL program; WebGL 2 shows separate GLSL ES 300 vertex and
fragment shaders. The generated selector also includes the native film-grain pass, and the
source selector includes its shader and the imported `valueNoise` implementation. Close the viewer or press Escape to return to the sculpture. The controls
also appear in the website tutorial and the inline API example.

From the repository root, run:

```sh
yarn install
yarn workspace luma.gl-examples-slang-shaders start
```

Open the displayed URL. Append `?backend=webgl2` to select WebGL 2 or `?backend=webgpu`
to prefer WebGPU. The website tutorial also offers backend tabs.

- `shader.slang` contains both entry points, the ray marcher, and the floor reflection.
- `geometry.slang` is a reusable distance-field `ShaderModule`; `palette.slang` is a
  reusable lighting and material module. Both use `sourceLanguage: 'slang'`.
- A flat `ConstantBuffer<SceneUniforms>` carries animation and camera controls. Its two
  `float4` fields share the same byte layout in WGSL and GLSL std140.
- `slang-transpiler.ts` imports the experimental compiler, uses reflection for resource names,
  and supplies the application-owned callback: GLSL ES 300 for WebGL 2 and unified WGSL
  with generated entry-point names for WebGPU.
- `film-grain.ts` imports `valueNoise` from `@luma.gl/shadertools`. Slang renders into a
  texture, then a native pass samples that texture and calls `valueNoise_noise` to add adjustable
  grain. The module supplies both WGSL and GLSL implementations. Set **Native grain** to zero
  to see the unmodified Slang image; pause and adjust the slider to compare the same scene.
- `app.ts` registers the callback on a local assembler and renders through `Model`.
  The framework has no Slang dependency.

This example demonstrates interoperability through an explicit texture boundary. It does not
use Slang `import` syntax or call native functions directly from Slang; those require the planned
registry and typed declaration bridge. The compiler remains application-owned.

The bounded 96-step ray marcher prioritizes interactive performance over exact geometry.
High twist can soften small surface details; reflection doubles ray work on floor pixels.
The compiler is an experimental package available from luma.gl v10. See the
[compiler limits](../../../modules/slang/README.md) for the supported authoring subset.
