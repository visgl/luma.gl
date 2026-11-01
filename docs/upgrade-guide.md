# Upgrade Guide

## Opaque GPU and glTF metadata

GPU data `readbackMetadata` and postprocessed glTF `extras` are now typed as `unknown`. Narrow or explicitly type these values before reading their properties.

## Opaque metadata types

Resource, model, and computation `userData` values and glTF `extras` now have type `unknown`. Narrow or explicitly type these values before reading their properties. Texture transform resource maps also use `unknown` values.

## Shader package rename

Install `@luma.gl/shaders` instead of `@luma.gl/shadertools` and update imports, including
`@luma.gl/shadertools/wgsl` to `@luma.gl/shaders/wgsl`. The old package and source tree are removed;
no compatibility module or old-name exports are retained. Shader module and assembler symbols
keep their existing names.

## Explicit shader assembler ownership

Models and computations create owned language-specific assemblers by default. Registering
hooks, default modules, or transpilers on `ShaderAssembler.getDefaultShaderAssembler()` no longer
automatically configures engine, gpgpu, or graph execution. Construct a `GLSLShaderAssembler` or
`WGSLShaderAssembler`, configure it, and pass it through the `shaderAssembler` prop. Share that
instance explicitly between consumers when desired. The static default factory is removed. Explicit class-default assemblers remain supported for existing integrations.

## Effects imports

The `@luma.gl/effects` package has been removed. Install `@luma.gl/engine` and replace
`@luma.gl/effects` imports with `@luma.gl/engine/effects`. Exported effect names and behavior
are unchanged. Effects remain an explicit subpath and are not re-exported from the engine root.
No compatibility package is retained.

## Graph and engine dependency direction

Graph and gpgpu no longer depend on engine. Update these rendering integration imports:

| APIs | Previous import | New import |
| --- | --- | --- |
| `GPUTableModel`, `GPUTableGeometry`, `TableTransform` and their associated types | `@luma.gl/graph/gpu-tables` | `@luma.gl/engine/tables` |
| Scenegraph physics adapters, sessions, and `makePhysicsScenegraph` | `@luma.gl/graph/gpu-physics` | `@luma.gl/engine/physics` |
| Path/polygon rendering models and polygon shaders | `@luma.gl/graph/experimental/models` | `@luma.gl/engine/models` |

GPU physics algorithms, tables, path expansion, and vector input preparation remain in graph. `Computation` and `ShaderInputs` remain owned by `@luma.gl/engine`; graph and gpgpu operations execute through Kernel and RenderKernel without these shader-module conveniences. Engine `Model` still extends that single `GPUVectorModel`. Dynamic resources are owned by `@luma.gl/core/dynamic`, with compatibility exports retained.

## Experimental package removal

Remove `@luma.gl/experimental` from project dependencies and update imports:

| Former APIs | New import |
| --- | --- |
| Scene renderers, PBR helpers, shadows, transparency, and scene composition | `@luma.gl/anari` |
| Controls, material plugins, texture helpers, and WebXR | `@luma.gl/engine/experimental/controls`, `/materials`, `/textures`, and `/webxr` |
| Path and polygon models | `@luma.gl/engine/models` |
| Flow and fluid simulations | `@luma.gl/graph/experimental/simulation` |

ANARI's `/forward`, `/deferred`, `/raytrace`, and `/raymarch` entry points remain available. The Engine root API is unchanged.

## Upgrading to v10.0

### loaders.gl grouped packages

luma.gl now uses loaders.gl 5.0.0-beta.2. Install `@loaders.gl/tables` in place of
`@loaders.gl/parquet`, and import Parquet APIs from `@loaders.gl/tables/parquet` or
its explicit implementation subpaths. Schema, schema utilities, and Node polyfills
now come from `@loaders.gl/core/schema`, `@loaders.gl/core/schema-utils`, and
`@loaders.gl/core/polyfills`; install `@loaders.gl/core` for those subpaths.

The beta also groups glTF under `@loaders.gl/scene/gltf` and LAS under
`@loaders.gl/pointclouds/las`. Replace the standalone `@loaders.gl/gltf` and
`@loaders.gl/las` dependencies with `@loaders.gl/scene` and `@loaders.gl/pointclouds`,
respectively. Install package roots, then import from the format subpaths.


