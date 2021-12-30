# @luma.gl/api

The `@luma.gl/api` module provides an abstract API for writing application code
that works with both WebGPU and WebGL.

This module cannot be used on its own: it relies on being backed up by another module
that implements its API. luma.gl provides adapters (implementations of the abstract API)
through the `@luma.gl/webgl` and `@luma.gl/webgpu` modules.

## A WebGPU-style API

From a high level, the luma.gl API is similar to the WebGPU API in a number of ways:
- the application must first obtain a "device" and then uses methods on this device to create GPU resource classes such as buffers, textures, shaders and pipelines.
- the API uses string constants and parameter option names that mirror those in the WebGPU API.

The similarities are intentional. The idea is to let knowledge of the WebGPU API carry over to the luma.gl API and vice versa,
rather than asking developers to learn another set of arbitrary abstractions.

While it has similarities to WebGPU, the luma.gl API is streamlined to be less cumbersome to use and also has to make
the necessary allowances to still support WebGL.

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
