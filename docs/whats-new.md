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

**`@luma.gl/shadertools`** (lightly updated API)

- All shader modules now use uniform buffers.
- NEW: `ShaderAssember` class that provides a clean entry point to the shader module system.
- New `CompilerMessage` type and `formatCompilerLog` function for portable shader log handling.

Module changes

**`@luma.gl/core`** (new API)

- The new portable luma.gl GPU API. Applications written against `@luma.gl/core` v9 are portable and can run on both WebGPU and WebGL2 devices.

**`@luma.gl/engine`** (lightly updated API)

- Exports classic luma.gl engine classes such as `Model`, `AnimationLoop` etc, which now work portably on both WebGPU and WebGL. 

**`@luma.gl/gltf`** ("renamed" module)

- New module that exports the glTF classes (moved from `@luma.gl/experimental`).

**`@luma.gl/shadertools`** (lightly updated API)

- Exports the shader assembler API and the shader module library.

**`@luma.gl/webgl`** (rewritten, no longer exports an API)

- This is now an optional "GPU backend module", that provides a WebGL 2 implementation of the luma.gl core API. 
- Importing this module enables the application to create `Device`s of `type; 'webgl'`.
- Note: Requires a browser / environment that supports the WebGL API.

**`@luma.gl/webgpu`** (new module, does not export an API)

- A new optional "GPU backend module", that provides a WebGPU implementation of the luma.gl core API. 
- Importing this module enables the application to create `Device`s of `type: 'webgpu'`.
- Note: Requires a browser / environment that supports the WebGPU API.