### loaders.gl beta.2 imports

Replace `@loaders.gl/textures` dependencies and imports with `@loaders.gl/images`.
Legacy texture helpers and decoder configuration use explicit entries such as
`@loaders.gl/images/load-image`, `@loaders.gl/images/basis-module-loader`, and
`@loaders.gl/images/crunch-module-loader`. Loader, writer, and source entries are
now flat: for example, replace `@loaders.gl/tables/parquet/parquet-source-loader`
with `@loaders.gl/tables/parquet-source-loader`.

### Audio loading ownership

loaders.gl now decodes `KHR_audio_emitter` while loading glTF. When using luma.gl's
`AudioController`, set `gltf.excludeExtensions: ['KHR_audio_emitter']` in loader
options. This keeps encoded clip loading under the controller's active-scene and
resource ownership rules, and preserves luma.gl's support for legacy draft attachments.

### math.gl grouped packages

luma.gl now uses math.gl 5.0.0-beta.2. Replace standalone math.gl dependencies
with their grouped package roots: `@math.gl/types` becomes `@math.gl/core`,
`@math.gl/polygon` becomes `@math.gl/geometry`, and CRS, projection, and
GeoArrow imports move under `@math.gl/geospatial`. Sun imports move to
`@math.gl/earth/sun`. Install the package root when using these subpaths.

The beta also removes alpha subpaths: import array types and `mat4`/`vec2`/`vec3`/`vec4`
from `@math.gl/core`, parametric geometry and polygon helpers from `@math.gl/geometry`,
DGGS helpers from `@math.gl/dggs`, and GeoArrow codecs and tessellation from
`@math.gl/geospatial/geoarrow`. TypeScript projects using `Float16Array` must include
`ES2025.Float16` in their compiler libraries; math.gl no longer supplies a global shim.


### Scene controllers move to engine

The glTF-prefixed skin, material-variant, billboard, area-light, audio, and interactivity runtime APIs have been removed from `@luma.gl/engine/gltf`. Import `SkinController`, `MaterialVariants`, `BillboardController`, `AreaLightController`, `AudioController`, and `Interactivity` from `@luma.gl/engine` instead. Audio graph and environment helpers also belong to engine.

Use `parseGLTFSkins()`, `parseGLTFMaterialVariants()`, `parseGLTFBillboards()`, `parseGLTFAreaLights()`, or `parseGLTFAudio()` to map imported data into engine construction props. `createScenegraphsFromGLTF()` already returns engine skin and variant controllers.

`SkinController.getBinding()` now accepts an engine node, not a glTF node index. Resolve an imported index with `scenegraphs.gltfNodeIndexToNodeMap.get(index)` first. Bindings no longer carry glTF node or skin indices. See [scene controllers](/docs/api-guide/engine/scene-controllers).

### glTF physics collider provenance

`GLTFPhysicsCollider.shapeIndex` is now optional. Check it before indexing the
implicit-shape array; colliders imported through an explicit legacy mesh resolver
instead identify their source with `meshIndex`.

### Device backend package consolidation

`@luma.gl/webgl`, `@luma.gl/webgpu`, and `@luma.gl/constants` have been removed.
Remove them from application dependencies and import their APIs from `@luma.gl/core`.
Backend entry points are available at `@luma.gl/core/webgl` and `@luma.gl/core/webgpu`.
Import WebGL constants and types from `@luma.gl/core/webgl-constants`, and optional
debugging helpers from `@luma.gl/core/webgl-debug`. Replace the former
`@luma.gl/core/webgl/debug` import with this dedicated entry point.

```typescript
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {GL} from '@luma.gl/core/webgl-constants';
```


### Render pass draw offsets and counts

Indexed WebGL draws now use `firstIndex` in index elements. Replace uses of
`firstVertex` as an indexed byte offset with `firstIndex: byteOffset / indexByteSize`.
`firstVertex` only applies to non-indexed draws. WebGL now rejects `indexCount`
unless the selected vertex array has an index buffer; attribute-less non-indexed
draws should use `vertexCount`.
WebGPU render passes and render bundles now honor explicit zero draw and instance
counts instead of drawing an implicit instance.

