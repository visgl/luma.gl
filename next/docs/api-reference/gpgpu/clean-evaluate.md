# cleanEvaluate / cleanEvaluateSync

[Overview](https://luma.gl/next/docs/api-reference/gpgpu.md)[GPU evaluators](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data-evaluator.md)[Operations](https://luma.gl/next/docs/api-reference/gpgpu/operations.md)[Custom operations](https://luma.gl/next/docs/api-reference/gpgpu/custom-operation.md)[cleanEvaluate](https://luma.gl/next/docs/api-reference/gpgpu/clean-evaluate.md)

`cleanEvaluate()` evaluates one or more result evaluators while cleaning up intermediate `GPUDataEvaluator` dependencies that are no longer needed. `GPUVectorEvaluator` roots are also supported.

`cleanEvaluateSync()` is the synchronous counterpart for call sites that must stay synchronous.

This is most useful when you build a lazy operation graph inline and only want to keep the final output evaluators alive.

## Usage[​](#usage "Direct link to Usage")

```
import {GPUDataEvaluator, add, cleanEvaluate} from '@luma.gl/gpgpu';



const positions = GPUDataEvaluator.fromArray(

  new Float32Array([

    0, 0, 0,

    1, 0, 0

  ]),

  {size: 3}

);



const offset = GPUDataEvaluator.fromConstant([1, 2, 3]);

const translated = add(positions, offset);



await cleanEvaluate(device, {translated});



const values = await translated.readValue();

translated.destroy();
```

### Sync usage[​](#sync-usage "Direct link to Sync usage")

```
import {GPUDataEvaluator, add, cleanEvaluateSync} from '@luma.gl/gpgpu';



const positions = GPUDataEvaluator.fromArray(

  new Float32Array([

    0, 0, 0,

    1, 0, 0

  ]),

  {size: 3}

);



const offset = GPUDataEvaluator.fromConstant([1, 2, 3]);

const translated = add(positions, offset);



cleanEvaluateSync(device, {translated});



translated.destroy();
```

## Signature[​](#signature "Direct link to Signature")

### `cleanEvaluate(device, result): Promise<ResultT>`[​](#cleanevaluatedevice-result-promiseresultt "Direct link to cleanevaluatedevice-result-promiseresultt")

```
function cleanEvaluate<

  ResultT extends GPUDataEvaluator | GPUVectorEvaluator | Array<GPUDataEvaluator | GPUVectorEvaluator> | Record<string, unknown>

>(device: Device, result: ResultT): Promise<ResultT>;
```

### `cleanEvaluateSync(device, result): ResultT`[​](#cleanevaluatesyncdevice-result-resultt "Direct link to cleanevaluatesyncdevice-result-resultt")

```
function cleanEvaluateSync<

  ResultT extends GPUDataEvaluator | GPUVectorEvaluator | Array<GPUDataEvaluator | GPUVectorEvaluator> | Record<string, unknown>

>(device: Device, result: ResultT): ResultT;
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Type                                                                                                                 | Description                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `device`  | `Device`                                                                                                             | The device used to evaluate the returned tables.                             |
| `result`  | `GPUDataEvaluator \| GPUVectorEvaluator \| Array<GPUDataEvaluator \| GPUVectorEvaluator> \| Record<string, unknown>` | The final evaluator or evaluators that should remain alive after evaluation. |

## Behavior[​](#behavior "Direct link to Behavior")

`cleanEvaluate()` and `cleanEvaluateSync()`:

* finds all `GPUDataEvaluator` and `GPUVectorEvaluator` instances directly referenced by `result`
* evaluates those root evaluators
* walks their dependency graph through `source`
* destroys dependency evaluators whose GPU buffers are not also used by the root evaluators
* returns the original `result` object

This lets you keep a compact final result shape while avoiding manual cleanup of intermediate dependency evaluators.

## Remarks[​](#remarks "Direct link to Remarks")

* `cleanEvaluate()` only looks at evaluators directly contained in the provided result value. If you pass a record, non-evaluator properties are ignored.
* `cleanEvaluateSync()` evaluates the same root shapes, but throws immediately if backend lookup or dependency materialization would require async work.
* Returned root evaluators are not destroyed automatically. Call `destroy()` on them when you are done.
