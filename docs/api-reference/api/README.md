# Overview

The `@luma.gl/api` module provides an abstract API that enables application code
to portably work with both WebGPU and WebGL.

Note that `@luma.gl/api` module exports an abstract "GPU Device API" and cannot be used on its own: 
it is designed to be used together with one or more modules that implements the provided APIs
on top of a specific GPU API. luma.gl provides two such "GPU Device implementation modules": 
`@luma.gl/webgl` and `@luma.gl/webgpu`.

## A WebGPU-style API

The luma.gl Device API is designed to be similar to the WebGPU API, for example:
- the application must first obtain a "device" and then uses methods on this device to create GPU resource classes such as buffers, textures, shaders and pipelines.
- The resource classes mirror those in the WebGPU API.
- the API uses string constants and parameter option names that mirror those in the WebGPU API.

These similarities are intentional. 
- Avoids creating a new abstraction layer that developers must learn. Knowledge of the WebGPU API carries over to the luma.gl API and vice versa.
- Allows the WebGPU Device implementation to remain thin, ensuring optimal performance and minimal overhead.

While the luma.gl Device API has similarities to WebGPU, 
it is streamlined to be less cumbersome to use and also 
makes the necessary allowances to still support WebGL.

## Installing adapters

The `@luma.gl/api` module is not usable on its own. A device adapter module must
be imported (it self registers on import).

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
