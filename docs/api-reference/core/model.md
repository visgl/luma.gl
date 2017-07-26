# Model

The `Model` class holds all the data necessary to draw an object in
luma.gl: **shaders** (via a `Program` instance), **shader modules**, **vertex attributes**
(a `Geometry` instance) and **uniforms**.

For most applications, the `Model` class is probably the most central luma.gl
class.

- `Model` is a subclass of `Object3D`, meaning it can be positioned, rotated and scaled.
- `Model` contains a [`Program`](program.html) (the shaders), a [`Geometry`](geometry.html) (containing the attributes for the primitive), [`Shader Modules`](#/documentation/shadertools-reference/shader-modules), any additional attributes for instanced rendering, and also stores textures and uniforms.
- Has simple boolean flags for selecting indexed and/or instanced rendering.
- Offers a simple render method that binds all attributes, uniforms and textures, selects (uses) the program, and calls the right gl draw call for the model.
- Setting buffers and more.


## Usage

Create model object by passing shaders, uniforms, and render it by passing updated uniforms.
```js
// construct the model.
const cube =  new Cube({
  gl,
  vs: VERTEX_SHADER,
  fs: FRAGMENT_SHADER,
  uniforms: {uSampler: texture}
})

// and on each frame update any uniforms (typically matrices) and call render.
cube.render({
  uPMatrix: currentProjectionMatrix,
  uMVMatrix: current ModelViewMatrix
});

```

## Remarks
* All instance methods in `Model` are chainable
  (unless they return a documented value).

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
| `render` | Takes uniforms |
| `draw` | Applies any gl settings temporarily and calls `render` |
| `onBeforeRender` | Called before model renders |
| `onAfterRender` | Called after model renders |
| `setProgramState` | Sets uniforms, attributes, textures, uses program |
| `unsetProgramState` | Unbinds attributes etc |

### Model constructor
1. **gl** WebGL context.
2. **opts** contains following name properties.
  * **vs** (VertexShader|*string*) - A vertex shader object, or source as a string.
  * **fs** (FragmentShader|*string*) - A fragment shader object, ot source as a string.
  * **modules** shader modules to be applied.
  * **moduleSettings** any uniforms needed by shader modules.
  * **program** pre created program to use, when provided, vs, ps and modules are not used.
  * **isInstanced** default value is false.
  * **instanceCount** default value is 0.
  * **vertexCount** when not provided will be deduced from `geometry` object.
  * **uniforms** uniform values to be used for drawing.
  * **geometry** geometry object, from which attributes, vertex count and drawing mode are deduced.
  * **onBeforeRender** function to be called before every time this model is drawn.
  * **onAfterRender** function to be called after every time this model is drawn.
