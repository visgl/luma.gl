The `Program` class encapsulates a `WebGLProgram` object. It contains a matched pair of vertex and fragment shaders.

`Program` handles
- Compilation and linking of shaders
- Setting and unsetting buffers (attributes)
- Setting uniform values
- Setting buffers
- Setting textures
and more.

Calling `Program.use()` after construction will cause any subsequent `draw*` calls to use the shaders from this program.

## Usage

Creating a program
```js
  const program = new Program(gl, {
    vs: vertexShaderSource,
    fs: fragmentShaderSource,
    id: 'my-identifier',
  });
```

Set matrix information for the projection matrix and element matrix of the camera and world
```js
program.setUniforms({
  uMVMatrix: view,
  uPMatrix: camera.projection
});
```

Set buffer values for the vertices of a triangle
```js
program.setBuffers({
  aVertexPosition: {
    value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
    size: 3
  },
});
```

Creating a program for transform feedback, specifying which varyings to use
```js
  const program = new Program(gl, {vs, fs, varyings: ['gl_Position']});
```


## Methods

| **Method** | **Description** |
|====|====|
| `constructor` | creates a Program |
| `initialze` | reinitializes (relinks) a Program |
| `delete` | deletes resources held by program |
| `setAttributes` | Sets named uniforms from a map, ignoring names |
| `setUniforms` | Sets named uniforms from a map, ignoring names |
| `draw` | Runs the shaders to render or compute |

| **Method** | **Description** |
| `getAttributeCount` | Gets number of active attributes |
| `getAttributeInfo` | Gets {name, type, size} for attribute at index |
| `getAttributeName` | Gets name for attribute at index |
| `getAttributeLocation` | Gets index for attribute with name |
| `getAttributeNames` |  |
| `getAttributeLocations` |  |
| `getUniformCount` | Gets number of active uniforms |
| `getUniformInfo` | Gets {name, type, size} for uniform at index |

## Limits

| Limit | Value | Description |
| --- | --- | --- |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS` | >= 0 (GLint) | |
| `GL.MAX_RENDERBUFFER_SIZE` | >= 1 (GLint) | |
| `GL.MAX_VARYING_VECTORS` | >= 8 (GLint) | |
| `GL.MAX_VERTEX_ATTRIBS` | >= 8 (GLint) | |
| `GL.MAX_VERTEX_UNIFORM_VECTORS` | >= 128 (GLint) | |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS` | >= 16 (GLint) | |
| WebGL2 | | |
| GL.TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH | | |

## Parameters

| Parameter | Type | Description
| `GL.DELETE_STATUS` | GLboolean | |
| `GL.LINK_STATUS` | GLboolean | |
| `GL.VALIDATE_STATUS` | GLboolean | |
| `GL.ATTACHED_SHADERS` | GLint | |
| `GL.ACTIVE_ATTRIBUTES` | GLint | |
| `GL.ACTIVE_UNIFORMS` | GLint | |
| WebGL2 | | |
| `GL.TRANSFORM_FEEDBACK_BUFFER_MODE` | GLenum | Buffer capture mode, `GL.SEPARATE_ATTRIBS` or `GL.INTERLEAVED_ATTRIBS` |
| `GL.TRANSFORM_FEEDBACK_VARYINGS` | GLint | |
| `GL.ACTIVE_UNIFORM_BLOCKS` | GLint | |


## Properties

A program instance has as public properties:

### `handle` (`WebGLProgram`)

The native `WebGLProgram` instance.

### `id` (`String`)

`id` string for debugging.

### `gl` (`WebGLRenderingContext`)


## Methods

### `constructor`

Creates a new program using the supplied vertex and fragment sshaders. The shaders are compiled into WebGLShaders and is created and the shaders are linked.

Syntax:

```js
	const program = new Program(gl, {
    vs: vertexShaderSource,
    fs: fragmentShaderSource,
    id: 'my-identifier',
    varyings:
  });
```

