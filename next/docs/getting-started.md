# Getting Started

luma.gl is a TypeScript toolkit for applications that need direct, portable access to WebGPU and WebGL2. This guide creates a small rendering project that tries WebGPU first and falls back to WebGL2.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

* A current Node.js LTS release
* A browser with WebGPU or WebGL2 support
* Basic TypeScript knowledge

tip

If your goal is a geospatial visualization rather than a GPU framework or custom renderer, start with [deck.gl](https://deck.gl) instead. deck.gl is built on luma.gl and provides higher-level layers, cameras, and interaction.

## Create a project[​](#create-a-project "Direct link to Create a project")

* npm
* yarn
* pnpm

```
npm create vite@latest luma-demo -- --template vanilla-ts
cd luma-demo
npm install @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl
```

```
yarn create vite luma-demo --template vanilla-ts
cd luma-demo
yarn add @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl
```

```
pnpm create vite luma-demo --template vanilla-ts
cd luma-demo
pnpm add @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl
```

Replace `src/main.ts` with:

```
import {AnimationLoopTemplate, type AnimationProps, makeAnimationLoop} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webgl2Adapter} from '@luma.gl/webgl';

class App extends AnimationLoopTemplate {
  override onRender({device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({
      clearColor: [0.05, 0.08, 0.14, 1]
    });
    renderPass.end();
  }
}

makeAnimationLoop(App, {
  adapters: [webgpuAdapter, webgl2Adapter]
}).start();
```

Start the development server:

* npm
* yarn
* pnpm

```
npm run dev
```

```
yarn dev
```

```
pnpm dev
```

You should see a dark canvas. luma.gl creates the best available device, begins a render pass each frame, and presents the result to the page.

## Choose a learning path[​](#choose-a-learning-path "Direct link to Choose a learning path")

[Recommended**Rendering with the Engine API**Draw a triangle, add geometry and textures, then move on to instancing and reusable shaders.Start with Model and AnimationLoop](https://luma.gl/next/docs/tutorials/hello-triangle)[Lower level**GPU resources and compute**Work directly with devices, buffers, textures, bindings, command encoders, and compute passes.Start with the portable GPU API](https://luma.gl/next/docs/api-guide/gpu)

## How backend selection works[​](#how-backend-selection-works "Direct link to How backend selection works")

The application supplies both adapters in preference order. A WebGPU-capable browser uses `webgpuAdapter`; other supported browsers fall back to `webgl2Adapter`. Application code continues to use the same luma.gl `Device`, resource, and render-pass APIs.

Use only `webgpuAdapter` when your application depends on compute shaders, storage textures, or another WebGPU-only feature. The documentation marks backend-specific features explicitly.

## Troubleshooting[​](#troubleshooting "Direct link to Troubleshooting")

### The canvas is blank[​](#the-canvas-is-blank "Direct link to The canvas is blank")

Check the browser console first. Confirm that `src/main.ts` is imported by `index.html` and that the canvas is not hidden by application CSS.

### WebGPU is unavailable[​](#webgpu-is-unavailable "Direct link to WebGPU is unavailable")

The example should fall back to WebGL2. To debug WebGPU specifically, consult the [WebGPU and WebGL comparison](https://luma.gl/next/docs/api-guide/background/webgpu-vs-webgl.md) and inspect the selected device in your browser developer tools.

### TypeScript cannot resolve a package[​](#typescript-cannot-resolve-a-package "Direct link to TypeScript cannot resolve a package")

Install all three packages shown above. `@luma.gl/engine` provides `AnimationLoop` and `Model`; `@luma.gl/webgpu` and `@luma.gl/webgl` provide the concrete device adapters.

## Next step[​](#next-step "Direct link to Next step")

Continue with [Hello Triangle](https://luma.gl/next/docs/tutorials/hello-triangle.md), where the empty render pass becomes a complete portable draw call.
