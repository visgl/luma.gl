# Upgrading to V9

This upgrade guide describes upgrading to the luma.gl v9 API, which introduces major API changes. 

### Notable non-API changes

- **ES modules** - luma.gl is now packaged and published as ES modules. This is the modern way of packaging JavaScript applications that fully embraces the static `import`/`export` syntax, however be aware that it can introduce incompatibilities with code that uses legacy imports that can be tricky to work around. If you are in a big legacy projects, getting your code base ready for ES modules may require a bigger effort than actually updating the luma.gl API.
- **Dependencies** - luma.gl v9 introduces major version bumps of some key dependencies. 
   - Luma.gl now uses math.gl v4, loaders.gl v4 and probe.gl v4. 
   - These dependencies are not expected to generate API breakages for most luma.gl applications. 
   - The main motivation for these major version bumps is to ensure that all luma.gl dependencies have also adopted ES modules.
   - However, be aware that dependent libraries are now even more strongly typed which could result in type errors in your applications that were previously silently ignored.


### Effort Estimation

Suddenly having to upgrade an existing application to a new breaking API version is never fun. A first step for application developers is often to assess how much effort an upgrade is likely to require.

While it is impossible to assess here how much work will be required for a specific application, this section provides a few notes that may help give a better sense of what to expect:

The general "structure" and abstraction level of the luma.gl API has not changed. While the v9 API changes will seem extensive at first:
  - A port of a luma.gl application to v9 should not require the application to be refactored or redesigned in any substantial way. 
  - An application should still be "instantly recognizable" as luma.gl application, whether written towards the v8 or v9 API.

The ground-up focus on TypeScript and strong typing in luma.gl v9 should create a safety net when porting. The typescript compiler should find many breakages in your application before you even run any code.

### Module-level changes

| **Module**           | v8 Description                                  | v9 Replacement                                                                                                                    |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `@luma.gl/core`      | The core module was re-exporting other modules. | Replace direct use of WebGL classes with `@luma.gl/core` device API. import directly from `@luma.gl/shadertools`.                 |
| `@luma.gl/gltools`   | Contained WebGL context functionality.          | Removed. WebGL context is now handled by the  `@luma.gl/webgl` `WebGLDevice` and  `@luma.gl/core` `CanvasContext` classes.        |
| `@luma.gl/webgl`     | Exported WebGL classes meant for direct usage.  | Now exports the WebGL backend for the `@luma.gl/core` module. `@luma.gl/webgl-legacy` now offers the legacy luma.gl v8 WebGL API. |
| `@luma.gl/constants` | Exported numeric OpenGL constants.              | Do not use. The luma.gl v9 API uses strictly typed WebGPU-style strings instead of numeric constants.                             |


## Deleted modules

**`@luma.gl/experimental`**
    - Scene graph exports (`ModelNode`, `GroupNode`, `ScenegraphNode`) has been moved into `@luma.gl/engine`.

**`@luma.gl/constants`** 

- This module remains as an internal module, but is no longer intended to be imported by applications. 
- WebGL-style numeric constants (`GL.` constants) are no longer used in the luma.gl v9 API. Instead, the luma.gl v9 API contains strictly typed WebGPU style string constants.
- Breaking changes
  - Constants are now exported via a named export rather than a default export for better ES modules compatibility. Change `import GL from @luma.gl/constants` to `import {GL} from @luma.gl/constants`.

**`@luma.gl/gltools`** (removed)
    - The WebGL context functions (`createGLContext` etc), have been replaced by methods on to the new `Device` and `CanvasContext` classes.

#### `@luma.gl/debug` (removed - see upgrade guide)

