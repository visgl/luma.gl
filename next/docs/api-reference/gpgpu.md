# Overview

[Overview](https://luma.gl/next/docs/api-reference/gpgpu.md)[GPU Evaluators](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data-evaluator.md)[Operations](https://luma.gl/next/docs/api-reference/gpgpu/operations.md)[Custom Operations](https://luma.gl/next/docs/api-reference/gpgpu/custom-operation.md)[cleanEvaluate](https://luma.gl/next/docs/api-reference/gpgpu/clean-evaluate.md)

The `@luma.gl/gpgpu` module performs GPU-based data transformation.

## API Reference[​](#api-reference "Direct link to API Reference")

* [`Operations`](https://luma.gl/next/docs/api-reference/gpgpu/operations.md)
* [`Custom Operations`](https://luma.gl/next/docs/api-reference/gpgpu/custom-operation.md)
* [`GPU Evaluators`](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data-evaluator.md)
* [`cleanEvaluate`](https://luma.gl/next/docs/api-reference/gpgpu/clean-evaluate.md)

## Installing[​](#installing "Direct link to Installing")

```
npm install @luma.gl/gpgpu
```

## Usage[​](#usage "Direct link to Usage")

Interleaving two buffers together

```
import {luma} from '@luma.gl/core';
import {webglAdapter} from '@luma.gl/webgl';
import {GPUDataEvaluator, add, interleave} from '@luma.gl/gpgpu';

const inputA = GPUDataEvaluator.fromArray(new Float32Array([0, 0, 0, 1, 0, 0]), {size: 3});
const inputB = GPUDataEvaluator.fromArray(new Float32Array([10, 20]), {size: 1});
const output = interleave(inputA, inputB);

// Operations can be chained
const outputAlt = interleave(inputA, add(inputB, GPUDataEvaluator.fromConstant(1)));

// No computation is performed until the output is evaluated.
// The WebGL backend is loaded automatically on first use.

const device = await luma.createDevice({
  type: 'webgl',
  adapters: [webglAdapter]
});

const outputVector = await output.evaluate(device);
```

For synchronous call sites that cannot propagate `Promise`s, use the sync counterparts:

* `output.evaluateSync(device)`
* `cleanEvaluateSync(device, result)`

Sync evaluation requires any backend modules to already be registered and any required CPU values to already be present. If a sync path would need async work, it throws immediately instead of waiting.

## BackendRegistry[​](#backendregistry "Direct link to BackendRegistry")

The `backendRegistry` dispatches lazy operations to the backend module for the evaluation device. The CPU backend is available by default. If no backend has been registered for a `webgl` or `webgpu` device, `@luma.gl/gpgpu` automatically loads the matching backend with a dynamic import, so built-in backend registration is not required.

```
const outputVector = await output.evaluate(device);
```

Backend modules are also available from dedicated endpoints. Use these imports when you want to eagerly load a backend or register a custom subset of operation handlers:

```
import {backendRegistry} from '@luma.gl/gpgpu';
import * as webglBackend from '@luma.gl/gpgpu/webgl';
import * as webgpuBackend from '@luma.gl/gpgpu/webgpu';

backendRegistry.add('webgl', webglBackend);
backendRegistry.add('webgpu', webgpuBackend);
```

If you plan to use synchronous evaluation on a `webgl` or `webgpu` device, eager registration is recommended so backend lookup is already resolved:

```
import {backendRegistry, cleanEvaluateSync, interleave} from '@luma.gl/gpgpu';
import * as webgpuBackend from '@luma.gl/gpgpu/webgpu';

backendRegistry.add('webgpu', webgpuBackend);

const packed = interleave(inputA, inputB);
cleanEvaluateSync(device, packed);
```

The same endpoints export individual backend operation handlers. Applications can combine those handlers with their own custom operation handlers, or register only the handlers they need. When registering a subset, only those operations can be evaluated for that device type:

```
import {backendRegistry} from '@luma.gl/gpgpu';
import {interleave, swizzle} from '@luma.gl/gpgpu/webgl';
import {customOpWebGL} from './custom-operation';

backendRegistry.add('webgl', {
  // Built-in operation handlers selected from the WebGL backend.
  interleave,
  swizzle,

  // Custom operation handler. The key must match the custom operation name.
  customOp: customOpWebGL
});
```

See [`Custom Operations`](https://luma.gl/next/docs/api-reference/gpgpu/custom-operation.md) for a full operation and backend handler example.

The CPU backend can be imported from `@luma.gl/gpgpu/cpu` when explicitly registering CPU handlers for another device type.

## Concepts[​](#concepts "Direct link to Concepts")

* [`Choosing a GPU Data-Processing API`](https://luma.gl/next/docs/api-guide/gpu/gpu-data-processing.md) compares portable GPGPU evaluators with `GPUCommandGraph` and lower-level compute helpers.
* [`Operations`](https://luma.gl/next/docs/api-reference/gpgpu/operations.md) documents the supported lazy compute operations such as `add()`, `interleave()`, and `fround()`.
* [`Custom Operations`](https://luma.gl/next/docs/api-reference/gpgpu/custom-operation.md) shows how to define lazy operations and register backend handlers.
* [`GPU Evaluators`](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data-evaluator.md) documents `GPUDataEvaluator` for one fixed-width `GPUData` or borrowed strided `GPUDataView`, and `GPUVectorEvaluator` for chunk-preserving `GPUVector.data[]` transforms.
* [`cleanEvaluate`](https://luma.gl/next/docs/api-reference/gpgpu/clean-evaluate.md) evaluates final result tables and cleans up intermediate dependencies in one step.

## Related Engine APIs[​](#related-engine-apis "Direct link to Related Engine APIs")

`@luma.gl/gpgpu` uses engine compute helpers internally, but it does not re-export them. Import [`BufferTransform`](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md), [`TextureTransform`](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md), and [`Computation`](https://luma.gl/next/docs/api-reference/engine/compute/computation.md) from `@luma.gl/engine` when you need direct access to those lower-level classes.
