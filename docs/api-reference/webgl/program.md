# Program

A `Program` contains a matched pair of vertex and fragment [shaders](/#/documentation/api-reference/shader) that can be exectued on the GPU by calling `Program.draw()`. Programs handle compilation and linking of shaders, setting and unsetting buffers (attributes), setting uniform values etc.

| **Method**      | **Description** |
| ---             | --- |
| `constructor`   | creates a Program |
| `initialze`     | reinitializes (relinks) a Program |
| `delete`        | deletes resources held by program |
| `draw`          | Runs the shaders to render or compute |
| `setAttributes` | Sets named uniforms from a map, ignoring names |
| `setUniforms`   | Sets named uniforms from a map, ignoring names |


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


## Members

* `handle` (`WebGLProgram`) - The native `WebGLProgram` instance.
* `id` (`String`) - `id` string for debugging.
* `gl` (`WebGLRenderingContext`)


## Methods

### constructor

Creates a new program using the supplied vertex and fragment shaders. The shaders are compiled into WebGLShaders and is created and the shaders are linked.

Syntax:

```js
	const program = new Program(gl, {
    vs: vertexShaderSource,
    fs: fragmentShaderSource,
    id: 'my-identifier',
    varyings: ['gl_Position', 'vColor']
  });
```

* `gl` (*WebGLRenderingContext*)
* `id` (`string`, optional) - string id (to help indentify the program during debugging).
* `vs` (`VertexShader`|`String`) - A vertex shader object, or source as a string.
* `fs` (`FragmentShader`|`String`) - A fragment shader object, or source as a string.
* `varyings` WebGL2 (`String`) - a list of names of varyings.
* `bufferMode`=`GL.SEPARATE_ATTRIBS` WebGL2 (`GLenum`) - Optional, specifies how transform feedback should store the varyings.

| `GL.TRANSFORM_FEEDBACK_BUFFER_MODE` | Description |
| ---                                 | --- |
| `GL.SEPARATE_ATTRIBS`               | One varying per buffer |
| `GL.INTERLEAVED_ATTRIBS`            | Multiple varyings per buffer |


WebGL References [WebGLProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram), [gl.createProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram)

### initialize

Relinks a program

* `vs` (`VertexShader`|`String`) - A vertex shader object, or source as a string.
* `fs` (`FragmentShader`|`String`) - A fragment shader object, or source as a string.
* `varyings` WebGL2 (`String[]`) - a list of names of varyings.
* `bufferMode` WebGL2 (`GLenum`=`GL.SEPARATE_ATTRIBS`) - Optional, specifies how transform feedback should store the varyings.

### delete

Deletes resources held by program. Note: Does not currently delete shaders (to enable shader caching).

### draw

The heart of the luma.gl API, the `Program.draw` the entry point for running shaders, rendering and calculating data using transform feedback techniques.

```js
  Program.draw({
    drawMode = GL.TRIANGLES,
    vertexCount,
    offset = 0,
    isIndexed = false,
    indexType = GL.UNSIGNED_SHORT,
    isInstanced = false,
    instanceCount = 0,
    vertexArray = null,
    uniforms = {},

    transformFeedback = null,
    samplers = {},
    parameters = {},
    start,
    end
  })
```

* `drawMode`=`GL.TRIANGLES` - geometry primitive format of vertex data
* `vertexCount` - number of vertices to draw
* `offset`=`0` - first vertex to draw
* `start` - hint to GPU, activates `gl.drawElementsRange` (WebGL2)
* `end` - hint to GPU, activates `gl.drawElementsRange` (WebGL2)
* `isIndexed`=`false` - use indices in the "elements" buffer
* `indexType`=`GL.UNSIGNED_SHORT` - must match the type of the "elements" buffer
* `isInstanced`=`false` - Set to enable instanced rendering.
* `instanceCount`=`0` - Number of instances
* `vertexArray`=`null` - an optional `VertexArray` object that will be bound and unbound before and after the draw call.
* `transformFeedback`=`null` - optional `TransformFeedback` object containing buffers that will receive the output of the transform feedback operation.
* `uniforms`=`{}` - a map of uniforms that will be set before the draw call.
* `samplers`=`{}` - a map of texture `Sampler`s that will be bound before the draw call.
* `parameters` - temporary gl settings to be applied to this draw call.

Runs the shaders in the program, on the attributes and uniforms.
* Indexed rendering uses the element buffer (`GL.ELEMENT_ARRAY_BUFFER`), make sure your attributes or `VertexArray` contains one.
* If a `TransformFeedback` object is supplied, `transformFeedback.begin()` and `transformFeedback.end()` will be called before and after the draw call.
* `Sampler`s will only be bound if there is a matching Texture with the same key in the supplied `uniforms` object.

The following WebGL APIs are called in this function:

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram), [gl.drawElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements), [gl.drawRangeElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawRangeElements) (WebGL2), [gl.drawArrays](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays), [gl.drawElementsInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced) (WebGL2), [gl.drawArraysInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced) (WebGL2), [gl.getExtension](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension), [ANGLE_instanced_arrays](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays), [gl.drawElementsInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawElementsInstancedANGLE), [gl.drawArraysInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawArraysInstancedANGLE),

