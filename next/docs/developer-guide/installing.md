# Installing

**luma.gl** is published as a suite of npm modules. Each module responsible for a particular part of the rendering stack.

You can explore the [live examples](https://luma.gl/next/examples) without installing anything. When you are ready to build locally, this guide creates a small rendering project that tries WebGPU first and falls back to WebGL2.

## Create Your First Project[​](#create-your-first-project "Direct link to Create Your First Project")

### Prerequisites[​](#prerequisites "Direct link to Prerequisites")

* A current Node.js LTS release
* A browser with WebGPU or WebGL2 support
* Basic TypeScript knowledge

### Choose a Package Manager[​](#choose-a-package-manager "Direct link to Choose a Package Manager")

Create a Vite project and install the luma.gl engine and both device adapters using your preferred package manager.

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

The most basic module is `@luma.gl/core` which provides an abstract API for writing application code that works with both WebGPU and WebGL.

However, the `@luma.gl/core` module cannot be used on its own: it relies on being backed up by another module that implements the API. luma.gl provides adapters (implementations of the abstract API) through the `@luma.gl/webgl` and `@luma.gl/webgpu` modules.

The `@luma.gl/core` module is not usable on its own. A device adapter module must be imported.

```
yarn add @luma.gl/core

yarn add @luma.gl/webgpu
```

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/webgpu';



const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter], createCanvasContext: ...});
```

It is possible to register more than one device adapter to create an application that can work in both WebGL and WebGPU environments.

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/webgpu';

import {webgl2Adapter} from '@luma.gl/webgl';



const webgpuDevice = luma.createDevice({type: 'best-available', adapters: [webgl2Adapter, webgpuAdapter], createCanvasContext: ...});
```

## A Typical Install[​](#a-typical-install "Direct link to A Typical Install")

* `engine`: High-level constructs such as `Model`, `AnimationLoop` and `Geometry` that allow a developer to work without worrying about rendering pipeline details.
* `webgl`: The WebGL backend adapter for `@luma.gl/core`. For lower-level rendering control in current luma.gl, look at `RenderPipeline` and related core resources rather than older `Program`-centric APIs.
* `shadertools`: A system for modularizing and composing shader code.
* `debug`: Tooling to aid in debugging.

```
yarn add @luma.gl/core

yarn add @luma.gl/webgl

yarn add @luma.gl/engine

yarn add @luma.gl/shadertools
```

Refer to the [Module Catalog](https://luma.gl/next/docs/api-reference.md) for more information about which luma.gl modules to install.
