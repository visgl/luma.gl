# Slang: Orbital sculpture

An animated ray-marched sculpture with three deforming rings, an iridescent material,
a glowing core, and a floor reflection. There is no mesh: a fullscreen triangle launches
camera rays, and signed-distance functions find the surfaces entirely in the fragment shader.
The same Slang sources run on WebGL 2 and WebGPU.

Drag to orbit the camera. Change the material, twist, exposure, and native grain; pause to inspect the
sculpture. Select **Show shaders** to compare the Slang source with the assembled shaders
used by the active backend. The source selector includes the main shader and both reusable
modules. WebGPU shows one WGSL program; WebGL 2 shows separate GLSL ES 300 vertex and
fragment shaders. The generated shaders include the native film-grain code; the source selector includes its typed
Slang contract and `valueNoise` implementation. Close the viewer or press Escape to return to the sculpture. The controls
also appear in the website tutorial and the inline API example.

From the repository root, run:

```sh
yarn install
yarn workspace luma.gl-examples-slang-shaders start
```

Open the displayed URL. Append `?backend=webgl2` to select WebGL 2 or `?backend=webgpu`
to prefer WebGPU. The website tutorial also offers backend tabs.

- `shader.slang` contains both entry points, the ray marcher, and the floor reflection.
- `geometry.slang` and `palette.slang` are named distance-field and material libraries.
  The application supplies their strings to the compiler registry; `shader.slang` imports them.
- A flat `ConstantBuffer<SceneUniforms>` carries animation and camera controls. Its two
  `float4` fields share the same byte layout in WGSL and GLSL std140.
- `slang-transpiler.ts` imports the experimental compiler, uses reflection for resource names,
  and supplies the application-owned callback: GLSL ES 300 for WebGL 2 and unified WGSL
  with generated entry-point names for WebGPU.
- `film-grain.ts` adapts the existing native `valueNoise` shader module with Slang declarations.
  `shader.slang` imports `filmGrain` and calls `applyNativeGrain` directly. Its native implementation
  calls `scaleGrain`, an explicitly exported Slang helper with a checked callback signature.
  Both WGSL and GLSL implementations are supplied; all rendering happens in one pass.
- `app.ts` registers the callback and named module registry on a local assembler and renders
  through `Model`. The framework has no Slang dependency.

Set **Native grain** to zero to see the unmodified image; pause and adjust it to compare the
same scene. Shared types, bindings and callback names come from explicit contracts; private
compiler names are not an interoperability API. There are no file imports or implicit loads.

The bounded 96-step ray marcher prioritizes interactive performance over exact geometry.
High twist can soften small surface details; reflection doubles ray work on floor pixels.
The compiler is an experimental package available from luma.gl v10. See the
[compiler limits](../../../modules/slang/README.md) for the supported authoring subset.
