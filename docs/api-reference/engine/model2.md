# Model

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

The `Model` class brings together and orchestrates the different functions needed
to perform draw calls, including:

- **shader module dependency injection and shader transpilation**
- **render pipeline creation** -
- **bindings** these can reference uniforms and textures.
- **uniforms**
- **attributes** (holds a [`Mesh`] or a [`Geometry`](/docs/api-reference/engine/geometry) instance, plus any additional attributes for instanced rendering)

The `Model` class integrates with the `@luma.gl/shadertools` shader module system: [see `Shader Assembly`](/docs/api-reference/shadertools/assemble-shaders).

TBD

- Automatically creates GPU `Buffer`s from typed array attributes
- Detailed debug logging of draw calls
- Exposes the functionality provided by the managed WebGL resources

## Usage

```typescript
import {Model} from `@luma.gl/engine`;
```

### Provide attribute data using Geometry object

Create model object by passing shaders, uniforms, geometry and render it by passing updated uniforms.

```typescript
// construct the model.
const model = new Model(device, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  geometry: geometryObject,
  bindings: {
    uSampler: texture
  },
})

// and on each frame update any uniforms (typically matrices) and call render.
model
  .setUniforms({
    uPMatrix: currentProjectionMatrix,
    uMVMatrix: current ModelViewMatrix
  })
  .draw();
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

// and on each frame update any uniforms (typically matrices) and call render.
model
  .setUniforms({
    uPMatrix: currentProjectionMatrix,
    uMVMatrix: currentModelViewMatrix
  })
  .draw();
```

### Provide attribute data using VertexArray object

A `VertexArray` object can be build and passed to `Model.draw()` to provide attribute data. Attribute data can be changed by changing `VertexArray` object.

```typescript
// construct the model.
const model = new Model(device, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  uniforms: {uSampler: texture},
  drawMode: gl.TRIANGLE_FAN,
  vertexCount: 3
});

const ATTRIBUTE1_LOCATION = 0;
const ATTRIBUTE2_LOCATION = 1;
const vertexArray1 = device.createVertexArray({
  buffers: {
    [ATTRIBUTE1_LOCATION]: buffer1,
    [ATTRIBUTE2_LOCATION]: buffer2
  }
});
const vertexArray2 = device.createVertexArray({
  buffers: {
    [ATTRIBUTE1_LOCATION]: buffer3,
    [ATTRIBUTE2_LOCATION]: buffer4
  }
});

//Render using attribute data from vertexArray1.
model.draw({
  uniforms: {
    uPMatrix: currentProjectionMatrix,
    uMVMatrix: currentModelViewMatrix
  },
  vertexArray: vertexArray1
});

// Switch attribute data to vertexArray2
model.setUniforms({
  uPMatrix: currentProjectionMatrix,
  uMVMatrix: currentModelViewMatrix
})
model.setVertexArray(vertexArray2);
model.draw({...});
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
| `transpileToGLSL100` |                      | Transpile vertex and fragment shaders to GLSL 1.0.                                                                             |

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

## Methods

### constructor(device: Device, props: ModelProps)

The constructor for the Model class. Use this to create a new Model.

### destroy(): void

Free GPU resources associated with this model immediately, instead of waiting for garbage collection.

### isAnimated(): boolean

Returns `true` if the model is animated (i.e. needs to be redrawn every frame).

### getUniforms(): object

Returns map of currently stored uniforms

### setUniforms(uniforms: object): void

Stores named uniforms {key, value}

### updateModuleSettings(moduleSettings: object): void

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
