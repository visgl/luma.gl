# Program

A `Program` contains a matched pair of vertex and fragment [shaders](/docs/api-reference/webgl/shader.md) that can be exectued on the GPU by calling `Program.draw()`. Programs handle compilation and linking of shaders, and store uniform values. They provide `draw` call which allows the application to run the shaders on specified input data.

## Usage

Creating a program

```js
  const program = new Program(gl, {
    id: 'my-program',
    vs: vertexShaderSourceString,
    fs: fragmentShaderSourceString
  });
```

Set or update uniforms, in this case world and projection matrices

```js
program.setUniforms({
  uMVMatrix: view,
  uPMatrix: projection
});
```

Create a `VertexArray` to store buffer values for the vertices of a triangle and drawing

```js
const program = new Program(gl, {vs, fs});

const vertexArray = new VertexArray(gl, {program});

vertexArray.setAttributes({
  aVertexPosition: new Buffer(gl, {data: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])})
});

program.draw({vertexArray, ...});
```

Creating a program for transform feedback, specifying which varyings to use

```js
const program = new Program(gl, {vs, fs, varyings: ['gl_Position']});
```


## Members

* `gl` : `WebGLRenderingContext`
* `handle` : `WebGLProgram` - The WebGL `WebGLProgram` instance.
* `id` : `String` - `id` string for debugging.


## Constructor

### Program(gl : WebGLRenderingContext, props : Object)

Creates a new program using the supplied vertex and fragment shaders. The shaders are compiled into WebGLShaders and is created and the shaders are linked.

```js
	const program = new Program(gl, {
    id: 'my-identifier',
    vs: vertexShaderSource,
    fs: fragmentShaderSource,
    varyings: ['gl_Position', 'vColor']
  });
```

* `id` (`string`, optional) - string id (to help indentify the program during debugging).
* `vs` (`VertexShader`|`String`) - A vertex shader object, or source as a string.
* `fs` (`FragmentShader`|`String`) - A fragment shader object, or source as a string.
* `varyings` WebGL2 (`String[]`) - a list of names of varyings.
* `bufferMode`=`GL.SEPARATE_ATTRIBS` WebGL2 (`GLenum`) - Optional, specifies how transform feedback should store the varyings.

| `GL.TRANSFORM_FEEDBACK_BUFFER_MODE` | Description |
| ---                                 | --- |
| `GL.SEPARATE_ATTRIBS`               | One varying per buffer |
| `GL.INTERLEAVED_ATTRIBS`            | Multiple varyings per buffer |

WebGL References [WebGLProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram), [gl.createProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createProgram)


### delete() : Program

Deletes resources held by program. Note: Does not currently delete shaders (to enable shader caching).


## Methods

### initialize(opts : Object) : Program

Relinks a program. Takes the same options as the constructor


### setUniforms(uniforms : Object) : Program

Sets named uniforms from a map, ignoring names

* `key` (*String*) - The name of the uniform to be set. The name of the uniform will be matched with the name of the uniform declared in the shader. You can set more uniforms on the Program than its shaders use, the extra uniforms will simply be ignored.
* `value` (*mixed*) - The value to be set. Can be a float, an array of floats, a typed array, a boolean, `Texture` etc. The values must match the declarations in the shader.

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram)


### draw(opts) : Program

`Program.draw` is the entry point for running shaders, rendering and (optionally calculating data using transform feedback techniques).

```js
  Program.draw({
    vertexArray,

    uniforms = {},
    transformFeedback = null,
    samplers = {},
    parameters = {},

    drawMode = GL.TRIANGLES,
    vertexCount,
    offset = 0,
    isIndexed = false,
    indexType = GL.UNSIGNED_SHORT,
    isInstanced = false,
    instanceCount = 0,

    start = 0,
    end=
  })
```

Main parameters

* `vertexArray` - a `VertexArray` object that will be bound and unbound before and after the draw call.
* `uniforms`=`{}` - a map of uniforms that will be set just before the draw call (and remain set after the call).
* `samplers`=`{}` - a map of texture `Sampler`s that will be bound before the draw call.
* `parameters` - temporary gl settings to be applied to this draw call.
* `transformFeedback`=`null` - optional `TransformFeedback` object containing buffers that will receive the output of the transform feedback operation.

Potentially autodeduced parameters

* `drawMode`=`GL.TRIANGLES` - geometry primitive format of vertex data
* `vertexCount` - number of vertices to draw
* `offset`=`0` - first vertex to draw
* `isIndexed`=`false` - use indices in the "elements" buffer
* `indexType`=`GL.UNSIGNED_SHORT` - must match the type of the "elements" buffer
* `isInstanced`=`false` - Set to enable instanced rendering.
* `instanceCount`=`0` - Number of instances

Parameters for drawing a limited range (WebGL2 only)

* `start` - hint to GPU, activates `gl.drawElementsRange` (WebGL2)
* `end` - hint to GPU, activates `gl.drawElementsRange` (WebGL2)

Notes:

* Runs the shaders in the program, on the attributes and uniforms.
* Indexed rendering uses the element buffer (`GL.ELEMENT_ARRAY_BUFFER`), make sure your attributes or `VertexArray` contains one.
* If a `TransformFeedback` object is supplied, `transformFeedback.begin()` and `transformFeedback.end()` will be called before and after the draw call.
* A `Sampler` will only be bound if there is a matching Texture with the same key in the supplied `uniforms` object.

The following WebGL APIs are called in this function:

[gl.useProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/useProgram),
[gl.drawElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements),
[gl.drawRangeElements](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawRangeElements) (WebGL2),
[gl.drawArrays](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays),
[gl.drawElementsInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced) (WebGL2),
[gl.drawArraysInstanced](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced) (WebGL2),
[gl.getExtension](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getExtension), [ANGLE_instanced_arrays](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays),
[gl.drawElementsInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawElementsInstancedANGLE),
[gl.drawArraysInstancedANGLE](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/drawArraysInstancedANGLE)


## Constants

### Limits

| Limit                               | Value          | Description |
| ---                                 | ---            | --- |
| `GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS` | >= 0 (GLint)   | |
| `GL.MAX_RENDERBUFFER_SIZE`          | >= 1 (GLint)   | |
| `GL.MAX_VARYING_VECTORS`            | >= 8 (GLint)   | |
| `GL.MAX_VERTEX_ATTRIBS`             | >= 8 (GLint)   | |
| `GL.MAX_VERTEX_UNIFORM_VECTORS`     | >= 128 (GLint) | |
| `GL.MAX_FRAGMENT_UNIFORM_VECTORS`   | >= 16 (GLint)  | |
| `GL.TRANSFORM_FEEDBACK_VARYING_MAX_LENGTH` (WebGL2)  | - | - |


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
