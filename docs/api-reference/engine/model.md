# Model

The `Model` class is the centerpiece of the luma.gl API. It brings together all GPU functionality needed to run shaders and perform draw calls, in a single, easy-to-use interface.

`Model` manages the following responsibilities:

- **Render pipeline creation and reuse** – builds GPU pipelines and recreates them when render state changes.
- **Attributes** – manages vertex attributes and can create buffers from typed arrays.
- **Bindings** – handles textures, samplers and uniform buffers.
- **Uniforms** – supports typed uniform buffers.
- **Async texture handling** – accepts `DynamicTexture` bindings and defers rendering until textures have loaded.
- **Shader module injection** – assembles GLSL or WGSL shaders from modules.
- **Debugging** – detailed draw call logging and optional shader source display.

The `Model` class integrates:

- The `@luma.gl/shadertools` shader module system: [see `Shader Assembly`](/docs/api-reference/shadertools/shader-assembler).
- `ShaderInputs` for uniform and binding management.
- The geometry helpers – accepts a [`Geometry`](/docs/api-reference/engine/geometry) instance (or mesh) plus any additional attributes for instanced rendering.

## Usage

```typescript
import {Model} from `@luma.gl/engine`;
```

One of the simplest way to provide attribute data is by using a Geometry object.

Create model object by passing shaders, uniforms, geometry and render it by passing updated uniforms.

```typescript
import {Model, CubeGeometry} from `@luma.gl/engine`;

const model = new Model(device, {
  source: WGSL_SHADER,
  vs: GLSL_VERTEX_SHADER,
  fs: GLSL_FRAGMENT_SHADER,
  geometry: new CubeGeometry(),
  bindings: {
    uSampler: texture
  },
})
```

### Provide attribute data using Buffer

When using `Buffer` objects, data remains on GPU and same `Buffer` object can be shared between multiple models.

```typescript
// construct the model.
const model = new Model(device, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  topology: 'triangle-list',
  vertexCount: 3,
  attributes: {
    attributeName1: bufferObject,
    attributeName2: device.createBuffer(new Float32Array(...))
  },
  bindings: {uSampler: texture},
})
```

On each frame, update any uniform buffers or bindings and issue a draw call:

```ts
model.setBindings({uSampler: texture});
model.draw(renderPass);
```

Debug shader source (even when shader successful)

```ts
// construct the model.
const model = new Model(device, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  debugShaders: 'always'
});
```

### Instanced rendering

```ts
model.setInstanceCount(numInstances);
model.draw(renderPass);
```

### Async textures

```ts
const texture = new AsyncTexture(device, {url});
const model = new Model(device, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  geometry: new CubeGeometry(),
  bindings: {uSampler: texture}
});
```

## Types

### `ModelProps`

| Property | Type | Description |
| --- | --- | --- |
| `source` | `string` | WGSL source code containing both vertex and fragment stages. |
| `vs?` | `string` | GLSL vertex shader source. |
| `fs?` | `string` | GLSL fragment shader source. |
| `modules` | `ShaderModule[]` | Shader modules to apply. |
| `defines` | `Record<string, boolean>` | Module defines passed to shader assembler. |
| `shaderInputs?` | `ShaderInputs` | Pre-created uniform/binding store. |
| `bindings?` | `Record<string, Binding | AsyncTexture>` | Textures, samplers and uniform buffers. |
| `parameters?` | `RenderPipelineParameters` | Pipeline parameters baked into the pipeline. |
| `geometry?` | `Geometry` | Geometry or mesh providing attributes and indices. |
| `isInstanced?` | `boolean` | Use instanced rendering (auto-detected). |
| `instanceCount?` | `number` | Number of instances to render. |
| `vertexCount?` | `number` | Number of vertices to render. |
| `indexBuffer?` | `Buffer` | Index buffer for indexed rendering. |
| `attributes?` | `Record<string, Buffer>` | Buffer-valued attributes. |
| `constantAttributes?` | `Record<string, TypedArray>` | Constant attributes (WebGL only). |
| `disableWarnings?` | `boolean` | Suppress warnings for unused attributes or bindings. |
| `varyings?` | `string[]` | WebGL transform feedback varyings. |
| `transformFeedback?` | `TransformFeedback` | WebGL transform feedback object. |
| `debugShaders?` | `'never' | 'errors' | 'warnings' | 'always'` | Display shader sources for debugging. |
| `pipelineFactory?` | `PipelineFactory` | Factory used to create `RenderPipeline` instances. |
| `shaderFactory?` | `ShaderFactory` | Factory used to create `Shader` instances. |
| `shaderAssembler?` | `ShaderAssembler` | Assembles GLSL or WGSL from modules. |

