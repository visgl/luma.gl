# Model

The `Model` class holds all the data necessary to draw an object in
luma.gl: **shaders** (via a `Program` instance), **shader modules**, **vertex attributes**
(a `Geometry` instance) and **uniforms**.

For most applications, the `Model` class is probably the most central luma.gl
class.

- `Model` can be positioned, rotated and scaled.
- `Model` contains a [`Program`](/#/documentation/api-reference/program) (the shaders), a [`Geometry`](/#/documentation/api-reference/geometry) (containing the attributes for the primitive), [`Shader Modules`](/#/documentation/api-reference/shader-modules), any additional attributes for instanced rendering, and also stores textures and uniforms.
- Has simple boolean flags for selecting indexed and/or instanced rendering.
- Offers a simple render method that binds all attributes, uniforms and textures, selects (uses) the program, and calls the right gl draw call for the model.
- Setting buffers and more.


## Usage

Create model object by passing shaders, uniforms, and render it by passing updated uniforms.
```js
// construct the model.
const model =  new Model(gl, {
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  geometry: geometryObject,
  uniforms: {uSampler: texture}
})

// and on each frame update any uniforms (typically matrices) and call render.
model.render({
  uPMatrix: currentProjectionMatrix,
  uMVMatrix: current ModelViewMatrix
});

```

## Methods


| **Method** | **Description** |
| --- | --- |
| `constructor` | creates a Model|
| `setInstanceCount` | How many instances |
| `getInstanceCount` | Defaults to 0 |
| `setVertexCount` | How many vertices, can be autocalculated from `Geometry` |
| `getVertexCount` | Gets vertex count |
| `isPickable` | True if picking is enabled |
| `setPickable` | enable/disable picking|
| `getProgram` | Get model's `Program` instance |
| `getGeometry` | Get model's `Geometry` instance |
| `getAttributes` | Get a map of named attributes |
| `setAttributes` | Sets map of attributes (Arrays or buffers) |
| `getUniforms` | Returns map of currently stored uniforms |
| `setUniforms` | Stores named uniforms {key, value} |
| `render` | Renders the model with provided uniforms, attributes and samplers |
| `draw` | Applies gl settings temporarily and calls `render` |
| `onBeforeRender` | Called before model renders |
| `onAfterRender` | Called after model renders |
| `setProgramState` | Sets uniforms, attributes, textures, uses program |
| `unsetProgramState` | Unbinds attributes etc |

### constructor

The constructor for the Model class. Use this to create a new Model.

`const model = new Model(gl, options);`

#### Parameters

* `gl` - WebGL context.
* `opts` - contains following named properties.
  * `vs` - (VertexShader|*string*) - A vertex shader object, or source as a string.
  * `fs` - (FragmentShader|*string*) - A fragment shader object, ot source as a string.
  * `modules` - shader modules to be applied.
  * `moduleSettings` - any uniforms needed by shader modules.
  * `program` - pre created program to use, when provided, vs, ps and modules are not used.
  * `shaderCache` - (ShaderCache) - Compiled shader (Vertex and Fragment) are cached in this object very first time they got compiled and then retrieved when same shader is used. When using multiple Model objects with duplicate shaders, use the same shaderCache object for better performance.
  * `isInstanced` - default value is false.
  * `instanceCount` - default value is 0.
  * `vertexCount` - when not provided will be deduced from `geometry` object.
  * `uniforms` - uniform values to be used for drawing.
  * `geometry` - geometry object, from which attributes, vertex count and drawing mode are deduced.
  * `onBeforeRender` - function to be called before every time this model is drawn.
  * `onAfterRender` - function to be called after every time this model is drawn.

### draw

Render the model.

#### Parameters

* `opts` - contains following named properties.
  * `moduleSettings` - any uniforms needed by shader modules.
  * `uniforms` - uniform values to be used for drawing.
  * `attributes` - attribute definitions to be used for drawing.
  * `samplers` - texture mappings to be used for drawing.
  * `parameters` - temporary gl settings to be applied to this draw call.
  * `framebuffer` - if provided, render to framebuffer

### render

Render the model.

#### Parameters

+ `uniforms` - uniform values to be used for drawing.
+ `attributes` - attribute definitions to be used for drawing.
+ `samplers` - texture mappings to be used for drawing.


## Remarks
* All instance methods in `Model` are chainable
  (unless they return a documented value).
