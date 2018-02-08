# TransformFeedback

`TransformFeedback` objects holds state needed to perform transform feedback operations. They store the buffer bindings that are being recorded to. This makes it easy to switch between different sets of feedback buffer bindings (somewhat similar to how `VertexArrayObjects` hold input vertex buffers.

The state managed by `TransformFeedback` objects includes the buffers the GPU will use to record the requested varyings.

When `TransformFeedback` objects must be "activated" (`TransformFeedback.begin`) before it can be used. There a number of caveats to be aware of when manually managing `TransformFeedback` object activation, see the remarks. For this reason, luma.gl [`Program.draw`](/#/documentation/api-reference/program) call takes an optional `TransformFeedback` object as a parameter and activates and deactivates it before and after the draw call.

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
  .bindBuffer({index: 0, bufferPosition, })
  .bindBuffer({index: 1, bufferColor, });
```

When binding the buffers, index should be equal to the corresponding varying entry in `varyings` array passed to `Program` constructor.

Buffers can also be bound using varying name and varyingMap that can be retrieved from `Model` object.

```js
const transformFeedback = new TransformFeedback(gl, {
  buffers: {
    outputColor: bufferColor,
    gl_Position: bufferPosition
  },
  varyingMap: model.varyingMap
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

Running program (drawing) with explicit activation of transform feedback
```js
transformFeedback.begin();
model.draw({...});
transformFeedback.end();
```

Turning off rasterization
```js
const parameters = {[GL.RASTERIZER_DISCARD]: true}
model.draw({..., transformFeedback, parameters});
```


## Methods

### constructor

* `gl` - (`WebGL2RenderingContext`) gl - context
* `opts` - (`Object`={}) - options
  * `buffers` - buffers that gets bound to `TRANSFORM_FEEDBACK_BUFFER` target for recording vertex shader outputs.
  * `varyingMap` - Object mapping varying name to buffer index it needs to be bound.

WebGL APIs [`gl.createTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createTransformFeedback)

### delete

WebGL APIS [`gl.deleteTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteTransformFeedback)

### bindBuffer

WebGL APIs [`gl.bindBufferBase`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferBase), [`gl.bindBufferRange`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferRange)

### begin(primitiveMode)

Activates transform feedback using the buffer bindings in this `TransformFeedback` object.
Buffers can not be accessed until `TransformFeedback.end` or `TransformFeedback.pause` have been called.

Buffers can not be changed until `TransformFeedback.end` or has been called.

Doing anything which reads from or writes to any part of these buffers (outside of feedback writes, of course).

Reallocating storage for any of these buffers. This includes invalidation.

```js
begin(primitiveMode)
```
* `primitiveMode` (`GLenum`) -
returns (`TransformFeedback`) - returns self to enable chaining

| `Transform Feedback primitiveMode | Compatible Draw Modes |
| ---            | --- |
| `GL.POINTS`	 | `GL.POINTS` |
| `GL.LINES`	 | `GL.LINES`, `GL.LINE_LOOP`, `GL.LINE_STRIP` |
| `GL.TRIANGLES` | `GL.TRIANGLES`, `GL.TRIANGLE_STRIP`, `GL.TRIANGLE_FAN` |

WebGL APIs [`gl.beginTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/beginTransformFeedback)

### pause()

Pauses transform feedback operations. When paused, transform feedback is still considered active and changing most transform feedback state related to the object results in an error. However, a new transform feedback object may be bound while transform feedback is paused.

The current program can be changed and so forth. Feedback operations can be paused indefinitely, and it is legal to read from buffers that are in a paused feedback operation (though you need to unbind the feedback object first).

Returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [`gl.pauseTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/pauseTransformFeedback)

### resume()

Resumes TranformFeedback

Bind the exact program that was used when TransformFeedback.begin was called.

returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [`gl.resumeTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/resumeTransformFeedback)

returns (`TransformFeedback`) - returns self to enable chaining

### end()

returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [`gl.endTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/endTransformFeedback)


## See also

* `Program` constructor - `varyings` argument to specify which
* `Program.varyings` - contains a map of the indices of


## Parameters

None


## Limits

| Limit | Value | Description |
| --- | --- | --- |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS` | >=4 | total number of variables that can be captured }
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS` | >=4 | number of components that any particular variable can contain |
| `GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` | >= 64 |  total number of components in interleaved capture |
| `GL.MAX_TRANSFORM_FEEDBACK_BUFFERS` | TBD | Advanced interleaving total number of buffers |


## Remarks

* All of the indexed `GL.TRANSFORM_FEEDBACK_BUFFER` bindings. So all calls to `Buffer.bindBase` or `Buffer.bindRange` with `{target: GL.TRANSFORM_FEEDBACK_BUFFER, ...}` will attach the given region of the buffer to the currently bound feedback object.
* Whether the transform feedback is active and/or paused.
* About `TransformFeedback` activation caveats
    * When activated, `TransformFeedback` are coupled to the "current" `Program`
* Note that a started and unpaused TransformFeedback prevents the app from changing or re-linking the current program. So for instance, `Program.use` (`gl.useProgram`) cannot be called.
