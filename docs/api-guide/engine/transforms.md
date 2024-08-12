# GPU Computations and Transforms 

Some operations can be very efficiently executed on the GPU.

WebGPU offers extensive GPU compute capabilities via compute shaders, while WebGL is limited to using a technique called "transform feedback".

| Type              | WebGPU | WebGL | Comment                        |
| ----------------- | ------ | ----- | ------------------------------ |
| Compute Shader    | ✅      | ❌     |                                |
| Buffer Transform  | ❌      | ✅     | Depends on `TransformFeedback` |
| Texture Transform | ✅      | 🚧     |                                |


### General GPU compute guidelines

Buffers can be read back to the CPU, but this has a high performance penalty. 
Ideally, the application's logic can be designed so that CPU access is not required which avoids expensive CPU and GPU sync.

### Compute Shaders

### Buffer Transforms (aka Transform Feedback)

Transform operations represent a GPGPU/GPU compute technique where standard GPU draw calls are configured 
so that they also write some specific outputs from the vertex shaders to (one or more) GPU memory buffers 
that have been provided by the application.

Transform Feedback operations write their output into `Buffer` instances. 
These buffers can then be directly set as attributes on `Model` or `VertexArray` for regular rendering operations.

To run a single transform feedback operation:

- Create a `Program` or a `Model` with varyings (`out` variables) declared in the vertex shader's GLSL code, and provide the names of these varyings to the `Program` constructor.
- Use `Program.draw()` or `Model.draw()` with a `transformFeedback` parameter.
- `Model.transform()` is equivalent to `Model.draw()` but automatically turns off the fragment shader stage.

The `BufferTransform` class is preferable to avoid having to deal with low-level WebGL specific `TransformFeedback` objects.

### Texture Transforms

Another approach for random access compute is Texture Transforms.
This approach stores input data in textures and writing to textures, and does not depend on the presence of the WebGL specific `TransformFeedback` class.

It has some characteristics in common with storage buffers in compute shaders but is less flexible.

## Usage

```typescript
import {BufferTransform} from '@luma.gl/engine';
```

### Use case : Specify source and destination buffers.

Create a `BufferTransform` object by passing, vs (vertex shader), source buffer(s), varyings (output variable names in vertex shader) and destination buffers. Then call `run` to perform one transform feedback iteration.

```typescript
const VS = `\
#version 300 es
attribute float inValue;
varying float outValue;

void main()
{
  outValue = 2.0 * inValue;
}
`;

const sourceData = new Float32Array([10, 20, 31, 0, -57]);
const sourceBuffer = device.createBuffer({data: sourceData});

// Default values applied for size (1) and type (gl.FLOAT)
const feedbackBuffer = device.createBuffer({byteLength: sourceData.length * 4});

const transform = new BufferTransform(device, {
  sourceBuffers: {
    inValue: sourceBuffer
  },
  feedbackBuffers: {
    outValue: feedbackBuffer
  },
  vs: VS,
  varyings: ['outValue'],
  elementCount: 5
});

// Perform one transform feedback iteration
transform.run();
```

### Use case : Create destination buffers automatically.

`BufferTransform` can internally create destination buffers (i.e. feedback buffers), when `feedbackMap` is provided. Each destination buffer is created with same settings and layout as corresponding source buffer as per `feedbackMap`.

```typescript
const transform = new BufferTransform(device, {
  sourceBuffers: {
    inValue: sourceBuffer
  },
  feedbackMap: {
    inValue: 'outValue'
  },
  vs: VS,
  varyings: ['outValue'],
  elementCount: 5
});
```

### Use case : Multiple iterations using swap().

When `feedbackMap` is specified buffers can be swapped using a single call to `swap()`, this is useful for cases like particle simulation, where output of one transform feedback iteration is piped as input to the next iteration.

```typescript
// Setup BufferTransform with `souceDestinationMap` as above

transform.run();

let bufferWithNewValues = transform.getBuffer('outValue');
...
// Render using 'bufferWithNewValues'
...

//swap buffers
transform.swap();
transform.run();
bufferWithNewValues = transform.getBuffer('outValue');
...
// Render using 'bufferWithNewValues'
...
```

### Use case : Update one or more buffers using update() method..

Once `BufferTransform` object is constructed and used, one or more source or destination buffers can be updated using `update`.

```typescript
// transform is set up as above
...

// update buffer binding for 'inValue' attribute
const newSourceBuffer = new Buffer(gl, {data: newSourceData});
transform.update({
  sourceBuffers: {
    inValue: newSourceBuffer
  }
});

// now data is provided from newly bound buffer.
transform.run();
```
