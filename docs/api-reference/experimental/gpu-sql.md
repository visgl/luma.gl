import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPU SQL

<ExperimentalDocsTabs active="gpu-sql" />

## Overview

`@luma.gl/graph/gpu-sql` provides a bounded SQL frontend for
[`GPUDataFrame`](/docs/api-reference/experimental/gpu-dataframe). `GPUSQLContext` registers
existing GPU dataframes by name and lowers supported statements into the same immutable GPU
dataframe planner. Planning does not upload, submit, allocate query output, or read GPU buffers.

The optional loaders.gl integration lives in the
[GPU data analysis example](https://github.com/visgl/luma.gl/blob/master/examples/experimental/gpu-data-analysis/src/loaders-sql-query.ts).
Its `planGPUDataFrameQuery()` helper consumes the loaders.gl plan directly. Copy the adapter into
your application and install `@loaders.gl/core` and `@loaders.gl/sql` when needed.
The `@luma.gl/graph/gpu-sql` module exports the native frontend without a loaders.gl dependency.

## When to use it

Use GPU SQL when an application already has GPU dataframe inputs and a constrained SQL surface is
more convenient than manually composing expressions, filters, aggregations, ordering, and joins.
Use GPU Dataframe directly when an application needs behavior outside the supported grammar.

Use the loaders.gl adapter when a query originates in a loader, catalog, or application component
that already emits `TableQueryOptions` and `SQLPredicate` values:

```ts
import {parseSQLPredicate} from '@loaders.gl/sql';
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {planGPUDataFrameQuery} from './loaders-sql-query';

const predicate = parseSQLPredicate('fare >= :minimum AND category IN (0, 1)', {
  preserveParameters: true
});
const query = planGPUDataFrameQuery(frame, {
  predicate,
  columns: ['fare', 'category'],
  parameters: {minimum: 8}
});
const compiled = query.compile(new GPUCommandGraph(device));

const commandEncoder = device.createCommandEncoder();
compiled.encode(commandEncoder, {minimum: 10});
device.submit(commandEncoder.finish());
```

The compiled result stays GPU-resident as `table`, `validity`, `dictionaries`, `rowIndices`, and
`selectedCounts`. Rendering or another command graph can consume those resources directly. Arrow
readback remains an explicit adapter operation rather than the query's required result type.

## Execution boundary

The execution boundary is explicit: Arrow input → GPU dataframe execution → GPU consumers.
Use `makeGPUAnalyticsTableFromArrowTable()` to upload input, construct a `GPUDataFrame`, compile
the query into a caller-owned `GPUCommandGraph`, then encode and submit the graph. Downstream
rendering and compute can use the compiled GPU resources directly. Call
`makeArrowTableFromGPUAnalyticsTable()` only when the application explicitly needs CPU readback.

## Supported grammar

`SQRT`, `LN`, `LOG10`, `ASIN`, and `ACOS` accept Float32 inputs. Square root requires a nonnegative
value, logarithms require a positive value, and inverse sine and cosine accept the interval [-1, 1].
Invalid domains and non-finite inputs produce null in GPU SQL. `SIN`, `COS`, `TAN`,
`ATAN`, and `EXP` also accept Float32 inputs and return null for non-finite inputs. `EXP`
returns null when its result would overflow Float32. Trigonometric functions use radians.
`RADIANS` and `DEGREES` convert Float32 angles. Both return null for non-finite inputs,
and `DEGREES` also returns null if the converted magnitude would overflow.
`ATAN2(y, x)` takes two Float32 values and returns the quadrant-aware angle in radians.
A null or non-finite argument, or the origin where both arguments are zero, yields null.

`MOD(dividend, divisor)` takes matching Int32 or Uint32 inputs. The remainder keeps the
dividend's sign. A null argument or zero divisor yields null.


`CAST` supports scalar Float32, Int32, and Uint32 results. Float-to-integer casts truncate toward zero
and clamp out-of-range finite values to the target limits. Null and non-finite inputs produce null
when converting from Float32 to an integer.


`COALESCE` returns the first valid value from 2–64 scalar numeric arguments. `NULLIF`
returns null when its two valid numeric arguments compare equal. Columns in either
function use matching scalar formats.


`ABS`, `FLOOR`, `CEILING`, `ROUND`, and `TRUNC` accept one numeric argument and preserve nulls.
`SIGN` preserves the input format and returns -1, 0, or 1 for finite scalar numeric inputs.
`ROUND` rounds halfway values away from zero. `ABS` supports Float32 and Uint32. The rounding
functions also accept Int32 and return integer inputs unchanged. Calls on untyped literals or
parameters use Float32, so a comparison with an integer column requires matching formats.


Searched `CASE WHEN … THEN … ELSE … END` can produce numeric columns. Conditions that are null skip
the branch. Numeric column branches must have the same scalar format. An omitted `ELSE` yields null.

- `SELECT *`, named columns, numeric expressions, and explicit `AS` aliases.
  Projection-only queries can pass through packed GPU columns and retain their source buffers.

- One registered `FROM` table with optional aliases.
- `WHERE` comparisons, `AND`, `OR`, `NOT`, parentheses, `IS NULL`, and `IS NOT NULL`.
- `IN` and `NOT IN` compare a source column against up to 64 literals or named parameters.
  A null candidate makes a nonmatching result unknown, which `WHERE` excludes.
- Named `:parameter` values with planning defaults and encoding-time updates.
- One or more numeric `ORDER BY` expressions, each with its own direction and null ordering, and an optional bounded `LIMIT`.
  Keys are evaluated in priority order. Rows that tie on every key retain their input order.
  Sort keys can use source fields outside the projection and are excluded from the output schema.

  A one-based position refers to the SELECT output, including computed aliases and expanded `*`.

- For ordered queries, `OFFSET` skips globally sorted rows across batches before applying `LIMIT`.
- `COUNT(*)`, `COUNT(column)`, `SUM`, `MIN`, `MAX`, and `AVG`, with optional `GROUP BY`.
  `COUNT(column)` counts valid values after filtering, while `COUNT(*)` counts all selected rows.
  Numeric aggregate expressions such as `SUM(fare * 2) AS total` require an explicit output alias.


  Refer to a selected key by source name, a matching expression, a one-based SELECT position, or an unqualified alias that does not shadow a source column.
  GROUP BY keys may be omitted from SELECT. Queries with hidden keys return only groups observed after WHERE.
  A projected computed key such as `FLOOR(fare) AS bucket` requires an explicit SELECT alias. Computed keys use observed grouping.
  HAVING filters grouped results before ordering and pagination. It can reference SELECT output names and aggregate calls, including calls omitted from SELECT. For unordered HAVING results, pass `rowIndices` and `selectedCounts` to Arrow readback.
  Set `maxReductionScratchBytes` in the query options to cap temporary partial buffers per grouped SUM or AVG. AVG counts both the sum and count buffers. The GPU reuses scratch across key ranges. `maxMeanScratchBytes` can also constrain the size of an individual AVG partial buffer.
  Grouped queries accept ORDER BY on SELECT output names, positions, or aggregate calls. Aggregate sort keys may be omitted from SELECT. Apply LIMIT and OFFSET to the sorted groups. Pass `globalRowIndices` and `globalSelectedCount` to Arrow readback for ordered groups.
  Grouped results preserve SELECT column order and retain key dictionaries under their output names.
  A projected single dictionary key returns the full category domain. Single numeric keys and multi-key queries return only groups observed after WHERE.
  Observed grouping supports uint32, sint32, float32, and dictionary-encoded keys, including nulls. Float keys group both signed zeros together and treat all NaNs as a single value.
  For observed results, pass the compiled query’s `rowIndices` and `selectedCounts` to Arrow readback to read the observed rows from the capacity-backed result.

  Default aggregate aliases use the bound field name, such as `sum_fare` for `SUM(trips.fare)`.

- One `INNER`, `LEFT`, `SEMI`, or `ANTI JOIN` over a single equality key.
  Aggregates can consume the selected left rows of a unique-right join directly on the GPU. The join and aggregate execute in one graph. An invalid right key index contributes no rows.
  The SELECT list controls result order and may omit either join key. `INNER JOIN` and `LEFT JOIN` can project direct right-side packed 32-bit numeric columns, including two- to four-component vectors and dictionary codes with adapter metadata. For example, `SELECT t.identifier, a.score AS account_score FROM trips AS t LEFT JOIN accounts AS a ON t.identifier = a.identifier`. The GPU gathers right payloads into the original left batch layout. For multiple left batches, the join can stage contiguous right payload chunks in GPU scratch, then gather each staged range once per left batch and projected column. Each staged range spans consecutive right chunks that fit in one storage binding. The GPU copies chunks with copy-source usage directly and can stage storage-only chunks with compute passes when the staging and gather steps together use fewer compute passes than direct gathering. The join gathers directly from any remaining source chunks. Set `maxJoinProjectionScratchBytes` to cap the combined staged payload and validity bytes across projected right columns. The planner considers columns in SELECT order and can stage a partial range when the whole column exceeds the remaining budget. A budget of zero disables staging. The cap applies to projection staging only. Multiple aliases for the same right source column share its gather work, GPU values, validity mask, and staging allocation. The result retains each alias in SELECT order. An unmatched left row yields null for every right field. SELECT expressions can combine left and right numeric inputs and use named parameters. Expressions run after matching, so COALESCE can replace a null from an unmatched right row. Right-side predicates remain outside this projection path. Global and grouped aggregates over INNER and LEFT JOIN can consume direct right payload columns, including in HAVING and aggregate sort expressions. COUNT excludes unmatched and null right values. Joined GROUP BY keys and computed right aggregate arguments remain outside this path.
  Qualify the ON operands when the join sides cannot be determined from their field names.

SQL keywords and registered table names are case-insensitive. Column names must match the
dataframe schema exactly, even when unquoted. Double-quote reserved names such as `"limit"`
and `"order"`. A quoted identifier such as `"fare.total"` names a single field. In
`trips."fare.total"`, `trips` qualifies the field. The period inside the quotes remains part of its name.

Unsupported statements, unknown columns, unregistered tables, unsupported strings, ambiguous
expressions and pagination without ordering fail during CPU-only planning.
Applications still own command submission, synchronization, result readback, and cleanup.

The loaders.gl adapter currently supports predicate pushdown and output projection. It accepts
finite numeric, Boolean, and null predicate values, including reusable named parameters. Portable
source-order `limit`, streaming, in-flight cancellation, string/binary/date values, and relational
extensions are reported or rejected as unsupported instead of silently falling back to CPU work.

## Inspecting a plan

Call `context.query(sql).explain()` to inspect the bound execution route, projected and working columns, key count, join type, and pagination before compiling. The frozen description is generated during CPU planning and allocates no GPU buffers.


## Related modules

- [GPU Dataframe](/docs/api-reference/experimental/gpu-dataframe)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
- [Arrow](/docs/api-reference/arrow)


## Benchmark right-side projection

Run the opt-in WebGPU benchmark with fixed row counts and varying right batch counts:

```sh
yarn test-browser-benchmarks modules/graph/test/gpu-sql/gpu-join-projection-benchmark.spec.ts
```

The benchmark checks result parity and records projection compute passes, copy passes, and staging
bytes. It separately reports graph compilation, command encoding, and the wall time from encoding
to GPU completion. Separate GPU timestamp runs measure the graph's compute passes when the device exposes timestamp
queries. Native copies contribute to wall time. Arrow readback runs outside the timed samples.
