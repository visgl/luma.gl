# Porting Guide

Given that the changes in the v9 API are quite extensive, this separate porting guide is provided to hopefully help plan the upgrade process.

## v9 API Design background

We'll start with motivating the changes in v9.

### Why is the v9 API a major breaking change?

The v8 API design was focused on providing a set of classes optimized for working with the WebGL2 API, and a significant part of the code was untyped, predating TypeScript introduction.

The v9 API design makes a number breaking changes in order to take full advantage of WebGPU and TypeScript.

#### Goal: A "WebGPU-first" API

Adding WebGPU support was the top priority for luma.gl v9. Some consideration was given towards keeping the existing WebGL2-centric API and providing a WebGPU implementation for that API, to avoid breaking applications. But ultimately that did not make sense. The WebGPU API is quite different from WebGL. WebGPU was designed to avoid the performance overhead that is unavoidable in WebGL APIs (e.g. avoid repeated validation of GPU objects, avoid repeated issuing of same commands, avoid constructs that prevent deep shader optimizations etc). WebGPU is clearly the future of GPU APIs in the browser (WebGL is no longer evolving). It seems doubtful that luma.gl would be able to remain relevant if it stuck to a WebGL-focused API.

#### Goal: A "TypeScript-first" API

As luma.gl continued to adopt TypeScript it become clear that modern TypeScript enables a number of simpler, more intuitive API constructions. One example is that in TypeScript we can now safely specify that an "enum type" argument must be one of a few specific strings. By using string values in types, we don't need to introduce enumerations or key-value object constants. As an example the `Sampler` `minFilter` property is now specified as either `'linear'` or `'nearest'`, rather than `GL.LINEAR` or `GL.NEAREST`. This move to string constant values enabled luma.gl to align string constants with the WebGPU standard, avoiding the need to define additional mappings and abstractions on top of the WebGPU API.

#### Goal: Improved Maintainability

Another reason for the breaking changes in v9 is simply the removal and restructuring of legacy code. Over 8 releases, the luma.gl API had grown quite large. It exposed all the functionality offered by WebGL2, however many WebGL 2 functions were rarely used. luma.gl contained a lot of code for mutating WebGL resources, which would not work for an applications that also attempts to run on WebGPU, since WebGPU classes are (mostly) immutable. In addition, some core maintainers of luma.gl have moved on, so we took the opportunity to cut out some legacy code to make sure the code base remains accessible and easy to understand for the community. The new WebGPU compatible API provided the just the lens we needed to decide which particular pieces of functionality should be cut. 

## Effort Estimation

Suddenly having to upgrade an existing application to a new breaking API version is never fun. A first step for a developer is often to assess how much effort an upgrade is likely to require.

While it is impossible for us to assess here how much work will be required for your specific application, and the list of luma.gl v9 changes listed below is long, it probably looks worse than it is:

- While the entire API has been modernized, the overall structure and concepts of the classic luma.gl API have been preserved. 
- The API abstraction level has not changed, and while constants and names etc will need to be updated, programmers should find themselves comfortably working with the same classes in luma.gl v9 as they did in v8, without having to re-learn the API. 
- They key building block classes like `AnimationLoop`, `Model`, `Buffer`, `Texture` etc are still available.
- Many changes affect parts of the API that are not frequently used in most applications.
- In addition, the strong TypeScript typings in luma.gl v9 should create a strong safety net when porting. This means that the typescript compiler should be able to pinpoint most breakages in your application before you even run your code.

## Quick v9 API overview

The luma.gl v9 API is designed to provide portable WebGPU / WebGL 2 API, ground-up TypeScript support, and strong support for working with both WGSL and GLSL shaders.

The new v9 GPU API is now an abstract Device API, meaning that the API itself is specified in terms of TypeScript interfaces and abstract classes that cannot be directly instantiates. Types such as `Buffer`, `Texture` etc can not be used on their own, but a subclass that implements the functionality of that class a specific GPU API must be requested from a Device (`WebGLBuffer`, `WebGPUTexture`). 

The new `Device` class provides the access point to the new GPU interface. It creates and instruments the WebGL context or the WebGPU adapter, and provides methods to create all the implementation classes (`WebGLDevice.createBuffer(... =>  WebGLBuffer`, `WebGPUDevice.createTexture(... =>  WebGLGPUTexture`)

The new `CanvasContext` class handles context sizing, resolution etc.

The v9 API no longer accepts/returns `GL` constants, but instead uses the corresponding string values from the WebGPU standard (mapping those transparently under WebGL).

- The parameter API has been updated to more closely match the WebGPU API. Also parameters are specified on pipelines and render pass creation and are and not as easy to change per draw call as they were in luma.gl v8.


In progress
- Reading and writing buffers is now an async operation. While WebGL does not support async reads and writes on MacOS, the API is still async to ensure portability to WebGPU.

- Uniform buffers are now the standard way for the application to specify uniforms. Uniform buffers are "emulated" under WebGL.

A subset of the new interfaces in the luma.gl v9 API:


