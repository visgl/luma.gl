# Model

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

The `Model` class is the centerpiece of the luma.gl API. It brings together all the different functionality needed to run shaders and perform draw calls in a single, easy-to-use interface.

- **render pipeline creation** -
- **attributes**
- **bindings** these can reference textures and uniform buffers
- **uniforms** WebGL only uniforms
- **shader module injection**
- **shader transpilation****
- **debugging** - Detailed debug logging of draw calls


The `Model` class integrates with the `@luma.gl/shadertools` shader module system: [see `Shader Assembly`]( /docs/api-reference/shadertools/shader-assembler).


 (Accepts a [`Mesh`] or a [`Geometry`](/docs/- - api-reference/engine/geometry) instance, plus any additional attributes for instanced rendering)

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

```
model.setUniforms({
  uPMatrix: currentProjectionMatrix,
  uMVMatrix: current ModelViewMatrix
});
model.draw();
```


## Types

### ModelProps

| Property             | Type                 | Description                                                                                                                    |
| -------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `vs`                 | `Shader` \| _string_ | A vertex shader object, or source as a string.                                                                                 |
| `fs`                 | `Shader` \| _string_ | A fragment shader object, or source as a string.                                                                               |
| `modules`            |                      | shader modules to be applied (shadertools).                                                                                    |
| `programManager`     |                      | `ProgramManager` to use for program creation and caching.                                                                      |
| `varyings`           | (WebGL 2)            | An array of vertex shader output variables, that needs to be recorded (used in TransformFeedback flow).                        |
| `bufferMode`         | (WebGL 2)            | Mode to be used when recording vertex shader outputs (used in TransformFeedback flow). Default value is `GL.SEPARATE_ATTRIBS`. |

`ModelProps` passes through `RenderPipelineProps`

| Property      | Type                       | Description                                                                             |
| ------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| `layout`      | `ShaderLayout`             | Describes how shader attributes and bindings are laid out.                              |
| `topology?`   |                            | `'point-list'`, `'line-list'`, `'line-strip'`, `'triangle-list'` or `'triangle-strip'`, |
| `parameters?` | `RenderPipelineParameters` |                                                                                         |
| Property          | Type                     | Description                                                         |
| ----------------- | ------------------------ | ------------------------------------------------------------------- |
| `vertexCount?`    | `number`                 |                                                                     |
| `instanceCount?`  | `number`                 |                                                                     |
| `moduleSettings?` | `Record<string, any>`    | any values required by shader modules (will be mapped to uniforms). |
| `uniforms?`       | `Record<string, any>`    | any non-binding uniform values                                      |
| `bindings?`       | `Record<string, any>`    |                                                                     |
| `buffers?`        | `Record<string, Buffer>` |                                                                     |

## Properties

### renderPipeline: RenderPipeline

Get model's `Program` instance

### onBeforeRender

function to be called before every time this model is drawn.

### onAfterRender

function to be called after every time this model is drawn.

### instanceCount: number

default value is 0.

### vertexCount: number

when not provided will be deduced from `geometry` object.

## Methods

### constructor(device: Device, props: ModelProps)

The constructor for the Model class. Use this to create a new Model.

### destroy(): void

Free GPU resources associated with this model immediately, instead of waiting for garbage collection.

### draw(options: DrawOptions): boolean

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


### setDrawMode(); this

Sets the WebGL `drawMode`.

`GL.POINTS` etc.

### setVertexCount(); this

Sets the number of vertices

### setInstanceCount(); this

How many instances will be rendered

### setGeometry(); this

Use a `Geometry` instance to define attribute buffers

### setAttributes(attributes: object); this

Sets map of attributes (passes through to [VertexArray.setAttributes](/docs/api-reference/core/resources/vertex-array))

### setUniforms(uniforms: object): void

Stores named uniforms key, value


### updateModuleSettings(moduleSettings: object): void


## Remarks

- The `Model` class is arguably the most useful class for typical applications. It manages the WebGL resources needed to perform draw calls and provide additional functionality as described below.
