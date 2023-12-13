# TransformFeedback

> NOTICE: `TransformFeedback` is only available in WebGL 2.

`TransformFeedback` objects hold state needed to perform [WebGLTransformFeedback](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTransformFeedback) operations, which capture the output of a vertex shader to varyings in a buffer. Each `TransformFeedback` object holds buffer bindings used to store output, allowing applications to switch between different `TransformFeedback` objects and update bindings, similar to how `VertexArrayObjects` hold input vertex buffers.

`TransformFeedback` objects must assigned to a `Model` with the appropriate varyings. Some caveats apply, see [remarks](#remarks).

When using transform feedback, it is usually desirable to turn off rasterization to prevent the fragment shader from running unnecessarily. This can be achieved by setting the `discard: true` option when creating a render pipeline.

For more information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Transform_Feedback).

## Usage

Create a `Model` for transform feedback operations.

```typescript
return new Model(device, {
  vs,
  fs,
  vertexCount,
  topology: 'point-list'
  attributes: {inValue: buffer},
  bufferLayout: [{name: 'inValue', format: 'float32'}],
  varyings: ['outValue'],
});
```

Create a `TransformFeedback` and assign output buffers.

```typescript
const transformFeedback = device.createTransformFeedback({
  layout: model.pipeline.shaderLayout,
  buffers: {0: positionBuffer, 1: colorBuffer}
});

model.setTransformFeedback(transformFeedback);
```

When binding the buffers, index should be equal to the corresponding varying entry in `varyings` array passed to `Model`. Buffers can also be bound using varying name, and resolved using the model's associated `Pipeline` and `ShaderLayout`.

```typescript
const transformFeedback = device.createTransformFeedback({
  layout: model.pipeline.shaderLayout,
  buffers: {
    outputColor: bufferColor,
    gl_Position: bufferPosition
  }
});
```

To run a `TransformFeedback` operation, draw a Model with an associated `TransformFeedback`. Optionally, set `discard` to avoid unnecessary
rasterization while performing the operation.

```typescript
const renderPass = device.beginRenderPass({discard: true});

model.draw(renderPass);

renderPass.end();
```

## Properties

- `.bindOnUse` = `true` - If true, binds and unbinds buffers before and after use, rather than right away when set. Workaround for a possible [Khronos/Chrome bug](https://github.com/KhronosGroup/WebGL/issues/2346).

## Methods

### constructor(device : WebGLDevice, props: TransformFeedbackProps)

Requires a WebGL 2 device. See `TransformFeedbackProps` for props. `TransformFeedback` instances should be created by `Device#createTransformFeedback`, rather than using the constructor directly.

WebGL APIs [`gl.createTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/createTransformFeedback)

Props:

- `props.layout` = (`ShaderLayout`) - Layout of shader (for varyings)
- `props.buffers` = (Object) - Map of location index or name to Buffer or BufferRange object. Used for varyings. If buffer parameters object is supplied, it contains following fields.
  - `buffer` = (`Buffer`) - Buffer object to be bound.
  - `byteOffset`= (Number, default: 0) - Byte offset for writes into the buffer.
  - `byteLength`= (Number, default: buffer.byteLength) - Byte length, from offset, available for writes into the buffer.

Notes:

- `buffers` - will get bound to indices in the `GL.TRANSFORM_FEEDBACK_BUFFER` target.

### destroy() : void

Destroys a `TransformFeedback` object.

WebGL APIs [`gl.deleteTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/deleteTransformFeedback)

### setBuffers(buffers: Object) : void

- `buffers` = (Object) - Map of location index or name to Buffer or BufferRange object. Used for varyings. If buffer parameters object is supplied, it contains following fields.
  - `buffer` = (Buffer) - Buffer object to be bound.
  - `byteOffset` = (Number, default: 0) - Byte offset for writes into the buffer.
  - `byteLength` = (Number, default: buffer.byteLength) - Byte length, from offset, available for writes into the buffer.

Notes:

- To use `gl.bindBufferRange`, `byteLength` must be specified. When not specified, `gl.bindBufferBase` is used for binding.

WebGL APIs [`gl.bindBufferBase`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferBase), [`gl.bindBufferRange`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bindBufferRange)

### begin(topology : PrimitiveTopology = 'point-list') : void

Activates transform feedback using the buffer bindings in this `TransformFeedback` object.

- `primitiveMode` (`PrimitiveTopology`) - See WebGPU's [GPUPrimitiveTopology](https://www.w3.org/TR/webgpu/#enumdef-gpuprimitivetopology).

Notes:

- Buffers can not be accessed until `TransformFeedback.end` or `TransformFeedback.pause` have been called.
- Buffers can not be changed until `TransformFeedback.end` or has been called, which includes doing anything which reads from or writes to any part of these buffers (outside of feedback writes, of course, or reallocating storage for any of these buffers).

WebGL APIs [`gl.beginTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/beginTransformFeedback)

### end() : void

Ends transform feedback operation, allowing access and changes to Buffers.

WebGL APIs [`gl.endTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/endTransformFeedback)

## Enumerations

| Primitive Mode | Compatible Draw Modes |
| -------------- | -------------------------------------------------------- |
| `point-list`    | `point-list`                                            |
| `line-list`     | `line-list`, `line-strip`, `line-loop-webgl`            |
| `triangle-list` | `triangle-list`, `triangle-strip`, `triangle-fan-webgl` |

## Limits

| Limit                                              | Value | Description                                                   |
| -------------------------------------------------- | ----- | ------------------------------------------------------------- |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS`       | >=4   | total number of variables that can be captured }              |
| `GL.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS`    | >=4   | number of components that any particular variable can contain |
| `GL.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` | >= 64 | total number of components in interleaved capture             |
| `GL.MAX_TRANSFORM_FEEDBACK_BUFFERS`                | TBD   | Advanced interleaving total number of buffers                 |

## Remarks

About `TransformFeedback` activation caveats

- When activated, `TransformFeedback` is coupled to the current `Model`.
- `TransformFeedback#begin` prevents the app from changing or re-linking the current program. So for instance, `Program.use` (`gl.useProgram`) cannot be called until after calling `TransformFeedback#end`.