| Interface | Description |
| --- | --- |
| `Adapter` | luma.gl exposes GPU capabilities on the device in the form of one or more as `Adapter`s. |
| `Device`  | Manages resources, and the device’s GPUQueues, which execute commands. |
| `Buffer`  | The physical resources backed by GPU memory. A `Device` may have its own memory with high-speed access to the processing units. |
| `Texture` | Like buffer, but supports random access |
GPUCommandBuffer and GPURenderBundle are containers for user-recorded commands.
| `Shader` | Compiled shader code.
| `Sampler` | or GPUBindGroup, configure the way physical resources are used by the GPU. |

GPUs execute commands encoded in GPUCommandBuffers by feeding data through a pipeline, which is a mix of fixed-function and programmable stages. Programmable stages execute shaders, which are special programs designed to run on GPU hardware. Most of the state of a pipeline is defined by a GPURenderPipeline or a GPUComputePipeline object. The state not included in these pipeline objects is set during encoding with commands, such as beginRenderPass() or setBlendColor().

## Porting Strategy

This is based on the porting strategy used to port [deck.gl](https://deck.gl), which is the biggest luma.gl-dependent code base.

### Step 1: Update Imports

- Change imports from `@luma.gl/gltools` to `@luma.gl/webgl`.
- Change imports from `@luma.gl/core` to `@luma.gl/webgl`.

### Step 2: Replace WebGLRenderingContext with Device

The quickest way to start porting would be to start updating your application to consistently use the new `Device` class instead of directly working with .

- **Feature Detection** - At the end of this stage it is also possible to replace feature detection constants with the new `device.features` functionality.

### Step 3: Replace canvas manipulation with CanvasContext

The handling of canvas related functionality (size, resolution etc) can
be a messy part of WebGL applications.

### Step 3: Replace parameter names

Recommended changes:

- Gradually reduce the number of imports `@luma.gl/constants` and start adopting string constants.

## Upgrading GPU Parameters

- Parameters are set on `Pipeline` creation. They can not be modified, or passed as parameters to draw calls.
- Parameters can now only be set, not queried. luma.gl no longer provides a way to query parameters.

## Depth testing

To set up depth testing

```typescript
const value = model.setParameters({
  depthWriteEnabled: true,
  depthCompare: 'less-equal'
});
```

## Upgrading to v9.0

luma.gl v9 is a major modernization of the luma.gl API, so the upgrade notes for this release are unusually long.
This page primarily contains a reference list of API changes. To facilitate porting to the v9 release we have also provided a
[Porting Guide](/docs/legacy/porting-guide) that provides more background information and recommended porting strategies.

### Removed Functionality

Going forward, luma.gl will focus on leveraging the capabilities WebGPU, while maintaining a high-quality, compatible WebGL2 backend. To accelerate this roadmap, luma.gl v9 is dropping WebGL 1 support.

- **WebGL1** is no longer supported. The `@luma.gl/webgl` backend now always creates a **WebGL2 context**.
- **GLSL 1.00** is no longer supported. GLSL shaders need to be ported to **GLSL 3.00**.
- **headless-gl** integration for Node.js is no longer supported (as it only supported WebGL 1).
### Non-API changes

luma.gl v9 upgrades tooling and packaging to latest JavaScript ecosystem standards:

- **ES modules** - luma.gl is now published as ES modules. This is the modern way of packaging JavaScript applications that fully embraces the static `import`/`export` syntax. While most bundlers and Node.js environments have added support for ES modules, they can introduce incompatibilities with code that uses legacy imports. Getting your build tooling and code base ready for ES modules may be a good first step before you start upgrading luma.gl.
- **Dependencies** - luma.gl v9 introduces major version bumps of its key vis.gl dependencies: `math.gl v4`, `loaders.gl v4` and `probe.gl v4`. These upgrades ensures that all dependencies also use the same ES module packaging and follow latest typescript standards. Since the new libraries are more strongly typed, some new warnings or errors may result from this upgrade, however we expect that developers will welcome the increased type safety.

### Module-level changes

| **Module**           | v8 Description                                  | v9 Replacement                                                                                                                    |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `@luma.gl/core`      | The core module was re-exporting other modules. | Replace direct use of WebGL classes with `@luma.gl/core` device API. import directly from `@luma.gl/shadertools`.                 |
| `@luma.gl/webgl`     | Exported WebGL classes meant for direct usage.  | Now exports the WebGL backend for the `@luma.gl/core` module. `@luma.gl/webgl-legacy` now offers the legacy luma.gl v8 WebGL API. |
| `@luma.gl/constants` | Exported numeric OpenGL constants.              | Do not use. The luma.gl v9 API uses strictly typed WebGPU-style strings instead of numeric constants.                             |
| `@luma.gl/gltools`   | Contained WebGL context functionality.          | Removed. WebGL context is now handled by the  `@luma.gl/webgl` `WebGLDevice` and  `@luma.gl/core` `CanvasContext` classes.        |

## Core Modules

**`@luma.gl/core`**

- The core module is no longer an umbrella module that simply re-exports exports from other modules.
- It now provides the abstract luma.gl `Device` API (for which `@luma.gl/webgpu` and `@luma.gl/webgl` provide backends).

**`@luma.gl/engine`**

- The engine module is largely unchanged in that it provides the same classes as before.

**`@luma.gl/webgl`**

- While the webgl module still contains the WebGL 2 classes, these classes can no longer be imported directly. Instead the application should use `Device` create methods (`device.createBuffer()`, `device.createTexture()` etc to create these ojects in a portable way).

**`@luma.gl/constants`** (INTERNAL)

- The constant module remains but is now considered an internal luma.gl module, and is no longer intended to be imported by applications.
- In the external API, all WebGL-style numeric constants (`GL.` constants) have been replaced with strictly typed WebGPU style string constants.

**`@luma.gl/debug`** (REMOVED)

The debug module has been removed. Debug functionality is now built-in (and dynamically loaded when needed) so there is no longer a need to import a separate debug module.

**`@luma.gl/experimental`**

- Scene graph exports (`ModelNode`, `GroupNode`, `ScenegraphNode`) has been moved into `@luma.gl/engine`.
- glTF exports have been moved to `@luma.gl/gltf`.

**`@luma.gl/gltools`** (removed, no longer needed, see [Upgrade Guide](/docs/upgrade-guide))



## Detailed Upgrade Guide

### `@luma.gl/engine`

#### `AnimationLoop`

| v8 Prop or Method               | v9 Replacement                     | Comment                                          |
| ------------------------------- | ---------------------------------- | ------------------------------------------------ |
| Properties                      |
| `props.gl`                      | `props.device`                     | Now accepts a `Promise<Device>`.                 |
| `props.glOptions`               | `luma.createDevice(<options>)`     |
| `props.createFramebuffer`       | N/A                                | You will need to create framebuffers explicitly. |
| `props.debug`                   | `luma.createDevice({debug: true})` | Device debug functionality is improved.          |
| Methods                         |
| `animationLoop.isContextLost()` | `device.lost`, `device.isLost()`   |                                                  |

### `luma.gl/core` / `@luma.gl/webgl`

The core module was re-exporting the webgl classes.

A long list of changes, some required to make the API portable between WebGPU and WebGL, and many to accommodate the limitations of the more locked-down WebGPU API.

| v8                      | v9                           | Comment                                                                                                                                              |
| ----------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new Buffer(gl, props)` | `device.createBuffer(props)` | WebGL classes such as `Buffer`, `Texture2D` etc can no longer be imported and instantiated with . Instead they must be created via a device methods. |
| `Program`               | `RenderPipeline`             | WebGPU alignment                                                                                                                                     |

**`@luma.gl/gltools`** (removed)

The WebGL context functions from `@luma.gl/gltools`(`createGLContext` etc), have been replaced by methods on to the new `Device` and `CanvasContext` classes.

The v8 luma.gl API was designed to allow apps to work directly with the `WebGLRenderingContext` object. v9 enables applications to work portably with both WebGPU and WebGL, and accordingly it wraps the WebGL context in a `Device` instance.

| v8 Prop or Method                  | v9 Replacement                        | Comment                                                        |
| ---------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `WebGLRenderingContext`            | `Device.gl`                           | Contexts are created (or wrapped) by the `Device` class.       |
| `WebGL2RenderingContext`           | `Device.gl`                           | Contexts are created (or wrapped) by the `Device` class.       |  |
| `getWebGL2Context(gl)`             | `device.gl2`                          |                                                                |
| `assertWebGLContext(gl)`           | N/A                                   | A device will always hold a valid WebGL context                |
| `assertWebGL2Context(gl)`          | N/A                                   | Not needed. WebGL devices now always use WebGL2.                   |
|                                    |                                       |
| `createGLContext()`                | `luma.createDevice()`                 | Will create a WebGL context if `WebGLDevice` is registered.    |
| `createGLContext({onContextLost})` | `device.lost`                         | `Promise` that lets the application `await` context loss.      |
| `instrumentGLContext()`            | `WebGLDevice.attach(gl)`              | Contexts are now automatically instrumented.                   |
| `polyfillGLContext()`              | N/A                                   |                                                                |
| `hasFeature(feature)`              | `device.features.has(feature)`        | Note: Feature names now defined by WebGPU style strings.       |
| `getFeatures()`                    | `Array.from(device.features)`         |                                                                |
| `getGLContextInfo(gl)`             | `device.info`                         | Returned object is keyed with strings instead of GL constants. |
| `getContextLimits(gl)`             | `device.limits`                       | Returns "WebGPU style" limits instead of WebGL style enums     |
|                                    |                                       |                                                                |
| `canvas`                           | `device.canvasContext.canvas`         |                                                                |
| `resizeGLContext(gl, options)`     | `canvasContext.resize(options)`       | Same options: `{width, height, useDevicePixels}`               |
| `getDevicePixelRatio()`            | `canvasContext.getDevicePixelRatio()` | Uses `useDevicePixels` prop on the `CanvasContext`             |
| `setDevicePixelRatio()`            | `canvasContext.setDevicePixelRatio()` |                                                                |
|                                    | `canvasContext.getPixelSize()`        |
|                                    | `canvasContext.getAspect()`           |
| `cssToDeviceRatio()`               | `canvasContext.cssToDeviceRatio()`    |                                                                |
| `cssToDevicePixels()`              | `canvasContext.cssToDevicePixels()`   |                                                                |
| `hasFeature(gl, ...)`              | `device.features.has(...)`            | See feature constant mapping below                             |


### `@luma.gl/constants`

| v8 Prop or Method                   | v9 Replacement                        | Comment                                                             |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `import GL from @luma.gl/constants` | `import {GL} from @luma.gl/constants` | Changed to use a *named export* ( => ) for ES module compatibility. |

### `@luma.gl/debug`**

| v8 Prop or Method    | v9 Replacement                                      | Comment                                                                                                                             |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `makeDebugContext()` | `luma.createDevice({debug: true, type: 'webgl'})`   | [Khronos WebGL developer tools][khronos_dev_tools] are dynamically loaded when needed.                                              |
| Spector.js           | `luma.createDevice({spector: true, type: 'webgl'})` | [Spector.js][spector] is pre-integrated. Te Spector.js library will be dynamically loaded when needed and the canvas is "captured". |

[khronos_dev_tools]: https://github.com/KhronosGroup/WebGLDeveloperTools
[spector]: https://spector.babylonjs.com/

## Constant Upgrade Guide

### Features

Feature constants have been changed to match the WebGPU API and will need to be updated. The strong typing in the luma.gl v9 API means that TypeScript will detect unsupported feature names which should make the conversion process less painful.

| luma.gl v8 `FEATURE`                        | v9 `DeviceFeature`                     | Comments                                                                      |
| ------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| **General WebGL Features**                  |                                        |                                                                               |
| `FEATURES.WEBGL2`                           | `webgl`                                | True for WebGL Contexts                                                      |
| `FEATURES.TIMER_QUERY`                      | `timer-query-webgl`                    | [`Query`][/]ocs/api-reference/webgl/query) for asynchronous GPU timings       |
| `FEATURES.INSTANCED_RENDERING`              | N/A (always true)                      | Instanced rendering (via instanced vertex attributes)                         |
| `FEATURES.VERTEX_ARRAY_OBJECT`              | N/A (always true)                      | `VertexArrayObjects` can be created                                           |
| `FEATURES.ELEMENT_INDEX_UINT32`             | N/A (always true)                      | 32 bit indices available for `GL.ELEMENT_ARRAY_BUFFER`s                       |
| `FEATURES.BLEND_MINMAX`                     | N/A (always true)                      | `GL.MIN`, `GL.MAX` blending modes are available                               |
| `FEATURES.FRAGMENT_SHADER_DRAW_BUFFERS`     | N/A (always true)                      | Fragment shader can draw to multiple render targets                           |
| `FEATURES.FRAGMENT_SHADER_DEPTH`            | N/A (always true)                      | Fragment shader can control fragment depth value                              |
| `FEATURES.SHADER_TEXTURE_LOD`               | N/A (always true)                      | Enables shader control of LOD                                                 |
| `FEATURES.FRAGMENT_SHADER_DERIVATIVES`      | N/A (always true)                      | Derivative functions are available in GLSL                                    |
| **`Texture`s and `Framebuffer`s**           |                                        |                                                                               |
| `FEATURES.TEXTURE_FLOAT`                    | `texture-renerable-float32-webgl`      | Floating point textures can be created / set as samplers                      |
| `FEATURES.TEXTURE_HALF_FLOAT`               | `float16-renderable-webgl`             | Half float textures can be created and set as samplers                        |
| `FEATURES.MULTIPLE_RENDER_TARGETS`          | `multiple-renderable--webgl1`          | `Framebuffer` multiple color attachments that fragment shaders can access     |
| `FEATURES.COLOR_ATTACHMENT_RGBA32F`         | `rgba32float-renderable-webgl1`        | Floating point `Texture` in the `GL.RGBA32F` format are renderable & readable |
| `FEATURES.COLOR_ATTACHMENT_FLOAT`           | `webgl1`                               | Floating point `Texture`s renderable + readable.                              |
| `FEATURES.COLOR_ATTACHMENT_HALF_FLOAT`      | `webgl1`                               | Half float format `Texture`s are renderable and readable                      |
| `FEATURES.FLOAT_BLEND`                      | `texture-blend-float-webgl`            | Blending with 32-bit floating point color buffers                             |
| `TEXTURE_FILTER_LINEAR_FLOAT`               | `float32-filterable-linear-webgl1`     | Linear texture filtering for floating point textures                          |
| `FEATURES.TEXTURE_FILTER_LINEAR_HALF_FLOAT` | `float16-filterable-linear-webgl1`     | Linear texture filtering for half float textures                              |
| `FEATURES.TEXTURE_FILTER_ANISOTROPIC`       | `texture-filterable-anisotropic-webgl` | Anisotropic texture filtering                                                 |
| `FEATURES.SRGB`                             | `texture-formats-srgb-webgl1`          | sRGB encoded rendering is available                                           |
| `FEATURES.TEXTURE_DEPTH_BUFFERS`            | `texture-formats-depth-webgl1`         | Depth buffers can be stored in `Texture`s, e.g. for shadow map calculations   |

## GPU Parameters

| setParameters | |  Parameters can no longer be set on the WebGL context. They must be set on a `RenderPipeline`. |
| setParameters ||  - `RenderPipeline` parameters cannot be changed after creation (though the `Model` class will create new `RenderPipeline` instances if parameters change).
- Some parameters are set on `RenderPass`.
- Constant attributes are no longer supported.
- `clear` can no longer be called directly. Instead attachments are cleared when a `RenderPass` is created and clear colors must be specified in `beginRenderPass`.
- Uniform buffers are required to run under WebGPU.

## Parameter Mapping

The following table shows mappings from luma v8 WebGL parameters to luma v9 WebGPU style parameters.

| luma v8 / WebGL Parameter                                | v9 Parameter                       | Values                                 | v9 Values                         |
| -------------------------------------------------------- | ---------------------------------- | -------------------------------------- | --------------------------------- |
| [polygonOffset][polygonoffset]                           | `depthBias`, `depthBiasSlopeScale` |
| [depthRange][depthrange]                                 | N/A                                |
| [clearDepth][cleardepth]                                 |                                    |
| **Rasterization Parameters**                             |
| [`cullFace`][cullface]                                   | `cullMode`                         | Which face to cull                     | **`'none'`**, `'front'`, `'back'` |
| [`frontFace`][frontface]                                 | `frontFace`                        | Which triangle winding order is front  | **`ccw`**, `cw`                   |
| `polygonOffset`                                          | `depthBias`                        | Small depth offset for polygons        | `float`                           |
| `polygonOffset`                                          | `depthBiasSlopeScale`              | Small depth factor for polygons        | `float`                           |
| `polygonOffset`                                          | `depthBiasClamp`                   | Max depth offset for polygons          | `float`                           |
| **Stencil Parameters**                                   |
| [`stencilMask`][stencilmask] / `GL.STENCIL_WRITEMASK`    | `stencilReadMask`                  | Binary mask for reading stencil values | `number` (**`0xffffffff`**)       |
| `stencilFunc` / `GL.STENCIL_VALUE_MASK`                  | `stencilWriteMask`                 | Binary mask for writing stencil values | `number` (**`0xffffffff`**)       |
| `stencilFunc` / `GL.STENCIL_FUNC`                        | `stencilCompare`                   | How the mask is compared               | **`always`**, `not-equal`, ...    |
| [`stencilOp`][stencilop] /  `GL.STENCIL_PASS_DEPTH_PASS` | `stencilPassOperation`             |                                        | **`'keep'`**                      |
| [`stencilOp`][stencilop] / `GL.STENCIL_PASS_DEPTH_FAIL`  | `stencilDepthFailOperation`        |                                        | **`'keep'`**                      |
| [`stencilOp`][stencilop] / `GL.STENCIL_FAIL`             | `stencilFailOperation`             |                                        | **`'keep'`**                      |
| [`stencilOpSeparate`][stencilopseparate]                 |                                    |                                        |                                   |
| **Sampler Parameters**                                   |
| `magFilter` / `GL.TEXTURE_MAG_FILTER` *                  | `magFilter`, `mipmapFilter`, `lodMinClamp`, `lodMaxClamp` |               | `'linear'`, `'nearest'`, ...      |
| `minFilter` / `GL.TEXTURE_MIN_FILTER` *                  | `minFilter`, `mipmapFilter`, `lodMinClamp`, `lodMaxClamp` |               | `'linear'`, `'nearest'`, ...      |

\* Note that the `magFilter`, `minFilter`, and `mipmapFilter` parameters accept only `'nearest'` and `'linear'` as values. To disable use of mipmaps on a texture that includes them, set `lodMaxClamp` to zero.

---

:::caution
TODO - this section needs updating
:::

| WebGL Function                           | WebGL Parameters                                                                                                                                                              | luma.gl v9 counterpart                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`clearStencil`][clearstencil]           | `GL.STENCIL_CLEAR_VALUE`                                                                                                                                                      |                                                                         |
|                                          | []                                                                                                                                                                            | `stencilWriteMask`                                                      |
| [`stencilFunc`][stencilfunc]             | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`]                                                                                                                | `stencilCompare`, `stencilReadMask`                                     |
| [`stencilOp`][stencilop]                 | `GL.STENCIL_FAIL`, `,                                                                                                                                                         | `stencilPassOperation`, `stencilFailDepth                               |
| [`stencilOpSeparate`][stencilopseparate] | [`GL.STENCIL_FAIL`, `GL.STENCIL_FAIL_DEPTH_FAIL`, `GL.STENCIL_FAIL_DEPTH_PASS`, `GL.STENCIL_BACK_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_PASS`] | N/A                                                                     |
| `GL.STENCIL_TEST`                        | `false`                                                                                                                                                                       | Enables stencil testing                                                 |
| `GL.STENCIL_CLEAR_VALUE`                 | `0`                                                                                                                                                                           | Sets index used when stencil buffer is cleared.                         |
| `GL.STENCIL_WRITEMASK`                   | `0xFFFFFFFF`                                                                                                                                                                  | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_BACK_WRITEMASK`              | `0xFFFFFFFF`                                                                                                                                                                  | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FUNC`                        | `GL.ALWAYS`                                                                                                                                                                   |                                                                         |
| `GL.STENCIL_REF`                         | `0`                                                                                                                                                                           |                                                                         |
| `GL.STENCIL_VALUE_MASK`                  | `0xFFFFFFFF`                                                                                                                                                                  | Sets bit mask                                                           |
| `GL.STENCIL_BACK_FUNC`                   | `GL.ALWAYS`                                                                                                                                                                   |                                                                         |
| `GL.STENCIL_BACK_REF`                    | `0`                                                                                                                                                                           |                                                                         |
| `GL.STENCIL_BACK_VALUE_MASK`             | `0xFFFFFFFF`                                                                                                                                                                  | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FAIL`                        | `GL.KEEP`                                                                                                                                                                     | stencil test fail action                                                |
| `GL.STENCIL_PASS_DEPTH_FAIL`             | `GL.KEEP`                                                                                                                                                                     | depth test fail action                                                  |
| `GL.STENCIL_PASS_DEPTH_PASS`             | `GL.KEEP`                                                                                                                                                                     | depth test pass action                                                  |
| `GL.STENCIL_BACK_FAIL`                   | `GL.KEEP`                                                                                                                                                                     | stencil test fail action, back                                          |
| `GL.STENCIL_BACK_PASS_DEPTH_FAIL`        | `GL.KEEP`                                                                                                                                                                     | depth test fail action, back                                            |
| `GL.STENCIL_BACK_PASS_DEPTH_PASS`        | `GL.KEEP`                                                                                                                                                                     | depth test pass action, back                                            |
**Blending**
| [blendColor][blendcolor]               | `GL.BLEND_COLOR`                                                                     |
| [blendEquation][blendequation]         | [`GL.BLEND_EQUATION_RGB`, `GL.BLEND_EQUATION_ALPHA`]                                 |
| [blendFunc][blendfunc]                 | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`]                                           |
| [blendFuncSeparate][blendfuncseparate] | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`, `GL.BLEND_DST_RGB`, `GL.BLEND_DST_ALPHA`] |
| `GL.BLEND`                | GLboolean       | `false`        | Blending enabled |
| `GL.BLEND_COLOR`          | Float32Array(4) | `[0, 0, 0, 0]` |                  |
| `GL.BLEND_EQUATION_RGB`   | GLenum          | `GL.FUNC_ADD`  |                  |
| `GL.BLEND_EQUATION_ALPHA` | GLenum          | `GL.FUNC_ADD`  |                  |
| `GL.BLEND_SRC_RGB`        | GLenum          | `GL.ONE`       | srcRgb           |
| `GL.BLEND_SRC_ALPHA`      | GLenum          | `GL.ZERO`      | srcAlpha         |
| `GL.BLEND_DST_RGB`        | GLenum          | `GL.ONE`       | dstRgb           |
| `GL.BLEND_DST_ALPHA`      | GLenum          | `GL.ZERO`      | dstAlpha         |


- **Depth Bias** - Sometimes referred to as "polygon offset". Adds small offset to fragment depth values (by factor × DZ + r × units). Usually used as a heuristic to avoid z-fighting, but can also be used for effects like applying decals to surfaces, and for rendering solids with highlighted edges. The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.


After the fragment shader runs, optional stencil tests are performed, with resulting operations on the the stencil buffer.

| V8/WebGL Function           | Description                            | Values                         |                  |
| --------------------------- | -------------------------------------- | ------------------------------ | ---------------- |
| **Stencil Parameters**      |
| `stencilReadMask`           | Binary mask for reading stencil values | `number` (**`0xffffffff`**)    |                  |
| `stencilWriteMask`          | Binary mask for writing stencil values | `number` (**`0xffffffff`**)    | `gl.frontFace`   |
| `stencilCompare`            | How the mask is compared               | **`always`**, `not-equal`, ... | `gl.stencilFunc` |
| `stencilPassOperation`      |                                        | **`'keep'`**                   | `gl.stencilOp`   |
| `stencilDepthFailOperation` |                                        | **`'keep'`**                   | `gl.stencilOp`   |
| `stencilFailOperation`      |                                        | **`'keep'`**                   | `gl.stencilOp`   |

Action when the stencil test fails

- stencil test fail action,
- depth test fail action,
- pass action

Remarks:

- By using binary masks, an 8 bit stencil buffer can effectively contain 8 separate masks or stencils
- The luma.gl API currently does not support setting stencil operations separately for front and back faces.


| WebGL Function                           | WebGL Parameters                                                                   | luma.gl v9 counterpart                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| [`clearStencil`][clearstencil]           | `GL.STENCIL_CLEAR_VALUE`                                                           |                                           |
| [`stencilMask`][stencilmask]             | [`GL.STENCIL_WRITEMASK`]                                                           | `stencilWriteMask`                        |
| [`stencilFunc`][stencilfunc]             | [`GL.STENCIL_FUNC`, `GL.STENCIL_REF`, `GL.STENCIL_VALUE_MASK`]                     | `stencilCompare`, `stencilReadMask`       |
| [`stencilOp`][stencilop]                 | `GL.STENCIL_FAIL`, `GL.STENCIL_PASS_DEPTH_FAIL`, `GL.STENCIL_PASS_DEPTH_PASS`      | `stencilPassOperation`, `stencilFailDepth |
| [`stencilOpSeparate`][stencilopseparate] | [`GL.STENCIL_FAIL`, `GL.STENCIL_FAIL_DEPTH_FAIL`, `GL.STENCIL_FAIL_DEPTH_PASS`] \* | N/A                                       |

