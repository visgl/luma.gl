# Model

`Model` is the primary class in luma.gl.

A `Model` holds all the data necessary to perform draw calls:

- **shaders** (via a [`Program`](/docs/api-reference/webgl/program) instance)
- **bindings** these can reference uniforms and textures.
- **attributes** (holds a [`Mesh`] or a [`Geometry`](/docs/api-reference/engine/geometry) instance, plus any additional attributes for instanced rendering)

The `Model` class integrates with the `@luma.gl/shadertools` shader module system: [see `Shader Assembly`](/docs/api-reference/shadertools/assemble-shaders).

TBD

- Automatically creates GPU `Buffer`s from typed array attributes
- Detailed debug logging of draw calls
- Exposes the functionality provided by the managed WebGL resources

## Usage

### Provide attribute data using Geometry object

Create model object by passing shaders, uniforms, geometry and render it by passing updated uniforms.

```typescript
// construct the model.
const model =  new Model(gl, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  uniforms: {uSampler: texture},
  geometry: geometryObject,
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
const model =  new Model(gl, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  uniforms: {uSampler: texture},
  attributes: {
    attributeName1: bufferObject,
    attributeName2: [new Buffer(gl, new Float32Array(...)), {size: 3, type: GL.FLOAT}]
  }
  drawMode: gl.TRIANGLE_FAN,
  vertexCount: 3,
})

// and on each frame update any uniforms (typically matrices) and call render.
model
  .setUniforms({
    uPMatrix: currentProjectionMatrix,
    uMVMatrix: current ModelViewMatrix
  })
  .draw();
```

### Provide attribute data using VertexArray object

A `VertexArray` object can be build and passed to `Model.draw()` to provide attribute data. Attribute data can be changed by changing `VertexArray` object.

```typescript
// construct the model.
const model = new Model(gl, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  uniforms: {uSampler: texture},
  drawMode: gl.TRIANGLE_FAN,
  vertexCount: 3
});

const ATTRIBUTE1_LOCATION = 0;
const ATTRIBUTE2_LOCATION = 1;
const vertexArray1 = new VertexArray(gl, {
  buffers: {
    [ATTRIBUTE1_LOCATION]: buffer1,
    [ATTRIBUTE2_LOCATION]: buffer2
  }
});
const vertexArray2 = new VertexArray(gl, {
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
model.draw({
  uniforms: {
    uPMatrix: currentProjectionMatrix,
    uMVMatrix: currentModelViewMatrix
  },
  vertexArray: vertexArray2
});
```

## Properties

| Property      | Type                     | Description                                                                             |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `vs`          | `Shader` \| _string_     | A vertex shader object, or source as a string.                                          |
| `fs`          | `Shader` \| _string_     | A fragment shader object, or source as a string.                                        |
| `layout`      | `ShaderLayout`           | Describes how shader attributes and bindings are laid out.                              |
| `modules`     |                          | shader modules to be applied (shadertools).                                             |
| `pipeline`    |                          | pre created program to use, when provided, vs, ps and modules are not used.             |
| `topology?`   |                          | `'point-list'`, `'line-list'`, `'line-strip'`, `'triangle-list'` or `'triangle-strip'`, |
| `parameters?` | RenderPipelineParameters |                                                                                         |

- `programManager` | | `ProgramManager` to use for program creation and caching. |
- `varyings` | (WebGL 2) | An array of vertex shader output variables, that needs to be recorded (used in TransformFeedback flow). |
- `bufferMode` | (WebGL 2) | Mode to be used when recording vertex shader outputs (used in TransformFeedback flow). Default value is `gl.SEPARATE_ATTRIBS`. |
- `transpileToGLSL100` | | Transpile vertex and fragment shaders to GLSL 1.0. |

## Properties

### moduleSettings: object

any uniforms needed by shader modules.

### uniforms: object

uniform values to be used for drawing.

### onBeforeRender

function to be called before every time this model is drawn.

### onAfterRender

function to be called after every time this model is drawn.

## Constructor

### Model(gl: WebGLRenderingContext, props: object)

The constructor for the Model class. Use this to create a new Model.

### delete()

Free WebGL resources associated with this model

## Methods

### setProps(props: object); this

Updates properties

### isAnimated(): boolean

Returns `true` if the model is animated (i.e. needs to be redrawn every frame).

### getProgram(): Program

Get model's `Program` instance

### getUniforms(): object

Returns map of currently stored uniforms

### setUniforms(uniforms: object); this

Stores named uniforms {key, value}

### updateModuleSettings(moduleSettings: object); this

### draw(options: object): boolean

Renders the model with provided uniforms, attributes and samplers

```typescript
model.draw({
  moduleSettings = null,
  uniforms = {},
  attributes = {},
  samplers = {},
  parameters = {},
  settings,
  framebuffer = null,
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

### transform(options: object); this

Renders the model with provided uniforms, and samplers. Calls `Program.draw()` with rasterization turned off.

- `discard`=`true` (Boolean) - Turns off rasterization
- `feedbackBuffers`=`null` (Object) - Optional map of feedback buffers. A `TransformFeedback` object will be created, initialized with these buffers, and passed to `Model.draw`.
- `unbindModels`=`[]` (Model[]) - Array of models whose VertexAttributes will be temporarily unbound during the transform feeback to avoid triggering a possible [Khronos/Chrome bug](https://github.com/KhronosGroup/WebGL/issues/2346).
  .

```typescript
model.transform({
  discard: false
});
```

### clear(options: object); this

## Deprecated Methods in v7

### render(options: object): boolean

Use Model.setUniforms() and Model.draw()

### getDrawMode(): Enum

Gets the WebGL drawMode

### getVertexCount(): GLInt

Gets vertex count

Note: might be autocalculated from `Geometry`

### getInstanceCount(): GLInt

Defaults to 0

### getAttributes(): object

Get a map of named attributes

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

Sets map of attributes (passes through to [VertexArray.setAttributes](/docs/api-reference/webgl/vertex-array))

## Remarks

- The `Model` class is arguably the most useful class for typical applications. It manages the WebGL resources needed to perform draw calls and provide additional functionality as described below.
