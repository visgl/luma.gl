# Shader

The `Shader` class holds a compiled shader. 
- It takes shader source code and compiles it during construction. 
- Shaders are used as inputs when creating `RenderPipeline` and `ComputePipeline` objects. 
- A `Shader` is immutable and the same compiled shader can safely be referenced by many pipelines.

## Usage

Create a pair of shaders

```typescript
const vs = device.createShader({stage: 'vertex', source});
const fs = device.createShader({stage: 'fragment', source});
```

## Types

### ShaderProps

Properties for a Shader

| Field         | Type                                | Description                           |
| ------------- | ----------------------------------- | ------------------------------------- |
| `id`          | `string`                            | name/identifier (for debugging)       |
| `stage`       | 'vertex' \| 'fragment' \| 'compute' | Required by WebGL and GLSL transpiler |
| `source`      | `string`                            | Shader source code                    |
| `sourceMap?`  | `string`                            | WebGPU only                           |
| `language?`   | 'glsl' \| 'wgsl'                    | wgsl in WebGPU only                   |
| `entryPoint?` | `string`                            | WGLSL only, name of main function     |

## Members

- `device`: `Device` - holds a reference to the 
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `ShaderProps` - holds a copy of the `ShaderProps` used to create this `Shader`.

## Methods

### `constructor(props: ShaderProps)`

`Shader` is an abstract class and cannot be instantiated directly. Create with `device.createShader(...)`.

### `destroy(): void`

Free up any GPU resources associated with this shader immediately (instead of waiting for garbage collection). 

### `getInfoLog(): Promise<CompilerMessage[]>`


## Remarks

- Shader compilation is fairly fast, in particular compared to Pipeline linking.
