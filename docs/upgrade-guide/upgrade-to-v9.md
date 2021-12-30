# Upgrading to V9

This upgrade guide describes upgrading to the new luma.gl v9 API, which introduces major API changes. 

Note: While the API changes are on the surface quite extensive, they are in a sense superficial, meaning that typically a port of a luma.gl application to v9 will not require the structure of an application to change. Looking at the code an application should still be "instantly recognizable" as luma.gl application, whether written towards the v8 or v9 API.

> The luma.gl v9 API is currently in [public review](/docs/public-review).

### Module-level changes

v9.0 deprecates a range of APIs as part of preparations for WebGPU support in v9.0.

- `@luma.gl/gltools` module is the new home of the luma.gl v8 API
    - As before, still contains the WebGL context functions (`createGLContext` etc). However these have been reimplemented as wrappers on the new `WebGLDevice` class.
    - It also contains the classic luma.gl WebGL 2 classes (`Program`, `Texture2D`) etc that used to be improved from `@luma.gl/webgl`. However these classes are now just exposed for backwards compatibility and should gradually be relaced.
    - To simplify gradual introduction of the new v9 API, all APIs in `@luma.gl/gltools` have been updated to optionally accept a `Device` parameter instead of a `WebGLRenderingContext`
- `@luma.gl/core` module is "in transition":
    - in v9, the core module still exports the deprecated v8 classes from `@luma.gl/gltools` (so that applications can gradually start moving to the v10 API).
    - WebGL class exports are deprecated and should be imported directly from `@luma.gl/gltools`.
    - gltools module re-exports are deprecated and should be imported directly from `@luma.gl/webgl`.
- `@luma.gl/constants` module remains but is no longer needed by applications:
    - WebGL-style numeric constants (`GL.` constants) are no longer used in the public v9 API.
    - Instead, the luma.gl v9 API uses string constants (strictly typed, of course).

### Feature-level changes

A long list of changes, some required to make the API portable between WebGPU and WebGL, and many to accommodate the limitations of the more locked-down WebGPU API.

- APIs no longer accept `WebGLRenderingContext` directly. APIs now require a `Device`.
- WebGL classes such as Buffer, Texture2D etc can no longer be imported and instantiated with `new Buffer(gl, props)`. Instead they must be created via a device `device.createBuffer(props)`.
- `Program` is now called `RenderPipeline`.
- Parameters can no longer be set on the WebGL context. They must be set on a `RenderPipeline`.
- `RenderPipeline` parameters cannot be changed after creation (though the `Model` class will create new `RenderPipeline` instances if parameters change).
- Some parameters are set on `RenderPass`.
- Constant attributes are no longer supported.
- `clear` can no longer be called directly. Instead attachments are cleared when a `RenderPass` is created and clear colors must be specified in `beginRenderPass`.
- Uniform buffers are required to run under WebGPU.

---

## String constants (GL no longer used)

/constants

### Context API

The v8 luma.gl API was designed to allow apps to work directly with the `WebGLRenderingContext` object. In v9 it became necessary to wrap the WebGL context in a `Device` object.

| Function                           | Replacement                    | Comment                                                          |
| ---------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| `createGLContext()`                | `luma.createDevice()`          |                                                                  |
| `createGLContext({onContextLost})` | `device.lost`                  | `Promise` that lets the application `await` context loss.        |
| `instrumentGLContext()`            | `WebGLDevice.attach(gl)`       | Contexts are now automatically instrumented.                     |
| `polyfillGLContext()`              | N/A                            | Partial polyfilling doesn't mix well with TypeScript.            |
| `hasFeature(feature)`              | `device.features.has(feature)` | Note: Feature names must be updated to new WebGPU style strings. |
| `getFeatures()`                    | `Array.from(device.features)`  |                                                                  |
| `getGLContextInfo(gl)`             | `device.info`                  | Returned object is keyed with strings instead of GL constants.   |
| `getContextLimits(gl)`             | `device.limits`                | Now returns "WebGPU style" limits.                               |

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
| `FEATURES.TIMER_QUERY`                      | `timer-query-webgl`                     | [`Query`][/]ocs/api-reference/webgl/query) for asynchronous GPU timings    |
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

This describes the porting strategy used to port [deck.gl](https://deck.gl), which is
a big luma.gl-dependent code base.

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


### luma.gl v10 expectations

When planning an upgrade strategy,s it can be good to know what further API changes might come down the pipe.

- In v10.0 the `@luma.gl/gltools` module is expected to be removed, forcing applications to adopt the new `Device` API.
- in v10, the core module will be completely updated and instead export the new v9+ API (what is currently in `@luma.gl/api` and `@luma.gl/engine`).

These are indications of intent, not firm decisions. However, the cost of maintaining the v8 API is not trivial, and having the supposedly minimal "core" module of a multi-module framework being focused on exporting optional backwards compatibility classes does not make much sense.

