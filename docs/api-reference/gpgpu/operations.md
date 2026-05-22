# Operations

This page is the top-level API reference for the lazy operations exported by `@luma.gl/gpgpu`.

Each operation returns a new [`GPUTableEvaluator`](/docs/api-reference/gpgpu/gpu-table). No GPU work is performed until that output table is evaluated.

## Common Behavior

- Operations are lazy and chainable.
- Inputs can be constant tables or per-row tables.
- Most multi-input operations deduce output `type`, `length`, and constant-ness from their inputs.
- For WebGL and WebGPU evaluation, register the relevant backend with `backendRegistry`.
- The CPU backend is registered by default.

## Arithmetic

The arithmetic API is exported from `@luma.gl/gpgpu` as:

- `add`
- `subtract`
- `multiply`
- `divide`
- `pow`
- `sqrt`
- `abs`
- `sin`
- `cos`
- `tan`
- `exp`
- `log`

### Signatures

```ts
type ArithmeticArgument = GPUTableEvaluator | number | number[];

add(...args: ArithmeticArgument[]): GPUTableEvaluator
subtract(...args: ArithmeticArgument[]): GPUTableEvaluator
multiply(...args: ArithmeticArgument[]): GPUTableEvaluator
divide(...args: ArithmeticArgument[]): GPUTableEvaluator

pow(base: ArithmeticArgument, exponent: ArithmeticArgument): GPUTableEvaluator
sqrt(arg: ArithmeticArgument): GPUTableEvaluator
abs(arg: ArithmeticArgument): GPUTableEvaluator
sin(arg: ArithmeticArgument): GPUTableEvaluator
cos(arg: ArithmeticArgument): GPUTableEvaluator
tan(arg: ArithmeticArgument): GPUTableEvaluator
exp(arg: ArithmeticArgument): GPUTableEvaluator
log(arg: ArithmeticArgument): GPUTableEvaluator
```

### Behavior

- Arithmetic operations accept `GPUTableEvaluator` inputs, scalar literals, or literal row values such as `[1, 2, 3]`.
- `add`, `subtract`, `multiply`, and `divide` fold left to right across all arguments.
- The output row size is the largest row size among the table and literal inputs.
- Missing elements are treated as `0` for elementwise arithmetic when smaller rows are combined with larger rows.
- `pow`, `sqrt`, `sin`, `cos`, `tan`, `exp`, and `log` always produce `float32` output.

### Example

```ts
const xyz = GPUTableEvaluator.fromArray(
  new Float32Array([
    1, 2, 3,
    4, 5, 6
  ]),
  {size: 3}
);

const result = add(xyz, [10, 20, 30], 1);
```

## `interleave`

### `interleave(...args: GPUTableEvaluator[]): GPUTableEvaluator`

Concatenates each input row in argument order.

For two inputs `x` and `y`, each output row is:

```text
[...xRow, ...yRow]
```

The output:

- uses row size equal to the sum of the input row sizes
- uses the deduced output type from the inputs
- uses the deduced row count from the inputs

### Example

```ts
const xyz = GPUTableEvaluator.fromArray(
  new Float32Array([
    0, 0, 0,
    1, 0, 0
  ]),
  {size: 3}
);

const id = GPUTableEvaluator.fromArray(new Float32Array([5, 6]), {size: 1});

const result = interleave(xyz, id);
```

## `gather`

### `gather(ids: GPUTableEvaluator, sourceValues: GPUTableEvaluator): GPUTableEvaluator`

Gathers rows from `sourceValues` using 0-based row indices from `ids`.

The output:

- uses `type = sourceValues.type`
- uses `size = sourceValues.size`
- uses `length = ids.length`
- is constant when `ids` is constant

Behavior:

- Each row in `ids` must contain one scalar index.
- Out-of-range indices return a zero row.
- Indices are interpreted as row indices into `sourceValues`.

### Example

```ts
const ids = GPUTableEvaluator.fromArray([2, 0, 1], {type: 'uint32', size: 1});
const values = GPUTableEvaluator.fromArray(
  [10, 11, 20, 21, 30, 31],
  {size: 2}
);

const result = gather(ids, values);
```

## `extent`

### `extent(sourceValues: GPUTableEvaluator): GPUTableEvaluator`

Computes per-channel extents across all rows in `sourceValues`.

The output:

- uses `type = sourceValues.type`
- uses `size = 2`
- uses `length = sourceValues.size`

Each output row stores `[min, max]` for one channel of the input table.

For an input table with `size = 2`, the output rows are:

```text
row 0: [min(x), max(x)]
row 1: [min(y), max(y)]
```

### Example

```ts
const points = GPUTableEvaluator.fromArray(
  [4, 9, -1, 8, 7, 3, 2, 12],
  {size: 2}
);

const result = extent(points);
```

## `sequence`

### `sequence(count: number, start?: number, step?: number): GPUTableEvaluator`

Generates a lazy integer sequence.

The output:

- uses `type = 'sint32'`
- uses `size = 1`
- uses `length = count`

Behavior:

- `start` defaults to `0`
- `step` defaults to `1`
- `count`, `start`, and `step` must be integers
- `count` must be non-negative
- `step` must not be `0`

### Example

```ts
const a = sequence(5);        // 0, 1, 2, 3, 4
const b = sequence(4, 10, 2); // 10, 12, 14, 16
```

## `fround`

### `fround(x: GPUTableEvaluator): GPUTableEvaluator`

Splits float64 values into float32 high and low parts for fp64-style workflows.

`GPUTableEvaluator.fromArray()` represents `Float64Array` input as `uint32` pairs. `fround()` consumes that representation and returns a `float32` table whose row size is doubled:

- the first half of each row stores the high float32 parts
- the second half stores the low residual parts

### Example

```ts
const source = GPUTableEvaluator.fromArray(
  new Float64Array([Math.PI, Math.E]),
  {size: 1}
);

const result = fround(source);
```

## Remarks

- Arithmetic operations can mix tables and literals in the same expression.
- `gather()` is currently a direct row-index gather, not a key-based lookup.
- `extent()` is a reduction operation: it collapses many input rows into one `[min, max]` row per channel.
- `sequence()` produces data without any table inputs, but still returns a lazy `GPUTableEvaluator`.
