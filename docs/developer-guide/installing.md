# Installing

**luma.gl** is published as a suite of npm modules. Each module responsible for a particular part of the rendering stack.

## A Minimal Install

The most basic module is `@luma.gl/core` which provides an abstract API for writing application code
that works with both WebGPU and WebGL.

However, the `@luma.gl/core` module cannot be used on its own: it relies on being backed up by another module
that implements the API. luma.gl provides adapters (implementations of the abstract API)
through the `@luma.gl/webgl` and `@luma.gl/webgpu` modules.

The `@luma.gl/core` module is not usable on its own. A device adapter module must
be imported.

```bash
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/core';
import '@luma.gl/webgpu';

const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```

It is possible to register more than one device adapter to create an application
that can work in both WebGL and WebGPU environments.

```typescript
import {luma} from '@luma.gl/core';
import '@luma.gl/webgpu';
import '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'best-available', canvas: ...});
```

## A Typical Install

- `engine`: High-level constructs such as `Model`, `AnimationLoop` and `Geometry` that allow a developer to work without worrying about rendering pipeline details.
- `webgl`: Wrapper classes around WebGL objects such as `Program`, `Buffer`, `VertexArray` that allow a developer to manager the rendering pipeline directly but with a more convenient API.
- `shadertools`: A system for modularizing and composing GLSL shader code.
- `debug`: Tooling to aid in debugging.


```bash
yarn add @luma.gl/core
yarn add @luma.gl/webgl
yarn add @luma.gl/engine
yarn add @luma.gl/shadertools
```

Refer to the [Module Catalog](/docs/api-reference) for more information about which luma.gl modules to install.
