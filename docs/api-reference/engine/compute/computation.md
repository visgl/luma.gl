# Computation

`Computation` is the engine-level wrapper around WebGPU compute shaders.
It plays the same role for compute work that [`Model`](/docs/api-reference/engine/model) plays for rendering: it assembles shaders, manages shader inputs and bindings, reuses cached pipelines, and dispatches work through a [`ComputePass`](/docs/api-reference/core/resources/compute-pass).

`Computation` is only supported on WebGPU devices.

## Usage

```typescript
import {Computation} from '@luma.gl/engine';

const computation = new Computation(device, {
  source: COMPUTE_SHADER_SOURCE,
  bindings: {
    inputBuffer,
    outputBuffer
  }
});

const computePass = device.beginComputePass();
computation.predraw();
computation.dispatch(computePass, 64, 1, 1);
computePass.end();
```

## Types

### `ComputationProps`

| Property | Type | Description |
| --- | --- | --- |
| `source?` | `string` | WGSL source code for the compute shader. |
| `modules?` | `ShaderModule[]` | Shader modules to assemble into the shader. |
| `defines?` | `Record<string, boolean>` | Shader module defines passed to the assembler. |
| `shaderInputs?` | `ShaderInputs` | Pre-created shader input manager. |
| `bindings?` | `Record<string, Binding>` | Bound textures, samplers, storage buffers, or uniform buffers. |
| `pipelineFactory?` | `PipelineFactory` | Factory used to create cached compute pipelines. |
| `shaderFactory?` | `ShaderFactory` | Factory used to create cached shader resources. |
| `shaderAssembler?` | `ShaderAssembler` | WGSL shader assembler to use. |
| `debugShaders?` | `'never' \| 'errors' \| 'warnings' \| 'always'` | Debug shader output policy. |

`ComputationProps` also includes the standard `ComputePipelineProps` supported by `device.createComputePipeline(...)`.

## Properties

### `device`, `id`

Device and application-provided identifier.

### `pipeline: ComputePipeline`

Current compute pipeline.

### `shader`

Compiled compute shader resource.

### `source`

Assembled WGSL source.

### `shaderInputs`

Current `ShaderInputs` instance.

## Methods

### `constructor(device: Device, props: ComputationProps)`

Creates a computation wrapper for one WebGPU device. Throws on non-WebGPU devices.

### `destroy(): void`

Releases the cached pipeline and shader and destroys the internal uniform store.

### `predraw(): void`

Updates uniform buffers from the current `ShaderInputs` state.

### `dispatch(computePass: ComputePass, x: number, y?: number, z?: number): void`

Binds the current pipeline and bindings and dispatches compute workgroups.

### `setShaderInputs(shaderInputs: ShaderInputs): void`

Replaces the active `ShaderInputs` instance and rebuilds the managed uniform-buffer bindings.

### `setShaderModuleProps(props: Record<string, any>): void`

Updates module props through the shader assembler's generated module-uniform helper.

### `updateShaderInputs(): void`

Flushes current `ShaderInputs` values into the internal uniform store.

### `setBindings(bindings: Record<string, Binding>): void`

Sets the resource bindings used for subsequent dispatches.

## Remarks

- `Computation` is compute-only and does not expose draw-style geometry or render-pass APIs.
- For shader-module-based resource management, `Computation` follows the same `ShaderInputs` pattern as `Model`.