\* `GL.STENCIL_BACK_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_FAIL`, `GL.STENCIL_BACK_FAIL_DEPTH_PASS`


- In WebGL, setting any value will enable stencil testing (i.e. enable `GL.STENCIL_TEST`).

- In WebGL, setting any value will enable stencil testing (i.e. enable `GL.STENCIL_TEST`).


### Clear Color

| Function                                                                                        | Sets parameters      |
| ----------------------------------------------------------------------------------------------- | -------------------- |
| [clearColor](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearColor) | GL.COLOR_CLEAR_VALUE |

| Parameter              | Type                | Default      | Description |
| ---------------------- | ------------------- | ------------ | ----------- |
| `GL.COLOR_CLEAR_VALUE` | new Float32Array(4) | [0, 0, 0, 0] | .           |


### Color Mask

| Function                                                                                      | Sets parameters    |
| --------------------------------------------------------------------------------------------- | ------------------ |
| [colorMask](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask) | GL.COLOR_WRITEMASK |

| Parameter            | Type                                         | Default                  | Description |
| -------------------- | -------------------------------------------- | ------------------------ | ----------- |
| `GL.COLOR_WRITEMASK` | [GLboolean, GLboolean, GLboolean, GLboolean] | [true, true, true, true] | .           |

### Dithering

