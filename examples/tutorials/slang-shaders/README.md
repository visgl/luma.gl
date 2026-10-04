# Slang: Orbital sculpture

An animated ray-marched sculpture with three deforming rings, an iridescent material,
a glowing core, and a floor reflection. There is no mesh: a fullscreen triangle launches
camera rays, and signed-distance functions find the surfaces entirely in the fragment shader.
The same Slang sources run on WebGL 2 and WebGPU.

Drag to orbit the camera. Change the material, twist, and exposure; pause to inspect the
sculpture. The controls also appear in the website tutorial.

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
- `app.ts` registers the callback on a local assembler and renders through `Model`.
  The framework has no Slang dependency.

The bounded 96-step ray marcher prioritizes interactive performance over exact geometry.
High twist can soften small surface details; reflection doubles ray work on floor pixels.
The compiler is an experimental package available from luma.gl v10. See the
[compiler limits](../../../modules/slang/README.md) for the supported authoring subset.
