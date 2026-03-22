# What's New

_This page contains news for recent luma.gl releases. For older releases (through v8.5) refer to the [Legacy What's New](/docs/legacy/legacy-upgrade-guide) page._

## Version 9.3 (In Development)

Target Date: April 2026

**General**

- **Typescript 5.9** - luma.gl code base is now TypeScript 5.9 clean.

**Examples**

- **[Texture Tester Example](/examples/api/texture-tester)** - New example showing support for compressed textures on WebGL and WebGPU. Also implements multi-canvas rendering.
- **[Multi-Canvas Example](/examples/api/multi-canvas)** - New example showing rendering into multiple HTML canvas elements.
- **[External Context Example](/examples/integrations/external-context)** - New example showing integration with external WebGL contexts.
- **[React Strict Mode Example](/examples/integrations/react-strict-mode)** - Improved resource cleanup for better compatibility when using luma.gl in React `<StrictMode>` apps

**@luma.gl/core**

- **Multi-canvas rendering** is now supported on both WebGL and WebGPU via [`device.createPresentationContext()`](/docs/api-reference/core/presentation-context). See the [Multiple Canvases](/docs/developer-guide/multiple-canvases) developer guide details.
- **Composite uniform buffer layouts** now support nested structs and fixed-size arrays in [`UniformBufferLayout`](/docs/api-reference/core/uniform-buffer-layout) and [`UniformStore`](/docs/api-reference/core/uniform-store), while preserving nested JavaScript values at the API boundary.
- **Grouped bindings** now support `ShaderLayout.bindings[].group`, flat `bindings`, and grouped `bindGroups`, including sparse logical bind-group usage on both WebGPU and WebGL.

**@luma.gl/engine**

- **WebGPU mipmap generation** now supported by [`DynamicTexture`](/docs/api-reference/engine/dynamic-texture).
- **Explicit mip chains** can now be passed to `DynamicTexture` for 2D, array, cube, and 3D uploads.
- **Compressed mip uploads** are now validated and uploaded through `DynamicTexture`, including block-size-aware mip truncation.
- **Mip-level format metadata** now accepts both `textureFormat` and `format` on texture data objects during the transition to loaders.gl `TextureLevel` naming.
- New **`Material`** and **`MaterialFactory`** classes provide reusable material-owned group-3 bindings for models.

**@luma.gl/webgpu**

- **compressed texture** support (but note that WebGPU is stricter than WebGL and requires block-aligned textures).
- **texture readback** improvements

**@luma.gl/webgl**

- **RenderPipeline optimization** - Compatible WebGL render pipelines now share linked `WebGLProgram`s, reducing pipeline creation overhead while preserving per-pipeline defaults.

**@luma.gl/gltf**

- **WebGPU support** - glTF models can now be rendered in WebGPU.
- **Joint/Skin Animations** - Support for glTF animations now include joint and skin animations.
- **Lighting** - luma.gl Light definitions are now extracted if the `KHR_lights_punctual` glTF extension is present in the glTF file.
- **`linear` texture filtering** - default texture filtering is now `linear` instead of `nearest` for improved texture rendering.
- **PBR material extensions** - the stock `pbrMaterial` shader now implements `KHR_materials_specular`, `KHR_materials_ior`, `KHR_materials_transmission`, `KHR_materials_volume`, `KHR_materials_clearcoat`, `KHR_materials_sheen`, `KHR_materials_iridescence`, and `KHR_materials_anisotropy`, using the parsed glTF extension uniforms and textures.
- **Emissive materials** - the stock PBR shader now applies `KHR_materials_emissive_strength`, and core `emissiveFactor` values are preserved even when no emissive texture is present.
- **Extension support docs** - the [`glTF Extension Support`](/docs/api-reference/gltf/gltf-extensions) table now documents the current built-in vs parsed-only extension coverage for `@luma.gl/gltf`.
- **Extension support metadata** - `createScenegraphsFromGLTF()` now exposes an `extensionSupport` map so applications can inspect which extensions a model uses and whether `@luma.gl/gltf` supports them.
- **Returned materials** - glTF scenegraph creation now returns `materials` aligned with the source glTF `materials` array.

**@luma.gl/shadertools**

- `WGSL shader modules` - most notably, the [`pbrMaterial`] module is now supported in WebGPU.
- `WGSL shader modules` now support shadertools-managed `@binding(auto)` allocation for module-owned bindings. See [WGSL Support](/docs/api-reference/shadertools/wgsl-support).
- `ShaderModule uniformTypes` now support nested structs and fixed-size arrays. See [`ShaderModule`](/docs/api-reference/shadertools/shader-module).
- `SpotLight` support has been added to the [`lighting`](/docs/api-reference/shadertools/shader-modules/lighting) shader module.
- New [`lambertMaterial`](/docs/api-reference/shadertools/shader-modules/lambert-material) shader module adds a diffuse-only matte material model.
- Built-in material shader modules now support `unlit`, allowing applications to disable lighting without changing material families.
- `lighting` and `pbrMaterial` documentation now describes the current bind-group conventions used by those modules.
- The deprecated [`picking`](/docs/api-reference/shadertools/shader-modules/picking) shader module remains available and behaviorally stable as a legacy compatibility path, but new picking features continue to land only in `@luma.gl/engine`.

**@luma.gl/effects**

- **WebGPU/WGSL effects** - Effects now have WGSL shader implementations and work under WebGPU.

## Version 9.2

Release Date: Sep 24, 2025

Production quality WebGPU backend

**General**

- All luma.gl examples now run under both WebGPU and WebGL
- API updates to cover [new Chrome WebGPU features](https://developer.chrome.com/docs/web-platform/webgpu/news)
- TypeScript v5.7, and all `"strict"` TypeScript options are now enabled.
- Documentation improvements

**@luma.gl/core**

- [`Buffer`]
  - [`Buffer.mapAndReadAsync()`] New method that reads directly from buffer memory without performing a copy.
  - [`Buffer.mapAndWriteAsync()`] New method that writes directly to buffer memory.
- [`Texture`]
  - `Texture` class refactors complete, see upgrade guide.
- Shader type APIs have been improved.
- `CommandEncoder`/`CommandBuffer` API improvements
- `Fence` - New synchronization primitive created with `device.createFence()`
- `CanvasContext` API simplifications (see upgrade guide).

- [Texture Formats](/docs/api-reference/core/texture-formats). Adds support for the new texture formats added in Chrome 132 (currently require setting chrome://flags/#enable-unsafe-webgpu)

  - `'r16unorm'`, `'rg16unorm'`, `'rgba16unorm'` (feature `'chromium-experimental-unorm16-texture-formats'`)
  - `'r16snorm'`, `'rg16snorm'`, `'rgba16snorm'` (feature `'chromium-experimental-snorm16-texture-formats'`)

- [Vertex Formats](/docs/api-reference/core/vertex-formats) (added in Chrome v133 and v119)
  - Single component 8 and 16 bit formats are now supported by WebGPU: `'uint8'`, `'sint8'`, `'unorm8'`, `'snorm8'`, `'uint16'`, `'sint16'`, `'unorm16'`, `'snorm16'`, and `'float16'`.
  - Note: 3 component formats are still missing in WebGPU.
  - `'unorm8x4-bgra'` - WebGPU only. Simplifies working with BGRA data.
  - `'unorm10-10-10-2` - Exposed since available in all WebGPU backends. Also supported by WebGL2.

**@luma.gl/engine**

- `DynamicTexture`
  - now supports mipmap generation for WebGPU textures
  - owns WebGPU mipmap generation for `2d`, `2d-array`, `cube`, `cube-array`, and `3d` textures
  - throws explicit runtime errors when a WebGPU texture format does not support the required mipmap-generation capabilities

**@luma.gl/effects**

- More postprocessing effects ported to WGSL

**@luma.gl/shadertools**

- More shader modules ported to WGSL

## Version 9.1

Target Date: Dec, 2024

Enhanced WebGPU support.

**Highlights**

- GPU backend management is streamlined via the new `Adapter` API.
- GPU connection to HTML DOM (via `canvas` elements) improved via `CanvasContext` API changes.
- `Texture`s are now immutable, however a new `DynamicTexture` class offers a higher-level, mutable texture API.
- `ShaderModule` type safety improvements (shader uniforms can now be strictly typed in JavaScript)

**@luma.gl/core**

- [`Adapter`](/docs/api-reference/core/adapter)
  - New class for singleton objects representing pluggable GPU backends.
  - Singleton `Adapter` objects are exported by the `@luma.gl/webgpu` and `@luma.gl/webgl` modules.
- [`luma`](/docs/api-reference/core/luma)
  - Now relies on `Adapter` instances to define which GPU backends are available.
  - Adapter can be supplied during device creation, avoiding the need for global registration of GPU backends.
  - `CreateDeviceProps.adapters` prop to supply list of GPU backend adapters to `luma.createDevice()`.
  - [`luma.registerAdapters()`](/docs/api-reference/core/luma#lumaregisteradapters) New method for global registration of adapters (in case it still desired).
- `Device`
  - `DeviceProps.createCanvasContext` - New prop for creating a default `CanvasContext`.
  - `DeviceProps.onResize` - New callback tracking size changes to `CanvasContext`s.
  - `DeviceProps.onVisibilityChange` - New callback tracking visibility to `CanvasContext`s.
  - `DeviceProps.onDevicePixelRatioChange` - New callback tracking device pixel resolution (DPR) changes to `CanvasContext`s.
  - `DeviceProps.debug*` - New debug options, please refer to `DeviceProps` documentation.
- `CanvasContext`
  - Now calculates exact "device pixel content box" size enabling pixel perfect sized drawing buffers (no moire etc).
  - Now tracks size, visibility and DPR changes (see the new `DeviceProps` callbacks).
- `Texture`
  - Textures are now immutable and synchronous. See upgrade guide, and the new `DynamicTexture` class in `@luma.gl/engine`.
  - `Texture.copyExternalImage()` New function that works on both WebGPU and WebGL.
  - `Texture.copyImageData()` New function that works on both WebGPU and WebGL.
- `Sampler`
  - `SamplerProps.mipmapFilter` New value `'none'` providing more explicit control over mipmap filtering.
- `RenderPipeline`
  - `Parameters.blend` - New parameter that provides more explicit control over color blending activation.
- `RenderPass`
  - `RenderPassProps.clearColors` - New prop enables specification of clear colors for multiple color attachments.

**@luma.gl/engine**

- `makeAnimationLoopTemplate`
  - Accepts a new `.adapters` prop. (Avoids need for global registration of adapters).
- [`DynamicTexture`](/docs/api-reference/engine/dynamic-texture)
  - New class allows that applications to work withcreate textures from a Promise.
- `ShaderPassRenderer`
  - New class that helps applications apply a `ShaderPass` list to a texture.

**@luma.gl/shadertools**

- [`ShaderModule](/docs/api-reference/shadertools/shader-module)`
  - New improvements to type safety, in particular for uniforms and bindings.
  - New simplified API, no longer required to instantiate modules into `ShaderModuleInstances`.
- `getShaderModuleUniforms(module: ShaderModule, ...)` New function
- `getShaderModuleDependencies(module: ShaderModule)` New function

**@luma.gl/webgl**

- `webglAdapter`
  - New object representing the WebGL backend
  - New: adds mock WEBGL1 extensions to WebGL2 contexts for better compatibility with old WebGL libraries
  - Big texture refactor to align WebGL implementation with WebGPU APIs
- `RenderPipeline`
  - WebGL render pipelines now support frame buffers with multiple color attachments.
- `RenderPass`
  - Now supports framebuffers with multiple color attachments.

**@luma.gl/webgpu**

- `webgpuAdapter` New object representing the WebGPU backend
- Numerous under-the-hood improvements and bug fixes

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
- **GLSL 1.00** is no longer supported. GLSL shaders need to be ported to **GLSL 3.00**.
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