### setBuffers

Sets named uniforms from a map, ignoring names.

```js
program.setBuffers(object);
```

* object - (*object*) An object with key value pairs matching a buffer name and its value respectively.
* name - (*string*) The name (unique id) of the buffer. If no `attribute` value is set in `options` then the buffer name will be used as attribute name.
* options - (*object*) An object with options/data described below:

### setUniforms

Sets named uniforms from a map, ignoring names

For each `key, value` of the object passed in it executes `setUniform(key, value)`.

```js
  program.setUniforms(object);
```

* `object` (*object*) - An object with key value pairs matching a niform name and its value respectively.
* `key` (*string*) - The name of the uniform to be set. The name of the uniform will be matched with the name of the uniform declared in the shader. You can set more uniforms on the Program than its shaders use, the extra uniforms will simply be ignored.
* `value` (*mixed*) - The value to be set. Can be a float, an array of floats, a boolean, etc. When the shaders are run (through a draw call), The must match the declaration. There's no need to convert arrays into a typed array, that's done automatically.

### varyings

* `program` (`WebGLProgram?`) - program
* `varyings` (`sequence<DOMString>`) -
* `bufferMode` (`GLenum`) -
returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [gl.transformFeedbackVaryings](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/transformFeedbackVaryings)

### getVarying(program, index)

* `program` (`WebGLProgram?`) - program
* `index` (`GLuint`) - index
returns (`WebGLActiveInfo`) - object with {`name`, `size`, `type`} fields.

WebGL APIs [gl.getTransformFeedbackVarying](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/getTransformFeedbackVarying)

### use

Calls `gl.useProgram(this.program)`. To set the current program as active. After this call, `gl.draw*` calls will run the shaders in this program.

Like `bind` calls on many other luma.gl objects, this method does normally not have to be called by the application.

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram)

### getUniformCount

Gets number of active uniforms

### getUniformInfo

Gets {name, type, size} for uniform at index

### getFragDataLocation (WebGL2)

### Limits

| Limit | Value | Description |
| --- | --- | --- |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS` | >= 0 (GLint) | |
| `GL.MAX_RENDERBUFFER_SIZE` | >= 1 (GLint) | |
| `GL.MAX_VARYING_VECTORS` | >= 8 (GLint) | |
| `GL.MAX_VERTEX_ATTRIBS` | >= 8 (GLint) | |
| `GL.MAX_VERTEX_UNIFORM_VECTORS` | >= 128 (GLint) | |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS` | >= 16 (GLint) | |
| `GL.TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH` (WebGL2) | - | - |

### Parameters

Use with `Program.getParameter(parameter)`

| Parameter | Type | Description
| --- | --- | --- |
| `GL.DELETE_STATUS`     | GLboolean | If true, program has been flagged for deletion (by calling `Program.delete()`), but the delete is pending because program is still part of current rendering state |
| `GL.LINK_STATUS`       | GLboolean | Indicates whether last link operation was successful. Program linking is performed by luma on program initialization |
| `GL.VALIDATE_STATUS`   | GLboolean | Result of last `gl.validateProgram()` operation |
| `GL.ATTACHED_SHADERS`  | GLint     | Number of attached shaders (`0`, `1` or `2`) |
| `GL.ACTIVE_ATTRIBUTES` | GLint     | Number of active attribute variables to a program |
| `GL.ACTIVE_UNIFORMS`   | GLint     | Number of active attribute variables to a program |
| `GL.TRANSFORM_FEEDBACK_BUFFER_MODE`  | GLenum |  (WebGL2) Buffer capture mode, `GL.SEPARATE_ATTRIBS` or `GL.INTERLEAVED_ATTRIBS` |
| `GL.TRANSFORM_FEEDBACK_VARYINGS`     | GLint  | (WebGL2) Number of varying variables to capture in transform feedback mode. |
| `GL.ACTIVE_UNIFORM_BLOCKS`           | GLint  | (WebGL2) Number of uniform blocks containing active uniforms. |