### Model parameters on WebGL

On WebGL, `Model.setParameters()` no longer replaces `model.pipeline`. `Model.draw()` passes
the model's current parameters to every draw call, as before. Code that draws
`model.pipeline` directly without passing `parameters` gets the parameters the retained
pipeline was created with; pass `model.parameters` to the draw call instead.

### CPU geometry validation

Engine geometry now delegates CPU storage and tessellation to `@math.gl/geometry`.
Indices must reference valid vertices across the entire supplied index array, including entries
after an explicit draw count. Remove invalid unused indices before constructing a geometry.
Uint8 indices supplied to the engine compatibility adapter are widened to Uint16.
`TruncatedConeGeometry` defaults to a bottom radius of 1; provide explicit nonzero radii for
frusta. Primitive tessellation order can change, so derive face metadata from normals rather
than relying on vertex or index ordering.

**@luma.gl/graph/gpu-simple-graph**

### GPUFFT2D graph lifecycle

`GPUFFT2D` now takes `{input, output, width, height, batchCount?, direction?}` graph views.
Replace `new GPUFFT2D(device, dimensions)` and `transform.encode(encoder, buffers)` with
`graph.add(new GPUFFT2D(props))`, `graph.compile()`, and `compiled.encode(encoder, {parameters: undefined})`.
Destroy the compiled graph instead of the primitive. `GPUFFT2DEncodeOptions` is removed.
Forward and inverse transforms are separate graph operations; pass parameters are immutable.
See [GPUFFT2D](./api-reference/experimental/gpu-core/gpu-fft2d) for the migration example.

- `GPULZByteDecompressor` descriptors now contain five uint32 words per record:
  `[outputOffset, byteLength, literalSourceOffset, literalPeriod, matchOffset]`. Code that creates
  descriptor buffers directly must add `literalPeriod` and use `GPU_LZ_BYTE_DESCRIPTOR_WORDS` when
  allocating and indexing them. Prefer `planGPULZByteDescriptors()` to convert the unchanged
  four-word parser spans into GPU descriptors.

**@luma.gl/shaders**

- `ShaderPassPipeline`, `ShaderPassPipelineStep`, and `ShaderPassComputeOptimization` have been
  renamed to `CompositeShaderPass`, `CompositeShaderPassStep`, and
  `CompositeShaderPassComputeOptimization`. Effect factories and values likewise replace their
  `ShaderPassPipeline` suffix with `CompositeShaderPass`.
- Named shader hook injections now throw if their target is not registered. Register the hook
  for the matching shader stage before injecting into it. WGSL continues to skip unregistered
  module injections, which may contain GLSL-only code.

**@luma.gl/core/webgpu**

- `WebGPUDevice.adapter` is now typed `GPUAdapter | null`. It is `null` for devices wrapped with `webgpuAdapter.attach()` / `luma.attachDevice()`, because a `GPUDevice` does not reference its `GPUAdapter`. Devices from `luma.createDevice()` still have an adapter; TypeScript code that reads `device.adapter` needs a null check or non-null assertion. Use `device.adapterInfo` for adapter metadata.

**@luma.gl/experimental**

- OIT fullscreen resolution is now exposed as `createABufferResolveCompositeShaderPass()` and
  `createWBOITResolveCompositeShaderPass()`. `WBOITRenderer.capture()` returns the accumulation and
  revealage bindings for inserting the WBOIT resolve into a larger shader-pass stack.

## Upgrading to v9.4

**@luma.gl/core**

- WebGPU device creation now defaults to the portable `DeviceProps.featureLevel: 'core'`. Applications that relied on luma.gl requesting every adapter feature and supported limit should pass `featureLevel: 'max'`.
- Render draw state is now owned by `RenderPass`. `RenderPipelineProps.bindings`, `RenderPipelineProps.bindGroups`, `RenderPipeline.setBindings()`, and `RenderPipeline.draw()` are deprecated compatibility APIs. Migrate low-level rendering code to `renderPass.setPipeline()`, `renderPass.setBindings()`, `renderPass.setVertexArray()`, and `renderPass.draw()`.
- `CommandEncoder.finish()` no longer accepts command-buffer properties, and the `CommandBufferProps` type has been removed. Set `id` and `userData` on the command encoder; the finished command buffer inherits them.

