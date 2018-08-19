# RFC: WebGL1 support for Trasnform.

* **Author**: Ravi Akkenapally
* **Date**: Aug, 2018
* **Status**: **Review**

Notes:
* PR: TODO


## Overview

With the introduction of `Transform` class, luma.gl provided an easy to use API around WebGL2's complicated TransformFeedback API and also the ability to manage/create several other WebGL resources internally. This allows applications to offload complex operation to GPU and run in parallel while making CPU available for other tasks. But this class is limited to WebGL2 context and cannot be used with WebGL1 context. In this RFC we propose an implementation to support this class for WebGL1 context.

## Main idea

We should be able to setup a render pipeline (strictly using WebGL1 features), such that input data is passed as textures to `VertexShader`, then each individual data items is accessed by performing a texture sample operation, apply user provided operations, and  pass the result to `FragmentShader`, which writes the result to a pixel as fragment color. A `readpixel` operation is performed for final results and returned.


## Environments

* Older browsers: sometimes support float textures
* Headless gl: only supports instancing, no other extensions.

## Implementation details

### Render target

Size of the target should be such that it has one pixel per each expected output. I.e. if user wants to perform an operation on two float array of size 10K , then render target should have at least 10K pixels. Type of render target :

#### Option#1 Framebuffer

We can create a texture and use it as color attachment to a `Framebuffer` object. There might be limitation on some of the browsers using FLOAT texture as render target, for example Safari doesn't support `WEBGL_color_buffer_float` hence a float texture can't be used as color attachment. We might be able to overcome this issue using recently added [pack](https://github.com/uber/luma.gl/blob/master/modules/imageprocessing/src/modules/pack.md) shader module of luma.gl.

#### Option#2 System color buffer

In this option, instead of using Framebuffer object we can use default render color buffer. This has no limitations regarding float type, but can't be used with other graphics applications that render to system provided color buffer. But can be used with applications that do not render anything, like data processing and unit testing etc.

We can start implementation with Option#1.

Once the render target is setup, and data is rendered we can use `gl.readPixels` to read the data.

### Inputs

Under WebGL2, all inputs are luma.gl `Buffer` objects. Due to WebGL1 limitation of buffer API (no async Texture to Buffer API) supporting `Buffer` objects require a CPU GPU sync for writing results from texture (render target) into a `Buffer`  object. To avoid such a sync and able to run a sequence of Transform operations (run -> swap -> run ...) we need to support luma.gl `Texture` objects as inputs and outputs.

Inputs can be specified in following three formats :

1. TypedArray (WebGL1 and WebGL2, ex: Float32Array, Uint8Array, etc)

When using WebGL1, internally `Texture` object is built with user provided `TypedArray` and used to provided input to the VertexShader.

2. Texture2D (WebGL1 and WebGL2)

Supported by both WebGL1 and WebGL2, but only the formats that are supported by WebGL context being used.

3. Buffer (WebGL2, luma.gl `Buffer` object)

Only supported in WebGL2 and set as `attributes` on the `VertexShader`.


* It is also possible to use any combination of above input methods when using WebGL2 and any combination of #1 and #2 when using WebGL1.

To achieve this flexibility a minor change is needed in how VertexShader source (`vs` parameter) is specified on `Tranform` object. In existing version `vs` needs to specify all inputs using `attributes` (GLSL100) or `in` (GLSL300), that should be now removed as explained in below sample code

#### Sample code

##### Current usage

```
const VS = `\
attribute float leftValue;
attribute float rightValue;
varying float outValue;

void main()
{
  outValue = leftValue + rightValue;
}
`;

...

const leftValueBuffer = new Buffer(gl, { ... });
const rightValueBuffer = new Buffer(gl, { ... });
const outValueBuffer = new Buffer(gl, { ... });

const transform = new Transform(gl, {
  sourceBuffers: {
    leftValue: leftValueBuffer,
    rightValue: rightValueBuffer,
  },
  vs: VS,
  feedBackBuffers: {
    outValue: outValueBuffer
  },
  varyings: ['outValue'],
  elementCount: 5
});
```

##### Proposed usage

VertexShader source shouldn't specify `attribute`/`in` input declaration.

```
const VS = `\
varying float outValue;

void main()
{
  outValue = leftValue + rightValue;
}
`;

```

When using `TypedArray` as inputs :

```
const leftArray = new Float32Array(gl, { ... });
const rightArray = new Float32Array(gl, { ... });

const transform = new Transform(gl, {
  sourceBuffers: {
    leftValue: leftArray,
    rightValue: rightArray,
  },
  vs: VS,
  varyings: ['outValue'],
  elementCount: 5
});

```

###### When using WebGL1

A `Texture2D` object is internally created for each source and used as `sampler2D` uniform. Additional attribute (`transform_elementID`) is added to generate texture coordinates sample individual input elements.

```
const leftValue = new Texture2D(gl, {data: leftArray, ...});
const rightValue = new Texture2D(gl, {data: leftArray, ...});
```

 Additional uniforms and sample instructions are inserted at the begging of the VertexShader.

 ```
 // Added uniforms
 uniform sampler2D transform_leftValue_uSampler;
 uniform sampler2D transform_rightValue_uSampler;
 uniform vec2 transform_uTextureSize;

 // Added attribute
 attribute float transform_elementID;

 varying float outValue;

 void main()
 {
   // Injected instruction
   const transform_texCoord = transform_getTexCoord(transform_elementID, transform_uTextureSize);
   leftValue = texture2D(transform_leftValue_uSampler, texCoord);
   rightValue = texture2D(transform_rightValue_uSampler, texCoord);

   outValue = leftValue + rightValue;
 }
 ```

In addition to above VertexShader changes, a passthrough FragmentShader is also used internally to write out data into FrameBuffer object.

```
const FS = `\
precision highp float;
varying float outValue;
void main(void) {
  // We will be packing float value into RGBA UNSIGNED_BYTE format
  gl_FragColor = vec4(outValue * colorScale, 0, 0, 1.);
}
`;
```

We will use newly added `pack` module to convert a Float value into RGBA UNSIGNED_BYTE format.

###### When using WebGL2

A `Buffer` object is internally created for each input.

```
const leftValueBuffer = new Buffer(gl, leftArray);
const rightValue = new Buffer(gl, rightArray);
```

And `attribute` definitions are injected into VertexShader. No other changes are needed.

```
const VS = `\

// Injected attribute definitions
attribute float leftValue;
attribute float rightValue;

varying float outValue;

void main()
{
  outValue = leftValue + rightValue;
}
`;
```

When using `Texture2D` as input, most of the above mentioned changes are applicable except, no need to create `Texture2D` objects from `TypedArray`.

### Outputs

Following 3 variants of output access API will be added.

1. getData(outputName) (WebGL1 and WebGL2)

Takes output element name, and returns TypedArray containing the value. When using WebGL1, a `Framebuffer.readPixels` is performed on current Framebuffer target. Note, only one output is supported. When using WebGL2, `Buffer.getData` is performed on corresponding `Buffer` object.

2. getTexture(outputName) (WebGL1 and WebGL2)

Takes output element name and returns corresponding `Texture2D` object.

3. getBuffer(outputName) (WebGL2)

Takes output element name and returns corresponding `Buffer` object.

* NOTE: Under WebGL2, there is flexibility of converting between Buffer and Texture objects without CPU and GPU sync using Pixel Buffer Objects.



### Vertex Processing

Idea is to treat each input parameter as an attribute of a vertex and render all vertices as `gl.POINTS`. And perform required operations in Vertex Shader and pass the result into Fragment Shader as a varying. But to be able to place this result onto a single corresponding pixel, we need to also set `gl_Position` value in vertex shader. This position attribute can be internally calculated based on number of elements and set on vertex shader.

### Fragment Processing

Fragment shader will be just a pass through shader, it will move varying value into `gl_FragColor`.

NOTE: Given this effort is to support WebGL1, all shaders must be in GLSL100 syntax.


## Offline Rendering (Bonus):

`Offline Rendering`, is the ability to create textures offline, and use them for purposes like special light effects, filtering, etc. This effort to make `Transform` work under WebGL1 also gives us an API for `Offline Rendering`.


## Limitations

### Ouput (one vec4)

When using WebGL2 TransformFeedback API, there can be more than one varying that can be captured into a Buffer. When using WebGL1 output is limited to a single float stream, FragmentShader can output a vec4, but we use all four channels to pack a single float value.

## Conclusion:

Even though there are limitations, making `Transform` work on WebGL1 has a big potential, we will be able make `Transform` dependent features (Attribute transitions) and demos (Wind demo, particle simulations) available to WebGL1 contexts and all `Transform` based shader module unit testing can also be run under WebGL1. And we can also use this API for `Offline Rendering`.
