# RFC: Enhanced, easy to use Transform Feedback API

* **Author**: Ravi Akkenapally
* **Date**: Feb, 2017
* **Status**: **Implemented**

Notes:
* Please add comments as reviews to the [PR](https://github.com/visgl/luma.gl/pull/398)


## Overview

One of the luma.gl goals is to provide easier interface on top of the complicated WebGL API. WebGL2 introduced a new feature "Transform Feedback" and luma.gl provides a wrapper around it. But in real world, using Transform Feedback still requires several state settings and object creations, which complicates using this new feature. This is an attempt to provide much easier API that takes minimum required data, deduces additional information when needed and provides methods that cover most use cases.


## Motivation

Performing Transform feedback operations typically require following steps :

1. [**Setup a `Model` or `Program`**] : Create `Model` or `Program` object, provide vertex shader and a pass through fragment shader. Provide a varyings array to specify what outputs need to be recorded.

2. [**Setup `TransformFeedback`**] : Create a `TransformFeedback` object, providing `varyingMap` object that can be retrieved from either `Model` or `Program` object.

3. [**Setup Buffers**] : Create `Buffer` objects for source and Destination buffers. Bind source buffers to correct attributes on `Model` or `Program` object. And Bind destination buffers on `TransformFeedback` object to correct binding index that matches `varyings` array passed to `Model` or `Program` object creation.

4. [**Perform Transform Feedback operations**] : Perform `draw` operation on `Model` or `Program` object.

5. [**Swap buffers and re-run**] : In some use cases, typically particle simulation (like deck.gl wind demo), application consume the data in destination buffers after transform feedback operations are done, swap source and destination buffers and re-run the operations, and repeat.


## Proposed: Add new `Transform` class

This new class can encapsulate all required objects, `Model`, `Program` and `TransformFeedback` and provide an easier interface.

`Transform` class can just take vertex shader , source buffers and optionally destination buffers. Internally it creates all required objects and provides following two methods to perform operations.

### constructor()

It takes Vertex Shader, source buffers and varyings.
* If destination buffers not provided, new buffers are created with same attributes of corresponding source buffer.
* Varyings information can be provided as an Array or as a Map of attributes to varyings. In any case varyings information is deduced and used accordingly.

### run()

Runs one iteration of transform feedback operation.

### swap()

Swap source destination buffers.


## Usage:

Create `Transform` object with sourceBuffers, feedbackMap and number of elements to process.

```typescript
const bufferLayout = new Transform(gl2, {
  sourceBuffers: {
    inValue: sourceBuffer
  },
  feedbackMap: {
    inValue: 'outValue'
  },
  vs: VS,
  elementCount: 5
});

```

Destination buffers and varying map required to perform transform feedback operations are internally created.

Perform one iteration of transform feedback.

```typescript
bufferLayout.run();
```

If needed switch all buffers with one call and re-run.

```typescript
bufferLayout.swapBuffers();

// Consume destination buffer data.

bufferLayout.run();
```

Now destination buffers can be retrieved and used as to set attribute buffers or data can be processed by CPU using `Buffer.getData`.

```typescript
bufferWithNewData = bufferLayout.getBuffer('outValue');
newData = bufferWithNewData.getData();
```


## Possible improvements:

### Input Functions:

Current model proposes a vertex shader (String), instead we can define a set of methods (like, mul, add, etc) and set of data types they operate on (scalar, vector2, etc), and input can be any combination of these instructions, or a Javascript function.
* This approach also avoids an issue of matching version string between input vertex shader and `Transform` class generated passthrough fragment shader, since both are built by the class.

### Integration with Shader Module system:

When a list of Modules can be taken as input and assembled with vertex shader, before running transform feedback operations.
* Only vertex shader specific modules can be supported.


## Conclusion:

This new class provides much easier interface and encapsulates all required objects. It auto deduces information, creates buffers when needed and provides convenience methods to perform usual tasks.
