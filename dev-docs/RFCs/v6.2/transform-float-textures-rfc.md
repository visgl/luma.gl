# RFC: Transform - Float textures support.

* **Author**: Ravi Akkenapally
* **Date**: Aug, 2018
* **Status**: **Review**

Notes:
* PR: TODO


## Overview

With the introduction of `Transform` class, luma.gl provided an easy to use API around WebGL2's complicated TransformFeedback API and also the ability to manage/create several other WebGL resources internally. This allows applications to offload complex operation to GPU and run in parallel while making CPU available for other tasks. But this class is limited `Buffer` objects, one or more `Buffer` objects can be used as inputs and result can be stored in one or more `Buffer` objects. In this RFC we propose support `Texture2D` objects as inputs and output.


## Use cases

Allowing a `Texture2D` object as input and/or output can help following use cases with minimal or no additional WebGL setup.

### Offline rendering

Ability to create or updated a`Texture2D` object from one or more `Buffer` or `Texture2D` objects.

### Filtering

Run a filter on GPU on one or more `Texture2D` object and crate a new `Texture2D` object.

### Contours

For contour generation, marching squares can be run on GPU, it takes threshold data as `Texture2D`, and outputs a `Buffer` with geometry needed to construct  iso-lines or iso-bands.


## Implementation details

### Textures as inputs

Data in a`Buffer` object can accessed in the vertex shader just by referring to corresponding input declaration. But to to access a `Texture2D` object we need to provide `Sampler2D` object, texture coordinates and sample instructions. `Transform` can internally generate all this and let user access the `Texture2D` contents in the same way as `Buffer`.

A new optional prop `sourceTextures` is added to `Transform` constructor options that takes one ore more `Texture2D` objects as inputs. User provided vertex shader accesses this texture in the same way as a `Buffer` input by defining an attribute and directly accessing it by attribute name.

```
const VS = `\
#version 300 es
in float inValueBuffer; // Buffer source
in float inValueTexture; // Texture source
out float outValue; // Data written into a Buffer

void main()
{
  // Input from texture is simply accessed by referring to the attribute name.
  outValue = inValueBuffer + inValueTexture;
}
`;

// prepare input
sourceBuffer = new Buffer(...);
sourceTexture = new Texture2D(...);

const transform = new Transform(gl2, {
  sourceBuffers: {
    inValueBuffer: sourceBuffer
  },
  sourceTextures: {
    inValueTexture: sourceTexture
  },
  feedbackBuffers: {
    outValue: feedbackBuffer
  }
  vs: VS,
  ...
});
```

`Transform` will add required shader code to get input from provided texture object, using new internal `transform` shader module, it will come with following GLSL functions.

```
#version 300 es

#define MODULE_TRANSFORM
in float transform_elementID; // attribute is internally setup by Transform based on elementCount.

// Given the size of a texture and current vertex number, returns corresponding texture coordinate
vec2 transform_getTexCoord(vec2 size, float elementID) {
  ...
}

// Given a sampler and corresponding texture size, return the value in the texture corresponding to the current element.
float transform_getInput(sampler2D sampler, vec2 size, float elementID) {
  ...
}
// END MODULE_transform

// Uniforms injected by Transform
uniform vec2 transform_uSize_inValueTexture; // texture size
uniform sampler2D transform_uSampler_inValueTexture; // texture sampler

// Disabled by Transform
// in float inValueTexture;


in float inValueBuffer; // Buffer source

out float outValue;

void main()
{
  // Injected by Transform
  float inValueTexture = transform_getInput(transform_uSampler_inValueTexture, transform_uSize_inValueTexture, transform_elementID);

  outValue = inValueBuffer + inValueTexture;
}

```

In addition to above shader changes, corresponding JS side changes are done to `Transform` class, to create and set attributes and uniforms and parse user provided shader and inject required code. And this code is only activated when there is at least one sourceTexture.

### Texture as output

A new optional `renderToTexture` prop added to `Tranfsorm` constructor options, when provided `Transform` will setup full render pipeline (not just Transform Feedback) and write specified output values into a Framebuffer object. `renderToTexture` option defines what varying should be written into Framebuffer object and how to create texture attachment for the Framebuffer object:

* {varyingName (String), texture (Texture2D, optional)} (Object) : `varyingName` defines what data to be written into Framebuffer, and `texture` when provided gets attached as color attachment. When `texture` is not provided, `feedbackMap` should contain an entry for `varyingName`, `Transform` can deduce required texture parameters (size, channel count) from corresponding source and internally create a `Texture2D` object. Vertex shader varying definition can also be used when needed to define the texture, if varying type is `vec2`, it implies 2 channel float texture i.e. RG32F texture.

New `transform` module also provides a method `vec2 transform_getPos(vec2 size)` which returns the pixel position of the current element being processed. This pixels position and above defined varying value is passed to Fragment shader which writes the value into Framebuffer object.


## Notes

* When processing textures of 1, 2 or 3 channels, we need to use R32F, RG32F and RGB32F. This feature requires luma.gl to support all these formats.

* `Transform` is WebGL2 only feature and so is this new enhancement.

* Initial implementation can be limited to Float values, hence only Float textures, but later can be extended to other types.

* Under GLSL 300, size of the texture and current vertex or instance ID are available to the shader, but in GLSL 100 this data is not available and should be provided to the shader as described above.


## Conclusion:

Ability to process textures using `Transform` makes it easy perform offline rendering and builds foundation to implement any GPGPU features that involve texture processing.
