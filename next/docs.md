# Introduction

Luma.gl is a TypeScript toolkit for high-performance GPU rendering and compute on the web. It provides one application-facing API with pluggable WebGPU and WebGL2 backends, plus higher-level building blocks for models, animation, shader composition, and GPU data processing.

## Why luma.gl?[​](#why-lumagl "Direct link to Why luma.gl?")

* **Low Level Access** - luma.gl offers a thin abstraction layer over the underlying graphics API.
* **Portable GPU API** — write against luma.gl resources and select WebGPU, WebGL2, or both at application startup.
* **Composable shaders** — package shader functions, typed inputs, hooks, and injections into reusable modules and plugins.
* **Visualization-scale data** — luma.gl is the rendering foundation for deck.gl and includes dedicated support for GPU tables and Apache Arrow workflows.

## A WebGPU-style API[​](#a-webgpu-style-api "Direct link to A WebGPU-style API")

The luma.gl v9 API design launched in 2023 stays fairly close to the WebGPU API, just as the earlier luma.gl v8 API followed the WebGL 2 API. The idea is to let users build their knowledge of WebGPU and the luma.gl API in tandem, rather than asking them to learn an abstraction and perhaps never get to work directly with WebGPU.

For more about our api design philosophy checkout our [Design Philosophy](https://luma.gl/next/docs/api-guide/background/api-design.md)

## Three Key APIs[​](#three-key-apis "Direct link to Three Key APIs")

### 1. Core Api[​](#1-core-api "Direct link to 1. Core Api")

The Core API exposes low level GPU resources such as devices, buffers, textures, shaders, bindings, pipelines, and render or compute passes. `@luma.gl/webgpu` and `@luma.gl/webgl` provide the concrete backends.

### 2. Engine API[​](#2-engine-api "Direct link to 2. Engine API")

The Engine API provides `Model`, `AnimationLoop`, geometry, scenegraph, dynamic texture, and GPU transformation helpers. It is the recommended starting point for applications.

### 3. Shader API[​](#3-shader-api "Direct link to 3. Shader API")

Shadertools assembles WGSL and GLSL from reusable shader modules and application-defined hooks. It is used by luma.gl, deck.gl, and custom renderers.

## Whats Next?[​](#whats-next "Direct link to Whats Next?")

Ready for your first `Hello Triangle`? Proceed to [Getting Started](https://luma.gl/next/docs/getting-started.md).
