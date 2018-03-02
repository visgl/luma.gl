# Transform (Experimental)

The `Transform` class provides easy interface to perform Transform Feedback operations on given data. Applications can use this class to move data processing from CPU to GPU, where multiple parallel execution units will be used for processing. Data is handled in form of `Buffer` objects, i.e. data resides in the GPU memory. Output of this class can directly set as attributes on `Model` or `VertexArray` for regular rendering operations, CPU access is not required hence avoids expensive CPU and GPU sync.

 `Transform` class creates and holds `Model` and `TransformFeedback` instances. This class is only supported when using `WebGL2RenderingContext`.

| **Method**      | **Description** |
| ---             | --- |
| `constructor`   | creates a `Transform` object |
| `update` | Update some or all buffer bindings |
| `run`           | Performs one iteration of TransformFeedback |
| `swapBuffers`   | Swaps source and destination buffers |
| `getBuffer`     | Returns current destination buffer of given varying |

## Usage

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
const destinationBuffer = new Buffer(gl, {
  bytes: sourceData.length * 4
});

const transform = new Transform(gl2, {
  sourceBuffers: {
    inValue: sourceBuffer
  },
  destinationBuffers: {
    outValue: destinationBuffer
  },
  vs: VS,
  varyings: ['outValue'],
  elementCount: 5
});

// Perform one transform feedback iteration
transform.run();
```

### Use case : Create destination buffers automatically.

`Transform` can internally create destinationBuffers, when `sourceDestinationMap` is provided. Each destination buffer is created with same settings and layout as corresponding source buffer as per `sourceDestinationMap`.

```js
const transform = new Transform(gl2, {
  sourceBuffers: {
    inValue: sourceBuffer
  },
  sourceDestinationMap: {
    inValue: 'outValue'
  },
  vs: VS,
  varyings: ['outValue'],
  elementCount: 5
});

```
### Use case : Multiple iterations using swapBuffers().

When `sourceDestinationMap` is specified buffers can be swapped using a single call to `swapBuffers()`, this is useful for cases like particle simulation, where output of one transform feedback iteration is piped as input to the next iteration.

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

## Methods

### constructor

Constructs a `Transform` object, creates `Model` and `TransformFeedback` instances. It then creates destination buffers if needed and binds the buffers to `Model` and `TransformFeedback` objects.

* `gl` (`WebGL2RenderingContext`) gl - context
* `opts` (`Object`={}) - options
  * `sourceBuffers` (`Object`) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Buffer` object.
  * `destinationBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Buffer` object.
  * `vs` (`String`) - vertex shader string.
  * `varyings` (`Array`) - Array of vertex shader varyings names.
  * `sourceDestinationMap` (`Object`, Optional) - key and value pairs, where key is a vertex shader attribute name and value is a vertex shader varying name.
  * `drawMode` (`GLEnum` = gl.POINTS, Optional) - Draw mode to be set on `Model` and `TransformFeedback` objects during draw/render time.
  * `elementCount` (`Integer`) - Number set to vertex count when rendering the model.

### delete

Deletes all owned resources, `Model`, `TransformFeedback` and any `Buffer` objects that are crated internally.

### update

Updates buffer bindings with provided buffer objects for one or more source or destination buffers.

* `sourceBuffers` (`Object`) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Buffer` object.
* `destinationBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader varying and value is the corresponding `Buffer` object.

### run

Performs one transform feedback iteration.

* `uniforms` (`Object` = {}, Optional) - Sets uniforms before rendering.

### swapBuffers

Swaps source and destination buffers.

### getBuffer

Returns current destination buffer corresponding to given varying name.

* `varyingName` (`String`) - varying name.
