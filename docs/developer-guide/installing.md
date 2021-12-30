# Installing

**luma.gl** is published as a suite of npm modules. Each module responsible for a particular part of the rendering stack.

## A Minimal Install

The most basic module is `@luma.gl/api` which provides an abstract API for writing application code
that works with both WebGPU and WebGL.

However, the `@luma.gl/api` module cannot be used on its own: it relies on being backed up by another module
that implements the API. luma.gl provides adapters (implementations of the abstract API)
through the `@luma.gl/webgl` and `@luma.gl/webgpu` modules.

The `@luma.gl/api` module is not usable on its own. A device adapter module must
be imported (it self registers on import).

```bash
yarn add @luma.gl/api
yarn add @luma.gl/webgl
yarn add @luma.gl/webgpu
```

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/webgpu';

const device = await luma.createDevice({type: 'webgpu', canvas: ...});
```

It is possible to register more than one device adapter to create an application
that can work in both WebGL and WebGPU environments.

```typescript
import {luma} from '@luma.gl/api';
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
yarn add @luma.gl/api
yarn add @luma.gl/webgl
yarn add @luma.gl/engine
yarn add @luma.gl/shadertools
```

## Module Catalog

**luma.gl** also exposes a `core` module that simply re-exports key parts of the other modules. This can be helpful to just get started without worrying too much about fine-grained control of dependencies. The `core` module re-exports the following functions and classes from other modules:

| Module                  | Description                                                                                | Exports                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `@luma.gl/core`         | The core module exports the api and engine modules.                                        |                                                         |
| `@luma.gl/webgpu`       | A `Device` adapter implemented using the WebGPU API. Enables creation of WebGPU resources. | `WebGPUDevice`                                          |
| `@luma.gl/engine`       |                                                                                            | `AnimationLoop`, `Model`, `Transform`, `Geometry`, ...  |
| `@luma.gl/webgl`        | A `Device` adapter implemented using the WebGL API. Enables creation of WebGL resources.   | `WebGLDevice`                                           |
| `@luma.gl/shadertools`  |                                                                                            | `assembleShaders`, `fp32`, `fp64`, `project`, ...       |
| `@luma.gl/experimental` | Scenegraph, GPGPU, GLTF, ...                                                               |                                                         |
| `@luma.gl/api`          |                                                                                            | `luma`, `Device`, `CanvasContext`, `Buffer`, `Texture`, |

luma.gl also includes some legacy modules that should be avoided in new applications.

| Legacy Module        | Description                                      | Exports                                                                |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `@luma.gl/constants` | WebGL constants. No longer needed in luma.gl v9. | `GL`                                                                   |
| `@luma.gl/gltools`   | Legacy WebGL API from luma.gl v8                 | `createGLContext`, `instrumentGLContext`, `isWebGL2`, `setParameters`, |
