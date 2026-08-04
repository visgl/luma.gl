# Operations

[Overview](https://luma.gl/next/docs/api-reference/gpgpu.md)[GPU Evaluators](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data-evaluator.md)[Operations](https://luma.gl/next/docs/api-reference/gpgpu/operations.md)[Custom Operations](https://luma.gl/next/docs/api-reference/gpgpu/custom-operation.md)[cleanEvaluate](https://luma.gl/next/docs/api-reference/gpgpu/clean-evaluate.md)[Precision](https://luma.gl/next/docs/api-guide/shaders/gpu-floating-point-precision.md)[fp64](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64.md)[fp64 arithmetic](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md)

This page is the top-level API reference for the lazy operations exported by `@luma.gl/gpgpu`.

Each operation returns a new [`GPUDataEvaluator`](https://luma.gl/next/docs/api-reference/gpgpu/gpu-data-evaluator.md). No GPU work is performed until that output table is evaluated.

## Common Behavior[​](#common-behavior "Direct link to Common Behavior")

* Each operation returns a new `GPUDataEvaluator`.
* Inputs can be `GPUDataEvaluator` instances, fixed-width `GPUData` chunks, or borrowed `GPUDataView` values, including strided attributes in interleaved buffers.
* Arithmetic operations can also use scalar literals or literal row values.
* Multi-input operations deduce output `type`, `length`, and constant-ness from their inputs.
* Output evaluation is backend-driven through `backendRegistry`.
* Operations can be chained to build larger compute graphs.
* Operation result evaluators own their materialized immutable output buffer.
* Strided inputs do not make outputs strided; operation results are packed unless an operation explicitly documents another layout.
* Use `GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(...)` to apply the same leaf operation independently across preserved `GPUVector.data[]` chunks.
* The CPU backend is available by default. If no backend has been registered for a WebGL or WebGPU device, the matching backend is loaded automatically on first evaluation.
* Backend operation handlers can also be imported from `@luma.gl/gpgpu/webgl`, `@luma.gl/gpgpu/webgpu`, or `@luma.gl/gpgpu/cpu` for eager loading or custom subset registration.

## Arithmetic[​](#arithmetic "Direct link to Arithmetic")

The arithmetic API is exported from `@luma.gl/gpgpu` as:

* `add`
* `subtract`
* `multiply`
* `divide`
* `pow`
* `sqrt`
* `abs`
* `sin`
* `cos`
* `tan`
* `exp`
* `log`

### Signatures[​](#signatures "Direct link to Signatures")

```
type ArithmeticArgument = GPUDataEvaluatorInput | number | number[];



add(...args: ArithmeticArgument[]): GPUDataEvaluator

subtract(...args: ArithmeticArgument[]): GPUDataEvaluator

multiply(...args: ArithmeticArgument[]): GPUDataEvaluator

divide(...args: ArithmeticArgument[]): GPUDataEvaluator



pow(base: ArithmeticArgument, exponent: ArithmeticArgument): GPUDataEvaluator

sqrt(arg: ArithmeticArgument): GPUDataEvaluator

abs(arg: ArithmeticArgument): GPUDataEvaluator

sin(arg: ArithmeticArgument): GPUDataEvaluator

cos(arg: ArithmeticArgument): GPUDataEvaluator

tan(arg: ArithmeticArgument): GPUDataEvaluator

exp(arg: ArithmeticArgument): GPUDataEvaluator

log(arg: ArithmeticArgument): GPUDataEvaluator
```

### Behavior[​](#behavior "Direct link to Behavior")

* Arithmetic operations accept `GPUDataEvaluator` inputs, scalar literals, or literal row values such as `[1, 2, 3]`.
* `add`, `subtract`, `multiply`, and `divide` fold left to right across all arguments.
* The output row size is the largest row size among the table and literal inputs.
* Missing elements are treated as `0` for elementwise arithmetic when smaller rows are combined with larger rows.
* `pow`, `sqrt`, `sin`, `cos`, `tan`, `exp`, and `log` always produce `float32` output.

### Example[​](#example "Direct link to Example")

```
const xyz = GPUDataEvaluator.fromArray(

  new Float32Array([

    1, 2, 3,

    4, 5, 6

  ]),

  {size: 3}

);



const result = add(xyz, [10, 20, 30], 1);
```

## `interleave`[​](#interleave "Direct link to interleave")

### `interleave(...args: GPUDataEvaluatorInput[]): GPUDataEvaluator`[​](#interleaveargs-gpudataevaluatorinput-gpudataevaluator "Direct link to interleaveargs-gpudataevaluatorinput-gpudataevaluator")

Concatenates each input row in argument order.

For two inputs `x` and `y`, each output row is:

```
[...xRow, ...yRow]
```

The output:

* uses row size equal to the sum of the input row sizes
* uses the deduced output type from the inputs
* uses the deduced row count from the inputs

### Example[​](#example-1 "Direct link to Example")

```
const xyz = GPUDataEvaluator.fromArray(

  new Float32Array([

    0, 0, 0,

    1, 0, 0

  ]),

  {size: 3}

);



const id = GPUDataEvaluator.fromArray(new Float32Array([5, 6]), {size: 1});



const result = interleave(xyz, id);
```

## `swizzle`[​](#swizzle "Direct link to swizzle")

### `swizzle(table: GPUDataEvaluatorInput, columns: number[]): GPUDataEvaluator`[​](#swizzletable-gpudataevaluatorinput-columns-number-gpudataevaluator "Direct link to swizzletable-gpudataevaluatorinput-columns-number-gpudataevaluator")

Builds a new table by selecting specific columns from each input row.

For an input row `row`, the output row is:

```
[row[columns[0]], row[columns[1]], ...]
```

The output:

* uses `type = table.type`
* uses `size = columns.length`
* uses `length = table.length`
* preserves `normalized`

Behavior:

* `columns` must be a non-empty array of integer column indices.
* Each column index must be in the range `[0, table.size)`.
* Output columns preserve the exact order of `columns`.
* Duplicate column indices are allowed.
* Contiguous increasing column ranges such as `[1, 2, 3]` are optimized as a view into the same source table.
* Non-contiguous selections such as `[2, 0, 2]` materialize a new table through a backend operation.

### Example[​](#example-2 "Direct link to Example")

```
const values = GPUDataEvaluator.fromArray(

  [10, 11, 12, 13, 20, 21, 22, 23],

  {size: 4}

);



const yz = swizzle(values, [1, 2]);

const reordered = swizzle(values, [2, 0, 2]);
```

## `gather`[​](#gather "Direct link to gather")

### `gather(ids: GPUDataEvaluatorInput, sourceValues: GPUDataEvaluatorInput): GPUDataEvaluator`[​](#gatherids-gpudataevaluatorinput-sourcevalues-gpudataevaluatorinput-gpudataevaluator "Direct link to gatherids-gpudataevaluatorinput-sourcevalues-gpudataevaluatorinput-gpudataevaluator")

Gathers rows from `sourceValues` using 0-based row indices from `ids`.

The output:

* uses `type = sourceValues.type`
* uses `size = sourceValues.size`
* uses `length = ids.length`
* is constant when `ids` is constant

Behavior:

* Each row in `ids` must contain one scalar index.
* Out-of-range indices return a zero row.
* Indices are interpreted as row indices into `sourceValues`.

### Example[​](#example-3 "Direct link to Example")

```
const ids = GPUDataEvaluator.fromArray([2, 0, 1], {type: 'uint32', size: 1});

const values = GPUDataEvaluator.fromArray(

  [10, 11, 20, 21, 30, 31],

  {size: 2}

);



const result = gather(ids, values);
```

## `extent`[​](#extent "Direct link to extent")

### `extent(sourceValues: GPUDataEvaluatorInput): GPUDataEvaluator`[​](#extentsourcevalues-gpudataevaluatorinput-gpudataevaluator "Direct link to extentsourcevalues-gpudataevaluatorinput-gpudataevaluator")

Computes per-channel extents across all rows in `sourceValues`.

The output:

* uses `type = sourceValues.type`
* uses `size = 2`
* uses `length = sourceValues.size`

Each output row stores `[min, max]` for one channel of the input table.

For an input table with `size = 2`, the output rows are:

```
row 0: [min(x), max(x)]

row 1: [min(y), max(y)]
```

### Example[​](#example-4 "Direct link to Example")

```
const points = GPUDataEvaluator.fromArray(

  [4, 9, -1, 8, 7, 3, 2, 12],

  {size: 2}

);



const result = extent(points);
```

## `dot`[​](#dot "Direct link to dot")

### `dot(x: GPUDataEvaluatorInput, y: GPUDataEvaluatorInput): GPUDataEvaluator`[​](#dotx-gpudataevaluatorinput-y-gpudataevaluatorinput-gpudataevaluator "Direct link to dotx-gpudataevaluatorinput-y-gpudataevaluatorinput-gpudataevaluator")

Computes the row-wise dot product of `x` and `y`.

The output:

* uses `type = 'float32'`
* uses `size = 1`
* uses `length = max(x.length, y.length)`

Behavior:

* `x` and `y` must have the same row size.
* Each output row is `sum(x_i * y_i)` over all lanes in the row.
* Constant inputs broadcast across non-constant inputs as usual.

### Example[​](#example-5 "Direct link to Example")

```
const x = GPUDataEvaluator.fromArray(

  [1, 2, 3, 4, 5, 6],

  {size: 3}

);

const y = GPUDataEvaluator.fromArray(

  [7, 8, 9, -1, -2, -3],

  {size: 3}

);



const result = dot(x, y);
```

## `length`[​](#length "Direct link to length")

### `length(x: GPUDataEvaluatorInput): GPUDataEvaluator`[​](#lengthx-gpudataevaluatorinput-gpudataevaluator "Direct link to lengthx-gpudataevaluatorinput-gpudataevaluator")

Computes the Euclidean row length of `x`.

The output:

* uses `type = 'float32'`
* uses `size = 1`
* uses `length = x.length`

Behavior:

* Each output row is `sqrt(sum(x_i * x_i))` over all lanes in the row.
* `length()` is a row-reduction operation: it converts each input row to one scalar output row.

### Example[​](#example-6 "Direct link to Example")

```
const points = GPUDataEvaluator.fromArray(

  [3, 4, 5, 12],

  {size: 2}

);



const result = length(points);
```

## `equalAll`[​](#equalall "Direct link to equalall")

### `equalAll(x: GPUDataEvaluatorInput, y: GPUDataEvaluatorInput): GPUDataEvaluator`[​](#equalallx-gpudataevaluatorinput-y-gpudataevaluatorinput-gpudataevaluator "Direct link to equalallx-gpudataevaluatorinput-y-gpudataevaluatorinput-gpudataevaluator")

Checks row-wise equality across all lanes of `x` and `y`.

The output:

* uses `type = 'uint32'`
* uses `size = 1`
* uses `length = max(x.length, y.length)`

Each output row is:

```
1 if all lanes are equal, else 0
```

Behavior:

* `x` and `y` must have the same row size.
* Constant inputs broadcast across non-constant inputs as usual.
* `equalAll()` reduces each row pair to a scalar loop/identity-style flag.

### Example[​](#example-7 "Direct link to Example")

```
const a = GPUDataEvaluator.fromArray(

  [1, 2, 3, 4, 5, 6],

  {size: 3}

);

const b = GPUDataEvaluator.fromArray(

  [1, 2, 3, 4, 0, 6],

  {size: 3}

);



const result = equalAll(a, b);
```

## `sequence`[​](#sequence "Direct link to sequence")

### `sequence(count: number, start?: number, step?: number): GPUDataEvaluator`[​](#sequencecount-number-start-number-step-number-gpudataevaluator "Direct link to sequencecount-number-start-number-step-number-gpudataevaluator")

Generates a lazy integer sequence.

The output:

* uses `type = 'sint32'`
* uses `size = 1`
* uses `length = count`

Behavior:

* `start` defaults to `0`
* `step` defaults to `1`
* `count`, `start`, and `step` must be integers
* `count` must be non-negative
* `step` must not be `0`

### Example[​](#example-8 "Direct link to Example")

```
const a = sequence(5);        // 0, 1, 2, 3, 4

const b = sequence(4, 10, 2); // 10, 12, 14, 16
```

## `select`[​](#select "Direct link to select")

### `select(condition: GPUDataEvaluatorInput, whenTrue: GPUDataEvaluatorInput, whenFalse: GPUDataEvaluatorInput): GPUDataEvaluator`[​](#selectcondition-gpudataevaluatorinput-whentrue-gpudataevaluatorinput-whenfalse-gpudataevaluatorinput-gpudataevaluator "Direct link to selectcondition-gpudataevaluatorinput-whentrue-gpudataevaluatorinput-whenfalse-gpudataevaluatorinput-gpudataevaluator")

Selects row or lane values from `whenTrue` or `whenFalse` using non-zero condition values.

The output:

* uses the deduced `type` from `whenTrue` and `whenFalse`
* uses the deduced `size` from `whenTrue` and `whenFalse`
* uses `length = max(condition.length, whenTrue.length, whenFalse.length)`

Behavior:

* `condition`, `whenTrue`, and `whenFalse` may each be size `1` or match the resolved output row size.
* Size `1` inputs broadcast across lanes.
* Each output lane uses `whenTrue` when the corresponding condition lane is non-zero, otherwise `whenFalse`.
* A scalar condition selects the entire row.

### Example[​](#example-9 "Direct link to Example")

```
const condition = GPUDataEvaluator.fromArray([1, 0, 1], {type: 'uint32', size: 1});

const whenTrue = GPUDataEvaluator.fromArray([10, 11, 20, 21, 30, 31], {size: 2});

const whenFalse = GPUDataEvaluator.fromArray([100, 101, 200, 201, 300, 301], {size: 2});



const result = select(condition, whenTrue, whenFalse);
```

## `segmentedMap`[​](#segmentedmap "Direct link to segmentedmap")

### `segmentedMap(segments: GPUDataEvaluatorInput, vertexCount: number): GPUDataEvaluator`[​](#segmentedmapsegments-gpudataevaluatorinput-vertexcount-number-gpudataevaluator "Direct link to segmentedmapsegments-gpudataevaluatorinput-vertexcount-number-gpudataevaluator")

Maps each vertex index to its containing segment and its offset within that segment.

The output:

* uses `type = 'uint32'`
* uses `size = 2`
* uses `length = vertexCount`

Each output row stores:

```
[segmentIndex, vertexIndexInSegment]
```

Behavior:

* `segments` must be a scalar `uint32` table of segment start indices.
* `vertexCount` defines the output row count and the exclusive end of the final segment.
* Segment starts must be non-decreasing.
* Duplicate starts are allowed and represent empty segments.
* `segments[0]` must be `0`.

For segment starts `[0, 3, 3, 6]`, the output rows begin:

```
row 0: [0, 0]

row 1: [0, 1]

row 2: [0, 2]

row 3: [2, 0]

row 4: [2, 1]

row 5: [2, 2]

row 6: [3, 0]
```

### Example[​](#example-10 "Direct link to Example")

```
const segments = GPUDataEvaluator.fromArray([0, 3, 5], {type: 'uint32', size: 1});



const result = segmentedMap(segments, 7);
```

## `fround`[​](#fround "Direct link to fround")

### `fround(x: GPUDataEvaluatorInput): GPUDataEvaluator`[​](#froundx-gpudataevaluatorinput-gpudataevaluator "Direct link to froundx-gpudataevaluatorinput-gpudataevaluator")

Splits float64 values into float32 high and low parts for fp64-style workflows.

`GPUDataEvaluator.fromArray()` represents `Float64Array` input as `uint32` pairs. `fround()` consumes that representation and returns a `float32` table whose row size is doubled:

* the first half of each row stores the high float32 parts
* the second half stores the low residual parts

### Example[​](#example-11 "Direct link to Example")

```
const source = GPUDataEvaluator.fromArray(

  new Float64Array([Math.PI, Math.E]),

  {size: 1}

);



const result = fround(source);
```

## Remarks[​](#remarks "Direct link to Remarks")

* `add()` and `interleave()` accept multiple arguments and fold from left to right.
* `GPUData` inputs are adapted into single-chunk evaluator views through their borrowed buffers; those buffers remain externally owned.
* Use `GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(...)` to apply the same lazy transform to every preserved `GPUData` chunk in a streaming vector.
* `fround()` is specialized and only accepts one input.
* As new operations are added to `@luma.gl/gpgpu`, this page should remain the top-level reference for them.
* Arithmetic operations can mix tables and literals in the same expression.
* `gather()` is currently a direct row-index gather, not a key-based lookup.
* `swizzle()` is a row-shaping operation: it preserves row count while reordering, duplicating, or slicing columns within each row.
* `dot()`, `length()`, and `equalAll()` are row-wise operations: they inspect all lanes in each input row and emit one scalar output row.
* `extent()` is a reduction operation: it collapses many input rows into one `[min, max]` row per channel.
* `select()` is lane-wise and size-preserving; it uses scalar or per-lane non-zero masks to choose between two inputs.
* `sequence()` produces data without any table inputs, but still returns a lazy `GPUDataEvaluator`.
* `segmentedMap()` is a per-vertex segment-annotation operation, not a segmented reduction.
