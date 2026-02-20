# Transform 

:::danger
This page needs update for luma.gl v9
:::

The `Transform` class provides easy interface to perform Transform Feedback operations on given data. Applications can use this class to move data processing from CPU to GPU, where multiple parallel execution units will be used for processing. Data is handled in form of `Buffer` objects, i.e. data resides in the GPU memory. Output of this class can directly set as attributes on `Model` or `VertexArray` for regular rendering operations, CPU access is not required hence avoids expensive CPU and GPU sync.

`Transform` class creates and holds `Model` and `TransformFeedback` instances.

### Use case : Specify source and destination buffers.

Create a `Transform` object by passing, vs (vertex shader), source buffer(s), varyings (output variable names in vertex shader) and destination buffers. Then call `run` to perform one transform feedback iteration.

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
const sourceBuffer = new Buffer(gl, {data: sourceData});

// Default values applied for size (1) and type (gl.FLOAT)
const feedbackBuffer = new Buffer(gl, {byteLength: sourceData.length * 4});

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

```typescript
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

### Use case : Multiple iterations using swap().

When `feedbackMap` is specified buffers can be swapped using a single call to `swap()`, this is useful for cases like particle simulation, where output of one transform feedback iteration is piped as input to the next iteration.

```typescript
// Setup Transform with `feedbackMap` as above

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

Once `Transform` object is constructed and used, one or more source or destination buffers can be updated using `update`.

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

### Use case : Reading source data from texture object (Experimental)

In addition to reading data from Buffer objects, Transform can read from texture objects. Transform allows to access texture data in the same way as buffer data and internally generates required texture coordinates and sample instructions.

```typescript
// simple shader that adds data from a buffer and texture to generate new buffer.

const vs = `\
#version 300 es
in float inBuffer;
in float inTexture;
out float outBuffer;

void main()
{
  outBuffer = inTexture + inBuffer;
}`;

const sourceBuffer = new Buffer(...);
const sourceTexture = new Texture2D(...);

const transform = new Transform(gl2, {
  sourceBuffers: {
    inBuffer: sourceBuffer
  },
  // specify source texture object using input attribute name
  _sourceTextures: {
    inTexture: sourceTexture
  },
  vs,
  feedbackMap: {
    inBuffer: 'outBuffer'
  },
  elementCount
});

transform.run();

// resulting buffer contains sum of input buffer and texture data.
const outData = transform.getBuffer('outBuffer').getData();
```

### Use case : Generating a texture object (Experimental)

In addition to reading data from a texture object, Transform can generate texture object, by rendering data into it offline. Source data can be either buffer(s), texture(s) or any combination.

```typescript
const vs = `\
#version 300 es
in vec4 inTexture;
out vec4 outTexture;

void main()
{
  outTexture = 2. *  inTexture;
}
`
const sourceTexture = new Texture2D(...);
const transform = new Transform(gl2, {
  _sourceTextures: {
    inTexture: sourceTexture
  },
  _targetTexture: 'inTexture',
  _targetTextureVarying: 'outTexture',
  vs,
  elementCount
});

transform.run();

const outTexture = transform._getTargetTexture();
```