**@luma.gl/engine**

- `BufferTransform.run()` now creates its render pass with `discard: true` by default, avoiding
  unnecessary attachment stores for transform-feedback-only workloads. Applications that attach a
  framebuffer and consume rasterized fragment output must pass `discard: false` to `run()`.
- `Model.predraw(commandEncoder)` now requires an explicit command encoder. Call it with the encoder that will be submitted when ordered pre-draw uploads must be shared across multiple draws or viewports. Normal `Model.draw(renderPass)` calls continue to perform their own pre-draw work.
- `makeGPUGeometry()` now interleaves CPU geometry attributes into a single vertex buffer by default. Callers that require separate attribute buffers should create those buffers and construct `GPUGeometry` explicitly with the corresponding `bufferLayout`.

**@luma.gl/core/webgl**

- WebGLDeveloperTools and Spector integration now require `import '@luma.gl/core/webgl-debug'` before enabling `debugWebGL` or `debugSpectorJS`. This keeps debug-only code and the full GL enum out of normal adapter application bundles.

**@luma.gl/core/webgpu**

- `getShaderLayoutFromWGSL()` now uses lightweight interface scanning and returns `null` when WGSL is ambiguous or outside the supported subset. Raw render and compute pipelines must provide an explicit `shaderLayout` in that case. Uniform-buffer member reflection is no longer included in the returned layout.

**@luma.gl/shadertools**

- `ShaderAssembler` is now abstract and can no longer be constructed directly. Replace
  `new ShaderAssembler()` with `new GLSLShaderAssembler()` for GLSL or
  `new WGSLShaderAssembler()` for WGSL.
- `ShaderAssembler.getDefaultShaderAssembler()` is removed. Construct a GLSL or WGSL
  assembler and pass it explicitly.
- `assembleGLSLShaderPair()` is available only on `GLSLShaderAssembler`, and
  `assembleWGSLShader()` is available only on `WGSLShaderAssembler`. Narrow existing
  `ShaderAssembler` references with `instanceof GLSLShaderAssembler` or
  `instanceof WGSLShaderAssembler` before assembling shader source.

## Upgrading to v9.3

**Potentially breaking behavior**
- `AsyncTexture` has been renamed to `DynamicTexture`.
- Scenegraph creation API has been improved, see [`createScenegraphsFromGLTF()`](/docs/api-reference/gltf).
- gltf module now creates `DynamicTexture` instances rather than raw `Texture`s.
- glTF texture sampling now defaults to linear filtering when a glTF sampler omits explicit filter settings. Applications relying on the previous nearest-neighbor default should verify visual output and set sampler filters explicitly when nearest sampling is required.
- The legacy feature flag `timer-query-webgl` has been removed. Replace checks for `timer-query-webgl` with `timestamp-query` for GPU timestamp/query support on both WebGPU and WebGL.
- `PipelineFactory` and `ShaderFactory` now import from `@luma.gl/core` instead of `@luma.gl/engine`.

## Upgrading to v9.2

v9.2 brings full WebGPU support. Some additional deprecations and breaking changes have been necessary, but apart from the `Texture` -> `AsyncTexture` split, impact on most applications should be minimal.

**New VertexFormats**
- `VertexFormat` Replace `'unorm8-webgl'` with `'unorm8'`.

**Texture and AsyncTexture**
- The `Texture` class has been simplified to the minimum API required for GPU portability. The `AsyncTexture` texture class provides a higher-level API and is recommended for most applications.
- `device.createTexture()` no longer accepts `props.data`: Use `AsyncTexture` or call `texture.setImageData()`
- `device.createTexture()` no longer accepts `props.mipmaps`: Use `AsyncTexture` (or call `texture.generateMipmapsWebGL()`)
- On WebGPU, mipmap generation now lives in `AsyncTexture.generateMipmaps()`, not in core `Texture`.
- WebGPU `AsyncTexture` uses render passes for `2d`, `2d-array`, `cube`, and `cube-array`, and a compute path for `3d`.
- Unsupported WebGPU formats now fail explicitly when mipmap generation is requested, instead of silently acting as a no-op.
- `TextureFormat` Correct the PVRTC 2bpp RGB format spelling from `pvrtc-rbg2unorm-webgl` to `pvrtc-rgb2unorm-webgl`.

