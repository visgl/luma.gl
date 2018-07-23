# GPGPU Roadmap


## Overview

The vision for our GPGPU support is a collection of code that make it easy to access the power of the GPU from JavaScript. This support code is expected to be provided in the form of JavaScript classes and shader code and shader modules, together with examples and docs.

Use cases include:

* TransformFeedback
* Textures (2D and 3D)
* Integer Arithmetic
* Compute Focused Shader Modules
* Unit Testing for Shaders

In general, we will want to expose ourselves to/play with lots of existing code that does GPU compute, to study patterns, refactor code into reusable functions and classes, and move the most promising of those to our gpgpu library.


## Possible Tasks

### Shader Module Unit Testing Framework

Today we have a test suite for the fp64 shader module only. It contains some rather hacky code to get data between GPU and CPU (using textures) so that assertions can be made on the GPU. This code should be generalized so that it is easy (trivial) to add unit tests to all our shader modules.

### Add Unit Tests to all Shader Modules

See previous.

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

Applications
deck.gl - Precalculate WebMercator Transformations
Currently the same lng/lats are reprojected every frame.

Why not use GPGPU to do initial projection as soon as the attribute has been updated?
If we do it using a nice GPGPU abstraction the code should remain clean and maintainable.


## GPGPU Use Cases and API Exploration

### Attribute mapping

Luma.gl can provide an API which internally uses  TF (WebGL2) or Float textures (WebGL1) to perform mapping of input data. The output can be an array of data items or handle to one or more Buffer objects.

Input:

```
[ {id: “data-1”, data: lngLatData, type: FLOAT, size: 2}, {id: “data-2”, data: Colors, type: FLOAT, size: 3} , etc..]
```

Input: Mapping function : shader code that performs the mapping
Output:

```
[ {id: “data-1”, handle: buffer1 (instance of Buffer)}, {id: “data-2”, handle: buffer2]
```

Notes: This is a general API in luma.gl, we can use this to perform Mercator projections in deck.gl and re-use on every frame, it will be re-run only when needed (data change, viewport change, etc)

Info Viz: Marching squares.
This will need texel write, so just TF is not enough. First need to make aggregation work.

Info Viz: Graph Edge bundling.

Grid aggregation:
Current setup
Each point [lon, lat] is projected to screen space.
Hexgon radius is set
Using “d3-hexbin” module each point is mapped to a hex bin (defined by centroid and set of point belong to it).
Possible steps
Replace a-i with TF run:  Input : vec2, Output: vec2, in VertexShader do the projection. Perform Buffer.getData.
Use FS and Float texture with two pass rendering : Ref: https://developer.nvidia.com/gpugems/GPUGems2/gpugems2_chapter32.html 
Perform projection of each point to screen co-ordinates (x, y) (float vec2)
Find out which hexagon (x, y) belongs to, map the hexagon to pixel on the texture, so a value (1,0,0) can be rendered with additive blending to that pixel. This has to be done in VS since we are changing the position and we need to render points to a frame buffer, where each point gets rendered to a single pixel.
In the second pass loop over each pixel of this texture to see how many points belong to that texel, which is number of points.
Unknowns/Yellow flags
Hexgons are binned using d3-hexbin module, this alogrithm need to be implemented in GLSL shader.
Mapping each centroid into a single pixel in VS


## Ideas: For Discussion

### Optimized f64 projection module

We are not able to enable fp64 flag on some of our applications (like heaven) due to vast geometry being run through VS transformations. Existing clipping seem to be not enough, so this method explores an idea of clipping early.

In optimized fp64 project module, we can first perform f32 projection and compare these screen space location against viewport (passed as uniforms), if it passes perform f64 projection, if not treat this vertex differently , two possible ways as explained below:
Idea1: For each vertex processed add a varying which will contain 1.0 if inside viewport, if not 0. In FS we can check this varying, if 0, discard the fragment early.

Idea2: Using TF generate two buffers, one containing vertices that passed and the other containing that failed. (this might not handle the cases that are partially visible)



## Appendix: Previous Work

Work items that have been completed are placed here

### TransformFeedback: Clear up the Confusion! (DONE)

The luma.gl v5 TF API should be solid, although we keep hearing suggestions it is not. This Likely a mix of TF being hard to understand and some remaining minor bug.

Actions
* Talk to all team members and understand why TF is considered broken
* Provide better luma.gl examples showing API usage
* Write better docs
* Fix any remaining bugs in TransformFeedback / Buffer classes
* Update any TF code/PRs: Wind example and Attribute animation




