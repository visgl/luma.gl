# Operations

This page is the central API reference for the operations supported by `@luma.gl/gpgpu`.

Operations are lazy. Calling an operation such as `add()` or `interleave()` returns a new [`GPUTable`](/docs/api-reference/gpgpu/gpu-table) that describes the result, but no GPU work is performed until that table is evaluated.

## Common Behavior

- Each operation returns a new `GPUTable`.
- Input tables can be constant or per-row.
- Output evaluation is backend-driven through `backendRegistry`.
- Operations can be chained to build larger compute graphs.
- The CPU backend is registered by default. Register `webglBackend` or `webgpuBackend` before evaluating on those device types.

## `add`

### `add(...args: GPUTable[]): GPUTable`

Adds corresponding elements from two or more input tables.

The output:

- uses the largest input row size among the arguments
- uses the deduced output type from the inputs
- uses the deduced row count from the inputs
- treats missing elements as `0` when smaller inputs are combined with larger ones

#### Example

```ts
const a = GPUTable.fromArray(new Float32Array([1, 2, 3, 4]), {size: 2});
const b = GPUTable.fromConstant([10, 20]);
const c = GPUTable.fromConstant([100, 200]);

const result = add(a, b, c);
```

## `interleave`

### `interleave(...args: GPUTable[]): GPUTable`

Concatenates rows from multiple input tables in argument order.

For two inputs `x` and `y`, each output row is:

```text
[...xRow, ...yRow]
```

The output:

- uses row size equal to the sum of the input row sizes
- uses the deduced output type from the inputs
- uses the deduced row count from the inputs

#### Example

```ts
const xyz = GPUTable.fromArray(new Float32Array([
  0, 0, 0,
  1, 0, 0
]), {size: 3});

const id = GPUTable.fromArray(new Float32Array([5, 6]), {size: 1});

const result = interleave(xyz, id);
```

## `fround`

### `fround(x: GPUTable): GPUTable`

Splits float64 values into float32 high and low parts.

This operation expects the input table to use `uint32` storage, which is how `GPUTable.fromArray()` represents `Float64Array` input internally.

For each float64 value `d`, the output stores all high parts first, followed by all low parts:

- `high = Math.fround(d)`
- `low = d - high`

This is useful for workflows that need fp64-style precision while running on float32-oriented GPU pipelines.

#### Example

```ts
const source = GPUTable.fromArray(new Float64Array([Math.PI, Math.E]), {size: 1});
const result = fround(source);
```

## Remarks

- `add()` and `interleave()` accept multiple arguments and fold from left to right.
- `fround()` is specialized and only accepts one input table.
- As new operations are added to `@luma.gl/gpgpu`, this page should remain the top-level reference for them.
