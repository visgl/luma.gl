# What's New

:::info
This page contains upgrade guides for older luma.gl releases (up through v8.5). For upgrading to luma.gl v9, refer to the  [Legacy What's New](/docs/legacy/legacy-upgrade-guide) page.
:::

## Version 9.0 (In Development)

Target Date: Jan 2023

:::caution
luma.gl v9 contains significant API changes and requires existing luma.gl v8 applications to be [upgraded](/docs/upgrade-guide).
:::

luma.gl v9 API is a major release that adds WebGPU support to the luma.gl API.

The key v9 feature is the new WebGL-independent core API with plug-in WebGPU and WebGL backends

- **Portable GPU API**: `@luma.gl/core` provides a portable GPU resource management API.
- **WebGPU bindings**: `@luma.gl/webgpu` provides a new WebGPU backend for the core API.
- **WebGL bindings**: `@luma.gl/webgl` provides a WebGL backend for the core API.

Non-API changes

- **TypeScript**: All APIs now rigorously typed.
- **ES modules** - Modern ES module and CommonJS entry points for maximum interoperability.
- **Website** - New Docusaurus website with more embedded live examples and improved documentation.
- **Debugging** - SpectorJS integration. Shader debugger UI.

Legacy Functionality

- **WebGL1** WebGL 1 support is dropped.
- **GLSL 1.00** is  no longer supported. GLSL shaders need to be ported to **GLSL 3.00**.
- **headless-gl** Node.js integration is no longer supported

New module structure

| Module                     | Impact               | Description                                                                                                      |
| -------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **`@luma.gl/core`**        | New API              | The new portable luma.gl GPU API. Applications can run on both WebGPU and WebGL2 devices.                        |
| **`@luma.gl/engine`**      | Light API updates    | Classic luma.gl engine classes ()`Model`, `AnimationLoop` etc), which work portably on both WebGPU and WebGL 2.  |
| **`@luma.gl/gltf`**        | Renamed module       | New module that exports the glTF classes (moved from `@luma.gl/experimental`).                                   |
| **`@luma.gl/shadertools`** | Light API updates    | The shader assembler API and the shader module library.                                                          |
| **`@luma.gl/webgl`**       | No exported API      | Now an optional "GPU backend module". Importing this module enables the application to create WebGL 2 `Device`s. |
| **`@luma.gl/webgpu`**      | new, no exported API | A new optional "GPU backend module". Importing this module enables the application to create WebGPU `Device`s.   |

New features

**`@luma.gl/core`**

- Exports the new `Device` class is the entry point to the luma.gl API, used to create other GPU resources.

**`@luma.gl/engine`**

- NEW: Scenegraph classes: `ModelNode`, `GroupNode`, `ScenegraphNode`. (Moved from `@luma.gl/experimental`).
- NEW: `ShaderInputs` - Class that manages uniform buffers for a `Model`
- NEW: `ShaderFactory` - Creates and caches reusable `Shader` resources
- NEW: `AnimationLoopTemplate` - Small helper class that can help write cleaner demos and applications in TypeScript.

**`@luma.gl/gltf`**

- New module that exports the glTF classes (moved from `@luma.gl/experimental`).

**`@luma.gl/shadertools`**

- All shader modules now use uniform buffers.
- NEW: `ShaderAssember` class that provides a clean entry point to the shader module system.
- New `CompilerMessage` type and `formatCompilerLog` function for portable shader log handling.

**`@luma.gl/webgl`** 

- Asynchronous shader compilation and linking is now supported on systems that support the [KHR_parallel_shader_compile](https://registry.khronos.org/webgl/extensions/KHR_parallel_shader_compile/) WebGL extension. This should speed up initialization for applications that create a lot of `RenderPipelines`.
- `parameters.unclippedDepth` - depth clipping can now be disabled if the `depth-clip-control` feature is available. See [`EXT_depth_clamp`][EXT_depth_clamp].
- `parameters.provokingVertex: 'first'` controls which primitive vertex is used for flat shading. Check the `provoking-vertex-webgl` feature. 
- `parameters.polygonMode: 'line'` enables wire frame rendering of polygons. Check the `polygon-mode-webgl` feature. 
- `parameters.polygonOffsetLine: true` enables depth bias (polygon offset) for lines. Check the `polygon-mode-webgl` feature. 
- `parameters.clipCullDistance0-7: true` enables `gl_ClipDistance[] / gl_CullDistance[]`. Check the `shader-clip-cull-distance-webgl` feature. 
- `shader-noperspective-interpolation-webgl`: GLSL vertex outputs and fragment inputs may be declared with a `noperspective` interpolation qualifier.
- `shader-conservative-depth-webgl`: New GLSL `gl_FragDepth` qualifiers `depth_any` `depth_greater` `depth_less` `depth_unchanged` can enable early depth test optimizations.

[EXT_depth_clamp]: https://registry.khronos.org/webgl/extensions/EXT_depth_clamp/
