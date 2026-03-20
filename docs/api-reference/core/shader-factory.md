# ShaderFactory

`ShaderFactory` caches and reuses [`Shader`](/docs/api-reference/core/resources/shader) resources for a device.

This is useful when multiple pipelines or models compile the same shader source repeatedly. Reusing a cached `Shader` reduces compilation overhead and complements [`PipelineFactory`](/docs/api-reference/core/pipeline-factory).

If you use [`Model`](/docs/api-reference/engine/model) or [`Computation`](/docs/api-reference/engine/compute/computation), those engine wrappers already use core factories by default. Create a `ShaderFactory` directly when you want explicit shader-cache ownership outside those wrappers.

## Usage

```typescript
import {ShaderFactory} from '@luma.gl/core';

const shaderFactory = ShaderFactory.getDefaultShaderFactory(device);
const shader = shaderFactory.createShader({stage: 'vertex', source: '...'});
shaderFactory.release(shader);
```

## Properties

### `device: Device`

Device that owns the cached shaders.

## Methods

### `ShaderFactory.getDefaultShaderFactory(device: Device): ShaderFactory`

Returns the default singleton factory stored on the device's core module state.

### `constructor(device: Device)`

Creates a factory for one device.

### `createShader(props: ShaderProps): Shader`

Returns a shader. If caching is enabled and an equivalent shader was already requested, the cached instance is reused and its internal reference count is incremented.

### `release(shader: Shader): void`

Releases a previously requested shader. When the reference count reaches zero, the shader is either destroyed or retained depending on the device destroy policy.

## Device Cache Controls

- `_cacheShaders` enables shader reuse through `ShaderFactory`.
- `_destroyShaders` evicts cached shaders when their factory reference count reaches zero.
- These are device props documented on [`Device`](/docs/api-reference/core/device).

## Remarks

- Cache identity is based on `stage` and shader `source`.
- `id` only affects the resource name used for debugging. It does not create a distinct cache entry.
- As with `PipelineFactory`, callers that use cached shader creation should pair `createShader()` with `release()`.
