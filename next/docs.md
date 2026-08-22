# luma.gl Documentation

luma.gl is a TypeScript toolkit for high-performance GPU rendering and compute on the web. It provides one application-facing API with pluggable WebGPU and WebGL2 backends, plus higher-level building blocks for models, animation, shader composition, and GPU data processing.

Start with a live scene, follow the ideas behind a single rendered frame, and choose how much of the GPU you want to control. You can explore the examples and tutorials right here in your browser.

[npm package](https://www.npmjs.com/package/@luma.gl/core)[MIT license](https://github.com/visgl/luma.gl/blob/master/LICENSE)[TypeScript strict mode](https://www.typescriptlang.org/)

## Choose your starting point[​](#choose-your-starting-point "Direct link to Choose your starting point")

[New to luma.gl**Discover what you can build**Explore living worlds, physical simulations, visual effects, and GPU-powered data directly in your browser.No installation required](https://luma.gl/next/docs/getting-started)[Framework capabilities**Explore the complete feature set**See how GPU-native data, large-scale visualization, compute pipelines, portable rendering, and visual effects fit together.Packages, techniques, and maturity](https://luma.gl/next/docs/capabilities)[Learn**Follow the fundamentals**Build from a triangle to textured geometry, instancing, reusable shaders, and GPU transforms.Live, backend-switchable examples](https://luma.gl/next/docs/tutorials)[See it in action**Explore live GPU examples**Launch interactive scenes for lighting, oceans, fire, Gaussian splats, effects, and data visualization.Interactive examples in your browser](https://luma.gl/next/examples)[Design and concepts**Browse the API guides**Understand the Engine, portable GPU, and Shader APIs before choosing individual resources.Task-oriented explanations](https://luma.gl/next/docs/api-guide)[Look up details**Use the API reference**Find packages, classes, resource methods, accepted formats, and backend-specific behavior.Organized by npm package](https://luma.gl/next/docs/api-reference)

When you are ready to turn an idea into your own application, the [Installing guide](https://luma.gl/next/docs/developer-guide/installing.md) walks through your first project, device adapters, and your first rendered frame.

## Why luma.gl?[​](#why-lumagl "Direct link to Why luma.gl?")

* **Portable GPU API** — write against luma.gl resources and select WebGPU, WebGL2, or both at application startup.
* **Low-level access without raw-API duplication** — retain explicit buffers, textures, shaders, bindings, passes, and pipelines while sharing most application code.
* **Engine building blocks** — use `Model`, `AnimationLoop`, geometry, transforms, and scenegraph helpers when raw resource management is unnecessary.
* **Composable shaders** — package shader functions, typed inputs, hooks, and injections into reusable modules and plugins.
* **Visualization-scale data** — luma.gl is the rendering foundation for deck.gl and includes dedicated support for GPU tables and Apache Arrow workflows.

## Is luma.gl the right level?[​](#is-lumagl-the-right-level "Direct link to Is luma.gl the right level?")

| Choose                      | When                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **luma.gl**                 | You are building a renderer, GPU compute workflow, visualization framework, or custom GPU feature and want explicit resource control. |
| [deck.gl](https://deck.gl)  | You need high-level geospatial or large-data visualization layers, picking, cameras, and interaction.                                 |
| **A complete scene engine** | You need a batteries-included scene engine with an extensive asset and material ecosystem.                                            |
| Raw WebGPU                  | You need exact control over one backend and do not need luma.gl's portability, lifecycle, or shader tooling.                          |

## Three cooperating APIs[​](#three-cooperating-apis "Direct link to Three cooperating APIs")

### Engine API[​](#engine-api "Direct link to Engine API")

The Engine API provides `Model`, `AnimationLoop`, geometry, scenegraph, dynamic texture, and GPU transformation helpers. It is the recommended starting point for applications.

### Portable GPU API[​](#portable-gpu-api "Direct link to Portable GPU API")

The Core API exposes devices, buffers, textures, shaders, bindings, pipelines, and render or compute passes. `@luma.gl/webgpu` and `@luma.gl/webgl` provide the concrete backends.

### Shader API[​](#shader-api "Direct link to Shader API")

Shadertools assembles WGSL and GLSL from reusable shader modules and application-defined hooks. It is used by luma.gl, deck.gl, and custom renderers.

Explore [how the three APIs fit together](https://luma.gl/next/docs/api-guide.md) for the complete object model and guidance on choosing the right layer.

## Supported environments[​](#supported-environments "Direct link to Supported environments")

luma.gl targets current evergreen browsers. WebGPU feature availability varies by browser and platform; WebGL2 provides the compatibility path for portable rendering. Compute shaders, storage textures, and some advanced features remain WebGPU-only.

Server-side rendering and compute are also possible when the host supplies a compatible GPU implementation. Browser-specific image, canvas, and video APIs may require environment-specific replacements.

## Project and releases[​](#project-and-releases "Direct link to Project and releases")

This documentation follows the current luma.gl development branch. See [What's New](https://luma.gl/next/docs/whats-new.md) for release-specific features and the [Upgrade Guide](https://luma.gl/next/docs/upgrade-guide.md) for breaking changes.

luma.gl is an MIT-licensed OpenJS Foundation project governed by the vis.gl community. Use [GitHub Discussions](https://github.com/visgl/luma.gl/discussions) for design and usage questions, and [GitHub Issues](https://github.com/visgl/luma.gl/issues) for confirmed bugs.

Older documentation remains available in the corresponding GitHub release branches: [v9.2](https://github.com/visgl/luma.gl/blob/9.2-release/docs/README.md), [v9.1](https://github.com/visgl/luma.gl/blob/9.1-release/docs/README.md), [v9.0](https://github.com/visgl/luma.gl/blob/9.0-release/docs/README.md), and [v8.5](https://github.com/visgl/luma.gl/blob/8.5-release/docs/README.md).