**Removal of WebGL uniform support**
- The transition from uniforms to uniform buffers is complete, and remaining support for non-buffer uniforms has been removed.
- `core`: `RenderPipeline.setUniformsWebGL()` dropped, use uniform buffer bindings
- `engine`: `Model.setUniformsWebGL()` deprecated, use uniform buffer bindings
- `shadertools`: WebGL1 shader modules have been removed, use the new modules uniform buffer-based counterparts.

**`CanvasContext` simplifications**
- `canvasContext.devicePixelWidth` and `canvasContext.devicePixelHeight` are now kept updated to exact device pixel size of underlying canvas.
- Instead `canvasContext.setDrawingBufferSize()` to explicitly control drawing buffer size, if not using `CanvasContextProps.autoResize`
- A new `DeviceProps.onResize` callback can be used to react to changes.

**Minor changes**
- `core`: The shader types has been refactored, some shader type names have changed. These are typically not used directly by applications.

## Upgrading to v9.1

v9.1 continues to build out WebGPU support. Some additional deprecations and breaking changes have been necessary, but impact on most applications should be minimal.

**Major change: Adapters**

- When initializing luma.gl, applications now import an `Adapter` singleton from the WebGPU and/or the WebGL module, and passes the adapter object(s) to `luma.createDevice()`, `makeAnimationLoop` etc.
- `luma.registerDevices()` can be replaced with `luma.registerAdapters()` if global registration is still desired.

**Major change: Texture and AsyncTextures**

