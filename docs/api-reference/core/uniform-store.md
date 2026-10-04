# UniformStore

[ShaderLayout](https://luma.gl/docs/api-reference/core/shader-layout.md)[Bindings](https://luma.gl/docs/api-reference/core/bindings.md)[Block layout](https://luma.gl/docs/api-reference/core/shader-block-layout.md)[BufferLayout](https://luma.gl/docs/api-reference/core/buffer-layout.md)[UniformStore](https://luma.gl/docs/api-reference/core/uniform-store.md)

A uniform store holds uniform values for a set of different uniform buffers, It can optionally creates managed uniform buffers for those

## Usage[​](#usage "Direct link to Usage")

## Types[​](#types "Direct link to Types")

The `UniformStore` class is designed so that the `setUniforms` function will be strictly typed.

```
export class UniformStore<TUniformGroups extends Record<string, Record<string, UniformValue>>> {
```

## Methods[​](#methods "Direct link to Methods")

### constructor[​](#constructor "Direct link to constructor")

Create a new UniformStore instance

* @param device
* @param blocks
* @param props

```
  constructor(

    device: Device, 

    blocks: Record<string, {

      uniformFormats: Record<string, UniformFormat>;

      defaultValues?: Record<string, UniformValue>;

    }>

  )
```

### destroy()[​](#destroy "Direct link to destroy()")

Destroy any managed uniform buffers

```
destroy(): void;
```

### setUniforms[​](#setuniforms "Direct link to setUniforms")

Set uniforms

```
setUniforms(uniforms: Partial<TUniformGroups>): void
```

### getUniformBufferByteLength()[​](#getuniformbufferbytelength "Direct link to getUniformBufferByteLength()")

Get the required minimum length of one of the uniform buffers managed by this `UniformStore`.

```
getUniformBufferByteLength(uniformBufferName: keyof TUniformGroups): number
```

### getUniformBufferData()[​](#getuniformbufferdata "Direct link to getUniformBufferData()")

Get formatted binary memory that can be uploaded to an application created uniform buffer

```
  getUniformBufferData(uniformBufferName: keyof TUniformGroups): Uint8Array
```

### getManagedUniformBuffer()[​](#getmanageduniformbuffer "Direct link to getManagedUniformBuffer()")

Creates one of the managed uniform buffers

```
  getUniformBuffer(device: Device, uniformBufferName: keyof TUniformGroups): Buffer
```

### updateUniformBuffer()[​](#updateuniformbuffer "Direct link to updateUniformBuffer()")

Update one uniform buffer. Only updates if values have changed

```
  updateUniformBuffer(uniformBufferName: keyof TUniformGroups): void
```

### updateUniformBuffers()[​](#updateuniformbuffers "Direct link to updateUniformBuffers()")

Updates all uniform buffers where values have changed

```
  updateUniformBuffers(): void
```
