# Installing

[Overview](https://luma.gl/next/docs/developer-guide.md)[Installing](https://luma.gl/next/docs/developer-guide/installing.md)[AI Agents](https://luma.gl/next/docs/developer-guide/working-with-ai.md)[Contributing](https://luma.gl/next/docs/developer-guide/contributing.md)[Editing](https://luma.gl/next/docs/developer-guide/editing.md)[Testing](https://luma.gl/next/docs/developer-guide/testing.md)[Debugging](https://luma.gl/next/docs/developer-guide/debugging.md)[Profiling](https://luma.gl/next/docs/developer-guide/profiling.md)[Bundling](https://luma.gl/next/docs/developer-guide/bundling.md)

When you are ready to turn an idea into your own application, this guide takes you from a new project to your first GPU-rendered frame. luma.gl is published as a family of npm packages, so you can choose the rendering tools and GPU backends your project needs.

Still exploring? The [live examples](https://luma.gl/next/examples) and [Hello Triangle tutorial](https://luma.gl/next/docs/tutorials/hello-triangle.md) run directly in your browser; you do not need to install anything to try them.

## Create Your First Project[​](#create-your-first-project "Direct link to Create Your First Project")

### Prerequisites[​](#prerequisites "Direct link to Prerequisites")

* A current Node.js LTS release
* A browser with WebGPU or WebGL2 support
* Basic TypeScript knowledge

### Choose a Package Manager[​](#choose-a-package-manager "Direct link to Choose a Package Manager")

Create a Vite project and install the luma.gl engine and both device adapters using your preferred package manager. The finished application will try WebGPU first and fall back to WebGL2.

**npm**

```
npm create vite@latest luma-demo -- --template vanilla-ts

cd luma-demo

npm install @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl
```

**yarn**

```
yarn create vite luma-demo --template vanilla-ts

cd luma-demo

yarn add @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl
```

**pnpm**

```
pnpm create vite luma-demo --template vanilla-ts

cd luma-demo

pnpm add @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl
```

### Render a Frame[​](#render-a-frame "Direct link to Render a Frame")

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

### Start the Development Server[​](#start-the-development-server "Direct link to Start the Development Server")

**npm**

```
npm run dev
```

**yarn**

```
yarn dev
```

**pnpm**

```
pnpm dev
```

You should see a dark canvas. luma.gl creates the best available device, begins a render pass each frame, and presents the result to the page.

## How Backend Selection Works[​](#how-backend-selection-works "Direct link to How Backend Selection Works")

The application supplies both adapters in preference order. A WebGPU-capable browser uses `webgpuAdapter`; other supported browsers fall back to `webgl2Adapter`. Application code continues to use the same luma.gl `Device`, resource, and render-pass APIs.

Use only `webgpuAdapter` when your application depends on compute shaders, storage textures, or another WebGPU-only feature. The documentation marks backend-specific features explicitly.

## Troubleshooting[​](#troubleshooting "Direct link to Troubleshooting")

### The Canvas Is Blank[​](#the-canvas-is-blank "Direct link to The Canvas Is Blank")

Check the browser console first. Confirm that `src/main.ts` is imported by `index.html` and that the canvas is not hidden by application CSS.

### WebGPU Is Unavailable[​](#webgpu-is-unavailable "Direct link to WebGPU Is Unavailable")

The example should fall back to WebGL2. To debug WebGPU specifically, consult the [WebGPU and WebGL comparison](https://luma.gl/next/docs/api-guide/background/webgpu-vs-webgl.md) and inspect the selected device in your browser developer tools.

### TypeScript Cannot Resolve a Package[​](#typescript-cannot-resolve-a-package "Direct link to TypeScript Cannot Resolve a Package")

Install all three packages shown above. `@luma.gl/engine` provides `AnimationLoop` and `Model`; `@luma.gl/webgpu` and `@luma.gl/webgl` provide the concrete device adapters.

## Next Step[​](#next-step "Direct link to Next Step")

Continue with [Hello Triangle](https://luma.gl/next/docs/tutorials/hello-triangle.md), where the empty render pass becomes a complete portable draw call. For lower-level resource management, start with [GPU resources and compute](https://luma.gl/next/docs/api-guide/gpu.md).

If your goal is a geospatial visualization rather than a GPU framework or custom renderer, start with [deck.gl](https://deck.gl) instead. deck.gl is built on luma.gl and provides higher-level layers, cameras, and interaction.

## A Minimal Install[​](#a-minimal-install "Direct link to A Minimal Install")

For lower-level applications, `@luma.gl/core` provides portable GPU devices, buffers, textures, and rendering resources. Pair it with at least one backend adapter: `@luma.gl/webgpu` for WebGPU or `@luma.gl/webgl` for WebGL2.

```
yarn add @luma.gl/core @luma.gl/webgpu
```

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/webgpu';



const device = await luma.createDevice({

  type: 'webgpu',

  adapters: [webgpuAdapter],

  createCanvasContext: true

});
```

To support both backends, install `@luma.gl/webgl` as well and supply the adapters in preference order:

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/webgpu';

import {webgl2Adapter} from '@luma.gl/webgl';



const device = await luma.createDevice({

  type: 'best-available',

  adapters: [webgpuAdapter, webgl2Adapter],

  createCanvasContext: true

});
```

## A Typical Install[​](#a-typical-install "Direct link to A Typical Install")

* `@luma.gl/core` provides portable devices, GPU resources, and rendering primitives.
* `@luma.gl/engine` adds models, animation loops, geometry, and higher-level rendering tools.
* `@luma.gl/webgpu` and `@luma.gl/webgl` provide the WebGPU and WebGL2 backends.
* `@luma.gl/shadertools` assembles reusable shader modules, hooks, and effects.

```
yarn add @luma.gl/core @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl @luma.gl/shadertools
```

Explore the [module catalog](https://luma.gl/next/docs/api-reference.md) to choose the packages that match your application.