- The texture API is being streamlined to work symmetrically across WebGPU and WebGL.
- `Texture.copyExternalImage()` and `Texture.copyImageData()` replaces `Texture.setImageData()` when initializing texture memory with image data.
- `Textures` no longer accept promises when setting data (e.g. from `loadImageBitmap(url)`.
- Instead, a new `AsyncTexture` class does accept promises and creates actual `Textures` once the promise resolves and data is available.
- The `Model` class now accepts `AsyncTextures` as bindings and defers rendering until the underlying texture has been created.

**@luma.gl/core**

| Updated API                   | Status     | Replacement                                  | Comment                                                         |
| ----------------------------- | ---------- | -------------------------------------------- | --------------------------------------------------------------- |
| `luma.registerDevices()` | Deprecated | [`luma.registerAdapters()`][adapters]. | Adapters provide a cleaner way to work with GPU backends. |
| `DeviceProps.canvas` | Moved | [`DeviceProps.createCanvasContext`][canvas]. | Move canvas related props to `props.createCanvasContext: {}`. |
| `DeviceProps.<webgl options>` | Moved | [`DeviceProps.webgl.<options>`][webgl]. | Move canvas related props to `props.webgl: {}`. |
| `DeviceProps.break` | Removed | — | Use an alternative [debugger][debugging] |
| `TextureProps.data` (Promise) | Removed | `AsyncTexture` class | `Texture` no longer accept promises. Use `AsyncTexture` |
| `Parameters.blend` | New | — | Explicit activation of color blending |
| `triangle-fan-webgl` topology | Removed | `triangle-strip`. | Reorganize your geometries |
| `line-loop-webgl` topology | Removed | `line-list`. | Reorganize your geometries |
| `glsl` shader template string | Removed | `/* glsl */` comment | Enable syntax highlighting in vscode using before shader string |
| `depth24unorm-stencil8` | Removed | `depth24plus-stencil8` | The `TextureFormat` was dropped from the WebGPU spec |
| `rgb8unorm-unsized` | Removed | `rgb8unorm` | Drop support for unsized WebGL1 `TextureFormat` |
| `rgba8unorm-unsized` | Removed | `rgba8unorm` | Drop support for unsized WebGL1 `TextureFormat` |

[adapters]: /docs/api-reference/core/luma#lumaregisteradapters
[canvas]: /docs/api-reference/core/canvas-context#canvascontextprops
[webgl]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext#contextattributes
[debugging]: /docs/developer-guide/debugging

**@luma.gl/shadertools**

| Updated API                          | Status  | Replacement                             | Comment                                            |
| ------------------------------------ | ------- | --------------------------------------- | -------------------------------------------------- |
| `ShaderModuleInstance` | Removed | Use `ShaderModule` instead. | Type has been removed. |
| `initializeShaderModule()` | Changed | — | Initializes the original shader module object |
| `ShaderModuleInstance.getUniforms()` | Removed | `getShaderModuleUniforms(module, ...)`. | Interact directly with the shader module |
| `getDependencyGraph()` | Removed | `getShaderModuleDependencies(module)` . | Interact directly with the shader module |
| `glsl` template string | Removed | `/* glsl */` comment | Enable syntax highlighting in vscode using comment |

**@luma.gl/effects**

New module. All postprocessing effects that were previously in `@luma.gl/shadertools` are now exported from `@luma.gl/effects`.

**@luma.gl/core/webgl**

- `WebGLDeviceContext` - Note that luma.gl v9.1 and onwards set `DeviceProps.webgl.preserveDrawingBuffers` to `true` by default. This can be disabled for some (potential) memory savings and a (potential) minor performance boost on resource limited devices, such as mobile phones, at the cost of not being able to take screenshots or rendering to the screen without clearing it.

## Upgrading to v9.0

luma.gl v9 is a major modernization of the luma.gl API, with many breaking changes, so the upgrade notes for this release are unusually long. To facilitate porting to the v9 release we have also provided a
[Porting Guide](/docs/legacy/porting-guide) that also provides more background information and discusses porting strategies.

## Upgrading to v8 and earlier releases

This page only covers luma.gl v9 and later releases.
For information on upgrading to from v8 and earlier releases, see the [Legacy Upgrade Guide](/docs/legacy/legacy-upgrade-guide).

## Module loader dependencies

- `exportGLTF` and its `GLTFExport*` descriptor types moved from `@luma.gl/engine/gltf` to
  the shared `examples/gltf/gltf-exporter.ts` application helper. Copy it into your application
  when exporting assets; it uses loaders.gl for GLB encoding.
- `loadPBREnvironment()` now requires a `loadImage` callback. Pass your application image loader,
  such as `loadImage: loadImageTexture` from `@loaders.gl/images/load-image`.
- The loaders.gl SQL adapter exports (`planGPUDataFrameQuery`,
  `makeGPUExpressionFromSQLPredicate`, `GPU_DATAFRAME_TABLE_QUERY_CAPABILITIES`, and
  `GPUDataFrameTableQueryOptions`) moved from `@luma.gl/graph/gpu-sql` to
  `examples/experimental/gpu-data-analysis/src/loaders-sql-query.ts`. Native `LuSQLContext`
  and `LuSQLQuery` remain in the module.
- Install loaders.gl packages explicitly in applications that use these integrations.
  Published luma.gl modules no longer install them transitively.

### Table compute execution

`GPUTableComputation` now delegates to Kernel instead of inheriting Computation. Its `inputVectors`, `bindings`, `setBindings()`, `dispatch()`, `dispatchBatches()`, and `destroy()` APIs are retained. Construction takes Kernel pipeline options and assembled WGSL source; assemble shader modules and defines with shadertools before construction. Uniform buffers are explicit bindings owned by the caller.

### Kernel imports

`Kernel`, `RenderKernel`, and their props/draw/dispatch types are exported from `@luma.gl/graph`. Engine no longer re-exports these APIs. Replace kernel imports from `@luma.gl/engine` with imports from `@luma.gl/graph`.

`BufferTransform` and `TextureTransform` are owned by `@luma.gl/engine`. Replace imports of these classes and their props types from `@luma.gl/graph` with engine imports. Gpgpu operations use RenderKernel directly and no longer depend on these adapters.

### GPU vector rendering imports

`GPUVectorModel`, `GPUVectorGeometry`, `getGPUVectorModelBatches`, `validateGPUVectorBatchStructure`, and their associated types belong to `@luma.gl/engine`. Replace imports from `@luma.gl/graph/gpu-simple-graph` or `@luma.gl/graph/gpu-data` with engine imports. GPUData, GPUVector, and GPUConstant live in `@luma.gl/graph/gpu-data`. Engine Model continues to extend GPUVectorModel; vector binding, batching, and resource ownership behavior is unchanged.

### glTF imports

The `@luma.gl/gltf` package has been removed. Import its API from `@luma.gl/engine/gltf`,
and replace `@luma.gl/gltf/physics` with `@luma.gl/engine/gltf-physics`. These are explicit
subpaths: importing the engine root does not import the glTF runtime. No compatibility package
is retained. Install `@luma.gl/engine` instead of `@luma.gl/gltf`.

### Test utility imports

The `@luma.gl/test-utils` package is removed. Replace its root and `/device` imports with
`@luma.gl/core/test-utils`. The legacy `SnapshotTestRunner`, `PerformanceTestRunner`, and
runner test-case types are removed from the public package. Use Vitest and Playwright instead.
Deprecated synchronous device helpers remain in `@luma.gl/core/test-utils-legacy`.

### Gaussian splat imports

The `@luma.gl/splats` package is removed. Replace its imports with `@luma.gl/engine/splats`
and install `@luma.gl/engine`. The engine root does not re-export these APIs. This move preserves
existing splat data, renderers, picking, residency, hierarchy, and graph-backed execution behavior.

## Shader plugin injections

`ShaderPluginVariant` and plugin-level `glsl` / `wgsl` objects have been removed.
Move the primary module, defines, vertex inputs, and varyings to the plugin root. Shader modules
carry their own GLSL/WGSL implementations. Move injection source to `glsl` / `wgsl`
fields on each injection, replacing its previous `injection` field:

```ts
const plugin: ShaderPlugin = {
  name: 'tint',
  module: tintModule,
  injections: [
    {
      target: 'fs:FILTER_COLOR',
      glsl: 'color *= tint.color;',
      wgsl: '*color *= tint.color;'
    }
  ]
};
```

Keep the target and order once when they match between languages. If they differ,
use separate entries containing only the relevant language's source. Omitted source
skips the injection for that language. For an old shared source string, set both
language fields explicitly. This change only affects `ShaderPlugin` descriptors;
lower-level assembler `ShaderInjection` objects still use `injection`.

If a plugin previously changed modules, defines, or its interface by language,
construct the appropriate descriptor explicitly before passing it to the model or
computation; there is no longer an implicit language-variant merge.

## Shader plugin primary module

`ShaderPlugin.modules` is replaced by the optional `ShaderPlugin.module`:

```ts
// Before
const plugin = {name: 'filter', modules: [filterShaderModule]};
// After
const plugin: ShaderPlugin = {name: 'filter', module: filterShaderModule};
```

Injection-only plugins need no module. If a plugin previously supplied multiple
modules, use one primary module with `dependencies`, or split independent features
into multiple plugins:

```ts
const combinedModule = {name: 'combined', dependencies: [firstModule, secondModule]};
const plugin: ShaderPlugin = {name: 'combined', module: combinedModule};
```

Dependencies retain their existing uniform/binding namespaces. Continue configuring
them by module name through `ShaderInputs`; the primary module does not automatically
forward props to dependencies. The `modules` arrays accepted by models, computations,
and assemblers, as well as `ResolvedShaderPlugins.modules`, are unchanged.

### Removal of `@luma.gl/gpgpu`

The v10 graph package now owns the former gpgpu APIs. The gpgpu package is removed without compatibility exports. Existing evaluator expressions retain their behavior. Update imports as follows:

| Former entry | Replacement |
| --- | --- |
| `@luma.gl/gpgpu` evaluator and operation exports | `@luma.gl/graph/gpu-simple-graph` |
| `@luma.gl/gpgpu` shared execution exports, including `Kernel` and `RenderKernel` | `@luma.gl/graph` |
| `@luma.gl/gpgpu/gpu-data` | `@luma.gl/graph/gpu-data` |
| `@luma.gl/gpgpu/cpu`, `/webgl`, `/webgpu` | `@luma.gl/graph/gpu-simple-graph/cpu`, `/webgl`, `/webgpu` |
| `@luma.gl/gpgpu/arrow` | `@luma.gl/graph/arrow` |

Replace the package dependency with `@luma.gl/graph`. Apache Arrow remains an optional peer used only by the Arrow entry.
