# Computation

[GPU Computations](https://luma.gl/next/docs/api-guide/engine/transforms.md)[Computation](https://luma.gl/next/docs/api-reference/engine/compute/computation.md)[BufferTransform](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md)[TextureTransform](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md)[Swap](https://luma.gl/next/docs/api-reference/engine/compute/swap.md)

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

`Computation` is the engine-level wrapper around WebGPU compute shaders. It plays the same role for compute work that [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md) plays for rendering: it assembles shaders, manages shader inputs and bindings, reuses cached pipelines, and dispatches work through a [`ComputePass`](https://luma.gl/next/docs/api-reference/core/resources/compute-pass.md).

## Usage[​](#usage "Direct link to Usage")

```
import {Computation} from '@luma.gl/engine';



const computation = new Computation(device, {

  source: COMPUTE_SHADER_SOURCE,

  bindings: {

    inputBuffer,

    outputBuffer

  }

});



computation.predraw(device.commandEncoder);

const computePass = device.beginComputePass();

computation.dispatch(computePass, 64, 1, 1);

computePass.end();
```

## Types[​](#types "Direct link to Types")

### `ComputationProps`[​](#computationprops "Direct link to computationprops")

| Property           | Type                                            | Description                                                                                                         |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `source?`          | `string`                                        | WGSL source code for the compute shader.                                                                            |
| `modules?`         | `ShaderModule[]`                                | Shader modules to assemble into the shader.                                                                         |
| `defines?`         | `Record<string, boolean>`                       | Shader module defines passed to the assembler.                                                                      |
| `plugins?`         | `ShaderPlugin[]`                                | Reusable shader assembly plugins resolved for WGSL compute assembly. Plugins with `vertexInputs` are not supported. |
| `shaderInputs?`    | `ShaderInputs`                                  | Pre-created shader input manager.                                                                                   |
| `bindings?`        | `Record<string, Binding>`                       | Bound textures, samplers, storage buffers, or uniform buffers.                                                      |
| `pipelineFactory?` | `PipelineFactory`                               | Factory from `@luma.gl/core` used to create cached compute pipelines.                                               |
| `shaderFactory?`   | `ShaderFactory`                                 | Factory from `@luma.gl/core` used to create cached shader resources.                                                |
| `shaderAssembler?` | `ShaderAssembler`                               | WGSL shader assembler to use.                                                                                       |
| `debugShaders?`    | `'never' \| 'errors' \| 'warnings' \| 'always'` | Debug shader output policy.                                                                                         |

`ComputationProps` also includes the standard `ComputePipelineProps` supported by `device.createComputePipeline(...)`.

## Properties[​](#properties "Direct link to Properties")

### `device`, `id`[​](#device-id "Direct link to device-id")

Device and application-provided identifier.

### `pipeline: ComputePipeline`[​](#pipeline-computepipeline "Direct link to pipeline-computepipeline")

Current compute pipeline.

### `shader`[​](#shader "Direct link to shader")

Compiled compute shader resource.

### `source`[​](#source "Direct link to source")

Assembled WGSL source.

### `shaderInputs`[​](#shaderinputs "Direct link to shaderinputs")

Current `ShaderInputs` instance.

## Methods[​](#methods "Direct link to Methods")

### `constructor(device: Device, props: ComputationProps)`[​](#constructordevice-device-props-computationprops "Direct link to constructordevice-device-props-computationprops")

Creates a computation wrapper for one WebGPU device. Throws on non-WebGPU devices.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Releases the cached pipeline and shader and destroys the internal uniform store.

### `predraw(commandEncoder: CommandEncoder): void`[​](#predrawcommandencoder-commandencoder-void "Direct link to predrawcommandencoder-commandencoder-void")

Updates uniform buffers from the current `ShaderInputs` state, encoding any managed uploads onto the supplied command encoder before the compute pass begins.

### `dispatch(computePass: ComputePass, x: number, y?: number, z?: number): void`[​](#dispatchcomputepass-computepass-x-number-y-number-z-number-void "Direct link to dispatchcomputepass-computepass-x-number-y-number-z-number-void")

Binds the current pipeline and bindings and dispatches compute workgroups.

### `setShaderInputs(shaderInputs: ShaderInputs): void`[​](#setshaderinputsshaderinputs-shaderinputs-void "Direct link to setshaderinputsshaderinputs-shaderinputs-void")

Replaces the active `ShaderInputs` instance and rebuilds the managed uniform-buffer bindings.

### `setShaderModuleProps(props: Record<string, any>): void`[​](#setshadermodulepropsprops-recordstring-any-void "Direct link to setshadermodulepropsprops-recordstring-any-void")

Updates module props through the shader assembler's generated module-uniform helper.

### `updateShaderInputs(commandEncoder?: CommandEncoder): void`[​](#updateshaderinputscommandencoder-commandencoder-void "Direct link to updateshaderinputscommandencoder-commandencoder-void")

Flushes current `ShaderInputs` values into the internal uniform store. On WebGPU, pass the encoder that will own the subsequent compute pass when upload ordering matters.

### `setBindings(bindings: Record<string, Binding>): void`[​](#setbindingsbindings-recordstring-binding-void "Direct link to setbindingsbindings-recordstring-binding-void")

Sets the resource bindings used for subsequent dispatches.

## Remarks[​](#remarks "Direct link to Remarks")

* `Computation` is compute-only and does not expose draw-style geometry or render-pass APIs.
* For shader-module-based resource management, `Computation` follows the same `ShaderInputs` pattern as [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md).
* `Computation` uses [`PipelineFactory`](https://luma.gl/next/docs/api-reference/core/pipeline-factory.md) and [`ShaderFactory`](https://luma.gl/next/docs/api-reference/core/shader-factory.md) from `@luma.gl/core` unless you provide custom factory instances.
