# Model

The `Model` class is the centerpiece of the luma.gl API. It brings together all GPU functionality needed to run shaders and perform draw calls, in a single, easy-to-use interface.

`Model` manages the following responsibilities:
- **render pipeline creation** -
- **attributes**
- **bindings** these can reference textures and uniform buffers
- **uniforms** WebGL only uniforms
- **shader module injection**
- **shader transpilation****
- **debugging** - Detailed debug logging of draw calls

The `Model` class integrates with 
- The `@luma.gl/shadertools` shader module system: [see `Shader Assembly`]( /docs/api-reference/shadertools/shader-assembler).
- The `Geometry` classes - accepts a [`Mesh`] or a [`Geometry`](/docs/api-reference/engine/geometry) instance, plus any additional attributes for instanced rendering)

## Usage

```typescript
import {Model} from `@luma.gl/engine`;
```

One of the simplest way to provide attribute data is by using a Geometry object.

Create model object by passing shaders, uniforms, geometry and render it by passing updated uniforms.

```typescript
import {Model, CubeGeometry} from `@luma.gl/engine`;
// construct the model.
const model = new Model(device, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
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
  uniforms: {uSampler: texture},
})
```

On each frame, call the `model.draw()` function after updating any uniforms (typically matrices).

```ts
model.setUniforms({
  uPMatrix: currentProjectionMatrix,
  uMVMatrix: current ModelViewMatrix
});
model.draw();
```

Debug shader source (even when shader successful)
```ts
// construct the model.
const model = new Model(device, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  debugShaders: true
});
```

## Types

### `ModelProps`

| Property           | Type                                           | Description                                                                       |
| ------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `vs`               | `Shader` \| _string_                           | A vertex shader object, or source as a string.                                    |
| `fs`               | `Shader` \| _string_                           | A fragment shader object, or source as a string.                                  |
| `modules`          |                                                | shader modules to be applied (shadertools).                                       |
| `pipelineFactory?` |                                                | `PipelineFactory` to use for program creation and caching.                        |
| `debugShaders?`    | `'error' \| 'never' \| 'warnings' \| 'always'` | Specify in what triggers the display shader compilation log (default: `'error'`). |
| `onBeforeRender?`  | `Function`                                     | function to be called before every time this model is drawn.                      |
| `onAfterRender?`   | `Function`                                     | function to be called after every time this model is drawn.                       |
| `varyings?`        | `string[]`                                     | WebGL: Array of vertex shader output variables (used in TransformFeedback flow).  |
| `bufferMode?`      |                                                | WebGL: Mode for recording vertex shader outputs (used in TransformFeedback flow). |

`ModelProps` also include `RenderPipelineProps`, which are passed through to the `RenderPipeline` constructor, e.g:

| Property          | Type                       | Description                                                                             |
| ----------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| `layout`          | `ShaderLayout`             | Describes how shader attributes and bindings are laid out.                              |
| `topology?`       |                            | `'point-list'`, `'line-list'`, `'line-strip'`, `'triangle-list'` or `'triangle-strip'`, |
| `parameters?`     | `RenderPipelineParameters` |                                                                                         |
| `vertexCount?`    | `number`                   |                                                                                         |
| `instanceCount?`  | `number`                   |                                                                                         |
| `moduleSettings?` | `Record<string, any>`      | any values required by shader modules (will be mapped to uniforms).                     |
| `uniforms?`       | `Record<string, any>`      | any non-binding uniform values                                                          |
| `bindings?`       | `Record<string, any>`      |                                                                                         |
| `buffers?`        | `Record<string, Buffer>`   |                                                                                         |


## Fields

### `renderPipeline: RenderPipeline`

The model's `RenderPipeline` instance

### instanceCount: number

default value is 0.

### vertexCount: number

when not provided will be deduced from `geometry` object.

## Methods

### `constructor(device: Device, props: ModelProps)`

The constructor for the Model class. Use this to create a new Model.

### `destroy(): void`

Free GPU resources associated with this model immediately, instead of waiting for garbage collection.

### `draw(options: DrawOptions): boolean`

Renders the model with provided uniforms, attributes and samplers

```typescript
model.draw({
  renderPass,
  moduleSettings = null,
  uniforms = {},
  attributes = {},
  samplers = {},
  parameters = {},
  settings,
  vertexArray = null,
  transformFeedback = null
});
```

`Model.draw()` calls `Program.draw()` but adds and extends the available parameters as follows:

- `moduleSettings`=`null` (Object) - any uniforms needed by shader modules.
- `attributes`=`{}` (Object) - attribute definitions to be used for drawing. In additions to `Buffer` and constant values, `Model`s can also accept typed arrays and attribute descriptor objects which it converts to buffers.
- `uniforms`=`{}` (Object) - uniform values to be used for drawing. In addition to normal uniform values, `Model` can also accept function valued uniforms which will be evaluated before every draw call.
- `animationProps` (Object) - if any function valued uniforms are set on the `Model`, `animationProps` must be provided to the draw call. The `animationProps` are passed as parameter to the uniform functions.

The remaining draw options are passed directly to `Program.draw()`:

- `uniforms`=`{}` (Object) - uniform values to be used for drawing.
- `samplers`=`{}` (Object) - texture mappings to be used for drawing.
- `parameters`=`{}` (Object) - temporary gl settings to be applied to this draw call.
- `framebuffer`=`null` (`Framebuffer`) - if provided, renders into the supplied framebuffer, otherwise renders to the default framebuffer.
- `transformFeedback` - an instance `TranformFeedback` object, that gets activated for this rendering.
- `vertexArray` - an instance of `VertexArray` object, that holds required buffer bindings for vertex shader inputs.

Returns

- `boolean` - `true` if the model was drawn, `false` if not (normally because resources were still being loaded). If false is returned, then the application should attempt to draw again next frame.

### `setVertexCount(): void`

Sets the number of vertices

### `setInstanceCount(); void`

How many instances will be rendered

### `setGeometry(); void`

Use a `Geometry` instance to define attribute buffers

### `setAttributes(attributes: object, options?): void`

Sets map of attributes (via [VertexArray.setAttributes](/docs/api-reference/core/resources/vertex-array))

- `attributes` (Object) - map of attribute names to values.
- `options.ignoreMissingAttributes` (boolean) - if `true`, allows the function to silently ignore missing attributes.

### `setUniforms(uniforms: object): void` (Deprecated)

Global uniforms key, value. Only works on WebGL, for portable code, use uniform buffers and `model.setBindings()` instead.

### `updateModuleSettings(moduleSettings: object): void` (Deprecated)
