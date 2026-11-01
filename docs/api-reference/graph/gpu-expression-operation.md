# GPUExpressionOperation

`GPUExpressionOperation` describes a numeric expression over named graph declarations.
Both `GPUGraph` and `GPUSimpleGraph` accept it through `graph.add()`. Expressions are parsed
with `@math.gl/expressions`; its JavaScript evaluator is not used to execute GPU work.

## Declare, compile, and bind

```typescript
import {GPUGraph, GPUExpressionOperation} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';

const graph = device.type === 'webgpu' ? new GPUGraph() : new GPUSimpleGraph();
graph.vector('positions', 'float32');
graph.scalar('scale', 'float32');
graph.vector('offset', 'float32');
graph.vector('transformed', 'float32');
graph.add(new GPUExpressionOperation({
  output: 'transformed',
  expression: 'positions * scale + offset'
}));

const compiled = graph.compile(device, {outputs: ['transformed']});
const first = await compiled.run({positions, scale: 2, offset});
const second = await compiled.run({positions: nextPositions, scale: 3, offset: nextOffset});
// Each result is independent, including when the second input has a different length.
// After GPU consumers have finished:
first.transformed.destroy();
second.transformed.destroy();
compiled.destroy();
```

Declarations contain types, not data. An omitted vector length is resolved from execution
bindings. An explicit length, such as `graph.vector('positions', 'float32', {length: 1024})`, constrains
all executions. Inputs are borrowed `GPUVector` objects or numeric scalar values. This first
subset uses packed float32, sint32, and uint32 vectors and scalars. Arithmetic operands must be float32; use explicit casts for integer inputs.

## Expression syntax

The `expression` property accepts a string or the AST returned by math.gl's `parse()`:

```typescript
import {parse} from '@math.gl/expressions';
const operation = new GPUExpressionOperation({
  output: 'transformed',
  expression: parse('positions * scale + offset')
});
```

Supported expressions contain declared identifiers, finite numeric literals, parentheses,
unary negation, binary `+`, `-`, `*`, `/`, and the function calls described below. Operators act elementwise; scalars broadcast to
vector rows. Vector outputs require at least one vector input. Scalar expressions produce a
one-row output vector with the declared numeric format. Arbitrary functions, member access, indexing, comparisons, conditionals,
and other JavaScript syntax are not part of this initial GPU subset. Parsing successfully
in math.gl does not imply support by the GPU compiler.

Compilation rejects undeclared identifiers, incompatible formats, duplicate expression
writers, forward references to expression outputs, and unsupported syntax. Add producers
before their consumers. Expressions nested inside conditional or loop composites are not yet supported. Runtime checks enforce the supplied device, formats, declared lengths,
and relationships between input dimensions.

## Math functions and numeric casts

Expressions accept `abs(x)`, `sqrt(x)`, `pow(x, exponent)`, `sin(x)`, `cos(x)`,
`tan(x)`, `exp(x)`, and `log(x)`. Arguments may be nested expressions and named inputs.
These functions operate on float32 values, and vector inputs are evaluated row by row.
Numeric literals are float32; use integer declarations to retain exact 32-bit integer inputs.
Only these bare function names are accepted: `Math.sin(x)`, arbitrary functions, and
incorrect argument counts are rejected at compilation. Function names are intrinsic,
not callable values supplied through bindings.

Use `float32(x)`, `sint32(x)`, and `uint32(x)` for explicit numeric value conversions.
The expression result type must match its output declaration. For example:

```typescript
graph.vector('indices', 'uint32');
graph.vector('weights', 'float32');
graph.add(new GPUExpressionOperation({
  output: 'weights',
  expression: 'sqrt(float32(indices))'
}));
```

Float-to-integer casts truncate toward zero and saturate to the destination range.
Integer-to-integer casts also saturate; they do not reinterpret bits or wrap. Converting
integers to float32 may lose precision. Integer input bindings must be integral and in
range. Arithmetic and math calls require float32 operands, so `uint32(x) + 1` requires
an explicit conversion back to float32 in this initial subset.

