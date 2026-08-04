# Fundamentals

[Setup](https://luma.gl/next/docs/tutorials.md)[Triangle](https://luma.gl/next/docs/tutorials/hello-triangle.md)[Cube](https://luma.gl/next/docs/tutorials/hello-cube.md)[Instancing](https://luma.gl/next/docs/tutorials/hello-instancing.md)

This course builds a portable renderer one concept at a time. Every lesson includes a live example that can switch between WebGPU and WebGL2 when both backends support the feature. The files shown on each page are loaded from the runnable examples in this repository, so the documentation and tested code stay in sync.

Explore [Getting Started](https://luma.gl/next/docs/getting-started.md) to see what you can build, or open any live lesson immediately. When you are ready to run the examples locally, follow the [Installing guide](https://luma.gl/next/docs/developer-guide/installing.md). Familiarity with TypeScript and basic GPU concepts is helpful; the tutorials explain the luma.gl object model as it is introduced.

## Rendering foundations[​](#rendering-foundations "Direct link to Rendering foundations")

[1 · Beginner**Hello Triangle**Create a Model, supply portable shaders, and issue a draw inside a render pass.Model · shaders · render passes](https://luma.gl/next/docs/tutorials/hello-triangle)[2 · Beginner**Hello Cube**Add geometry, textures, depth testing, and uniforms that update every frame.Geometry · textures · uniforms](https://luma.gl/next/docs/tutorials/hello-cube)[3 · Intermediate**Hello Instancing**Draw many copies of one geometry using per-instance attributes.Buffers · layouts · instancing](https://luma.gl/next/docs/tutorials/hello-instancing)[4 · Intermediate**Lighting**Compose reusable shader functionality and supply material inputs.Shader modules · materials](https://luma.gl/next/docs/tutorials/lighting)

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

After the course, use [What's Next?](https://luma.gl/next/docs/tutorials/whats-next.md) to choose a deeper API guide or a larger example.
