# ShaderFactory

`ShaderFactory` caches and reuses [`Shader`](/docs/api-reference/core/resources/shader) resources for a device.

This is useful when multiple pipelines or models compile the same shader source repeatedly. Reusing a cached `Shader` reduces compilation overhead and complements [`PipelineFactory`](/docs/api-reference/core/pipeline-factory).

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

### `cachingEnabled: boolean`

Whether shader reuse is enabled for the current device configuration.

## Methods

### `ShaderFactory.getDefaultShaderFactory(device: Device): ShaderFactory`

Returns the default singleton factory stored on the device's core module state.

### `constructor(device: Device)`

Creates a factory for one device.

### `createShader(props: ShaderProps): Shader`

Returns a shader. If caching is enabled and an equivalent shader was already requested, the cached instance is reused and its internal reference count is incremented.

### `release(shader: Shader): void`

Releases a previously requested shader. When the reference count reaches zero, the shader is either destroyed or retained depending on the device destroy policy.

## Remarks

- Cache identity is based on `stage` and shader `source`.
- As with `PipelineFactory`, callers that use cached shader creation should pair `createShader()` with `release()`.