| Parameter   | Type      | Default | Description                                                                      |
| ----------- | --------- | ------- | -------------------------------------------------------------------------------- |
| `GL.DITHER` | GLboolean | `true`  | Enable dithering of color components before they get written to the color buffer |

- Note: Dithering is driver dependent and typically has a stronger effect when the color components have a lower number of bits.

### PolygonOffset

Add small offset to fragment depth values (by factor × DZ + r × units)
Useful for rendering hidden-line images, for applying decals to surfaces,
and for rendering solids with highlighted edges.

| Function                                                                                              | Sets parameters                                     |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [polygonOffset](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset) | [GL.POLYGON_OFFSET_FACTOR, GL.POLYGON_OFFSET_UNITS] |

| Parameter                  | Type      | Default | Description |
| -------------------------- | --------- | ------- | ----------- |
| `GL.POLYGON_OFFSET_FILL`   | GLboolean | `false` | .           |
| `GL.POLYGON_OFFSET_FACTOR` | GLfloat   | `0`     | .           |
| `GL.POLYGON_OFFSET_UNITS`  | GLfloat   | `0`     | .           |

- Note: The semantics of polygon offsets are loosely specified by the WebGL standard and results can thus be driver dependent.

### Rasterization (WebGL 2)

Primitives are discarded immediately before the rasterization stage, but after the optional transform feedback stage. `gl.clear()` commands are ignored.