- `makeDebugContext()` - Khronos WebGL developer tools no longer need to be bundled, they are now dynamically loaded when WebGL devices are created with `luma.createDevice({debug: true, type: 'webgl'})`.
- Debugging:the [Khronos WebGL developer tools](https://github.com/KhronosGroup/WebGLDeveloperTools) no longer need to be bundled. They are now automatically loaded from CDN when WebGL devices are created with `luma.createDevice({debug: true, type: 'webgl'})`
- Debugging: [Spector.js](https://spector.babylonjs.com/) is pre-integrated. If a `WebGLDevice` is created with `spector: true`, the Spector.js library will be dynamically loaded from CDN, the device canvas will be "captured". Also information about luma.gl objects associated with WebGL handles will be displayed in the Spector UI.

#### `@luma.gl/gltools` (removed)

- The `@luma.gl/gltools` module is removed. Its exports are available in the `@luma.gl/webgl-legacy` module.

## Changes per module

**`@luma.gl/core`**
    - in v9, the core module still exports the deprecated v8 classes from `@luma.gl/gltools` (so that applications can gradually start moving to the v10 API).
    - WebGL class exports are deprecated and should be imported directly from `@luma.gl/webgl-legacy`.

**`@luma.gl/engine`**

#### `AnimationLoop`

| Deleted v8 Properties | Replace with                                        |
| --------------------- | --------------------------------------------------- |
| `gl`                  | `props.device`                                 |
| `glOptions`           | Pass options to `luma.createDevice()`               |
| `createFramebuffer`   | Create framebuffers explicitly in your application. |
| `debug`               | Use `luma.createDevice({debug: true})`              |

Deleted v8 methods 
- isContextLost() - Use `device.isLost()`.


### Feature-level changes

A long list of changes, some required to make the API portable between WebGPU and WebGL, and many to accommodate the limitations of the more locked-down WebGPU API.

| v8                      | v9                           | Comment                                                                                                                                              |
| ----------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WebGLRenderingContext` | `Device`                     | The device lets luma                                                                                                                                 |
| `new Buffer(gl, props)` | `device.createBuffer(props)` | WebGL classes such as `Buffer`, `Texture2D` etc can no longer be imported and instantiated with . Instead they must be created via a device methods. |
| `Program`               | `RenderPipeline`             | WebGPU alignment                                                                                                                                     |


## GPU Parameters

| setParameters | |  Parameters can no longer be set on the WebGL context. They must be set on a `RenderPipeline`. |
| setParameters ||  - `RenderPipeline` parameters cannot be changed after creation (though the `Model` class will create new `RenderPipeline` instances if parameters change).
- Some parameters are set on `RenderPass`.
- Constant attributes are no longer supported.
- `clear` can no longer be called directly. Instead attachments are cleared when a `RenderPass` is created and clear colors must be specified in `beginRenderPass`.
- Uniform buffers are required to run under WebGPU.

---

## String constants (GL no longer used)

/constants

### WebGLContext API

The v8 luma.gl API was designed to allow apps to work directly with the `WebGLRenderingContext` object. v9 enables applications to work portably with both WebGPU and WebGL, and accordingly it wraps the WebGL context in a `Device` instance.

| Function                           | Replacement                    | Comment                                                        |
| ---------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `createGLContext()`                | `luma.createDevice()`          | Will create a WebGL context if `WebGLDevice` is registered.    |
| `createGLContext({onContextLost})` | `device.lost`                  | `Promise` that lets the application `await` context loss.      |
| `instrumentGLContext()`            | `WebGLDevice.attach(gl)`       | Contexts are now automatically instrumented.                   |
| `polyfillGLContext()`              | N/A                            | Partial polyfilling doesn't mix well with TypeScript.          |
| `hasFeature(feature)`              | `device.features.has(feature)` | Note: Feature names now defined by WebGPU style strings.       |
| `getFeatures()`                    | `Array.from(device.features)`  |                                                                |
| `getGLContextInfo(gl)`             | `device.info`                  | Returned object is keyed with strings instead of GL constants. |
| `getContextLimits(gl)`             | `device.limits`                | Returns "WebGPU style" limits instead of WebGL style enums     |

## Context Assertion Functions

To help applications work directly with `WebGLRenderingContext` instances,
luma.gl v8 exposed a suite of context assertion functions. The `Device` abstraction should
generally reduce the need for using these.

| Function                  | Replacement       | Comment                                                         |
| ------------------------- | ----------------- | --------------------------------------------------------------- |
| `isWebGL(gl)`             | `device.isWebGL`  | `device.info.type` === `webgl1`                                 |
| `isWebGL2(gl)`            | `device.isWebGL2` | `device.info.type` === `webgl2`                                 |
| `getWebGL2Context(gl)`    | `device.gl2`      |                                                                 |
| `assertWebGLContext(gl)`  | N/A               | A device will always hold a valid WebGL context                 |
| `assertWebGL2Context(gl)` | N/A               | `if (device.info.type !== 'webgl2') throw new Error('WebGL2');` |

## Canvas API

The luma.gl v9 API adds a `CanvasContext` class that more cleanly separates the
complicated relation between `WebGLRenderingContext` and its associated
canvas DOM element (`HTLMCanvasElement`).

| Function                       | Replacement                                  | Comment                                            |
| ------------------------------ | -------------------------------------------- | -------------------------------------------------- |
| `resizeGLContext(gl, options)` | `device.canvasContext.resize(options)`       | Same options: `{width, height, useDevicePixels}`   |
| `getDevicePixelRatio()`        | `device.canvasContext.getDevicePixelRatio()` | Uses `useDevicePixels` prop on the `CanvasContext` |
| `setDevicePixelRatio()`        | `device.canvasContext.setDevicePixelRatio()` |                                                    |
|                                | `device.canvasContext.getPixelSize()`        |
|                                | `device.canvasContext.getAspect()`           |
| `cssToDeviceRatio()`           | `device.canvasContext.cssToDeviceRatio()`    |                                                    |
| `cssToDevicePixels()`          | `device.canvasContext.cssToDevicePixels()`   |                                                    |

### Features

Feature names have been changed to fit with a combined WebGL / WebGPU model and will need to be updated.

> The strong typing in the luma.gl v9 API means that TypeScript will detect unsupported feature names which should make the
> conversion process less painful.

| luma.gl v8 `FEATURE`                        | v9 `DeviceFeature`                      | Comments                                                                      |
| ------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| **General WebGL Features**                  |                                         |                                                                               |
| `FEATURES.WEBGL2`                           | `webgl2`                                | True for WebGL 2 Context                                                      |
| `FEATURES.TIMER_QUERY`                      | `timer-query-webgl`                     | [`Query`][/]ocs/api-reference/webgl/query) for asynchronous GPU timings       |
| `FEATURES.INSTANCED_RENDERING`              | `instanced-rendering-webgl1`            | Instanced rendering (via instanced vertex attributes)                         |
| `FEATURES.VERTEX_ARRAY_OBJECT`              | `vertex-array-object-webgl1`            | `VertexArrayObjects` can be created                                           |
| `FEATURES.ELEMENT_INDEX_UINT32`             | `element-index-uint32-webgl1`           | 32 bit indices available for `GL.ELEMENT_ARRAY_BUFFER`s                       |
| `FEATURES.BLEND_MINMAX`                     | `blend-min-max-webgl1``                 | `GL.MIN`, `GL.MAX` blending modes are available                               |
| `FEATURES.FRAGMENT_SHADER_DRAW_BUFFERS`     | `glsl-frag-data-webgl1`                 | Fragment shader can draw to multiple render targets                           |
| `FEATURES.FRAGMENT_SHADER_DEPTH`            | `glsl-frag-depth-webgl1`                | Fragment shader can control fragment depth value                              |
| `FEATURES.SHADER_TEXTURE_LOD`               | `glsl-texture-lod-webgl1`               | Enables shader control of LOD                                                 |
| `FEATURES.FRAGMENT_SHADER_DERIVATIVES`      | `glsl-derivatives-webgl1`               | Derivative functions are available in GLSL                                    |
| **`Texture`s and `Framebuffer`s**           |                                         |                                                                               |
| `FEATURES.TEXTURE_FLOAT`                    | `texture-renerable-float32-webgl`       | Floating point textures can be created / set as samplers                      |
| `FEATURES.TEXTURE_HALF_FLOAT`               | `texture-renderable-float16-webgl`      | Half float textures can be created and set as samplers                        |
| `FEATURES.MULTIPLE_RENDER_TARGETS`          | `multiple-renderable--webgl1`           | `Framebuffer` multiple color attachments that fragment shaders can access     |
| `FEATURES.COLOR_ATTACHMENT_RGBA32F`         | `texture-renderable-rgba32float-webgl1` | Floating point `Texture` in the `GL.RGBA32F` format are renderable & readable |
| `FEATURES.COLOR_ATTACHMENT_FLOAT`           | `webgl1`                                | Floating point `Texture`s renderable + readable.                              |
| `FEATURES.COLOR_ATTACHMENT_HALF_FLOAT`      | `webgl1`                                | Half float format `Texture`s are renderable and readable                      |
| `FEATURES.FLOAT_BLEND`                      | `texture-blend-float-webgl`             | Blending with 32-bit floating point color buffers                             |
| `TEXTURE_FILTER_LINEAR_FLOAT`               | `texture-filter-linear-float32-webgl1`  | Linear texture filtering for floating point textures                          |
| `FEATURES.TEXTURE_FILTER_LINEAR_HALF_FLOAT` | `texture-filter-linear-float16-webgl1`  | Linear texture filtering for half float textures                              |
| `FEATURES.TEXTURE_FILTER_ANISOTROPIC`       | `texture-filter-anisotropic-webgl`      | Anisotropic texture filtering                                                 |
| `FEATURES.SRGB`                             | `texture-formats-srgb-webgl1`           | sRGB encoded rendering is available                                           |
| `FEATURES.TEXTURE_DEPTH_BUFFERS`            | `texture-formats-depth-webgl1`          | Depth buffers can be stored in `Texture`s, e.g. for shadow map calculations   |

## Porting Strategies

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

