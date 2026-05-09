# Model

`Model` is the main engine-level rendering class in luma.gl.
It assembles shaders, manages geometry and bindings, reuses cached pipelines, and issues draw calls through a [`RenderPass`](/docs/api-reference/core/resources/render-pass).

## Usage

```typescript
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

## Types

### `ModelProps`

| Property | Type | Description |
| --- | --- | --- |
| `source?` | `string` | Unified WGSL source that contains both stages. |
| `vs?` | `string \| null` | GLSL vertex shader source. |
| `fs?` | `string \| null` | GLSL fragment shader source. |
| `modules?` | `ShaderModule[]` | Shader modules to assemble into the shader source. |
| `defines?` | `Record<string, boolean>` | Shader module defines. |
| `shaderInputs?` | `ShaderInputs` | Pre-created shader input manager. |
| `bindings?` | `Record<string, Binding \| DynamicTexture>` | Textures, samplers, uniform buffers, and dynamic textures. |
| `parameters?` | `RenderPipelineParameters` | Pipeline parameters baked into the model's pipeline. |
| `geometry?` | `Geometry \| GPUGeometry \| null` | Geometry source for attributes and indices. |
| `isInstanced?` | `boolean` | Optional override for instancing. |
| `instanceCount?` | `number` | Number of instances to draw. |
| `vertexCount?` | `number` | Number of vertices to draw. |
| `indexBuffer?` | `Buffer \| null` | Optional index buffer. |
| `attributes?` | `Record<string, Buffer>` | Buffer-valued attributes. |
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

### `indexBuffer`, `bufferAttributes`, `constantAttributes`

Attribute and index data currently bound to the model.

### `bindings`

Current binding map, including `DynamicTexture` instances that have not yet resolved to concrete textures.

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

### `destroy(): void`

Releases cached pipeline and shader references and destroys the internal uniform store.

### `needsRedraw(): false | string`

Returns the current redraw reason and clears the internal redraw flag.

### `setNeedsRedraw(reason: string): void`

Marks the model as needing redraw.

### `predraw(commandEncoder: CommandEncoder): void`

Updates shader inputs and rebuilds the pipeline if necessary, encoding any managed uniform uploads onto the supplied command encoder before the render pass begins.

### `draw(renderPass: RenderPass): boolean`

Draws once into the supplied render pass. Returns `false` when required resources, such as unresolved `DynamicTexture` bindings, are not ready yet.

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

Updates the vertex count.

### `setShaderInputs(shaderInputs: ShaderInputs): void`

Replaces the current `ShaderInputs` instance.

### `updateShaderInputs(commandEncoder?: CommandEncoder): void`

Flushes current `ShaderInputs` values into the model's internal uniform store and bindings. On WebGPU, pass the same `CommandEncoder` that will later open the render pass when uploads must be ordered with subsequent draws.

### `setBindings(bindings: Record<string, Binding | DynamicTexture>): void`

Sets textures, samplers, uniform buffers, and dynamic textures.

### `setTransformFeedback(transformFeedback: TransformFeedback | null): void`

Attaches or removes a transform-feedback object.

### `setIndexBuffer(indexBuffer: Buffer | null): void`

Replaces the index buffer.

### `setAttributes(buffers: Record<string, Buffer>, options?): void`

Sets buffer-valued attributes.

### `setConstantAttributes(attributes: Record<string, TypedArray>, options?): void`

Sets constant-valued attributes.

## Remarks

- `Model` integrates with [`ShaderInputs`](/docs/api-reference/engine/shader-inputs), [`PipelineFactory`](/docs/api-reference/core/pipeline-factory), and [`ShaderFactory`](/docs/api-reference/core/shader-factory) by default.
- `DynamicTexture` bindings are supported directly. `Model.draw()` defers rendering until those textures are ready.
