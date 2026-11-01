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
subset uses packed float32 vectors and float32 scalars.

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
unary negation, and binary `+`, `-`, `*`, `/`. Operators act elementwise; scalars broadcast to
vector rows. Vector outputs require at least one vector input. Scalar expressions produce a
one-row float32 output vector. Functions, member access, indexing, comparisons, conditionals,
and other JavaScript syntax are not part of this initial GPU subset. Parsing successfully
in math.gl does not imply support by the GPU compiler.

Compilation rejects undeclared identifiers, incompatible formats, duplicate expression
writers, forward references to expression outputs, and unsupported syntax. Add producers
before their consumers. Expressions nested inside conditional or loop composites are not yet supported. Runtime checks enforce the supplied device, formats, declared lengths,
and relationships between input dimensions.

## Chunking and ownership

Multiple vector operands must have equal lengths and matching chunk boundaries, including
empty chunks. Outputs preserve that topology. The implementation never merges or repacks
input chunks. Execution rejects incompatible boundaries instead of copying them implicitly.

`compile(device, {outputs})` selects the results to retain. By default every expression output
is selected. Returned allocated vectors belong to the caller and survive another run or
`compiled.destroy()`. Unselected intermediate storage is released after execution. Input
vectors remain caller-owned.

To supply output storage, pass `run(bindings, {outputTargets: {transformed: destination}})`.
Targets must have the inferred float32 layout and chunk topology. Writable chunks within a target must not overlap. They are borrowed and must
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