| Parameter               | Type      | Default | Description           |
| ----------------------- | --------- | ------- | --------------------- |
| `GL.RASTERIZER_DISCARD` | GLboolean | `false` | Disable rasterization |

### Sampling

Specify multisample coverage parameters

| Function                                                                                                | Sets parameters                                           |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [sampleCoverage](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/sampleCoverage) | [`GL.SAMPLE_COVERAGE_VALUE`, `GL.SAMPLE_COVERAGE_INVERT`] |

| Parameter                     | Type      | Default | Description                                                                            |
| ----------------------------- | --------- | ------- | -------------------------------------------------------------------------------------- |
| `GL_SAMPLE_COVERAGE`          | GLboolean | `false` | Activates the computation of a temporary coverage value determined by the alpha value. |
| `GL_SAMPLE_ALPHA_TO_COVERAGE` | GLboolean | `false` | Activates ANDing the fragment's coverage with the temporary coverage value             |
| `GL.SAMPLE_COVERAGE_VALUE`    | GLfloat   | 1.0     |                                                                                        |
| `GL.SAMPLE_COVERAGE_INVERT`   | GLboolean | `false` |                                                                                        |


### Scissor Test

Settings for scissor test and scissor box.

| Function                                                                                  | Sets parameters  |
| ----------------------------------------------------------------------------------------- | ---------------- |
| [scissor](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor) | `GL.SCISSOR_BOX` |
| scissorTest                                                                               | GL.SCISSOR_TEST  |

