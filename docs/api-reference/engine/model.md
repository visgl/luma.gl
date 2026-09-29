import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# Model

<EngineDocsTabs group="model" active="model" />

`Model` is the main engine-level rendering class in luma.gl.
It assembles shaders, manages geometry and bindings, reuses immutable cached
pipelines, and applies its dynamic draw state to a
[`RenderPass`](/docs/api-reference/core/resources/render-pass).

<DocumentationContract title="Model" rows={[
  {label: 'Role', value: 'Connect shaders, inputs, geometry, pipelines, and draw state'},
  {label: 'Construction', value: 'Device plus ModelProps'},
  {label: 'Updates', value: 'Update inputs, bindings, attributes, counts, or pipeline-defining props'},
  {label: 'Ownership', value: 'Owns internal pipelines; caller retains explicitly supplied resources'},
  {label: 'Portability', value: 'Provide WGSL and GLSL for WebGPU and WebGL portability'},
  {label: 'Performance', value: 'Reuse models and honor redraw state instead of rebuilding per frame'}
]} />

## Usage

```typescript
import {CubeGeometry, DynamicTexture, Model} from '@luma.gl/engine';

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

## Types

### `ModelProps`

| Property | Type | Description |
| --- | --- | --- |
| `source?` | `string` | Unified WGSL source that contains both stages. |
| `vs?` | `string \| null` | GLSL vertex shader source. |
| `fs?` | `string \| null` | GLSL fragment shader source. |
| `modules?` | `ShaderModule[]` | Shader modules to assemble into the shader source. |
| `defines?` | `Record<string, boolean>` | Shader module defines. |
| `plugins?` | `ShaderPlugin[]` | Reusable shader assembly plugins resolved for the active GLSL or WGSL backend. Plugin `vertexInputs` add shader-facing attributes; callers still own buffer layout and attribute data. |
| `shaderInputs?` | `ShaderInputs` | Pre-created shader input manager. |
| `bindings?` | `Record<string, Binding \| DynamicBuffer \| DynamicBufferRange \| TextureBindingSource>` | Textures, samplers, uniform buffers, dynamic buffers, and texture binding sources such as `DynamicTexture` and `VideoTexture`. |
| `parameters?` | `RenderPipelineParameters` | Pipeline parameters baked into the model's pipeline. |
| `geometry?` | `Geometry \| GPUGeometry \| null` | Geometry source for attributes and indices. |
| `isInstanced?` | `boolean` | Optional override for instancing. |
| `instanceCount?` | `number` | Number of instances to draw. |
| `vertexCount?` | `number` | Number of vertices to draw. For indexed models, this is used as the index count when `indexCount` is not provided, including an explicit value of `0`. |
| `indexBuffer?` | `Buffer \| DynamicBuffer \| null` | Optional index buffer. |
| `indexCount?` | `number` | Number of indices to draw. Takes precedence over `vertexCount`; if neither is provided, the full index buffer is drawn. |
| `indirectBuffer?` | `Buffer \| null` | WebGPU only. Indirect draw record whose `instanceCount` is written on the GPU. See [`setIndirectBuffer()`](#setindirectbufferindirectbuffer-buffer--null-indirectoffset-number-void). |
| `indirectOffset?` | `number` | Byte offset of the indirect draw record in `indirectBuffer`. Defaults to `0`. |
| `attributes?` | `Record<string, Buffer \| DynamicBuffer>` | Buffer-valued attributes. |
| `constantAttributes?` | `Record<string, TypedArray>` | Constant attributes, primarily for WebGL. |
| `disableWarnings?` | `boolean` | Suppress warnings for unused attributes and bindings. |
| `varyings?` | `string[]` | WebGL transform-feedback varyings. |
| `transformFeedback?` | `TransformFeedback` | Optional transform feedback object. |
| `debugShaders?` | `'never' \| 'errors' \| 'warnings' \| 'always'` | Debug shader output policy. |
| `pipelineFactory?` | `PipelineFactory` | Factory from `@luma.gl/core` used to create cached pipelines. |
| `shaderFactory?` | `ShaderFactory` | Factory from `@luma.gl/core` used to create cached shaders. |
| `shaderAssembler?` | `ShaderAssembler` | Shader assembler override. |

`ModelProps` also includes the standard [`RenderPipelineProps`](/docs/api-reference/core/resources/render-pipeline), except that `bindings`, `vs`, and `fs` are specialized for engine usage.

## Properties

### `id`, `device`

Application-provided identifier and owning device.

### `source`, `vs`, `fs`

The assembled WGSL source or the GLSL stage sources used to create the current pipeline.

### `pipelineFactory`, `shaderFactory`

Factories from `@luma.gl/core` used to reuse cached pipelines and shaders.

### `parameters`, `topology`, `bufferLayout`

Current pipeline parameters and geometry layout.

### `isInstanced`, `instanceCount`, `vertexCount`

Draw-count state for the model.

### `indirectBuffer`, `indirectOffset`

WebGPU indirect draw record that supplies a GPU-resident instance count, or `null` when the model draws `instanceCount`.

### `indexBuffer`, `bufferAttributes`, `constantAttributes`

Attribute and index data currently bound to the model.

### `bindings`

Current binding map, including `DynamicBuffer` instances that may replace their backing buffer and `TextureBindingSource` instances such as `DynamicTexture` and `VideoTexture` that resolve to concrete texture bindings during draw preparation.

### `vertexArray`

Underlying vertex array object used to track attribute bindings.

### `transformFeedback`

Optional WebGL transform-feedback object.

### `pipeline`

Current render pipeline.

### `shaderInputs`

Active `ShaderInputs` manager.

### `userData`

Application-owned metadata attached to the model.

## Methods

### `constructor(device: Device, props: ModelProps)`

Creates a render model for one device.

### `Model.createAsync(device: Device, props: ModelProps): Promise<Model>`

Creates the model through the device's asynchronous render-pipeline path and resolves after its
pipeline and vertex array are ready. Prefer it during WebGPU loading when multiple independent models
can be created with `Promise.all()`. The `new Model(...)` constructor remains the synchronous
compatibility path.

### `destroy(): void`

Releases cached pipeline and shader references and destroys the internal uniform store.

### `needsRedraw(): false | string`

Returns the current redraw reason and clears the internal redraw flag.

### `setNeedsRedraw(reason: string): void`

Marks the model as needing redraw.

### `predraw(commandEncoder: CommandEncoder): void`

Updates shader inputs and rebuilds the pipeline if necessary, encoding any managed uniform uploads onto the supplied command encoder before the render pass begins.

### `draw(renderPass: RenderPass): boolean`

Draws once into the supplied render pass. The model selects its pipeline,
bindings, and vertex array on that pass before issuing the draw. Returns
`false` when required resources, such as unresolved texture binding sources,
are not ready yet.

### `setGeometry(geometry: Geometry | GPUGeometry | null): void`

Replaces the geometry source.

### `setTopology(topology: PrimitiveTopology): void`

Updates the primitive topology.

### `setBufferLayout(bufferLayout: BufferLayout[]): void`

Replaces the buffer layout and marks the pipeline dirty.

### `setParameters(parameters: RenderPipelineParameters): void`

Updates pipeline parameters and marks the pipeline dirty when needed.

### `setInstanceCount(instanceCount: number): void`

Updates the instance count.

### `setVertexCount(vertexCount: number): void`

Updates the vertex count. For indexed models without an explicit index count, this also limits the number of indices drawn.

### `setIndexCount(indexCount: number | undefined): void`

Updates the indexed draw count. An explicit index count takes precedence over the vertex count.

### `setIndirectBuffer(indirectBuffer: Buffer | null, indirectOffset?: number): void`

Draws with an instance count that lives in GPU memory, for example the number of rows that
survived a GPU filter or compaction pass, without reading it back to the CPU. While set,
`draw()` records `renderPass.drawIndirect()`, or `drawIndexedIndirect()` when the model has an
index buffer, instead of a direct draw with `instanceCount`. A CPU `instanceCount` of `0` does not
skip the draw. Pass `null` to return to `instanceCount`.

`indirectBuffer` holds one WebGPU indirect draw record at `indirectOffset` (a multiple of 4):

| Draw | Record (`uint32` words) | Bytes |
| --- | --- | --- |
| non-indexed | `vertexCount, instanceCount, firstVertex, firstInstance` | 16 |
| indexed | `indexCount, instanceCount, firstIndex, baseVertex, firstInstance` | 20 |

The model and the application split ownership of the record:

- The model writes every word except `instanceCount` from its own vertex or index count and
  draw offsets (`baseVertex` and `firstInstance` are `0`). It rewrites them when they change, with
  queue writes that are legal while a render pass is open, so callers never need to know the
  model's geometry.
- The application owns the `instanceCount` word at byte `indirectOffset + 4`. It must be written
  before the render pass begins, typically by the compute pass that produced it or by a
  `copyBufferToBuffer()` encoded after that pass. Buffer copies cannot be encoded inside a render
  pass, which is why the model does not copy the count itself.

The buffer needs `Buffer.INDIRECT | Buffer.COPY_DST` usage (add `Buffer.STORAGE` if a shader
writes the count directly). A [`DrawCommandBuffer`](/docs/api-reference/experimental/gpu-core/draw-command-buffer)
from `@luma.gl/gpgpu` is compatible: pass `drawCommands.buffer` and
`drawCommands.getCommandByteOffset(index)`. Use one record per model; models that share a record
would overwrite each other's geometry words.

```ts
const drawRecord = device.createBuffer({
  byteLength: 20,
  usage: Buffer.INDIRECT | Buffer.COPY_DST
});
model.setIndirectBuffer(drawRecord);

