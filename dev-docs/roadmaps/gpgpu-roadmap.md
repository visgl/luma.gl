# GPGPU Roadmap

* **Authors**: Ib Green and Ravi Akkenapally

Status: Ongoing


## Overview

The vision for our GPGPU support is a collection of code that make it easy to access the power of the GPU from JavaScript. This support code is expected to be provided in the form of JavaScript classes and shader code and shader modules, together with examples and docs.

Use cases include:

* TransformFeedback
* Aggregation
* Contour generation
* Textures (2D and 3D)
* Integer Arithmetic
* Compute Focused Shader Modules
* Unit Testing for Shaders

In general, we will want to expose ourselves to/play with lots of existing code that does GPU compute, to study patterns, refactor code into reusable functions and classes, and move the most promising of those to our gpgpu library.

References

* Blog Post: [Automatic, GPU-based object highlighting in deck.gl Layers](https://medium.com/vis-gl/automatic-gpu-based-object-highlighting-in-deck-gl-layers-7fe3def44c89)


## Release Schedule

* v6.0 (deck.gl)- Jul 2018 - ScreenGridLayer with GPU based grid aggregation.
* v5.2 (luma.gl) - Apr 2018 - New Transform API, for GPGPU use cases.
* v5.1 (luma.gl) - Feb 2018 - Improved Transformfeedback API.
* v5.0 (deck.gl) - Dec 2017 - Automatic, GPU-based object highlighting in deck.gl Layers.


## vNext

### Shader Module Unit Testing Framework

Today we have a test suite for the fp64 shader module only. It contains some rather hacky code to get data between GPU and CPU (using textures) so that assertions can be made on the GPU. This code should be generalized so that it is easy (trivial) to add unit tests to all our shader modules.

### Add Unit Tests to all Shader Modules

See previous.

### Extend Transform to support WebGL1

Current Transform uses WebGL2 TransformFeedback API and only supported by WebGL2, extend this class to support WebGL1 using float textures, so Transform can be used under WebGL1 and WebGL2.

### Support Compute-Focused Shader Modules

The luma.gl shader module system has great potential as a building block for GPGPU. However currently it only supports specific `vs` or `fs` shaders which doesn’t fit. Add support for `cs` type shaders and change existing fp32 fp64 etc libs to use that.
Note: this is a shader packaging improvement, not a WebGL compute shader feature.

RFC

### Build out our library of Math Shader Modules

Fp32 and fp64 are great building blocks. We could add well-designed (api audited), reusable, documented shader modules for complex number support, interval arithmetic, root finding etc.

### Dynamic Discovery of GPU limitations

Today we sniff driver names to figure out if we need to flip on some fp64 patch path. Instead we could run a shader that checks whether the GPU is actually doing the right thing, and based on the result dynamically flip on the right flags.

This would likely be a simple extension of the Shader Unit Test framework.
Implement WebGL1 fallbacks (TransformFeedback / FloatingPoint textures)
There are a bunch of clever tricks (many available on github) to use textures instead of transform feedback, to encode floating points in RGBA etc. It could make sense to have such tricks packaged up and tested in a GPGPU library.
An application could be to make deck.gl attribute animation work under non-WebGL2 contexts.

Or make Wind example work on WebGL1

### Existing work

Study existing GPGPU frameworks. See if we can leverage/integrate or if there are good ideas that we can use.

* GPU.js - Break out GPGPU type code from Wind Example Lots of interesting code in the shaders. Some of it can likely be thought of as reusable GPGPU code.

Step 1: Reorganize code inside Wind Example

### Pre calculate WebMercator Transformations

Currently the same lng/lats are reprojected every frame. Why not use GPGPU to do initial projection as soon as the attribute has been updated? If we do it using a nice GPGPU abstraction the code should remain clean and maintainable.

### Contour generation on GPU

Marching Squares algorithm used for iso-lines and iso-bands is suitable for GPU implementation. Build Contour Layer that generates iso-lines and iso-bands on GPU.

### GridLayer add GPUAggregation support.

GPUGridLayer with limited features (compared to current GridLayer) is released as experimental layer in v6.0 that perform aggregation on GPU. Extend this layer to support remaining features (aggregation on user provided keys and support for min, max and average aggregation function)

### Graph Edge bundling

Perform edge bundling on GPU.

### Shader module for binning

Add a shader module that performs grid and hexgon binning on GPU. We can take existing shader code from GPU Aggregator for grid binning.

## Ideas: For Discussion

### Optimized f64 projection module

We are not able to enable fp64 flag on some of our applications (like heaven) due to vast geometry being run through VS transformations. Existing clipping seem to be not enough, so this method explores an idea of clipping early.

In optimized fp64 project module, we can first perform f32 projection and compare these screen space location against viewport (passed as uniforms), if it passes perform f64 projection, if not treat this vertex differently , two possible ways as explained below:
Idea1: For each vertex processed add a varying which will contain 1.0 if inside viewport, if not 0. In FS we can check this varying, if 0, discard the fragment early.

Idea2: Using TF generate two buffers, one containing vertices that passed and the other containing that failed. (this might not handle the cases that are partially visible)



## Appendix: Previous Work

Work items that have been completed are placed here

### GPU based object highlighting (Shipped in V5.0)

Picking shader module has been enhanced to support custom and automatic object highlighting. Check [Blogpost](https://medium.com/vis-gl/automatic-gpu-based-object-highlighting-in-deck-gl-layers-7fe3def44c89) for more details.

### TransformFeedback: Clear up the Confusion! (Shipped in v5.1)

The luma.gl v5 TF API should be solid, although we keep hearing suggestions it is not. This Likely a mix of TF being hard to understand and some remaining minor bug.

Actions
* Talk to all team members and understand why TF is considered broken
* Provide better luma.gl examples showing API usage
* Write better docs
* Fix any remaining bugs in TransformFeedback / Buffer classes
* Update any TF code/PRs: Wind example and Attribute animation

### Transform : Improved Transformfeedback API (Shipped in v5.2)

This new class provides an easy-to-use interface to Transform Feedback. It hides WebGL API complexity by internally creating and managing all required WebGL objects that are necessary to perform Transform Feedback operations. New demos and existing features (AttributeTransitions) are updated to use this newer class to reduce code complexity.

### ScreenGridLayer with GPU based grid aggregation. (deck.gl, shipped in v6.0)

ScreenGridLayer is updated to support aggregation on GPU. Depending on the data set aggregation on GPU can be 10-12X faster and capable of handling large data sets (MM) where CPU version freezes the UI.
