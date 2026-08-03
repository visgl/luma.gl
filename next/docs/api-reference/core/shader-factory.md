# ShaderFactory

`ShaderFactory` caches and reuses [`Shader`](https://luma.gl/next/docs/api-reference/core/resources/shader.md) resources for a device.

This is useful when multiple pipelines or models compile the same shader source repeatedly. Reusing a cached `Shader` reduces compilation overhead and complements [`PipelineFactory`](https://luma.gl/next/docs/api-reference/core/pipeline-factory.md).

If you use [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md) or [`Computation`](https://luma.gl/next/docs/api-reference/engine/compute/computation.md), those engine wrappers already use core factories by default. Create a `ShaderFactory` directly when you want explicit shader-cache ownership outside those wrappers.

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderFactory} from '@luma.gl/core';

const shaderFactory = ShaderFactory.getDefaultShaderFactory(device);
const shader = shaderFactory.createShader({stage: 'vertex', source: '...'});
shaderFactory.release(shader);
```

## Properties[​](#properties "Direct link to Properties")

### `device: Device`[​](#device-device "Direct link to device-device")

Device that owns the cached shaders.

## Methods[​](#methods "Direct link to Methods")

### `ShaderFactory.getDefaultShaderFactory(device: Device): ShaderFactory`[​](#shaderfactorygetdefaultshaderfactorydevice-device-shaderfactory "Direct link to shaderfactorygetdefaultshaderfactorydevice-device-shaderfactory")

Returns the default singleton factory stored on the device's core module state.

### `constructor(device: Device)`[​](#constructordevice-device "Direct link to constructordevice-device")

Creates a factory for one device.

### `createShader(props: ShaderProps): Shader`[​](#createshaderprops-shaderprops-shader "Direct link to createshaderprops-shaderprops-shader")

Returns a shader. If caching is enabled and an equivalent shader was already requested, the cached instance is reused and its internal reference count is incremented.

### `release(shader: Shader): void`[​](#releaseshader-shader-void "Direct link to releaseshader-shader-void")

Releases a previously requested shader. When the reference count reaches zero, the shader is either destroyed or retained depending on the device destroy policy.

## Device Cache Controls[​](#device-cache-controls "Direct link to Device Cache Controls")

* `_cacheShaders` enables shader reuse through `ShaderFactory`.
* `_destroyShaders` evicts cached shaders when their factory reference count reaches zero.
* These are device props documented on [`Device`](https://luma.gl/next/docs/api-reference/core/device.md).

## Remarks[​](#remarks "Direct link to Remarks")

* Cache identity is based on `stage` and shader `source`.
* `id` only affects the resource name used for debugging. It does not create a distinct cache entry.
* As with `PipelineFactory`, callers that use cached shader creation should pair `createShader()` with `release()`.
