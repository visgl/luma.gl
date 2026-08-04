# Fundamentals

[Overview](https://luma.gl/next/docs/tutorials.md)[Triangle](https://luma.gl/next/docs/tutorials/hello-triangle.md)[Cube](https://luma.gl/next/docs/tutorials/hello-cube.md)[Instancing](https://luma.gl/next/docs/tutorials/hello-instancing.md)

A living scene begins with a single draw call. Start with a triangle, add depth and light, then discover how the same rendering ideas scale into richer GPU-powered worlds. Every lesson includes a working example you can explore directly in your browser.

**Start with [Hello Triangle](https://luma.gl/next/docs/tutorials/hello-triangle.md). No installation required.**

When a feature supports both backends, its live example can switch between WebGPU and WebGL2. The source shown on each page comes directly from the runnable example, so you can move from what you see to how it works without leaving the lesson.

Curious where these fundamentals can take you? [Getting Started](https://luma.gl/next/docs/getting-started.md) shows complete scenes, simulations, visual effects, and GPU data workflows.

## Rendering foundations[​](#rendering-foundations "Direct link to Rendering foundations")

[1 · Your first draw**Hello Triangle**Create a Model, supply portable shaders, and issue a draw inside a render pass.Model · shaders · render passes](https://luma.gl/next/docs/tutorials/hello-triangle)[2 · Add a dimension**Hello Cube**Add geometry, textures, depth testing, and uniforms that update every frame.Geometry · textures · uniforms](https://luma.gl/next/docs/tutorials/hello-cube)[3 · Shape with light**Lighting**Compose reusable shader functionality and supply material inputs.Shader modules · materials](https://luma.gl/next/docs/tutorials/lighting)[4 · Scale the scene**Hello Instancing**Draw many copies of one geometry using per-instance attributes.Buffers · layouts · instancing](https://luma.gl/next/docs/tutorials/hello-instancing)

## Reusable shaders[​](#reusable-shaders "Direct link to Reusable shaders")

* [Shader Modules](https://luma.gl/next/docs/tutorials/shader-modules.md) package reusable shader code and typed inputs.
* [Shader Hooks](https://luma.gl/next/docs/tutorials/shader-hooks.md) expose deliberate extension points.
* [Shader Plugins](https://luma.gl/next/docs/tutorials/shader-plugins.md) combine modules, injections, and application configuration.

## GPU-driven updates[​](#gpu-driven-updates "Direct link to GPU-driven updates")

* [Transform](https://luma.gl/next/docs/tutorials/transform.md) runs data transformations on portable GPU resources.
* [Transform Feedback](https://luma.gl/next/docs/tutorials/transform-feedback.md) demonstrates the WebGL2-specific feedback path.
* [External WebGL Context](https://luma.gl/next/docs/tutorials/external-webgl-context.md) integrates luma.gl with an existing renderer.

## What the examples guarantee[​](#what-the-examples-guarantee "Direct link to What the examples guarantee")

* Tutorial application sources are typechecked by the repository test setup.
* The backend selector reflects the backends supported by each example.
* Full source links point to the same files rendered in the documentation.

After the course, use [What's Next?](https://luma.gl/next/docs/tutorials/whats-next.md) to choose a deeper API guide or a larger example. Ready to work with the code on your own machine? The [Installing guide](https://luma.gl/next/docs/developer-guide/installing.md) takes you from an empty project to your first rendered frame.
