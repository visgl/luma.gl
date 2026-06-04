# Overview

The `@luma.gl/gpgpu` module performs GPU-based data transformation.

## API Reference

- [`Operations`](/docs/api-reference/gpgpu/operations)
- [`Custom Operations`](/docs/api-reference/gpgpu/custom-operation)
- [`GPUTableEvaluator`](/docs/api-reference/gpgpu/gpu-table)
- [`cleanEvaluate`](/docs/api-reference/gpgpu/clean-evaluate)

## Installing

```bash
npm install @luma.gl/gpgpu
```

## Usage

Interleaving two buffers together

```ts
import {luma} from '@luma.gl/core';
import {webglAdapter} from '@luma.gl/webgl';
import {GPUTableEvaluator, add, interleave} from '@luma.gl/gpgpu';

const inputA = GPUTableEvaluator.fromArray(new Float32Array([0, 0, 0, 1, 0, 0]), {size: 3});
const inputB = GPUTableEvaluator.fromArray(new Float32Array([10, 20]), {size: 1});
const output = interleave(inputA, inputB);

// Operations can be chained
const outputAlt = interleave(inputA, add(inputB, GPUTableEvaluator.fromConstant(1)));

// No computation is performed until the output is evaluated.
// The WebGL backend is loaded automatically on first use.

const device = await luma.createDevice({
  type: 'webgl',
  adapters: [webglAdapter]
});

const outputVector = await output.evaluate(device);
```

## BackendRegistry

The `backendRegistry` dispatches lazy operations to the backend module for the
evaluation device. The CPU backend is available by default. If no backend has
been registered for a `webgl` or `webgpu` device, `@luma.gl/gpgpu`
automatically loads the matching backend with a dynamic import, so built-in
backend registration is not required.

```ts
const outputVector = await output.evaluate(device);
```

Backend modules are also available from dedicated endpoints. Use these imports
when you want to eagerly load a backend or register a custom subset of operation
handlers:

```ts
import {backendRegistry} from '@luma.gl/gpgpu';
import * as webglBackend from '@luma.gl/gpgpu/webgl';
import * as webgpuBackend from '@luma.gl/gpgpu/webgpu';

backendRegistry.add('webgl', webglBackend);
backendRegistry.add('webgpu', webgpuBackend);
```

The same endpoints export individual backend operation handlers. Applications
can combine those handlers with their own custom operation handlers, or register
only the handlers they need. When registering a subset, only those operations can
be evaluated for that device type:

```ts
import {backendRegistry, type OperationHandler} from '@luma.gl/gpgpu';
import {interleave, swizzle} from '@luma.gl/gpgpu/webgl';

const zeroRows: OperationHandler = async ({output, target}) => {
  const value = new output.ValueType(output.length * output.size);
  // Custom operation implementation. Write the result into `target`.
  target.write(value);
  return {success: true, value};
};

backendRegistry.add('webgl', {
  // Built-in operation handlers selected from the WebGL backend.
  interleave,
  swizzle,

  // Custom operation handler. The key must match the custom operation name.
  zeroRows
});
```

See [`Custom Operations`](/docs/api-reference/gpgpu/custom-operation) for a full
operation and backend handler example.

The CPU backend can be imported from `@luma.gl/gpgpu/cpu` when explicitly
registering CPU handlers for another device type.

## Concepts

- [`Operations`](/docs/api-reference/gpgpu/operations) documents the supported lazy compute operations such as `add()`, `interleave()`, and `fround()`.
- [`Custom Operations`](/docs/api-reference/gpgpu/custom-operation) shows how to define lazy operations and register backend handlers.
- [`GPUTableEvaluator`](/docs/api-reference/gpgpu/gpu-table) represents structured input and output data for lazy GPGPU operations. It can borrow packed single-chunk `GPUVector` inputs from `@luma.gl/tables`.
- [`cleanEvaluate`](/docs/api-reference/gpgpu/clean-evaluate) evaluates final result tables and cleans up intermediate dependencies in one step.

## Related Engine APIs

`@luma.gl/gpgpu` uses engine compute helpers internally, but it does not re-export them. Import [`BufferTransform`](/docs/api-reference/engine/compute/buffer-transform), [`TextureTransform`](/docs/api-reference/engine/compute/texture-transform), and [`Computation`](/docs/api-reference/engine/compute/computation) from `@luma.gl/engine` when you need direct access to those lower-level classes.