| Parameter         | Type          | Default                           | Description |
| ----------------- | ------------- | --------------------------------- | ----------- |
| `GL.SCISSOR_TEST` | GLboolean     | `false`                           |
| `GL.SCISSOR_BOX`  | Int32Array(4) | [null, null, null, null]), // TBD |

## Viewport

Specifies the transformation from normalized device coordinates to
window/framebuffer coordinates. The maximum supported value, is defined by the
`GL.MAX_VIEWPORT_DIMS` limit.

| Function                                                                                    | Parameters    |
| ------------------------------------------------------------------------------------------- | ------------- |
| [viewport](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport) | `GL.VIEWPORT` |

| Parameter     | Type          | Default   | Description |
| ------------- | ------------- | --------- | ----------- |
| `GL.VIEWPORT` | Int32Array(4) | [...] TBD | Viewport    |

Example:

```typescript
// Set viewport to maximum supported size
const maxViewport = getLimits(gl)[GL.MAX_VIEWPORT_DIMS];
setState(gl, {
  viewport: [0, 0, maxViewport[0], maxViewport[1]]
});
```

## Remarks

GPU State Management can be quite complicated.

- A large part of the WebGL API is devoted to parameters. When reading, querying individual values using GL constants is the norm, and when writing, special purpose functions are provided for most parameters. luma.gl supports both forms for both reading and writing parameters.
- Reading values from WebGL can be very slow if it requires a GPU roundtrip. To get around this, luma.gl reads values once, caches them and tracks them as they are changed through luma functions. The cached values can get out of sync if the context is shared outside of luma.gl.
- luma.gl's state management enables "conflict-free" programming, so that even when setting global state, one part of the code does not need to worry about whether other parts are changing the global state.
- Note that to fully support the conflict-free model and detect changes done e.g. in other WebGL libraries, luma.gl needs to hook into the WebGL context to track state changes.

