---
layout: docs
title: Model
categories: [Documentation]
---

The `Model` class holds all the data necessary to draw an object in
luma.gl: **shaders** (via a `Program` instance), **vertex attributes**
(a `Geometry` instance), **uniforms** and **textures**.

Class: Model {#Model}
===========================

For most applications, the `Model` class is probably the most central luma.gl
class.

### Model Overview:

- `Model` is a subclass of Object3D, meaning that it can be used in scene graphs
  (by adding it to a [`Group`](group.html) or a [`Scene`](scene.html)),
  and it can be positioned, rotated and scaled.
- `Model` contains a [`Program`](program.html) (the shaders),
  a [`Geometry`](geometry.html) (containing the attributes
  for the primitive), any additional attributes for instanced rendering,
  and also stores textures and uniforms.
- Has simple boolean flags for selecting indexed and/or instanced rendering.
- Offers a simple render method that binds all attributes, uniforms and
  textures, selects (uses) the program, and calls the right gl draw call for
  the model.
- Setting buffers
- Setting textures and more.


### Remarks
* All instance methods in `Model` are chainable
  (unless they return a documented value).

### Methods

| **Method** | **Description** |
|====|====|
| `constructor` | creates a Model|
| `hash` | Return a "unique" integer |
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
| `setTextures` | Sets array of textures for model |
| `render` | Takes a camera or a viewMatrix parameter |
| onBeforeRender | Called before model renders |
| `onAfterRender` | Called after model renders |
| `setProgramState` | Sets uniforms, attributes, textures, uses program |
| `unsetProgramState` | Unbinds attributes etc |
| `bindTextures` | binds textures |


Model constructor {#Model:constructor}
----------------------------------------------------------------------

2. **opts.vs** (VertexShader|*string*) - A vertex shader object, or source as a string.
3. **opts.fs** (FragmentShader|*string*) - A fragment shader object, ot source as a string.
4. **opts.shaderCache** (ShaderCache|null) - An optional `ShaderCache`, will be used to compile shader source strings.
* program
* geometry
* material = null
* textures = []
* instanced = false
* instanceCount = 0
* vertexCount = undefined
* isIndexed = undefined
* pickable = false, pick = null
* uniforms = {}
* attributes = {}
* render = null
* onBeforeRender = null
* onAfterRender = null


Model Method: setUniforms {#Model:setUniforms}
--------------------------------------------------

For each `key, value` of the object passed in it executes `setUniform(key, value)`.

### Syntax:

	program.setUniforms(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a
                       uniform name and its value respectively.


1. key - (*string*) The name of the uniform to be set.
                    The name of the uniform will be matched with the name of
                    the uniform declared in the shader. You can set more
                    uniforms on the Model than its shaders use, the extra
                    uniforms will simply be ignored.
2. value - (*mixed*) The value to be set.
                     Can be a float, an array of floats, a boolean, etc.
                     When the shaders are run (through a draw call),
                     The must match the declaration.
                     There's no need to convert arrays into a typed array,
                     that's done automatically.

### Examples:

Set matrix information for the projection matrix and element matrix of the
camera and world.
The context of this example can be seen
[here]http://uber.github.io/luma.gl/examples/lessons/3/).

{% highlight js %}
program.setUniforms({
  'uMVMatrix': view,
  'uPMatrix': camera.projection
});
{% endhighlight %}




Model method setInstanceCount
--------------------------
* instanceCount

Model method getInstanceCount
--------------------------

Model method setVertexCount
--------------------------
* vertexCount

Model method getVertexCount
--------------------------

Model method isPickable
--------------------------

Model method setPickable
--------------------------

Model method getProgram
--------------------------

Model method getGeometry
--------------------------

Model method getAttributes
--------------------------

Model method setAttributes
--------------------------
* attributes = {}

Model method getUniforms
--------------------------
Sets uniforms to be used. Note that uniforms are stored in a map so uniform
values not present in the argument map won't be overwritten.


Model method setUniforms
--------------------------
Sets uniforms to be used. Note that uniforms are stored in a map so uniform
values not present in the argument map won't be overwritten.


Model method setTextures
--------------------------
Sets textures to be used.


Model method render
--------------------------
Draws the model (i.e. binds all the attributes textures and uniforms and runs
the shaders in attached program). Can be called directly but is usually called
during by Scene.render traversing the models in the scene.

* camera - Camera exposes uniforms that can be used directly in shaders
* viewMatrix


### Less commonly used methods

Model method onBeforeRender()
--------------------------
Attaches attributes


Model method onAfterRender()
--------------------------
Detaches attributes


Model method setProgramState
--------------------------
Attaches attributes for primitive (from geometry) and instances (from model),
Sets uniforms and textures


Model method unsetProgramState
--------------------------
Reverses setProgramState


Model method bindTextures
--------------------------

(force = false)
