# Hello Triangle

[Setup](https://luma.gl/next/docs/tutorials.md)[Triangle](https://luma.gl/next/docs/tutorials/hello-triangle.md)[Cube](https://luma.gl/next/docs/tutorials/hello-cube.md)[Instancing](https://luma.gl/next/docs/tutorials/hello-instancing.md)

**Goal:** create one `Model` and issue a portable draw call. Complete [Getting Started](https://luma.gl/next/docs/getting-started.md) before this lesson.

<!-- -->

The example should display a red triangle. Switch backends above the canvas to verify that the same application code runs with WebGPU and WebGL2.

## The mental model[​](#the-mental-model "Direct link to The mental model")

A `Model` gathers the state required for one draw: shaders, topology, vertex and instance counts, buffer layouts, attributes, bindings, and render parameters. It is a durable object; the animation loop draws it into a short-lived `RenderPass` each frame.

This first model does not need a vertex buffer. Both shaders use the built-in vertex index to select three clip-space positions. The WebGPU backend consumes WGSL and the WebGL2 backend consumes GLSL, while the model and render loop are shared.

## Follow the frame[​](#follow-the-frame "Direct link to Follow the frame")

1. `makeAnimationLoop` creates the best available device from the supplied adapters.
2. The animation loop constructs the application with that device.
3. `onRender` begins a render pass and clears its color attachment.
4. `model.draw(renderPass)` records the draw.
5. Ending the pass allows the device to submit and present the frame.

**Runnable source**[View on GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-triangle)

```
// Loading canonical example source…
```

## Common problems[​](#common-problems "Direct link to Common problems")

* A shader compilation error normally identifies WGSL or GLSL source and line number in the browser console.
* A blank canvas with no error often means the model was not drawn inside an active pass.
* If only one backend fails, use the backend selector to isolate the shader or feature that is not portable.

## Summary[​](#summary "Direct link to Summary")

You created a model, provided backend-appropriate shaders, and drew it through the same render-pass API. Next, [Hello Cube](https://luma.gl/next/docs/tutorials/hello-cube.md) adds geometry, textures, depth testing, and uniforms.
