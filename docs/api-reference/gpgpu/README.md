# Overview

The `@luma.gl/gpgpu` module performs GPU-based data transformation.

## API Reference

- [`Operations`](/docs/api-reference/gpgpu/operations)
- [`GPUTable`](/docs/api-reference/gpgpu/gpu-table)
- [`BufferTransform`](/docs/api-reference/gpgpu/buffer-transform)
- [`TextureTransform`](/docs/api-reference/gpgpu/texture-transform)
- [`Computation`](/docs/api-reference/gpgpu/computation)

## Installing

```bash
npm install @luma.gl/gpgpu
```


## Usage

Interleaving two buffers together

```ts
import {luma} from '@luma.gl/core';
import {webglAdapter} from '@luma.gl/webgl';
import {GPUTable, backendRegistry, webglBackend, add, interleave} from '@luma.gl/gpgpu';

const inputA = GPUTable.fromArray(<Float32Array>, {size: 3});
const inputB = GPUTable.fromArray(<Float32Array>, {size: 1});
const output = interleave(inputA, inputB);

// Operations can be chained
const outputAlt = interleave(inputA, add(inputB, 1));

// No computation is performed until the output is evaluated
backendRegistry.add('webgl', webglBackend);

const device = await luma.createDevice({
  type: 'webgl',
  adapters: [webglAdapter]
});

await output.evaluate(device);
```

## BackendRegistry

The `backendRegistry` allows apps to include the implementation for the device types that they wish to support.

```ts
import {backendRegistry, webglBackend, webgpuBackend} from '@luma.gl/gpgpu';

backendRegistry.add('webgl', webglBackend);
backendRegistry.add('webgpu', webgpuBackend);
```

## Concepts

- [`Operations`](/docs/api-reference/gpgpu/operations) documents the supported lazy compute operations such as `add()`, `interleave()`, and `fround()`.
- [`GPUTable`](/docs/api-reference/gpgpu/gpu-table) represents structured input and output data for lazy GPGPU operations.
- [`BufferTransform`](/docs/api-reference/gpgpu/buffer-transform) wraps WebGL2 transform feedback for buffer-to-buffer computation.
- [`TextureTransform`](/docs/api-reference/gpgpu/texture-transform) is the older render-to-texture transform helper.
- [`Computation`](/docs/api-reference/gpgpu/computation) wraps WebGPU compute pipelines and dispatches.
