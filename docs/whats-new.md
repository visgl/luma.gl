# What's New

*This page contains news for recent luma.gl releases. For older releases (through v8.5) refer to the  [Legacy What's New](/docs/legacy/legacy-upgrade-guide) page.*

## Version 9.1 (In Development)

Target Date: Q2 2024

- Production quality (non-experimental) WebGPU backend.

**@luma.gl/core**

- new [`luma.attachDevice()`](/docs/api-reference/core/luma#attachdevice) API - A `Device` can now be [attached to `WebGL2RenderingContext` or `GPUDevice`] without importing `WebGLDevice`.

## Version 9.0

Target Date: Feb 2024

:::caution
luma.gl v9 contains significant API changes and requires existing luma.gl v8 applications to be [upgraded](/docs/upgrade-guide).
:::

luma.gl v9 is a major release that adds experimental WebGPU support to the luma.gl API.

### WebGPU Support

The biggest change is that the core API is now portable (no longer WebGL-specific), and plug-in backends are provided for WebGL 2 and WebGPU:

- **Portable GPU API**: `@luma.gl/core` now provides a portable GPU resource management API.
- **WebGL bindings**: `@luma.gl/webgl` now provides a WebGL backend for the core API.
- **WebGPU bindings**: `@luma.gl/webgpu` provides a new experimental WebGPU backend for the core API.

### WebGL Support

luma.gl v9 drops support for WebGL 1 functionality.

- **WebGL1** WebGL 1 support is dropped.
- **GLSL 1.00** is  no longer supported. GLSL shaders need to be ported to **GLSL 3.00**.
- **headless-gl** The Node.js WebGL 1 integration is no longer supported

On the upside this means that all features requiring WebGL 2 are now available and luma.gl also brings support for a range of new WebGL 2 extensions, see more below.

### New module structure

| Module                     | Impact            | Description                                                                                                     |
| -------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| **`@luma.gl/core`**        | New API           | The new portable luma.gl GPU API. Applications can run on both WebGPU and WebGL2 devices.                       |
| **`@luma.gl/engine`**      | Light API updates | Classic luma.gl engine classes ()`Model`, `AnimationLoop` etc), which work portably on both WebGPU and WebGL 2. |
| **`@luma.gl/gltf`**        | Renamed module    | New module that exports the glTF classes (moved from `@luma.gl/experimental`).                                  |
| **`@luma.gl/shadertools`** | Light API updates | The shader assembler API and the shader module library.                                                         |
| **`@luma.gl/webgl`**       | WebGL backend     | Optional "GPU backend module". Importing this module enables the application to create WebGL 2 `Device`s.       |
| **`@luma.gl/webgpu`**      | WebGPU backend    | Experimental "GPU backend module". Importing this module enables the application to create WebGPU `Device`s.    |

### General improvements

- **TypeScript**: All APIs now rigorously typed.
- **ES modules** - Modern ES module and CommonJS entry points for maximum interoperability.
- **Website** - New Docusaurus website with more embedded live examples and improved documentation.
- **Debugging** - SpectorJS integration. Shader debugger UI.

### New features

**`@luma.gl/core`**

- Exports the new `Device` class is the entry point to the luma.gl API, used to create other GPU resources.

**`@luma.gl/engine`**

- NEW: Scenegraph classes: `ModelNode`, `GroupNode`, `ScenegraphNode`, moved from `@luma.gl/experimental`.
- NEW: `ShaderInputs` - Class that manages uniform buffers for a `Model`
- NEW: `ShaderFactory` - Creates and caches reusable `Shader` resources
- NEW: `AnimationLoopTemplate` - Helper class for writing cleaner demos and applications in TypeScript.
- New `Computation` - Class that manages a `ComputePipeline` similar to `Model` and `Transform`.

**`@luma.gl/gltf`**

- New module that exports the glTF classes (moved from `@luma.gl/experimental`).

**`@luma.gl/shadertools`**

- All shader modules now use uniform buffers.
- New `ShaderAssembler` class that provides a clean entry point to the shader module system.
- New `CompilerMessage` type and `formatCompilerLog` function for portable shader log handling.
- Shader assembly now supports WGSL and single shader source (compute or single vertex+fragment WGSL shaders)

**`@luma.gl/webgl`** 

- The new bindings API now supports WebGL 2 Uniform Buffers.

WebGL 2 Extension support: WebGL is not dead yet! Browsers (Chrome in particular) 
are actively developing "extensions" for WebGL 2, 
and luma.gl is exposing support for many of the new WebGL extensions through the 
[`DeviceFeatures`](/docs/api-reference/core/device-features) API.

New `Device.features` that improve application performance in WebGL:
- `compilation-status-async-webgl`: Asynchronous shader compilation and linking is used automatically by luma.gl and significantly speeds up applications that create many `RenderPipelines`. 

New `Device.features` that enable additional color format support in WebGL:
- `rgb9e5ufloat-renderable-webgl`: `rgb9e5ufloat` is renderable.
- `snorm8-renderable-webgl`: `r,rg,rgba8snorm` are renderable.
- `norm16-renderable-webgl`: `r,rg,rgba16norm` are renderable. 
- `snorm16-renderable-webgl`: `r,rg,rgba16snorm` are renderable.

New `Device.features` that expose new GPU parameters in WebGL:
- `depth-clip-control`: `parameters.unclippedDepth` - depth clipping can now be disabled.
- `provoking-vertex-webgl`: `parameters.provokingVertex` - controls which primitive vertex is used for flat shading. 
- `polygon-mode-webgl`: `parameters.polygonMode` - enables wire frame rendering of polygons.
- `polygon-mode-webgl`: `parameters.polygonOffsetLine` - enables depth bias (polygon offset) for lines. 
- `shader-clip-cull-distance-webgl`: `parameters.clipCullDistance0-7`, also see GLSL effects below.

New `Device.features` that enable new GLSL syntax
- `shader-noperspective-interpolation-webgl`: GLSL vertex outputs and fragment inputs may be declared with a `noperspective` interpolation qualifier.
- `shader-conservative-depth-webgl`: GLSL `gl_FragDepth` qualifiers `depth_any` `depth_greater` `depth_less` `depth_unchanged` can enable early depth test optimizations.
- `shader-clip-cull-distance-webgl`: Enables `gl_ClipDistance[] / gl_CullDistance[]`.

