# Slang Shaders

A triangle rendered from the same Slang vertex and fragment source on WebGL 2 and WebGPU.
The application imports the private `@luma.gl/slang` workspace and registers its own compiler
with its shader assembler. The framework has no Slang dependency.

From the repository root, run:

```sh
yarn install
yarn workspace luma.gl-examples-slang-shaders start
```

Open the displayed URL. Append `?backend=webgl2` to select WebGL 2 or `?backend=webgpu`
to prefer WebGPU. The website tutorial also offers backend tabs.

- `shader.slang` contains both entry points and calls the reusable palette helper.
- `palette.slang` is supplied through a `ShaderModule` with `sourceLanguage: 'slang'`.
- `slang-transpiler.ts` supplies the application-owned callback: GLSL ES 300 for WebGL 2
  and unified WGSL with generated entry-point names for WebGPU.
- `app.ts` registers the callback on a local assembler and renders through `Model`.

This example runs from the repository because the Slang package is private. See the
[compiler limits](../../../modules/slang/README.md) for the supported authoring subset.
