# Model

[Model](https://luma.gl/next/docs/api-reference/engine/model.md)[Shader Inputs](https://luma.gl/next/docs/api-guide/engine/shader-inputs.md)[ShaderInputs](https://luma.gl/next/docs/api-reference/engine/shader-inputs.md)[Materials](https://luma.gl/next/docs/api-guide/engine/materials.md)

`Model` is the main engine-level rendering class in luma.gl. It assembles shaders, manages geometry and bindings, reuses immutable cached pipelines, and applies its dynamic draw state to a [`RenderPass`](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md).

## Usage[​](#usage "Direct link to Usage")

```
import {CubeGeometry, DynamicTexture, Model} from '@luma.gl/engine';

const dynamicTexture = new DynamicTexture(device, {data: loadImageBitmap(url)});

const model = new Model(device, {
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
| `geometry?`           | `Geometry \| GPUGeometry \| null`                                                        | Geometry source for attributes and indices.                                                                                                                                            |
| `isInstanced?`        | `boolean`                                                                                | Optional override for instancing.                                                                                                                                                      |
| `instanceCount?`      | `number`                                                                                 | Number of instances to draw.                                                                                                                                                           |
| `vertexCount?`        | `number`                                                                                 | Number of vertices to draw.                                                                                                                                                            |
| `indexBuffer?`        | `Buffer \| DynamicBuffer \| null`                                                        | Optional index buffer.                                                                                                                                                                 |
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

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Releases cached pipeline and shader references and destroys the internal uniform store.

### `needsRedraw(): false | string`[​](#needsredraw-false--string "Direct link to needsredraw-false--string")

Returns the current redraw reason and clears the internal redraw flag.

### `setNeedsRedraw(reason: string): void`[​](#setneedsredrawreason-string-void "Direct link to setneedsredrawreason-string-void")

Marks the model as needing redraw.

### `predraw(commandEncoder: CommandEncoder): void`[​](#predrawcommandencoder-commandencoder-void "Direct link to predrawcommandencoder-commandencoder-void")

Updates shader inputs and rebuilds the pipeline if necessary, encoding any managed uniform uploads onto the supplied command encoder before the render pass begins.

### `draw(renderPass: RenderPass): boolean`[​](#drawrenderpass-renderpass-boolean "Direct link to drawrenderpass-renderpass-boolean")

Draws once into the supplied render pass. The model selects its pipeline, bindings, and vertex array on that pass before issuing the draw. Returns `false` when required resources, such as unresolved texture binding sources, are not ready yet.

### `setGeometry(geometry: Geometry | GPUGeometry | null): void`[​](#setgeometrygeometry-geometry--gpugeometry--null-void "Direct link to setgeometrygeometry-geometry--gpugeometry--null-void")

Replaces the geometry source.

### `setTopology(topology: PrimitiveTopology): void`[​](#settopologytopology-primitivetopology-void "Direct link to settopologytopology-primitivetopology-void")

Updates the primitive topology.

### `setBufferLayout(bufferLayout: BufferLayout[]): void`[​](#setbufferlayoutbufferlayout-bufferlayout-void "Direct link to setbufferlayoutbufferlayout-bufferlayout-void")

Replaces the buffer layout and marks the pipeline dirty.

### `setParameters(parameters: RenderPipelineParameters): void`[​](#setparametersparameters-renderpipelineparameters-void "Direct link to setparametersparameters-renderpipelineparameters-void")

Updates pipeline parameters and marks the pipeline dirty when needed.

### `setInstanceCount(instanceCount: number): void`[​](#setinstancecountinstancecount-number-void "Direct link to setinstancecountinstancecount-number-void")

Updates the instance count.

### `setVertexCount(vertexCount: number): void`[​](#setvertexcountvertexcount-number-void "Direct link to setvertexcountvertexcount-number-void")

Updates the vertex count.

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

### `setConstantAttributes(attributes: Record<string, TypedArray>, options?): void`[​](#setconstantattributesattributes-recordstring-typedarray-options-void "Direct link to setconstantattributesattributes-recordstring-typedarray-options-void")

Sets constant-valued attributes.

## Remarks[​](#remarks "Direct link to Remarks")

* `Model` integrates with [`ShaderInputs`](https://luma.gl/next/docs/api-reference/engine/shader-inputs.md), [`PipelineFactory`](https://luma.gl/next/docs/api-reference/core/pipeline-factory.md), and [`ShaderFactory`](https://luma.gl/next/docs/api-reference/core/shader-factory.md) by default.
* `DynamicBuffer` attributes, index buffers, and bindings are resolved before drawing so resized buffers are rebound automatically.
* `DynamicTexture` and `VideoTexture` bindings are supported directly. `Model.draw()` defers rendering until texture binding sources are ready.
