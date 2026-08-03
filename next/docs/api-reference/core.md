# Overview

The `@luma.gl/core` module provides an abstract API that enables application code to portably work with both WebGPU and WebGL. The main export is the `Device` class which provides methods for creating GPU resources such as `Buffer`, `Texture`, `Shader` etc.

The pages in this section provide curated explanations and portability guidance. For the exact public TypeScript declarations, overloads, inheritance, and source locations, use the [generated `@luma.gl/core` API index](https://luma.gl/next/docs/api-reference/generated/core.md).

## Installing adapters[​](#installing-adapters "Direct link to Installing adapters")

The `@luma.gl/core` module is not usable on its own. A device adapter module must be imported and provided during device creation.

```
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';

const device = await luma.createDevice({type: 'webgpu', adapters: [webgpuAdapter], createCanvasContext: ...});
```

It is possible to supply more than one device adapter to create an application that can work in both WebGL and WebGPU environments.

```
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {webglAdapter} '@luma.gl/webgl';

const webgpuDevice = luma.createDevice({type: 'best-available', adapters: [webgpuAdapter, webglAdapter], createCanvasContext: ...});
```

## Creating GPU Resources[​](#creating-gpu-resources "Direct link to Creating GPU Resources")

Once the application has created a `Device`, GPU resources can be created:

```
const buffer = device.createBuffer(...);
const texture = device.createTexture(...);
const renderPass = device.beginRenderPass(...);
```

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [PipelineFactory](https://luma.gl/next/docs/api-reference/core/pipeline-factory.md)
* [ShaderFactory](https://luma.gl/next/docs/api-reference/core/shader-factory.md)
* [Shader Types](https://luma.gl/next/docs/api-reference/core/shader-types.md)
* [Shader Layout](https://luma.gl/next/docs/api-reference/core/shader-layout.md)
* [Vertex Formats](https://luma.gl/next/docs/api-reference/core/vertex-formats.md)
* [Texture Formats](https://luma.gl/next/docs/api-reference/core/texture-formats.md)
