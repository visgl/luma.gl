# TransformFeedback (WebGL2)

`TransformFeedback` objects holds state needed to perform transform feedback operations. They store the buffer bindings that are being recorded to. This makes it easy to switch between different sets of feedback buffer bindings (somewhat similar to how `VertexArrayObjects` hold input vertex buffers.

The state managed by `TransformFeedback` objects includes the buffers the GPU will use to record the requested varyings.

When `TransformFeedback` objects must be "activated" (`TransformFeedback.begin`) before it can be used. There a number of caveats to be aware of when manually managing `TransformFeedback` object activation, see the remarks. For this reason, luma.gl [`Program.draw`](/docs/api-reference/webgl/program.md) call takes an optional `TransformFeedback` object as a parameter and activates and deactivates it before and after the draw call.

Finally, note that when using transform feedback it is frequently desirable to turn off rasterization: `gl.enable(GL.RASTERIZER_DISCARD)` to prevent the fragment shader from running.

For more information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Transform_Feedback).


## Usage

Setting up a model object for transform feedback.

```js
const model = new Model(gl, {
  vs,
  fs,
  varyings: ['gl_Position', 'outputColor'],
  ...
});
```

Setting up a transform feedback object and binding buffers

```js
const transformFeedback = new TransformFeedback(gl)
  .setBuffer(0, bufferPosition)
  .setBuffer(1, bufferColor);
```

When binding the buffers, index should be equal to the corresponding varying entry in `varyings` array passed to `Program` constructor.

Buffers can also be bound using varying name if information about varyings are retrieved from `Program` object.

```js
const transformFeedback = new TransformFeedback(gl, {
  program: ..., // linked program, configuration will be read from it
  buffers: {
    outputColor: bufferColor,
    gl_Position: bufferPosition
  }
});
```

Running program (drawing) with implicit activation of transform feedback (will call `begin` and `end` on supplied `transformFeedback`)

```js
model.draw({
  drawMode,
  vertexCount,
  ...,
  transformFeedback
});
```

Running a transform feedback operation while turning off rasterization (drawing):

```js
model.transform({
  drawMode,
  ...,
  transformFeedback
});
```

or equivalently, just call draw with an additional parameter:

```js
const parameters = {[GL.RASTERIZER_DISCARD]: true}
model.draw({..., transformFeedback, parameters});
```


## Methods

### constructor(gl : WebGL2RenderingContext, props: Object)

See `TransformFeedback.setProps` for parameters.

WebGL APIs [`gl.createTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createTransformFeedback)


### initialize(props : Object) : TransformFeedback

Reinitializes an existing `TransformFeedback` object with new props.


### setProps(props : Object) : TransformFeedback

* `props.program`= (Object) - Gets a mapping of varying name to buffer indices from a linked program if supplied.
* `props.buffers`=(Object) - Map of location index or name to Buffer object or buffer parameters object. If buffer parameters object is supplied, it contains following fields.
  * `buffer`=(Buffer) - Buffer object to be bound.
  * `byteOffset`=(Number, default: 0) - Byte offset that is used to start recording the data in the buffer.
  * `byteSize`=(Number, default: remaining buffer size) - Size in bytes that is used for recording the data.
* `props.bindOnUse`=`true` - If true, binds and unbinds buffers before and after use, rather than right away when set. Workaround for a possible [Khronos/Chrome bug](https://github.com/KhronosGroup/WebGL/issues/2346).

Notes:

* `buffers` - will get bound to indices in the `GL.TRANSFORM_FEEDBACK_BUFFER` target.


### delete() : TransformFeedback

Destroys a `TransformFeedback` object.

WebGL APIS [`gl.deleteTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteTransformFeedback)


### setBuffers(buffers: Object) : TransformFeedback

* `buffers`=(Object) - Map of location index or name to Buffer object or buffer parameters object. If buffer parameters object is supplied, it contains following fields.
  * `buffer`=(Buffer) - Buffer object to be bound.
  * `byteOffset`=(Number, default: 0) - Byte offset that is used to start recording the data in the buffer.
  * `byteSize`=(Number, default: remaining buffer size) - Size in bytes that is used for recording the data.

Notes:

* To use `gl.bindBufferRange`, either `offsetInByts` or `byteSize` must be specified, when only one is specified, default value is used for the other, when both not specified, `gl.bindBufferBase` is used for binding.

WebGL APIs [`gl.bindBufferBase`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferBase), [`gl.bindBufferRange`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferRange)


### begin(primitiveMode : GLEnum) : TransformFeedback

Activates transform feedback using the buffer bindings in this `TransformFeedback` object.

* `primitiveMode` (`GLenum`) -

returns (`TransformFeedback`) - returns self to enable chaining

Notes:

* Buffers can not be accessed until `TransformFeedback.end` or `TransformFeedback.pause` have been called.
* Buffers can not be changed until `TransformFeedback.end` or has been called, which includes doing anything which reads from or writes to any part of these buffers (outside of feedback writes, of course, or reallocating storage for any of these buffers).


WebGL APIs [`gl.beginTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/beginTransformFeedback)


### end() : TransformFeedback

returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [`gl.endTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/endTransformFeedback)


## See also

* `Program` constructor - `varyings` argument to specify which vertex shader outputs to expose to transform feedback operations.


## Enumerations

| Primitive Mode | Compatible Draw Modes |
| ---            | --- |
| `GL.POINTS`    | `GL.POINTS` |
| `GL.LINES`     | `GL.LINES`, `GL.LINE_LOOP`, `GL.LINE_STRIP` |
| `GL.TRIANGLES` | `GL.TRIANGLES`, `GL.TRIANGLE_STRIP`, `GL.TRIANGLE_FAN` |


## Limits

| Limit                                              | Value | Description |
| ---                                                | ---   | --- |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS`       | >=4   | total number of variables that can be captured }
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS`    | >=4   | number of components that any particular variable can contain |
| `GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` | >= 64 |  total number of components in interleaved capture |
| `GL.MAX_TRANSFORM_FEEDBACK_BUFFERS`                | TBD   | Advanced interleaving total number of buffers |


## Remarks

About `TransformFeedback` activation caveats

* When activated, `TransformFeedback` are coupled to the "current" `Program`
* Note that a started and unpaused TransformFeedback prevents the app from changing or re-linking the current program. So for instance, `Program.use` (`gl.useProgram`) cannot be called.
