# TransformFeedback

`TransformFeedback` objects holds state needed to perform transform feedback operations. They store the buffer bindings that are being recorded to. This makes it easy to switch between different sets of feedback buffer bindings (somewhat similar to how `VertexArrayObjects` hold input vertex buffers.

The state managed by `TransformFeedback` objects includes the buffers the GPU will use to record the requested varyings.

The `TransformFeedback` also stores current count of primitives recorded in the current feedback operation, if it is active. See [`Query`]() for more information.

When `TransformFeedback` objects must be "activated" (`TransformFeedback.begin`) before it can be used. There a number of caveats to be aware of when manually managing `TransformFeedback` object activation, see the remarks. For this reason, luma.gl [`Program.draw`]() call takes an optional `TransformFeedback` object as a parameter and activates and deactivates it before and after the draw call.

Finally, note that when using transform feedback it is frequently desirable to turn off rasterization: `gl.enable(GL.RASTERIZER_DISCARD)` to prevent the fragment shader from running.

For more information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Transform_Feedback).


## Usage

Setting up a program for transform feedback.
```js
const program = new Program(gl, {
  vs,
  fs,
  varyings: ['gl_Position'],
});

Setting up a transform feedback object and binding buffers
```js
const program = new Program(gl, {
  vs,
  fs,
  varyings: ['gl_Position'],
});

transformFeedback.bindBuffers(program.varyings, {
  gl_Position: {buffer, offset},
  normals: {buffer: buffer, offset}
})
```

```js
const transformFeedback = new TransformFeedback(gl)
  .bindBuffer({index: 0, buffer, })
  .bindBuffer({index: 1, buffer, });
```

Running program (drawing) with implicit activation of transform feedback (will call `begin` and `end` on supplied `transformFeedback`)
```js
program.draw({
  drawMode,
  vertexCount,
  ...,
  transformFeedback
});
```

Running program (drawing) with explicit activation of transform feedback
```js
program.use();
transformFeedback.begin();
program.draw({...});
transformFeedback.end();
```

Turning off rasterization
```js
withSettings({[GL.RASTERIZER_DISCARD]: true]}, () => {
  program.draw({..., transformFeedback});
});
```


## Methods

### constructor

* `gl` (`WebGL2RenderingContext`) gl - context
* `opts` (`Object`=`{}`) - options

WebGL APIs [gl.createTransformFeedback]()

### delete

WebGL APIS [gl.deleteTransformFeedback]()

### bindBuffer

WebGL APIs [gl.bindBufferBase](), [gl.bindBufferRange]()


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

WebGL APIs [gl.beginTransformFeedback](), [gl.bindTransformFeedback]()

### pause()

Pauses transform feedback operations. When paused, transform feedback is still considered active and changing most transform feedback state related to the object results in an error. However, a new transform feedback object may be bound while transform feedback is paused.

The current program can be changed and so forth. Feedback operations can be paused indefinitely, and it is legal to read from buffers that are in a paused feedback operation (though you need to unbind the feedback object first).

TODO `program.use` must be called first to restore the program that was active?

Returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [gl.pauseTransformFeedback](), [gl.bindTransformFeedback]()

### resume()

Resumes TranformFeedback

Bind the exact program that was used when TransformFeedback.begin was called.

returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [gl.resumeTransformFeedback](), [gl.bindTransformFeedback]()

returns (`TransformFeedback`) - returns self to enable chaining

### end()

returns (`TransformFeedback`) - returns self to enable chaining

WebGL APIs [gl.endTransformFeedback](), [gl.bindTransformFeedback]()


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


## API Audit Notes

* Activation is tightly coupled to the current program. Since we try to encapsulate program.use, should we move these methods (begin/pause/resume/end) to the Program?

