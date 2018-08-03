# RFC: WebGL1 support for Trasnform.

* **Author**: Ravi Akkenapally
* **Date**: Aug, 2018
* **Status**: **Review**

Notes:
* PR: TODO


## Overview

With the introduction of `Transform` class, luma.gl provided an easy to use API around WebGL2's complicated TransformFeedback API and also the ability to manage/create several other WebGL resources internally. This allows applications to offload complex operation to GPU and run in parallel while making CPU available for other tasks. But this class is limited to WebGL2 context and cannot be used with WebGL1 context. In this RFC we propose an implementation to support this class for WebGL1 context.

## Main idea

We should be able to setup a render pipeline (strictly using WebGL1 features), such that input parameters are provided as attributes to the VertexShader, inside VertexShader user provided operations are performed, and result is passed to FragmentShader, which writes the result to a pixel as fragment color.

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

### Inputs and Outputs

Under WebGL2, all inputs and outputs are luma.gl `Buffer` objects. Due to WebGL1 limitation of buffer API (no async Texture to Buffer API) supporting `Buffer` objects require a CPU GPU sync for writing results from texture (render target) into a `Buffer`  object. To avoid such a sync and able to run a sequence of Transform operations (run -> swap -> run ...) we need to support luma.gl `Texture` objects as inputs and outputs.

#### Textures as inputs outputs

This has the advantage of avoiding sync between CPU and GPU, but its not free. The vertex shader `vs` provided by the user, needs to either have texture sample instructions to read the input or some be inserted by the system under the hood (shader injection ?).

First phase can be implemented by always reading from Texture into a Buffer and then explore and extend the API to support `Textures`.

TODO: code samples supporting `Textures`.

### Vertex Processing

Idea is to treat each input parameter as an attribute of a vertex and render all vertices as `gl.POINTS`. And perform required operations in Vertex Shader and pass the result into Fragment Shader as a varying. But to be able to place this result onto a single corresponding pixel, we need to also set `gl_Position` value in vertex shader. This position attribute can be internally calculated based on number of elements and set on vertex shader.

### Fragment Processing

Fragment shader will be just a pass through shader, it will move varying value into `gl_FragColor`.

NOTE: Given this effort is to support WebGL1, all shaders must be in GLSL100 syntax.

## Limitations

### Ouput (one vec4)

There can only be one vec4 (four component vector) output. When using WebGL2 TransformFeedback API, there can be more than one varying that can be captured into a Buffer. But given we are using full render cycle to render into color buffer, output is limited to one vec4.

### GPU CPU sync

Under WebGL2, `Transform` allows data to remain on GPU memory and be consumed by the render cycles without syncing with the CPU. But under WebGL1, we need to perform readPixels after every run, resulting in CPU and GPU sync.

## Conclusion:

Even though there are limitations, making Transform work on WebGL1 has a big potential, we will be able make `Transform` dependent features (Attribute transitions) and demos (Wind demo, particle simulations) available to WebGL1 contexts. And also all `Transform` based shader module unit testing can also be run under WebGL1.
