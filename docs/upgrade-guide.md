# Upgrade Guide

The upgrade guide lists breaking changes in each major and minor version of the luma.gl API, and provides information on how to update applications.

Upgrade instructions assume that you are upgrading from the immediately previous release.
If you are upgrading across multiple releases you will want to consider the release notes for all
intermediary releases.

luma.gl largely follows [SEMVER](https://semver.org) conventions. Breaking changes are typically only done in major versions, minor version bumps bring new functionality but few breaking changes, and patch releases typically contain only low-risk fixes.

*For detailed commit level logs that include alpha and beta releases, see the [CHANGELOG](https://github.com/visgl/luma.gl/blob/master/CHANGELOG.md) in the github repository.*

## Upgrading to v9.1

v9.1 continues to build out WebGPU support. Some additional deprecations and breaking changes have been necessary, but impact on most applications should be minimal.

**Notable change: Adapters**

When initializing luma.gl, applications now import an `Adapter` singleton from either the WebGPU or the WebGL module, and pass the adapter object to `luma.createDevice()`, `makeAnimationLoop` etc. 

`luma.registerDevices()` is replaced with `luma.registerAdapters()` if global registration work best.

**Notable change: Textures**

- The texture API is being streamlined to work symmetrically across WebGPU and WebGL.
- `Texture.copyExternalImage()` replaces `Texture.setImageData()` when initializing textures with image data.

**Notable change: AsyncTextures**

- `Textures` no longer accept promises when setting data (e.g. from `loadImageBitmap(url)`. 
- Instead, a new `AsyncTexture` class does accept promises and creates actual `Textures` once the promise resolves and data is available.
- The `Model` class now accepts `AsyncTextures` as bindings and defers rendering until the underlying texture has been created.

**@luma.gl/core**

| Updated API                    | Status     | Replacement                                  | Comment                                                         |
| ------------------------------ | ---------- | -------------------------------------------- | --------------------------------------------------------------- |
| `luma.registerDevices()`       | Deprecated | [`luma.registerAdapters()`][adapters].       | Adapters provide a cleaner way to work with GPU backends.       |
| `DeviceProps` for canvas       | Moved      | [`DeviceProps.createCanvasContext`][canvas]. | Move canvas related props to `props.createCanvasContext: {}`.   |
| `DeviceProps` for webgl        | Moved      | [`DeviceProps.webgl`][webgl].                | Move canvas related props to `props.webgl: {}`.                 |
| `DeviceProps.break`            | Removed    |                                              | Use an alterative [debugger][debugging]                         |
| `TextureProps.data` (Promise) | Removed    | `AsyncTexture` class                         | Textures no longer accept promises.                             |
| `Parameters.blend`             | New        |                                              | Explicit activation of color blending                           |
| `triangle-fan-webgl` topology  | Removed    | `triangle-strip`.                            | Reorganize your geometries                                      |
| `line-loop-webgl` topology     | Removed    | `line-list`.                                 | Reorganize your geometries                                      |
| `glsl` shader template string  | Removed    | `/* glsl */` comment                         | Enable syntax highlighting in vscode using before shader string |
| `depth24unorm-stencil8`        | Removed    | `depth24plus-stencil8`                       | The `TextureFormat` was removed from the WebGPU spec            |
| `rgb8unorm-unsized`            | Removed    | `rgb8unorm`                                  | No longer support unsized WebGL1 `TextureFormat`                |
| `rgba8unorm-unsized`           | Removed    | `rgb8aunorm`                                 | No longer support unsized WebGL1 `TextureFormat`                |

[adapters]: /docs/api-reference/core/luma#lumaregisteradapters
[canvas]: /docs/api-reference/core/canvas-context#canvascontextprops
[webgl]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext#contextattributes
[debugging]: /docs/developer-guide/debugging

**@luma.gl/shadertools**

| Updated API                          | Status  | Replacement                             | Comment                                            |
| ------------------------------------ | ------- | --------------------------------------- | -------------------------------------------------- |
| `ShaderModuleInstance`               | Removed | Use `ShaderModule` instead.             | Type has been removed.                             |
| `initializeShaderModule()`           | Changed |                                         | Initializes the original shader module object      |
| `ShaderModuleInstance.getUniforms()` | Removed | `getShaderModuleUniforms(module, ...)`. | Interact directly with the shader module           |
| `getDependencyGraph()`               | Removed | `getShaderModuleDependencies(module)` . | Interact directly with the shader module           |
| `glsl` template string               | Removed | `/* glsl */` comment                    | Enable syntax highlighting in vscode using comment |


**@luma.gl/webgl**

- `WebGLDeviceContext` - Note that luma.gl v9.1 and onwards set `DeviceProps.webgl.preserveDrawingBuffers` to `true` by default. This can be disabled for some memory savings and a minor performance boost on resource limited devices, such as mobile phones, at the cost of not being able to take screenshots or rendering to screen without clearing it.

## Upgrading to v9.0

luma.gl v9 is a major modernization of the luma.gl API, with many breaking changes, so the upgrade notes for this release are unusually long. To facilitate porting to the v9 release we have also provided a
[Porting Guide](/docs/legacy/porting-guide) that also provides more background information and discusses porting strategies.

## Upgrading to v8 and earlier releases

This page only covers luma.gl v9 and later releases. 
For information on upgrading to from v8 and earlier releases, see the [Legacy Upgrade Guide](/docs/legacy/legacy-upgrade-guide).
