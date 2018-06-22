# Transform Feedback (WebGL2)

Transform Feedback operations represent a GPGPU/GPU compute technique where GPU draw calls are configured so that they write some specified outputs from the vertex shaders to (one or more) GPU memory buffers that have been provided by the application. Applications use transform feedback to data processing from CPU to GPU, where multiple parallel execution units will be used for processing. Data is handled in form of `Buffer` objects, i.e. data resides in the GPU memory.

Transform Feedback operations write their output into `Buffer` instances. These buffers can then be directly set as attributes on `Model` or `VertexArray` for regular rendering operations.

Buffers can be read back to the CPU, but this has a high performance penaltyh. Ideally, the application's logic can be designed so that CPU access is not required which avoids expensive CPU and GPU sync.

To run a single transform feedback operation:

* Create a `Program` or a `Model` with varyings (`out` variables) declared in the vertex shader's GLSL code, and provide the names of these varyings to the `Program` constructor.
* Use `Program.draw()` or `Model.draw()` with a `transformFeedback` parameter.
* `Model.transform()` is equivalent to `Model.draw()` but automatically turns off the fragment shader stage.

Alternatively, the more powerful `Transform` class is preferable if you don't want to deal with setting up `Program` and `TransformFeedback` instances, or if intend to run a repeating, double buffered transform feedback loop.


## Usage

```js
import {_Transform as Transform} from 'luma.gl';
```

### Use case : Specify source and destination buffers.

Create a `Transform` object by passing, vs (vertex shader), source buffer(s), varyings (output variable names in vertex shader) and destination buffers. Then call `run` to perform one transform feedback iteration.

```js
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
const sourceBuffer = new Buffer(gl, {data: sourceData});

// Default values applied for size (1) and type (gl.FLOAT)
const feedbackBuffer = new Buffer(gl, {bytes: sourceData.length * 4});

const transform = new Transform(gl2, {
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

`Transform` can internally create destination buffers (i.e. feedback buffers), when `feedbackMap` is provided. Each destination buffer is created with same settings and layout as corresponding source buffer as per `feedbackMap`.

```js
const transform = new Transform(gl2, {
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
### Use case : Multiple iterations using swapBuffers().

When `feedbackMap` is specified buffers can be swapped using a single call to `swapBuffers()`, this is useful for cases like particle simulation, where output of one transform feedback iteration is piped as input to the next iteration.

```js

// Setup Transform with `souceDestinationMap` as above

transform.run();

let bufferWithNewValues = transform.getBuffer('outValue');
...
// Render using 'bufferWithNewValues'
...

//swap buffers
transform.swapBuffers();
transform.run();
bufferWithNewValues = transform.getBuffer('outValue');
...
// Render using 'bufferWithNewValues'
...
```

### Use case : Update one or more buffers using update() method..

Once `Transform` object is constructed and used, one or more source or destination buffers can be updated using `update`.

```js
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
