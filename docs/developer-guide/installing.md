# Installing

[Overview](https://luma.gl/docs/developer-guide.md)[Installing](https://luma.gl/docs/developer-guide/installing.md)[Editing](https://luma.gl/docs/developer-guide/editing.md)[Contributing](https://luma.gl/docs/developer-guide/contributing.md)[Documentation](https://luma.gl/docs/developer-guide/documentation.md)

When you are ready to turn an idea into your own application, this guide takes you from a new project to your first GPU-rendered frame. luma.gl is published as a family of npm packages, so you can choose the rendering tools and GPU backends your project needs.

Still exploring? The [live examples](https://luma.gl/examples) and [Hello Triangle tutorial](https://luma.gl/docs/tutorials/hello-triangle.md) run directly in your browser; you do not need to install anything to try them.

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

npm install @luma.gl/engine @luma.gl/core
```

**yarn**

```
yarn create vite luma-demo --template vanilla-ts

cd luma-demo

yarn add @luma.gl/engine @luma.gl/core
```

**pnpm**

```
pnpm create vite luma-demo --template vanilla-ts

cd luma-demo

pnpm add @luma.gl/engine @luma.gl/core
```

### Render a Frame[​](#render-a-frame "Direct link to Render a Frame")

Replace `src/main.ts` with:

```
import {AnimationLoopTemplate, type AnimationProps, makeAnimationLoop} from '@luma.gl/engine';

import {webgpuAdapter} from '@luma.gl/core/webgpu';

import {webgl2Adapter} from '@luma.gl/core/webgl';



class App extends AnimationLoopTemplate {

  override onRender({device}: AnimationProps): void {

    const renderPass = device.beginRenderPass({

      clearColor: [0.05, 0.08, 0.14, 1]

    });

    renderPass.end();

  }



  override onFinalize(): void {}

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

`type: 'best-available'` selects a supported WebGPU adapter before WebGL 2, regardless of adapter array order. It does not retry WebGL after a selected WebGPU adapter fails to create a device; handle that rejection in application code. Portable application code uses the same `Device`, resource, and render-pass APIs with backend-appropriate shaders.

Use only `webgpuAdapter` when your application depends on compute shaders, storage textures, or another WebGPU-only feature. The documentation marks backend-specific features explicitly.

## Troubleshooting[​](#troubleshooting "Direct link to Troubleshooting")

### The Canvas Is Blank[​](#the-canvas-is-blank "Direct link to The Canvas Is Blank")

Check the browser console first. Confirm that `src/main.ts` is imported by `index.html` and that the canvas is not hidden by application CSS.

### WebGPU Is Unavailable[​](#webgpu-is-unavailable "Direct link to WebGPU Is Unavailable")

The example should fall back to WebGL2. To debug WebGPU specifically, consult the [WebGPU and WebGL comparison](https://luma.gl/docs/api-guide/background/webgpu-vs-webgl.md) and inspect the selected device in your browser developer tools.

### TypeScript Cannot Resolve a Package[​](#typescript-cannot-resolve-a-package "Direct link to TypeScript Cannot Resolve a Package")

Install both packages shown above. `@luma.gl/engine` provides `AnimationLoop` and `Model`; core includes the device adapters at `@luma.gl/core/webgpu` and `@luma.gl/core/webgl`.

## Next Step[​](#next-step "Direct link to Next Step")

Continue with [Hello Triangle](https://luma.gl/docs/tutorials/hello-triangle.md), where the empty render pass becomes a complete portable draw call. For lower-level resource management, start with [GPU resources and compute](https://luma.gl/docs/api-guide/gpu.md).

If your goal is a geospatial visualization rather than a GPU framework or custom renderer, start with [deck.gl](https://deck.gl) instead. deck.gl is built on luma.gl and provides higher-level layers, cameras, and interaction.

## A Minimal Install[​](#a-minimal-install "Direct link to A Minimal Install")

For lower-level applications, `@luma.gl/core` provides portable GPU devices, buffers, textures, and rendering resources. Pair it with at least one backend adapter: `@luma.gl/core/webgpu` for WebGPU or `@luma.gl/core/webgl` for WebGL2.

```
yarn add @luma.gl/core
```

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/core/webgpu';



const device = await luma.createDevice({

  type: 'webgpu',

  adapters: [webgpuAdapter],

  createCanvasContext: true

});
```

To support both backends, import both adapters from core and supply them in the adapter list:

```
import {luma} from '@luma.gl/core';

import {webgpuAdapter} from '@luma.gl/core/webgpu';

import {webgl2Adapter} from '@luma.gl/core/webgl';



const device = await luma.createDevice({

  type: 'best-available',

  adapters: [webgpuAdapter, webgl2Adapter],

  createCanvasContext: true

});
```

## A Typical Install[​](#a-typical-install "Direct link to A Typical Install")

* `@luma.gl/core` provides portable devices, GPU resources, and rendering primitives.
* `@luma.gl/engine` adds models, animation loops, geometry, and higher-level rendering tools.
* `@luma.gl/core/webgpu` and `@luma.gl/core/webgl` provide the WebGPU and WebGL2 backends.
* `@luma.gl/shadertools` assembles reusable shader modules, hooks, and effects.

```
yarn add @luma.gl/core @luma.gl/engine @luma.gl/shadertools
```

Explore the [module catalog](https://luma.gl/docs/api-reference.md) to choose the packages that match your application.
