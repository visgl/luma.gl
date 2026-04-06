# Computation

`Computation` is the WebGPU-native compute pipeline wrapper in `@luma.gl/gpgpu`. It assembles WGSL compute shaders, manages shader-module uniform buffers through `ShaderInputs`, caches pipelines and shaders through the core factories, and dispatches work into a `ComputePass`.

## Usage

```ts
import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/gpgpu';

const outputBuffer = device.createBuffer({
  byteLength: 1024 * 4,
  usage: Buffer.COPY_SRC | Buffer.COPY_DST | Buffer.STORAGE
});

const computation = new Computation(device, {
  source: `
    @group(0) @binding(0) var<storage, read_write> outputValues: array<f32>;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let index = id.x;
      outputValues[index] = f32(index);
    }
  `,
  bindings: {
    outputValues: outputBuffer
  }
});

const computePass = device.beginComputePass();
computation.dispatch(computePass, 16);
computePass.end();
device.submit();
```

## Types

### `ComputationProps`

`ComputationProps` extends `ComputePipelineProps` except that `shader` is replaced by higher-level assembly inputs.

| Property | Type | Description |
| --- | --- | --- |
| `source?` | `string` | WGSL compute shader source. |
| `modules?` | `ShaderModule[]` | Shader modules to assemble into the final source. |
| `defines?` | `Record<string, boolean>` | Shader-module feature defines. |
| `shaderInputs?` | `ShaderInputs` | Pre-created shader input manager. |
| `bindings?` | `Record<string, Binding>` | Storage buffers, textures, samplers, and uniform buffers. |
| `debugShaders?` | `'never' \| 'errors' \| 'warnings' \| 'always'` | Shader debug policy. |
| `pipelineFactory?` | `PipelineFactory` | Optional compute-pipeline factory override. |
| `shaderFactory?` | `ShaderFactory` | Optional shader-factory override. |
| `shaderAssembler?` | `ShaderAssembler` | Optional shader assembler override. |

## Properties

### `device`, `id`

Owning device and application identifier.

### `pipeline`

Current compute pipeline.

### `source`

Assembled WGSL source used to create the current compute shader.

### `shader`

Compiled compute shader.

### `bindings`

Current binding map passed to the compute pipeline.

### `shaderInputs`

Active `ShaderInputs` instance used to manage module uniforms.

### `pipelineFactory`, `shaderFactory`

Factories used to create and reuse the underlying pipeline and shader objects.

### `userData`

Application-defined metadata.

## Methods

### `constructor(device: Device, props: ComputationProps)`

Creates a compute pipeline wrapper. Construction throws unless `device.type === 'webgpu'`.

### `destroy(): void`

Releases the pipeline, shader, and internal uniform-store resources.

### `predraw(): void`

Flushes current shader input values into managed uniform buffers before dispatch.

### `dispatch(computePass: ComputePass, x: number, y?: number, z?: number): void`

Updates the pipeline if needed, binds resources, and dispatches workgroups into the supplied compute pass.

### `setVertexCount(vertexCount: number): void`

Placeholder API for parity with draw-oriented models. Currently does not change behavior.

### `setInstanceCount(instanceCount: number): void`

Placeholder API for parity with draw-oriented models. Currently does not change behavior.

### `setShaderInputs(shaderInputs: ShaderInputs): void`

Replaces the active `ShaderInputs` manager and recreates managed uniform-buffer bindings for all shader modules.

### `setShaderModuleProps(props: Record<string, any>): void`

Derives module uniforms and bindings from shader-module props. This method currently extracts values but does not apply them back to the computation bindings.

### `updateShaderInputs(): void`

Writes current `ShaderInputs` values into the internal `UniformStore`.

### `setBindings(bindings: Record<string, Binding>): void`

Merges additional bindings into the current binding map.

## Remarks

- `Computation` is the preferred `@luma.gl/gpgpu` primitive for WebGPU compute work.
- `predraw()` is the compute equivalent of updating uniforms before a draw or dispatch.
- For WebGL2 transform-feedback workflows, use [`BufferTransform`](/docs/api-reference/gpgpu/buffer-transform).
