# GPUExpressionOperation

`GPUExpressionOperation` describes a numeric expression over named graph declarations.
Both `GPUGraph` and `GPUSimpleGraph` accept it through `graph.add()`. Expressions are parsed
with `@math.gl/expressions`; its JavaScript evaluator is not used to execute GPU work.
The same expression works on WebGL through SimpleGraph and on WebGPU through either graph.

This page is the expression syntax reference as well as the operation API guide.

- [Syntax at a glance](#syntax-at-a-glance)
- [Types and broadcasting](#typed-rows-and-component-wise-execution)
- [Components and constructors](#component-access-and-row-construction)
- [Math and casts](#math-functions-and-numeric-casts)
- [Row math, equality, and selection](#row-math-equality-and-selection)
- [Errors and unsupported syntax](#errors-and-unsupported-syntax)
- [Chunking and ownership](#chunking-and-ownership)

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
subset uses float32, sint32, and uint32 scalars and packed vector rows of one to four components
(`float32`, `float32x2`, `float32x3`, `float32x4`, and corresponding integer formats).
Arithmetic operands must have float32 components; use explicit casts for integer inputs.

## Syntax at a glance

| Syntax | Meaning | Example |
| --- | --- | --- |
| Declared name | Execution-time scalar or vector input, or preceding output | `positions`, `scale` |
| Numeric literal | Finite float32 number | `1`, `0.25`, `1e-3` |
| `(...)` | Grouping; multiplication/division precede addition/subtraction | `(positions + offset) * scale` |
| `-x`, `+`, `-`, `*`, `/` | Component-wise float32 arithmetic | `positions * scale` |
| `abs`, `sqrt`, `sin`, `cos`, `tan`, `exp`, `log` | One-argument component-wise float32 functions | `sqrt(abs(values))` |
| `pow(x, exponent)` | Component-wise float32 power | `pow(values, 2)` |
| `float32`, `sint32`, `uint32` | Explicit, width-preserving numeric casts | `sint32(positions)` |
| `.x`, `.yz`, `.zyx`, `.xx` | Static component selection, reordering, repetition | `positions.zyx` |
| `vec2`, `vec3`, `vec4` | Concatenate components or replicate one component | `vec4(positions, 1)` |
| `dot(x, y)` | Sum component products **within each row** | `dot(positions, directions)` |
| `length(x)` | Euclidean magnitude **within each row** | `length(positions)` |
| `equalAll(x, y)` | All components equal; one uint32 0/1 per row | `equalAll(ids, targetIds)` |
| `select(condition, whenTrue, whenFalse)` | Choose values using a numeric condition | `select(mask, colors, vec4(0))` |

These are the complete supported operators and function names; JavaScript's broader
syntax and math.gl's other functions are not implicitly available.

## Expression strings and ASTs

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
one-row output vector with the declared numeric format. Use `equalAll` and `select` for
equality and conditional value selection; JavaScript comparison and ternary operators are
not supported. Parsing successfully in math.gl does not imply support by the GPU compiler.

Compilation rejects undeclared identifiers, incompatible formats, duplicate expression
writers, forward references to expression outputs, and unsupported syntax. Add producers
before their consumers. Expressions nested inside conditional or loop composites are not yet supported. Runtime checks enforce the supplied device, formats, declared lengths,
and relationships between input dimensions.

## Typed rows and component-wise execution

The vector format fixes each row's component type and width. Vector length remains the
number of rows and is supplied at execution; width is not another runtime dimension.

```typescript
graph.vector('positions', 'float32x3');
graph.vector('offsets', 'float32x3');
graph.scalar('scale', 'float32');
graph.vector('transformed', 'float32x3');
graph.vector('indices', 'sint32x3');
graph.add(new GPUExpressionOperation({
  output: 'transformed',
  expression: 'positions * scale + offsets'
}));
graph.add(new GPUExpressionOperation({
  output: 'indices',
  expression: 'sint32(transformed)',
  integerRounding: 'nearest'
}));
```

Arithmetic and component-wise math calls operate independently on each component. One-component operands
broadcast across the other operand's components; other width mismatches fail at compilation.
This includes one-component vector rows: a `float32` vector can supply one weight per row
for a `float32x3` vector, with matching row counts and chunk boundaries. Scalar declarations
still accept a single numeric binding, which broadcasts across all rows and components.

Casts preserve width: `sint32(positions)` produces `sint32x3`, applying rounding and saturation
independently per component. The output declaration must match the inferred component type
and width. Integer arithmetic requires an explicit conversion back to float32.

Storage stays packed: `float32x3` occupies 12 bytes per row on both backends, without WGSL
`vec3` padding. Inputs and caller-provided output targets must have the matching packed row
stride and a four-byte-aligned offset. Existing chunk boundaries and ownership rules apply.

Row functions can change the component width, but do not change the number of rows.
Existing evaluator operations and their APIs remain unchanged.

## Component access and row construction

Static `.xyzw` selectors choose one to four components per row. `positions.x` returns one
component, `positions.zyx` reorders a three-component row, and `positions.xx` repeats its first
component. Selectors can be nested and applied to subexpressions. A selector must fit the
input width; `.w` on a three-component row fails at compilation. Computed indexing, `.rgba`
aliases, and arbitrary properties are not supported.

`vec2(...)`, `vec3(...)`, and `vec4(...)` concatenate argument components in order. A single
one-component argument replicates to the requested width. Otherwise the total component
count must exactly match the constructor width; there is no implicit padding or truncation.

```typescript
graph.vector('positions', 'float32x3');
graph.vector('homogeneous', 'float32x4');
graph.vector('reordered', 'float32x3');
graph.add(new GPUExpressionOperation({
  output: 'homogeneous',
  expression: 'vec4(positions, 1)'
}));
graph.add(new GPUExpressionOperation({
  output: 'reordered',
  expression: 'homogeneous.zyx'
}));
```

Constructors infer their component type from their arguments and require matching types.
For example, `vec3(ids.xy, uint32(1))` preserves exact uint32 values. Numeric literals are
float32, so `vec3(ids.xy, 1)` requires an explicit cast when `ids` is uint32. Existing
width-preserving casts apply to constructed rows and selections.

One-component selections broadcast in arithmetic: `positions + positions.y` adds each row's
second component to every component in that row. Scalar-only constructors can be used inside
expressions, such as `positions + vec3(scale)`. A vector output still needs a vector input to
determine its runtime row count. Chunk-boundary and ownership rules are unchanged; returned
outputs are materialized results, even when a selector can use a borrowed intermediate view.

Compilation reports the operation ID with concise width/type diagnostics, for example
`reorder: .w needs 4 components; positions has 3`.

## Math functions and numeric casts

Expressions accept `abs(x)`, `sqrt(x)`, `pow(x, exponent)`, `sin(x)`, `cos(x)`,
`tan(x)`, `exp(x)`, and `log(x)`. Arguments may be nested expressions and named inputs.
These functions operate on float32 values, and vector inputs are evaluated row by row.
Numeric literals are float32; use integer declarations to retain exact 32-bit integer inputs.
Only the documented bare function names are accepted: `Math.sin(x)`, arbitrary functions, and
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

Float-to-integer casts default to truncation toward zero and saturate to the destination range.
Set `integerRounding: 'nearest'` on an expression operation to round to the nearest integer,
with exact half-way ties away from zero, before saturation:

```typescript
graph.add(new GPUExpressionOperation({
  output: 'indices',
  expression: 'uint32(position)',
  integerRounding: 'nearest' // default: 'truncate'
}));
```

The option applies to every float-to-integer cast in that operation, including nested casts.
Different operations in the same graph can select different modes. It does not change
integer-to-integer casts, conversion to float32, or arithmetic. Both backends use the same
rounding rule; for example, nearest maps `-1.5` to `-2` and `1.5` to `2` before saturation.
Integer-to-integer casts also saturate; they do not reinterpret bits or wrap. Converting
integers to float32 may lose precision. Integer input bindings must be integral and in
range. Arithmetic and float32 math calls require float32 operands, so `uint32(x) + 1` requires
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

## Row math, equality, and selection

All four functions are row-local: they preserve row counts and chunk boundaries. They can
be nested with arithmetic, casts, constructors, and selectors.

| Function | Input rules | Result |
| --- | --- | --- |
| `dot(x, y)` | Float32 components; identical widths from 1 to 4 | One float32 component per row |
| `length(x)` | Float32 components; width 1 to 4 | One float32 component per row |
| `equalAll(x, y)` | Identical component types and widths | One uint32 component, either 0 or 1, per row |
| `select(condition, whenTrue, whenFalse)` | Branch component types must match; widths follow the rules below | The branch component type and resolved branch width |

### Dot products and lengths

`dot(vec3(1, 2, 3), vec3(4, 5, 6))` is `32`. `length(vec2(3, 4))` is `5`.
For one-component rows, `dot(x, y)` is multiplication and `length(x)` is magnitude.
Neither function reduces across rows: `length(positions)` gives one length for each position,
not the number of positions or the length of the whole buffer.

`dot` requires equal widths; write `dot(positions, vec3(scale))` to explicitly replicate a
scalar. Integer inputs require a cast, such as `length(float32(integerPositions))`.
The scalar row result broadcasts in surrounding arithmetic:

```typescript
graph.vector('positions', 'float32x3');
graph.vector('distance', 'float32');
graph.vector('direction', 'float32x3');
graph.scalar('epsilon', 'float32'); // Bind a positive value, e.g. 1e-6.
graph.add(new GPUExpressionOperation({output: 'distance', expression: 'length(positions)'}));
graph.add(new GPUExpressionOperation({
  output: 'direction',
  expression: 'positions / (distance + epsilon)'
}));
```

The positive `epsilon` keeps the denominator nonzero. The result approaches unit length
for positions whose magnitude is large relative to epsilon; zero positions remain zero.

### Equality

`equalAll` compares corresponding components without converting their type. It returns
`uint32(1)` only when every component matches, otherwise `uint32(0)`. Integer comparisons
retain exact 32-bit values, including values beyond float32's exact integer range.
Float comparisons are exact comparisons, not approximate comparisons with a tolerance.

There is no implicit width broadcast in `equalAll`. To compare every component to the same
value, write `equalAll(ids, vec3(targetId))`, where both inputs have uint32 components.

### Selection

The argument order matches the existing evaluator API:

```text
select(condition, whenTrue, whenFalse)
```

**This differs from WGSL's builtin order**, which places the false value first and condition
last. Expression syntax always uses the condition-first order shown above.

- Zero selects `whenFalse`; any nonzero numeric value selects `whenTrue`.
- A one-component condition chooses a whole row. A multi-component condition chooses each
  component independently.
- Branch component types must match. A one-component branch broadcasts to the other branch's
  width; otherwise branch widths must match.
- The condition must have one component or the resolved branch width. It may use any of the
  three numeric component types, independently of the branch type. Fractional and negative
  nonzero conditions remain true even when selecting integer values.
- Both branches are evaluated. Selection preserves rows; it neither filters nor compacts data.

```typescript
graph.vector('ids', 'uint32');
graph.scalar('selectedId', 'uint32');
graph.vector('colors', 'float32x4');
graph.vector('highlighted', 'float32x4');
graph.add(new GPUExpressionOperation({
  output: 'highlighted',
  expression: 'select(equalAll(ids, selectedId), vec4(1, 1, 0, 1), colors)'
}));
```

Component-wise example: `select(vec3(0, -2, 0.5), vec3(10), vec3(20))` produces
`vec3(20, 10, 10)`. Selecting integer branches preserves their type and precision;
use `uint32(0)` instead of the float32 literal `0` for an integer fallback.

On SimpleGraph, row functions use existing evaluator handlers. Condition normalization
happens before branch-type conversion. Row operations can introduce intermediate GPU passes;
WebGPU still submits once. Full GPUGraph compiles the functions into each expression's shader.

## Errors and unsupported syntax

Compilation prefixes concise errors with the operation ID. Supplying `id` makes failures
easier to locate; the default is `<output>-expression`.

| Error or unsupported expression | Fix |
| --- | --- |
| `reorder: .w needs 4 components; positions has 3` | Choose an existing component or construct a wider row. |
| `dot requires matching row widths` | Match both widths; explicitly replicate a scalar with `vecN`. |
| `equalAll requires matching types and row widths` | Cast deliberately and match widths before comparing. |
| `select branches require matching component types` | Cast one branch, including numeric literal fallbacks. |
| `select widths must match its branches or be one component` | Use a scalar condition or match the branch row width. |
| `Arithmetic requires float32 operands` | Use `float32(...)` around integer operands. |
| `Math.sqrt(x)` | Use the bare function `sqrt(x)`. |
| `positions[0]`, `positions.rgba` | Use static `.xyzw` selectors. |
| `x == y`, `condition ? a : b` | Use `equalAll(x, y)` and `select(condition, a, b)`. |

Assignments, arbitrary calls, logical/comparison operators, computed indexing, and general
JavaScript objects are unsupported. Expressions cannot gather other rows, generate sequences,
perform whole-vector reductions, or process variable-length rows. Use dedicated graph/evaluator
operations for those tasks. Physical formats such as float16, narrow integers, normalized
colors, and float64 high/low splitting remain outside the expression format subset.

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