These casts apply to finite numeric values. Results of out-of-domain math, overflow,
and casts of nonfinite intermediate values have no cross-backend guarantee. Use positive
bases for portable `pow` results, positive arguments for `log`, and nonnegative arguments
for `sqrt`; transcendental results follow backend float32 accuracy rather than bitwise
JavaScript equivalence.

Numeric casts do not add normalized or packed storage formats to expression graphs.
The existing `castData` evaluator retains its separate physical-format conversion and
rounding behavior. Pure arithmetic/function expressions retain evaluator fusion.
Casts introduce explicit conversion stages on SimpleGraph; WebGPU stages share its
single evaluation scope, and WebGL uses GPU transform feedback without CPU readback.

## Chunking and ownership

Multiple vector operands must have equal lengths and matching chunk boundaries, including
empty chunks. Outputs preserve that topology. The implementation never merges or repacks
input chunks. Execution rejects incompatible boundaries instead of copying them implicitly.

`compile(device, {outputs})` selects the results to retain. By default every expression output
is selected. Returned allocated vectors belong to the caller and survive another run or
`compiled.destroy()`. Unselected intermediate storage is released after execution. Input
vectors remain caller-owned.

To supply output storage, pass `run(bindings, {outputTargets: {transformed: destination}})`.
Targets must have the inferred numeric layout and chunk topology. Writable chunks within a target must not overlap. They are borrowed and must
not alias inputs or other expression outputs. Results reference the supplied target objects.

## Full-graph composition

Expression results are ordinary logical graph values, so a subsequent WebGPU operation can
consume them:

```typescript
import {GPUGraphVectorMADD} from '@luma.gl/graph/gpu-core';

const graph = new GPUGraph();
const input = graph.vector('input', 'float32');
const transformed = graph.vector('transformed', 'float32');
const output = graph.vector('output', 'float32');
const scale = graph.scalar('scale', 'float32');
graph.add(new GPUExpressionOperation({output: 'transformed', expression: 'input * scale'}));
graph.add(new GPUGraphVectorMADD({input: transformed, scale, addend: input, output}));
const compiled = graph.compile(device, {outputs: ['output']});
const results = await compiled.run({input: inputVector, scale: 2, output: outputVector});
```

Expressions can also consume scalars produced by preceding `GPUGraphDotProduct`,
`GPUGraphScalarLiteral`, or `GPUGraphScalarOperation` operations without a host binding.
Those scalar results can be selected as outputs and are returned as one-row GPUVectors.
Internal vector outputs from `GPUGraphVectorMADD` and `GPUGraphSpMV` are prepared before their
consumers and can also be selected as results. MADD inherits its input chunk topology when
no output topology is declared; other fixed-shape outputs use their declared dimensions.

The full graph encodes expressions and its other operations into one command encoder and
submits once. Its expression shaders are compiled once and take dimensions at execution.
Resource preparation and command-graph lowering happen per run. Existing non-expression
operations may still specialize their shaders for concrete dimensions. Texture declarations
are not yet supported by this reusable expression-program entry point; the existing
`GPUGraphCompiler.compile(program, bindings)` API remains available for those programs.

SimpleGraph lowers the same expression subset through the existing arithmetic evaluators.
WebGPU execution uses one evaluation scope; WebGL retains the existing evaluator submission
behavior. Backend shader caches remain responsible for SimpleGraph shader reuse.

## Compiled program objects

`GPUGraph.compile(device)` returns `CompiledGPUGraph`.
`GPUSimpleGraph.compile(device)` returns `CompiledGPUSimpleExpressionGraph`.
Both expose `run(bindings, options)` and `destroy()`. Destroying a compiled program releases
its retained compilation resources, not the caller's inputs or returned outputs.

## Existing evaluator APIs

`GPUDataEvaluator`, `GPUVectorEvaluator`, their operation functions, and direct evaluation
remain unchanged. Legacy `new GPUSimpleGraph(device).compile(options)` graphs also retain
their existing caching, scope, and result-ownership behavior. The new declaration-based path
uses `new GPUSimpleGraph()` and `compile(device, options)`; do not mix its operations with
legacy evaluator adapters in one builder.
