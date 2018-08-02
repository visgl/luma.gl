# Transform (WebGL2)

The `Transform` class provides easy interface to perform Transform Feedback operations on given data. Applications can use this class to move data processing from CPU to GPU, where multiple parallel execution units will be used for processing. Data is handled in form of `Buffer` objects, i.e. data resides in the GPU memory. Output of this class can directly set as attributes on `Model` or `VertexArray` for regular rendering operations, CPU access is not required hence avoids expensive CPU and GPU sync.

`Transform` class creates and holds `Model` and `TransformFeedback` instances.

This class is only supported when using `WebGL2RenderingContext`.


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

// Setup Transform with `feedbackMap` as above

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

## Constructor

### Transform(gl : WebGL2RenderingContext, props: Object)

Constructs a `Transform` object. It then creates destination buffers if needed and binds the buffers to `Model` and `TransformFeedback` objects.

* `gl` (`WebGL2RenderingContext`) gl - context
* `opts` (`Object`={}) - options
  * `sourceBuffers` (`Object`) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Attribute`, `Buffer` or attribute descriptor object.
  * `feedbackBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Buffer` object.
  * `vs` (`String`) - vertex shader string.
  * `modules` - shader modules to be applied.
  * `varyings` (`Array`) - Array of vertex shader varyings names. When not provided this can be deduced from `feedbackMap`. Either `varyings` or `feedbackMap` must be provided.
  * `feedbackMap` (`Object`, Optional) - key and value pairs, where key is a vertex shader attribute name and value is a vertex shader varying name.
  * `drawMode` (`GLEnum` = gl.POINTS, Optional) - Draw mode to be set on `Model` and `TransformFeedback` objects during draw/render time.
  * `elementCount` (`Integer`) - Number set to vertex count when rendering the model.

Notes:

* Internally, creates `Model` and `TransformFeedback` instances


### delete() : Transform

Deletes all owned resources, `Model`, `TransformFeedback` and any `Buffer` objects that are crated internally.


## Methods

### getBuffer(varyingName : String) : Buffer

Returns current destination buffer corresponding to given varying name.

* `varyingName` (`String`) - varying name.


### run({uniforms : Object, unbindModels : Object}) : Transform

Performs one transform feedback iteration.

* `uniforms`=`null` (`Object` = {}, Optional) - Sets uniforms before rendering.
* `unbindModels`=`[]` (Model[]) - Array of models whose VertexAttributes will be temporarily unbound during the transform feeback to avoid triggering a possible [Khronos/Chrome bug](https://github.com/KhronosGroup/WebGL/issues/2346).


### update(props) : Transform

Updates buffer bindings with provided buffer objects for one or more source or destination buffers.

* `props.sourceBuffers` (`Object`) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Attribute`, `Buffer` or attribute descriptor object.
* `props.feedbackBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader varying and value is the corresponding `Buffer` object.
* `props.elementCount` (`Integer`, Optional) - Number set to vertex count when rendering the model. If not supplied, the previously set element count is used.


### swapBuffers() : Transform

Swaps source and destination buffers. If buffer swapping is used, `sourceBuffers` supplied to the constructor and/or the `update` method must be `Buffer` objects.
