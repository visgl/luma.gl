# Hello Cube

[Overview](https://luma.gl/docs/tutorials.md)[Triangle](https://luma.gl/docs/tutorials/hello-triangle.md)[Cube](https://luma.gl/docs/tutorials/hello-cube.md)[Instancing](https://luma.gl/docs/tutorials/hello-instancing.md)

**Goal:** expand the triangle model with geometry, a sampled texture, depth testing, and uniforms that change every frame.

<!-- -->

## From a draw to a scene object[​](#from-a-draw-to-a-scene-object "Direct link to From a draw to a scene object")

`CubeGeometry` supplies positions, texture coordinates, and indices. `Model` converts that geometry into GPU buffers and associates the attributes with the locations declared by the WGSL and GLSL vertex shaders.

A `DynamicTexture` begins loading the image immediately. The model binds it by name, so the WebGPU shader's `@binding(auto)` declarations and the WebGL2 sampler uniform can use the same JavaScript binding object.

## Updating uniforms[​](#updating-uniforms "Direct link to Updating uniforms")

The model-view-projection matrix changes every frame as the cube rotates. `UniformStore` maintains the typed CPU values and the corresponding managed GPU uniform buffer. The frame performs three steps:

1. Recalculate the matrix for the current aspect ratio and animation tick.
2. Call `setUniforms` with the new value.
3. Draw the model in a pass with color and depth attachments.

Depth writes and `less-equal` comparison ensure the cube's hidden faces do not overwrite nearer surfaces.

**Runnable source**[View on GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-cube)

```
// Loading canonical example source…
```

## Common problems[​](#common-problems "Direct link to Common problems")

* A black cube usually indicates that the image failed to load; check the asset URL.
* Distorted faces usually indicate an attribute layout that does not match the shader.
* Missing faces or incorrect overlap often means depth testing or the depth attachment is absent.

## Summary[​](#summary "Direct link to Summary")

You combined geometry, asynchronous texture data, bindings, uniforms, and depth state in one reusable model. Next, [Hello Instancing](https://luma.gl/docs/tutorials/hello-instancing.md) draws many objects with one model and one draw call.
