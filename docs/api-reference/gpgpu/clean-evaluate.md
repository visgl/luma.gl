# cleanEvaluate

`cleanEvaluate()` is a small utility for evaluating one or more result tables while cleaning up intermediate `GPUTableEvaluator` dependencies that are no longer needed.

This is most useful when you build a lazy operation graph inline and only want to keep the final output evaluators alive.

## Usage

```ts
import {GPUTableEvaluator, add, cleanEvaluate} from '@luma.gl/gpgpu';

const positions = GPUTableEvaluator.fromArray(
  new Float32Array([
    0, 0, 0,
    1, 0, 0
  ]),
  {size: 3}
);

const offset = GPUTableEvaluator.fromConstant([1, 2, 3]);
const translated = add(positions, offset);

await cleanEvaluate(device, {translated});

const values = await translated.readValue();
translated.destroy();
```

## Signature

### `cleanEvaluate(device, result): Promise<ResultT>`

```ts
function cleanEvaluate<
  ResultT extends GPUTableEvaluator | GPUTableEvaluator[] | Record<string, unknown>
>(device: Device, result: ResultT): Promise<ResultT>;
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `device` | `Device` | The device used to evaluate the returned tables. |
| `result` | `GPUTableEvaluator \| GPUTableEvaluator[] \| Record<string, unknown>` | The final evaluator or evaluators that should remain alive after evaluation. |

## Behavior

`cleanEvaluate()`:

- finds all `GPUTableEvaluator` instances directly referenced by `result`
- evaluates those root evaluators
- walks their dependency graph through `source`
- destroys dependency evaluators whose GPU buffers are not also used by the root evaluators
- returns the original `result` object

This lets you keep a compact final result shape while avoiding manual cleanup of temporary operation nodes.

## Remarks

- `cleanEvaluate()` only looks at evaluators directly contained in the provided result value. If you pass a record, non-evaluator properties are ignored.
- Returned root evaluators are not destroyed automatically. Call `destroy()` on them when you are done.