Arguments
* `gl` (*WebGLRenderingContext*)
* `opts`
    * `id` (`string`, optional) - string id (to help indentify the program during debugging).
    * `vs` (`VertexShader`|`String`) - A vertex shader object, or source as a string.
    * `fs` (`FragmentShader`|`String`) - A fragment shader object, or source as a string.
    * `varyings` WebGL2 (`String`) - a list of names of varyings.
    * `bufferMode` WebGL2 (`GLenum`=`GL.SEPARATE_ATTRIBS`) - Optional, specifies how transform feedback should store the varyings.

| `GL.TRANSFORM_FEEDBACK_BUFFER_MODE` | Description |
| --- | --- |
| `GL.SEPARATE_ATTRIBS` | One varying per buffer |
| `GL.INTERLEAVED_ATTRIBS` | Multiple varyings per buffer |


WebGL References [WebGLProgram](), [gl.createProgram]()

### `initialize`

Relinks a program

* `opts`
    * `id` (`string`, optional) - string id (to help indentify the program during debugging).
    * `vs` (`VertexShader`|`String`) - A vertex shader object, or source as a string.
    * `fs` (`FragmentShader`|`String`) - A fragment shader object, or source as a string.
    * `varyings` WebGL2 (`String`) - a list of names of varyings.
    * `bufferMode` WebGL2 (`GLenum`=`GL.SEPARATE_ATTRIBS`) - Optional, specifies how transform feedback should store the varyings.


### `delete`

Deletes resources held by program. Note: Does not currently delete shaders (to enable shader caching).

WebGL APIs [gl.createProgram]()

### `setBuffers`

Sets named uniforms from a map, ignoring names

For each `key, value` of the object passed in it executes `setBuffer(key, value)`.

program.setBuffers(object);

1. object - (*object*) An object with key value pairs matching a buffer name and its value respectively.
1. name - (*string*) The name (unique id) of the buffer. If no `attribute` value is set in `options` then the buffer name will be used as attribute name.
2. options - (*object*) An object with options/data described below:


### `setUniforms`

Sets named uniforms from a map, ignoring names

For each `key, value` of the object passed in it executes `setUniform(key, value)`.

```js
  program.setUniforms(object);
```

Arguments:

1. object - (*object*) An object with key value pairs matching a niform name and its value respectively.
1. key - (*string*) The name of the uniform to be set. The name of the uniform will be matched with the name of the uniform declared in the shader. You can set more uniforms on the Program than its shaders use, the extra uniforms will simply be ignored.
2. value - (*mixed*) The value to be set. Can be a float, an array of floats, a boolean, etc. When the shaders are run (through a draw call), The must match the declaration. There's no need to convert arrays into a typed array, that's done automatically.


### `draw`

Runs the shaders in the program, on the attributes and uniforms.

WebGL APIs [gl.useProgram](), [gl.drawElements](), [gl.drawArrays](), [gl.drawElementsInstanced](), [gl.drawArraysInstanced](), [gl.getExtension](), [ANGLE_instanced_arrays](), [gl.drawElementsInstancedANGLE](), [gl.drawArraysInstancedANGLE](),


## Additional Methods

These methods will not need to be called by most applications

### `getAttributeCount`

Gets number of active attributes

### `getAttributeInfo`

Gets {name, type, size} for attribute at index

### `getAttributeName`

Gets name for attribute at index

### `getAttributeLocation`

Gets index for attribute with name

### `getAttributeNames`

### `getAttributeLocations`

### varyings

* `program` (`WebGLProgram?`) - program
* `varyings` (`sequence<DOMString>`) -
* `bufferMode` (`GLenum`) -
returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [gl.transformFeedbackVaryings]()

### getVarying(program, index)

* `program` (`WebGLProgram?`) - program
* `index` (`GLuint`) - index
returns (`WebGLActiveInfo`) - object with {`name`, `size`, `type`} fields.

WebGL APIs [gl.getTransformFeedbackVarying]()


### `use`

Calls `gl.useProgram(this.program)`. To set the current program as active. After this call, `gl.draw*` calls will run the shaders in this program.

Like `bind` calls on many other luma.gl objects, this method does normally not have to be called by the application.

[gl.useProgram]()


### `getUniformCount`

Gets number of active uniforms

### `getUniformInfo`

Gets {name, type, size} for uniform at index

### `getFragDataLocation` WebGL2