`ModelProps` also include [`RenderPipelineProps`](/docs/api-reference/core/resources/render-pipeline) such as `id`, `shaderLayout`, `bufferLayout`, `topology` and `userData`.

## Properties

### `id: string`
Model identifier.

### `device: Device`
Device that created this model.

### `parameters: RenderPipelineParameters`
Pipeline parameters such as blending and depth testing.

### `topology: PrimitiveTopology`
Primitive topology used when drawing.

### `bufferLayout: BufferLayout[]`
Vertex buffer layout.

### `isInstanced: boolean | undefined`
Whether instanced rendering is enabled.

### `instanceCount: number`
Number of instances to draw.

### `vertexCount: number`
Number of vertices to draw.

### `indexBuffer: Buffer | null`
Index buffer used for indexed drawing.

### `bindings: Record<string, Binding | AsyncTexture>`
Currently bound textures, samplers and uniform buffers.

### `vertexArray: VertexArray`
Vertex array object tracking attribute bindings.

### `transformFeedback: TransformFeedback | null`
Transform feedback object (WebGL2 only).

### `pipeline: RenderPipeline`
Underlying GPU pipeline.

### `pipelineFactory: PipelineFactory`
Factory used to create pipelines.

### `shaderFactory: ShaderFactory`
Factory used to create shaders.

### `userData: Record<string, any>`
Application-specific data.

## Methods

### `constructor(device: Device, props: ModelProps)`
Create a new `Model`.

### `destroy(): void`
Release GPU resources associated with the model.

### `needsRedraw(): boolean | string`
Check whether the model requires drawing.

### `setNeedsRedraw(reason: string): void`
Mark the model as needing to be redrawn.

### `predraw(): void`
Update uniform buffers and pipeline state prior to drawing.

### `draw(renderPass: RenderPass): boolean`
Render the model once to the supplied render pass.

### `setGeometry(geometry: Geometry | GPUGeometry | null): void`
Set the geometry for this model.

### `setTopology(topology: PrimitiveTopology): void`
Update the primitive topology.

### `setBufferLayout(bufferLayout: BufferLayout[]): void`
Update the buffer layout.

### `setParameters(parameters: RenderPipelineParameters): void`
Change render pipeline parameters.

### `setInstanceCount(instanceCount: number): void`
Specify how many instances to render.

### `setVertexCount(vertexCount: number): void`
Specify how many vertices to render.

### `setShaderInputs(shaderInputs: ShaderInputs): void`
Set the `ShaderInputs` instance.

### `updateShaderInputs(): void`
Update internal uniform buffers and bindings from `shaderInputs`.

### `setBindings(bindings: Record<string, Binding | AsyncTexture>): void`
Set textures, samplers and uniform buffers.

### `setTransformFeedback(transformFeedback: TransformFeedback | null): void`
Attach an optional transform feedback object.

### `setIndexBuffer(indexBuffer: Buffer | null): void`
Specify the index buffer.

### `setAttributes(buffers: Record<string, Buffer>, options?): void`
Set buffer-valued attributes.

### `setConstantAttributes(attributes: Record<string, TypedArray>, options?): void`
Set constant-valued attributes (WebGL only).