---

## Depth testing

To set up depth testing

```typescript
const value = model.setParameters({
  depthWriteEnabled: true,
  depthCompare: 'less-equal'
});
```



| Parameter                         | Type      | Default      | Description                                                             |
| --------------------------------- | --------- | ------------ | ----------------------------------------------------------------------- |
| `GL.STENCIL_TEST`                 | GLboolean | `false`      | Enables stencil testing                                                 |
| `GL.STENCIL_CLEAR_VALUE`          | GLint     | `0`          | Sets index used when stencil buffer is cleared.                         |
| `GL.STENCIL_WRITEMASK`            | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_BACK_WRITEMASK`       | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FUNC`                 | GLenum    | `GL.ALWAYS`  |                                                                         |
| `GL.STENCIL_REF`                  | GLint     | `0`          |                                                                         |
| `GL.STENCIL_VALUE_MASK`           | GLuint    | `0xFFFFFFFF` | Sets bit mask                                                           |
| `GL.STENCIL_BACK_FUNC`            | GLenum    | `GL.ALWAYS`  |                                                                         |
| `GL.STENCIL_BACK_REF`             | GLint     | `0`          |                                                                         |
| `GL.STENCIL_BACK_VALUE_MASK`      | GLuint    | `0xFFFFFFFF` | Sets bit mask enabling writing of individual bits in the stencil planes |
| `GL.STENCIL_FAIL`                 | GLenum    | `GL.KEEP`    | stencil test fail action                                                |
| `GL.STENCIL_PASS_DEPTH_FAIL`      | GLenum    | `GL.KEEP`    | depth test fail action                                                  |
| `GL.STENCIL_PASS_DEPTH_PASS`      | GLenum    | `GL.KEEP`    | depth test pass action                                                  |
| `GL.STENCIL_BACK_FAIL`            | GLenum    | `GL.KEEP`    | stencil test fail action, back                                          |
| `GL.STENCIL_BACK_PASS_DEPTH_FAIL` | GLenum    | `GL.KEEP`    | depth test fail action, back                                            |
| `GL.STENCIL_BACK_PASS_DEPTH_PASS` | GLenum    | `GL.KEEP`    | depth test pass action, back                                            |