// Before the render pass: publish the GPU-resident count (a single u32) into the record.
runCompaction(device.commandEncoder); // writes selectedCount on the GPU
device.commandEncoder.copyBufferToBuffer({
  sourceBuffer: selectedCount,
  destinationBuffer: drawRecord,
  destinationOffset: 4,
  size: 4
});

const renderPass = device.beginRenderPass({});
model.draw(renderPass); // drawIndirect / drawIndexedIndirect
renderPass.end();
```

Throws on WebGL, which has no indirect draws, rather than drawing a stale CPU count. Because the
count changes on the GPU, call `setNeedsRedraw()` when a new count is published.

### `setShaderInputs(shaderInputs: ShaderInputs): void`

Replaces the current `ShaderInputs` instance.

### `updateShaderInputs(commandEncoder?: CommandEncoder): void`

Flushes current `ShaderInputs` values into the model's internal uniform store and bindings. On WebGPU, pass the same `CommandEncoder` that will later open the render pass when uploads must be ordered with subsequent draws.

### `setBindings(bindings: Record<string, Binding | DynamicBuffer | DynamicBufferRange | TextureBindingSource>): void`

Sets textures, samplers, uniform buffers, dynamic buffers, and texture binding sources.

### `setTransformFeedback(transformFeedback: TransformFeedback | null): void`

Attaches or removes a transform-feedback object.

### `setIndexBuffer(indexBuffer: Buffer | DynamicBuffer | null): void`

Replaces the index buffer.

### `setAttributes(buffers: Record<string, Buffer | DynamicBuffer>, options?): void`

Sets buffer-valued attributes.

### `setConstantAttributes(attributes: Record<string, TypedArray>, options?): void`

Sets constant-valued attributes.

## Remarks

- `Model` integrates with [`ShaderInputs`](/docs/api-reference/engine/shader-inputs), [`PipelineFactory`](/docs/api-reference/core/pipeline-factory), and [`ShaderFactory`](/docs/api-reference/core/shader-factory) by default.
- `DynamicBuffer` attributes, index buffers, and bindings are resolved before drawing so resized buffers are rebound automatically.
- `DynamicTexture` and `VideoTexture` bindings are supported directly. `Model.draw()` defers rendering until texture binding sources are ready.
