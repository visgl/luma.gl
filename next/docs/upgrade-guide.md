# Upgrade Guide

The upgrade guide lists breaking changes in each major and minor version of the luma.gl API, and provides information on how to update applications.

Upgrade instructions assume that you are upgrading from the immediately previous release. If you are upgrading across multiple releases you will want to consider the release notes for all intermediary releases.

luma.gl largely follows [SEMVER](https://semver.org) conventions. Breaking changes are typically only done in major versions, minor version bumps bring new functionality but few breaking changes, and patch releases typically contain only low-risk fixes.

*For detailed commit level logs that include alpha and beta releases, see the [CHANGELOG](https://github.com/visgl/luma.gl/blob/master/CHANGELOG.md) in the github repository.*

## Upgrading to v10.0[​](#upgrading-to-v100 "Direct link to Upgrading to v10.0")

**@luma.gl/shadertools**

* `ShaderAssembler` is now abstract and can no longer be constructed directly. Replace `new ShaderAssembler()` with `new GLSLShaderAssembler()` for GLSL or `new WGSLShaderAssembler()` for WGSL.
* `ShaderAssembler.getDefaultShaderAssembler()` now requires an explicit shader language. Replace calls without an argument with `ShaderAssembler.getDefaultShaderAssembler('glsl')` or `ShaderAssembler.getDefaultShaderAssembler('wgsl')`.
* `assembleGLSLShaderPair()` is available only on `GLSLShaderAssembler`, and `assembleWGSLShader()` is available only on `WGSLShaderAssembler`. Narrow existing `ShaderAssembler` references with `instanceof GLSLShaderAssembler` or `instanceof WGSLShaderAssembler` before assembling shader source.

**@luma.gl/experimental**

* `ABufferRenderer.render()` and `WBOITRenderer.render()` now accept an already-rendered opaque `sourceTexture` and return the resolved color texture. Applications must render opaque color and depth before invoking the OIT renderer; the former base-pass/framebuffer callbacks were removed.
* OIT fullscreen resolution is now exposed as `createABufferResolveShaderPassPipeline()` and `createWBOITResolveShaderPassPipeline()`. `WBOITRenderer.capture()` returns the accumulation and revealage bindings for inserting the WBOIT resolve into a larger shader-pass stack.

**@luma.gl/arrow**

* Arrow materialization now stays in `@luma.gl/arrow` adapter helpers instead of table constructors and instance readback methods:

  <!-- -->

  * `makeGPUDataFromArrowData(...)`, `makeGPUVectorFromArrow(...)`, `makeGPURecordBatchFromArrowRecordBatch(...)`, and `makeGPUTableFromArrowTable(...)`
  * `readArrowGPUDataAsync(...)` and `readArrowGPUVectorAsync(...)`

* Arrow append-in-place helpers and streaming wrapper classes have been removed. Convert each Arrow record batch with `makeGPURecordBatchFromArrowRecordBatch(device, recordBatch, ...)` and retain it with `gpuTable.addBatch(...)`.

**@luma.gl/gpgpu**

* `GPUTableEvaluator` and `getGPUTableEvaluator()` have been removed. Use `GPUDataEvaluator` and `getGPUDataEvaluator()` for one packed fixed-width `GPUData` chunk.
* Leaf GPGPU operations no longer adapt `GPUVector` inputs. Use `GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(...)` to apply one leaf transform independently across preserved `GPUVector.data[]` chunks.
* The experimental direct `BitonicArgsort` WebGPU helper has been removed. Use graph-native `GPUSort` from `@luma.gl/gpgpu/gpu-core` with explicit key/value output views and command submission.

## Upgrading to v9.4[​](#upgrading-to-v94 "Direct link to Upgrading to v9.4")

**GPU compute and table imports**

* `@luma.gl/tables` has been removed without compatibility re-exports. Import primitive GPU data APIs (`GPUData`, `GPUDataView`, `GPUVector`, `GPUVectorFormat`, `GPUConstant`, formats, and basic helpers) from `@luma.gl/gpgpu/gpu-data`.
* Import `GPURecordBatch`, `GPUTable`, schemas, table bindings, table computations, and generic table planners from `@luma.gl/experimental/gpu-tables`.
* Import path and polygon models, their GPU input helpers, and model-specific planners from `@luma.gl/experimental/models`.
* `@luma.gl/experimental/gpu-core` and `@luma.gl/experimental/gpu-graph` have been removed without compatibility re-exports. Import them from `@luma.gl/gpgpu/gpu-core` and `@luma.gl/gpgpu/gpu-graph`; graph benchmarks move to `@luma.gl/gpgpu/gpu-graph/benchmarks`.

**@luma.gl/core**

* WebGPU device creation now defaults to the portable `DeviceProps.featureLevel: 'core'`. Applications that relied on luma.gl requesting every adapter feature and supported limit should pass `featureLevel: 'max'`.
* Render draw state is now owned by `RenderPass`. `RenderPipelineProps.bindings`, `RenderPipelineProps.bindGroups`, `RenderPipeline.setBindings()`, and `RenderPipeline.draw()` are deprecated compatibility APIs. Migrate low-level rendering code to `renderPass.setPipeline()`, `renderPass.setBindings()`, `renderPass.setVertexArray()`, and `renderPass.draw()`.
* `CommandEncoder.finish()` no longer accepts command-buffer properties, and the `CommandBufferProps` type has been removed. Set `id` and `userData` on the command encoder; the finished command buffer inherits them.

**@luma.gl/engine**

* `BufferTransform.run()` now creates its render pass with `discard: true` by default, avoiding unnecessary attachment stores for transform-feedback-only workloads. Applications that attach a framebuffer and consume rasterized fragment output must pass `discard: false` to `run()`.
* `Model.predraw(commandEncoder)` now requires an explicit command encoder. Call it with the encoder that will be submitted when ordered pre-draw uploads must be shared across multiple draws or viewports. Normal `Model.draw(renderPass)` calls continue to perform their own pre-draw work.
* `makeGPUGeometry()` now interleaves CPU geometry attributes into a single vertex buffer by default. Callers that require separate attribute buffers should create those buffers and construct `GPUGeometry` explicitly with the corresponding `bufferLayout`.

**@luma.gl/webgl**

* WebGLDeveloperTools and Spector integration now require `import '@luma.gl/webgl/debug'` before enabling `debugWebGL` or `debugSpectorJS`. This keeps debug-only code and the full GL enum out of normal adapter application bundles.

**@luma.gl/webgpu**

* `getShaderLayoutFromWGSL()` now uses lightweight interface scanning and returns `null` when WGSL is ambiguous or outside the supported subset. Raw render and compute pipelines must provide an explicit `shaderLayout` in that case. Uniform-buffer member reflection is no longer included in the returned layout.

**@luma.gl/arrow**

* Arrow 2D text clip rectangles now require `FixedSizeList<Float32>[4]` columns, and GPU-backed clip rectangles require `GPUVector<'float32x4'>`. Rebuild any previous `FixedSizeList<Int16>[4]` or `GPUVector<'sint16x4'>` inputs as 32-bit floats. Rectangle values are interpreted as `[x, y, width, height]` offsets in the text anchor's world coordinate space.

## Upgrading to v9.3[​](#upgrading-to-v93 "Direct link to Upgrading to v9.3")

**Potentially breaking behavior**

* `AsyncTexture` has been renamed to `DynamicTexture`.
* Scenegraph creation API has been improved, see [`createScenegraphsFromGLTF()`](https://luma.gl/next/docs/api-reference/gltf.md).
* gltf module now creates `DynamicTexture` instances rather than raw `Texture`s.
* glTF texture sampling now defaults to linear filtering when a glTF sampler omits explicit filter settings. Applications relying on the previous nearest-neighbor default should verify visual output and set sampler filters explicitly when nearest sampling is required.
* The legacy feature flag `timer-query-webgl` has been removed. Replace checks for `timer-query-webgl` with `timestamp-query` for GPU timestamp/query support on both WebGPU and WebGL.
* `PipelineFactory` and `ShaderFactory` now import from `@luma.gl/core` instead of `@luma.gl/engine`.

## Upgrading to v9.2[​](#upgrading-to-v92 "Direct link to Upgrading to v9.2")

v9.2 brings full WebGPU support. Some additional deprecations and breaking changes have been necessary, but apart from the `Texture` -> `AsyncTexture` split, impact on most applications should be minimal.

**New VertexFormats**

* `VertexFormat` Replace `'unorm8-webgl'` with `'unorm8'`.

**Texture and AsyncTexture**

* The `Texture` class has been simplified to the minimum API required for GPU portability. The `AsyncTexture` texture class provides a higher-level API and is recommended for most applications.
* `device.createTexture()` no longer accepts `props.data`: Use `AsyncTexture` or call `texture.setImageData()`
* `device.createTexture()` no longer accepts `props.mipmaps`: Use `AsyncTexture` (or call `texture.generateMipmapsWebGL()`)
* On WebGPU, mipmap generation now lives in `AsyncTexture.generateMipmaps()`, not in core `Texture`.
* WebGPU `AsyncTexture` uses render passes for `2d`, `2d-array`, `cube`, and `cube-array`, and a compute path for `3d`.
* Unsupported WebGPU formats now fail explicitly when mipmap generation is requested, instead of silently acting as a no-op.
* `TextureFormat` Correct the PVRTC 2bpp RGB format spelling from `pvrtc-rbg2unorm-webgl` to `pvrtc-rgb2unorm-webgl`.

**Removal of WebGL uniform support**

* The transition from uniforms to uniform buffers is complete, and remaining support for non-buffer uniforms has been removed.
* `core`: `Renderpipeline.setUniformsWebGL()` dropped, use uniform buffer bindings
* `engine`: `Model.setUniformsWebGL()` deprecated, use uniform buffer bindings
* `shadertools`: WebGL1 shader modules have been removed, use the new modules uniform buffer-based counterparts.

**`CanvasContext` simplifications**

* `canvasContext.devicePixelWidth` and `canvasContext.devicePixelHeight` are now kept updated to exact device pixel size of underlying canvas.
* Instead `canvasContext.setDrawingBufferSize()` to explicitly control drawing buffer size, if not using `CanvasContextProps.autoResize`
* A new `DeviceProps.onResize` callback can be used to react to changes.

**Minor changes**

* `core`: The shader types has been refactored, some shader type names have changed. These are typically not used directly by applications.

## Upgrading to v9.1[​](#upgrading-to-v91 "Direct link to Upgrading to v9.1")

v9.1 continues to build out WebGPU support. Some additional deprecations and breaking changes have been necessary, but impact on most applications should be minimal.

**Major change: Adapters**

* When initializing luma.gl, applications now import an `Adapter` singleton from the WebGPU and/or the WebGL module, and passes the adapter object(s) to `luma.createDevice()`, `makeAnimationLoop` etc.
* `luma.registerDevices()` can be replaced with `luma.registerAdapters()` if global registration is still desired.

**Major change: Texture and AsyncTextures**

* The texture API is being streamlined to work symmetrically across WebGPU and WebGL.
* `Texture.copyExternalImage()` and `Texture.copyImageData()` replaces `Texture.setImageData()` when initializing texture memory with image data.
* `Textures` no longer accept promises when setting data (e.g. from `loadImageBitmap(url)`.
* Instead, a new `AsyncTexture` class does accept promises and creates actual `Textures` once the promise resolves and data is available.
* The `Model` class now accepts `AsyncTextures` as bindings and defers rendering until the underlying texture has been created.

**@luma.gl/core**

| Updated API                   | Status     | Replacement                                                                                                                       | Comment                                                                                    |
| ----------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `luma.registerDevices()`      | Deprecated | [`luma.registerAdapters()`](https://luma.gl/next/docs/api-reference/core/luma.md#lumaregisteradapters).                      | Adapters provide a cleaner way to work with GPU backends.                                  |
| `DeviceProps.canvas`          | Moved      | [`DeviceProps.createCanvasContext`](https://luma.gl/next/docs/api-reference/core/canvas-context.md#canvascontextprops).      | Move canvas related props to `props.createCanvasContext: {}`.                              |
| `DeviceProps.<webgl options>` | Moved      | [`DeviceProps.webgl.<options>`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext#contextattributes). | Move canvas related props to `props.webgl: {}`.                                            |
| `DeviceProps.break`           | Removed    | —                                                                                                                                 | Use an alternative [debugger](https://luma.gl/next/docs/developer-guide/debugging.md) |
| `TextureProps.data` (Promise) | Removed    | `AsyncTexture` class                                                                                                              | `Texture` no longer accept promises. Use `AsyncTexture`                                    |
| `Parameters.blend`            | New        | —                                                                                                                                 | Explicit activation of color blending                                                      |
| `triangle-fan-webgl` topology | Removed    | `triangle-strip`.                                                                                                                 | Reorganize your geometries                                                                 |
| `line-loop-webgl` topology    | Removed    | `line-list`.                                                                                                                      | Reorganize your geometries                                                                 |
| `glsl` shader template string | Removed    | `/* glsl */` comment                                                                                                              | Enable syntax highlighting in vscode using before shader string                            |
| `depth24unorm-stencil8`       | Removed    | `depth24plus-stencil8`                                                                                                            | The `TextureFormat` was dropped from the WebGPU spec                                       |
| `rgb8unorm-unsized`           | Removed    | `rgb8unorm`                                                                                                                       | Drop support for unsized WebGL1 `TextureFormat`                                            |
| `rgba8unorm-unsized`          | Removed    | `rgb8aunorm`                                                                                                                      | Drop support for unsized WebGL1 `TextureFormat`                                            |

**@luma.gl/shadertools**

| Updated API                          | Status  | Replacement                             | Comment                                            |
| ------------------------------------ | ------- | --------------------------------------- | -------------------------------------------------- |
| `ShaderModuleInstance`               | Removed | Use `ShaderModule` instead.             | Type has been removed.                             |
| `initializeShaderModule()`           | Changed | —                                       | Initializes the original shader module object      |
| `ShaderModuleInstance.getUniforms()` | Removed | `getShaderModuleUniforms(module, ...)`. | Interact directly with the shader module           |
| `getDependencyGraph()`               | Removed | `getShaderModuleDependencies(module)` . | Interact directly with the shader module           |
| `glsl` template string               | Removed | `/* glsl */` comment                    | Enable syntax highlighting in vscode using comment |

**@luma.gl/effects**

New module. All postprocessing effects that were previously in `@luma.gl/shadertools` are now exported from `@luma.gl/effects`.

**@luma.gl/webgl**

* `WebGLDeviceContext` - Note that luma.gl v9.1 and onwards set `DeviceProps.webgl.preserveDrawingBuffers` to `true` by default. This can be disabled for some (potential) memory savings and a (potential) minor performance boost on resource limited devices, such as mobile phones, at the cost of not being able to take screenshots or rendering to the screen without clearing it.

## Upgrading to v9.0[​](#upgrading-to-v90 "Direct link to Upgrading to v9.0")

luma.gl v9 is a major modernization of the luma.gl API, with many breaking changes, so the upgrade notes for this release are unusually long. To facilitate porting to the v9 release we have also provided a [Porting Guide](https://luma.gl/next/docs/legacy/porting-guide) that also provides more background information and discusses porting strategies.

## Upgrading to v8 and earlier releases[​](#upgrading-to-v8-and-earlier-releases "Direct link to Upgrading to v8 and earlier releases")

This page only covers luma.gl v9 and later releases. For information on upgrading to from v8 and earlier releases, see the [Legacy Upgrade Guide](https://luma.gl/next/docs/legacy/legacy-upgrade-guide).
