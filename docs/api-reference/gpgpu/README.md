# Overview

The `@luma.gl/gpgpu` module performs GPU-based data transformation.

## API Reference

- [`Operations`](/docs/api-reference/gpgpu/operations)
- [`GPUTable`](/docs/api-reference/gpgpu/gpu-table)

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

const inputA = GPUTable.fromArray(new Float32Array([0, 0, 0, 1, 0, 0]), {size: 3});
const inputB = GPUTable.fromArray(new Float32Array([10, 20]), {size: 1});
const output = interleave(inputA, inputB);

// Operations can be chained
const outputAlt = interleave(inputA, add(inputB, GPUTable.fromConstant(1)));

// No computation is performed until the output is evaluated
backendRegistry.add('webgl', webglBackend);

const device = await luma.createDevice({
  type: 'webgl',
  adapters: [webglAdapter]
});

await output.evaluate(device);
```

## BackendRegistry

The `backendRegistry` allows apps to include only the implementations for the device types that they wish to support. The CPU backend is registered by default. Register `webglBackend` or `webgpuBackend` before evaluating operation-backed tables on those device types.

```ts
import {backendRegistry, webglBackend, webgpuBackend} from '@luma.gl/gpgpu';

backendRegistry.add('webgl', webglBackend);
backendRegistry.add('webgpu', webgpuBackend);
```

## Concepts

- [`Operations`](/docs/api-reference/gpgpu/operations) documents the supported lazy compute operations such as `add()`, `interleave()`, and `fround()`.
- [`GPUTable`](/docs/api-reference/gpgpu/gpu-table) represents structured input and output data for lazy GPGPU operations.

## Related Engine APIs

`@luma.gl/gpgpu` uses engine compute helpers internally, but it does not re-export them. Import [`BufferTransform`](/docs/api-reference/engine/compute/buffer-transform), [`TextureTransform`](/docs/api-reference/engine/compute/texture-transform), and [`Computation`](/docs/api-reference/engine/compute/computation) from `@luma.gl/engine` when you need direct access to those lower-level classes.
