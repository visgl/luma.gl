# UniformStore

A uniform store holds uniform values for a set of different uniform buffers, 
It can optionally creates managed uniform buffers for those

## Usage

## Types

The `UniformStore` class is designed so that the `setUniforms` function will be strictly typed.

```typescript
export class UniformStore<TUniformGroups extends Record<string, Record<string, UniformValue>>> {
```

## Methods

### constructor

Create a new UniformStore instance
   * @param device 
   * @param blocks 
   * @param props 

```typescript
  constructor(
    device: Device, 
    blocks: Record<string, {
      uniformFormats: Record<string, UniformFormat>;
      defaultValues?: Record<string, UniformValue>;
    }>
  )
```

### destroy()

Destroy any managed uniform buffers

```typescript
destroy(): void;
```

### setUniforms

Set uniforms

```typescript
setUniforms(uniforms: Partial<TUniformGroups>): void
```

### getUniformBufferByteLength()

Get the required minimum length of one of the uniform buffers managed by this `UniformStore`.

```typescript
getUniformBufferByteLength(uniformBufferName: keyof TUniformGroups): number
```

### getUniformBufferData()

Get formatted binary memory that can be uploaded to an application created uniform buffer

```typescript
  getUniformBufferData(uniformBufferName: keyof TUniformGroups): Uint8Array
```

### getManagedUniformBuffer()

Creates one of the managed uniform buffers

```typescript
  getUniformBuffer(device: Device, uniformBufferName: keyof TUniformGroups): Buffer
```

### updateUniformBuffer()

Update one uniform buffer. Only updates if values have changed

```typescript
  updateUniformBuffer(uniformBufferName: keyof TUniformGroups): void
```

### updateUniformBuffers()

Updates all uniform buffers where values have changed

```typescript
  updateUniformBuffers(): void
```