### Blending

| Function style                         | Sets parameter(s)                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| [blendColor][blendColor]               | `GL.BLEND_COLOR`                                                                     |
| [blendEquation][blendEquation]         | [`GL.BLEND_EQUATION_RGB`, `GL.BLEND_EQUATION_ALPHA`]                                 |
| [blendFunc][blendFunc]                 | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`]                                           |
| [blendFuncSeparate][blendFuncSeparate] | [`GL.BLEND_SRC_RGB`, `GL.BLEND_SRC_ALPHA`, `GL.BLEND_DST_RGB`, `GL.BLEND_DST_ALPHA`] |

[blendColor]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor
[blendEquation]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
[blendFunc]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
[blendFuncSeparate]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate

| Parameter                 | Type            | Default        | Description      |
| ------------------------- | --------------- | -------------- | ---------------- |
| `GL.BLEND`                | GLboolean       | `false`        | Blending enabled |
| `GL.BLEND_COLOR`          | Float32Array(4) | `[0, 0, 0, 0]` |                  |
| `GL.BLEND_EQUATION_RGB`   | GLenum          | `GL.FUNC_ADD`  |                  |
| `GL.BLEND_EQUATION_ALPHA` | GLenum          | `GL.FUNC_ADD`  |                  |
| `GL.BLEND_SRC_RGB`        | GLenum          | `GL.ONE`       | srcRgb           |
| `GL.BLEND_SRC_ALPHA`      | GLenum          | `GL.ZERO`      | srcAlpha         |
| `GL.BLEND_DST_RGB`        | GLenum          | `GL.ONE`       | dstRgb           |
| `GL.BLEND_DST_ALPHA`      | GLenum          | `GL.ZERO`      | dstAlpha         |


[polygonoffset]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
[depthrange]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthRange
[cleardepth]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearDepth

[cullface]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
[frontface]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace


[clearstencil]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clearStencil
[stencilmask]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
[stencilfunc]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
[stencilop]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
[stencilopseparate]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOpSeparate



[blendcolor]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendColor
[blendequation]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
[blendfunc]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
[blendfuncseparate]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate
