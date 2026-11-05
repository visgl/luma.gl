# Model

[Model](https://luma.gl/next/docs/api-reference/engine/model.md)[Inputs workflow](https://luma.gl/next/docs/api-guide/engine/shader-inputs.md)[ShaderInputs](https://luma.gl/next/docs/api-reference/engine/shader-inputs.md)[Materials](https://luma.gl/next/docs/api-guide/engine/materials.md)

`Model` is the main engine-level rendering class in luma.gl. It assembles shaders, manages geometry and bindings, reuses immutable cached pipelines, and applies its dynamic draw state to a [`RenderPass`](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md).

**Model**

* Role

  Connect shaders, inputs, geometry, pipelines, and draw state

* Construction

  Device plus ModelProps

* Updates

  Update inputs, bindings, attributes, counts, or pipeline-defining props

* Ownership

  Owns internal pipelines; caller retains explicitly supplied resources

* Portability

  Provide WGSL and GLSL for WebGPU and WebGL portability

* Performance

  Reuse models and honor redraw state instead of rebuilding per frame

## GPUVectorModel base[​](#gpuvectormodel-base "Direct link to GPUVectorModel base")

`Model` extends `GPUVectorModel`, owned and exported by `@luma.gl/engine`. Import GPUVectorModel, GPUVectorGeometry, and their batching helpers from engine; gpgpu/gpu-data provides the GPUData and GPUVector inputs. The base owns the shared rendering state, contiguous vector `setGPUVectors()` API, and aligned vector `drawBatches()` API. Vector byte offsets are preserved. `GPUVectorModel` supports shader assembly, uniforms, and resource bindings. `Model` also adapts `Geometry` and `GPUGeometry` inputs and manages material bindings and uniforms. Vector inputs supply formats, strides, and offsets for layout inference. Explicit layouts can describe packed groups and override inferred bindings. `BufferTransform` and `TextureTransform` use `GPUVectorModel` directly; `TableTransform` inherits that implementation through `BufferTransform`.

## GPU vector geometry and attributes[​](#gpu-vector-geometry-and-attributes "Direct link to GPU vector geometry and attributes")

`GPUVectorModel` accepts GPU vectors and constants. `GPUVectorGeometry` groups borrowed per-vertex columns, an optional contiguous `uint16` or `uint32` index vector (`uint8` on WebGL), and topology. CPU `Geometry` and buffer-based `GPUGeometry` inputs are accepted by `Model`.

```
import {GPUVectorGeometry, GPUVectorModel} from '@luma.gl/engine';



const model = new GPUVectorModel(device, {

  ...shaders,

  isInstanced: true,

  geometry: new GPUVectorGeometry({

    attributes: {positions, normals},

    indices,

    topology: 'triangle-list'

  }),

  attributeVectors: {instancePositions, colors}

});



model.setGeometryVectors({positions, normals});

model.setAttributeVectors({instancePositions, colors});
```

`setGeometry()` applies topology, geometry vectors, and indices together. The granular `setGeometryVectors()`, `setIndexVector()`, and `setTopology()` methods update them independently. `setAttributeVectors()` replaces supplemental attributes while preserving geometry. Supplemental vectors default to instance step mode on instanced models and vertex step mode otherwise. Constants broadcast without determining draw counts.

Both vector setters accept an optional second `bufferLayouts` argument. The `setGPUAttributes(columns, bufferLayouts)` method applies caller-resolved supplemental layouts, including packed buffers and mixed WebGPU vector/constant bindings. WebGL constants are converted to shader values; WebGPU constants use model-owned vertex buffers. All caller-supplied vectors and buffers remain borrowed.

Omit `bufferLayouts` to infer formats, strides, and offsets from the inputs:

```
model.setAttributeVectors({positions, colors, radius});
```

Within each vector input group, inferred constants share one model-owned, zero-stride vertex buffer on WebGPU. WebGL continues to use constant attribute values. Inferred vector views share one layout when every corresponding chunk uses the same buffer, stride, and relative attribute offsets within a row. This recognizes existing interleaved storage without copying it. Separate column allocations remain separate bindings; inference does not interleave or concatenate their data to fit device limits.

Explicit layouts and layouts carried by packed vectors remain authoritative and are not consolidated. Geometry and supplemental attribute groups are consolidated independently.

Geometry vectors must share logical length and chunk boundaries, as must supplemental attribute vectors. Non-instanced models require both groups to share their batch structure. `draw()` renders matching batches together for non-instanced models. Instanced models draw each geometry batch with each instance-stepped attribute batch. Supplemental vertex inputs share the geometry batch structure. Buffer layouts and model draw counts are restored after batched rendering. Indices remain a single contiguous stream shared by geometry batches.

`validateGPUVectorBatchStructure(vectors)`, exported from `@luma.gl/engine` and `@luma.gl/graph/gpu-data`, validates row counts, chunk counts, and per-chunk row counts. It accepts a named map or array of vectors, ignores constants and undefined entries, and neither modifies nor repacks input storage.

### Per-batch uniforms[​](#per-batch-uniforms "Direct link to Per-batch uniforms")

`drawBatches()` invokes `onBatch` before each aligned vector chunk. Set managed shader-input uniforms in the callback to supply batch-local state such as a picking row offset:

```
model.drawBatches(renderPass, {

  vectors: {positions, colors},

  onBatch: ({rowIndexOffset, rowCount}) => {

    model.shaderInputs.setProps({picking: {indexOffset: rowIndexOffset}});

  }

});
```

`rowIndexOffset` is cumulative within the supplied vectors; `rowCount` is the current chunk's length. Corresponding vectors must have equal lengths, chunk counts, and per-chunk row counts. This API does not pad, split, concatenate, or realign chunks. As with other `drawBatches()` inputs, configure matching model buffer layouts and initial attribute bindings first.

On WebGPU, the model reserves one buffer for all managed uniform blocks and batches in the call. Each batch binds a distinct `{buffer, offset, size}` range, aligned to the device's `minUniformBufferOffsetAlignment`. The model grows the allocation before drawing when needed, keeps it for reuse, and destroys it with the model. WebGL updates uniforms immediately.

**Slots are reused on every `drawBatches()` call.** Submit previous draws before another call changes their uniform values or requires a larger allocation:

```
const pass = encoder.beginRenderPass({framebuffer});

model.drawBatches(pass, {vectors, onBatch});

pass.end();

device.submit(encoder.finish());

// The model's batch slots can now be reused with different values.
```

This matches the proposed GPU layers' per-batch style-buffer pattern. It is not an immutable snapshot across multiple calls before submission. Keep the model alive while pending commands or reusable render bundles reference its buffers. Re-record or stop replaying bundles before changing the slots they reference. Explicit external buffer bindings remain caller-managed. The callback's shader-input values remain set after the call; temporary buffer bindings, attributes, and draw counts are restored, including when a callback throws.

## Usage[​](#usage "Direct link to Usage")

```
import {CubeGeometry, Model} from '@luma.gl/engine';

import {DynamicTexture} from '@luma.gl/core/dynamic';



const dynamicTexture = new DynamicTexture(device, {data: loadImageBitmap(url)});



const model = await Model.createAsync(device, {

  vs: GLSL_VERTEX_SHADER,

  fs: GLSL_FRAGMENT_SHADER,

  geometry: new CubeGeometry(),

  bindings: {

    uSampler: dynamicTexture

  }

});



const renderPass = device.beginRenderPass({framebuffer});

model.draw(renderPass);

renderPass.end();
```

## Types[​](#types "Direct link to Types")

### `ModelProps`[​](#modelprops "Direct link to modelprops")

| Property              | Type                                                                                     | Description                                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source?`             | `string`                                                                                 | Unified WGSL source that contains both stages.                                                                                                                                         |
| `vs?`                 | `string \| null`                                                                         | GLSL vertex shader source.                                                                                                                                                             |
| `fs?`                 | `string \| null`                                                                         | GLSL fragment shader source.                                                                                                                                                           |
| `modules?`            | `ShaderModule[]`                                                                         | Shader modules to assemble into the shader source.                                                                                                                                     |
| `defines?`            | `Record<string, boolean>`                                                                | Shader module defines.                                                                                                                                                                 |
| `plugins?`            | `ShaderPlugin[]`                                                                         | Reusable shader assembly plugins resolved for the active GLSL or WGSL backend. Plugin `vertexInputs` add shader-facing attributes; callers still own buffer layout and attribute data. |
| `shaderInputs?`       | `ShaderInputs`                                                                           | Pre-created shader input manager.                                                                                                                                                      |
| `bindings?`           | `Record<string, Binding \| DynamicBuffer \| DynamicBufferRange \| TextureBindingSource>` | Textures, samplers, uniform buffers, dynamic buffers, and texture binding sources such as `DynamicTexture` and `VideoTexture`.                                                         |
| `parameters?`         | `RenderPipelineParameters`                                                               | Pipeline parameters baked into the model's pipeline.                                                                                                                                   |
| `geometry?`           | `GPUVectorGeometry \| Geometry \| GPUGeometry \| null`                                   | Geometry source for attributes and indices.                                                                                                                                            |
| `isInstanced?`        | `boolean`                                                                                | Optional override for instancing.                                                                                                                                                      |
| `instanceCount?`      | `number`                                                                                 | Number of instances to draw.                                                                                                                                                           |
| `vertexCount?`        | `number`                                                                                 | Number of vertices to draw. For indexed models, this is used as the index count when `indexCount` is not provided, including an explicit value of `0`.                                 |
| `indexBuffer?`        | `Buffer \| DynamicBuffer \| null`                                                        | Optional index buffer.                                                                                                                                                                 |
| `indexCount?`         | `number`                                                                                 | Number of indices to draw. Takes precedence over `vertexCount`; if neither is provided, the full index buffer is drawn.                                                                |
| `attributes?`         | `Record<string, Buffer \| DynamicBuffer>`                                                | Buffer-valued attributes.                                                                                                                                                              |
| `constantAttributes?` | `Record<string, TypedArray>`                                                             | Constant attributes, primarily for WebGL.                                                                                                                                              |
| `disableWarnings?`    | `boolean`                                                                                | Suppress warnings for unused attributes and bindings.                                                                                                                                  |
| `varyings?`           | `string[]`                                                                               | WebGL transform-feedback varyings.                                                                                                                                                     |
| `transformFeedback?`  | `TransformFeedback`                                                                      | Optional transform feedback object.                                                                                                                                                    |
| `debugShaders?`       | `'never' \| 'errors' \| 'warnings' \| 'always'`                                          | Debug shader output policy.                                                                                                                                                            |
| `pipelineFactory?`    | `PipelineFactory`                                                                        | Factory from `@luma.gl/core` used to create cached pipelines.                                                                                                                          |
| `shaderFactory?`      | `ShaderFactory`                                                                          | Factory from `@luma.gl/core` used to create cached shaders.                                                                                                                            |
| `shaderAssembler?`    | `ShaderAssembler`                                                                        | Shader assembler override.                                                                                                                                                             |

`ModelProps` also includes the standard [`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md), except that `bindings`, `vs`, and `fs` are specialized for engine usage.

## Properties[​](#properties "Direct link to Properties")

### `id`, `device`[​](#id-device "Direct link to id-device")

Application-provided identifier and owning device.

### `source`, `vs`, `fs`[​](#source-vs-fs "Direct link to source-vs-fs")

The assembled WGSL source or the GLSL stage sources used to create the current pipeline.

### `pipelineFactory`, `shaderFactory`[​](#pipelinefactory-shaderfactory "Direct link to pipelinefactory-shaderfactory")

Factories from `@luma.gl/core` used to reuse cached pipelines and shaders.

### `parameters`, `topology`, `bufferLayout`[​](#parameters-topology-bufferlayout "Direct link to parameters-topology-bufferlayout")

Current pipeline parameters and geometry layout.

### `isInstanced`, `instanceCount`, `vertexCount`[​](#isinstanced-instancecount-vertexcount "Direct link to isinstanced-instancecount-vertexcount")

Draw-count state for the model.

### `indexBuffer`, `bufferAttributes`, `constantAttributes`[​](#indexbuffer-bufferattributes-constantattributes "Direct link to indexbuffer-bufferattributes-constantattributes")

Attribute and index data currently bound to the model.

### `bindings`[​](#bindings "Direct link to bindings")

Current binding map, including `DynamicBuffer` instances that may replace their backing buffer and `TextureBindingSource` instances such as `DynamicTexture` and `VideoTexture` that resolve to concrete texture bindings during draw preparation.

### `vertexArray`[​](#vertexarray "Direct link to vertexarray")

Underlying vertex array object used to track attribute bindings.

### `transformFeedback`[​](#transformfeedback "Direct link to transformfeedback")

Optional WebGL transform-feedback object.

### `pipeline`[​](#pipeline "Direct link to pipeline")

Current render pipeline.

### `shaderInputs`[​](#shaderinputs "Direct link to shaderinputs")

Active `ShaderInputs` manager.

### `userData`[​](#userdata "Direct link to userdata")

Application-owned metadata attached to the model.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: ModelProps)`[​](#constructordevice-device-props-modelprops "Direct link to constructordevice-device-props-modelprops")

Creates a render model for one device.

### `Model.createAsync(device: Device, props: ModelProps): Promise<Model>`[​](#modelcreateasyncdevice-device-props-modelprops-promisemodel "Direct link to modelcreateasyncdevice-device-props-modelprops-promisemodel")

Creates the model through the device's asynchronous render-pipeline path and resolves after its pipeline and vertex array are ready. Prefer it during WebGPU loading when multiple independent models can be created with `Promise.all()`. The `new Model(...)` constructor remains the synchronous compatibility path.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Releases cached pipeline and shader references and destroys the internal uniform store.

### `needsRedraw(): false | string`[​](#needsredraw-false--string "Direct link to needsredraw-false--string")

Returns the current redraw reason and clears the internal redraw flag.

### `setNeedsRedraw(reason: string): void`[​](#setneedsredrawreason-string-void "Direct link to setneedsredrawreason-string-void")

Marks the model as needing redraw.

### `predraw(commandEncoder: CommandEncoder): void`[​](#predrawcommandencoder-commandencoder-void "Direct link to predrawcommandencoder-commandencoder-void")

Updates shader inputs and rebuilds the pipeline if necessary, encoding any managed uniform uploads onto the supplied command encoder before the render pass begins.

### `draw(renderPass: RenderPass, options?: ModelDrawOptions): boolean`[​](#drawrenderpass-renderpass-options-modeldrawoptions-boolean "Direct link to drawrenderpass-renderpass-options-modeldrawoptions-boolean")

Draws once into the supplied render pass. The model selects its pipeline, bindings, and vertex array on that pass before issuing the draw. Returns `false` when required resources, such as unresolved texture binding sources, are not ready yet.

`options.parameters` accepts `viewport`, `scissorRect` (or `null` to disable scissoring), `blendConstant`, and `stencilReference`. Supplied values override pass state only for this draw, including all internal vector batches. Omitted fields inherit the current pass state. Prior values are restored even if drawing throws or resources are not ready. Model defaults and pipeline parameters are unchanged. `Model` inherits this API from `GPUVectorModel`.

```
model.draw(renderPass, {

  parameters: {blendConstant: [0.5, 0.5, 0.5, 1], stencilReference: 3}

});
```

Dynamic overrides cannot be recorded into a render bundle. Set them on the executing render pass instead. Native-handle parameter mutations bypass luma's state tracking.

### `setGeometry(geometry: GPUVectorGeometry | Geometry | GPUGeometry | null): void`[​](#setgeometrygeometry-gpuvectorgeometry--geometry--gpugeometry--null-void "Direct link to setgeometrygeometry-gpuvectorgeometry--geometry--gpugeometry--null-void")

Replaces the geometry source.

### `setTopology(topology: PrimitiveTopology): void`[​](#settopologytopology-primitivetopology-void "Direct link to settopologytopology-primitivetopology-void")

Updates the primitive topology.

### `setBufferLayout(bufferLayout: BufferLayout[]): void`[​](#setbufferlayoutbufferlayout-bufferlayout-void "Direct link to setbufferlayoutbufferlayout-bufferlayout-void")

Replaces the buffer layout and marks the pipeline dirty.

### `setParameters(parameters: RenderPipelineParameters): void`[​](#setparametersparameters-renderpipelineparameters-void "Direct link to setparametersparameters-renderpipelineparameters-void")

Updates pipeline parameters. On WebGPU, where parameters are part of the render pipeline, this marks the pipeline dirty when the parameters change. On WebGL the model keeps its pipeline and passes its parameters to each draw call, so `model.pipeline.props.parameters` keeps the parameters the retained pipeline was created with.

### `setInstanceCount(instanceCount: number): void`[​](#setinstancecountinstancecount-number-void "Direct link to setinstancecountinstancecount-number-void")

Updates the instance count.

### `setVertexCount(vertexCount: number): void`[​](#setvertexcountvertexcount-number-void "Direct link to setvertexcountvertexcount-number-void")

Updates the vertex count. For indexed models without an explicit index count, this also limits the number of indices drawn.

### `setIndexCount(indexCount: number | undefined): void`[​](#setindexcountindexcount-number--undefined-void "Direct link to setindexcountindexcount-number--undefined-void")

Updates the indexed draw count. An explicit index count takes precedence over the vertex count.

### `setShaderInputs(shaderInputs: ShaderInputs): void`[​](#setshaderinputsshaderinputs-shaderinputs-void "Direct link to setshaderinputsshaderinputs-shaderinputs-void")

Replaces the current `ShaderInputs` instance.

### `updateShaderInputs(commandEncoder?: CommandEncoder): void`[​](#updateshaderinputscommandencoder-commandencoder-void "Direct link to updateshaderinputscommandencoder-commandencoder-void")

Flushes current `ShaderInputs` values into the model's internal uniform store and bindings. On WebGPU, pass the same `CommandEncoder` that will later open the render pass when uploads must be ordered with subsequent draws.

### `setBindings(bindings: Record<string, Binding | DynamicBuffer | DynamicBufferRange | TextureBindingSource>): void`[​](#setbindingsbindings-recordstring-binding--dynamicbuffer--dynamicbufferrange--texturebindingsource-void "Direct link to setbindingsbindings-recordstring-binding--dynamicbuffer--dynamicbufferrange--texturebindingsource-void")

Sets textures, samplers, uniform buffers, dynamic buffers, and texture binding sources.

### `setTransformFeedback(transformFeedback: TransformFeedback | null): void`[​](#settransformfeedbacktransformfeedback-transformfeedback--null-void "Direct link to settransformfeedbacktransformfeedback-transformfeedback--null-void")

Attaches or removes a transform-feedback object.

### `setIndexBuffer(indexBuffer: Buffer | DynamicBuffer | null): void`[​](#setindexbufferindexbuffer-buffer--dynamicbuffer--null-void "Direct link to setindexbufferindexbuffer-buffer--dynamicbuffer--null-void")

Replaces the index buffer.

### `setAttributes(buffers: Record<string, Buffer | DynamicBuffer>, options?): void`[​](#setattributesbuffers-recordstring-buffer--dynamicbuffer-options-void "Direct link to setattributesbuffers-recordstring-buffer--dynamicbuffer-options-void")

Sets buffer-valued attributes.

* `options.disableWarnings` suppresses warnings for buffers without a matching layout or attribute.
* `options.byteOffsets` maps buffer names to the byte offset where their vertex data starts. Buffers without an entry are bound at offset `0`. Use this for views into a shared buffer; the buffer layout and render pipeline do not change.

### `setConstantAttributes(attributes: Record<string, TypedArray>, options?): void`[​](#setconstantattributesattributes-recordstring-typedarray-options-void "Direct link to setconstantattributesattributes-recordstring-typedarray-options-void")

Sets constant-valued attributes.

## Remarks[​](#remarks "Direct link to Remarks")

* `Model` integrates with [`ShaderInputs`](https://luma.gl/next/docs/api-reference/engine/shader-inputs.md), [`PipelineFactory`](https://luma.gl/next/docs/api-reference/core/pipeline-factory.md), and [`ShaderFactory`](https://luma.gl/next/docs/api-reference/core/shader-factory.md) by default.
* `DynamicBuffer` attributes, index buffers, and bindings are resolved before drawing so resized buffers are rebound automatically.
* `DynamicTexture` and `VideoTexture` bindings are supported directly. `Model.draw()` defers rendering until texture binding sources are ready.

### Draw count inference and independent lengths[​](#draw-count-inference-and-independent-lengths "Direct link to Draw count inference and independent lengths")

`inferDrawCount` accepts `'instance'`, `'vertex'`, or `'no'` and defaults to `'no'`. It selects the count updated from vector lengths (or each batch's row count), preserving the other count. `'no'` preserves both caller-supplied counts.

`enforceMatchingVectorLengths` defaults to `true`. Set it to `false` together with `inferDrawCount: 'no'` to bind attributes with independent lengths and single physical chunks. Layout and buffer validation still apply. `drawBatches()` always requires matching lengths and chunk boundaries.
