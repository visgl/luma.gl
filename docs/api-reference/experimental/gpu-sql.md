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
Invalid domains and non-finite inputs produce null in GPU SQL. Angles are in radians.


`CAST` supports scalar Float32, Int32, and Uint32 results. Float-to-integer casts truncate toward zero
and clamp out-of-range finite values to the target limits. Null and non-finite inputs produce null
when converting from Float32 to an integer.


`COALESCE` returns the first valid value from 2–64 scalar numeric arguments. `NULLIF`
returns null when its two valid numeric arguments compare equal. Columns in either
function use matching scalar formats.


`ABS`, `FLOOR`, `CEILING`, `ROUND`, and `TRUNC` accept one numeric argument and preserve nulls.
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
- One numeric `ORDER BY` expression with direction, null ordering, and optional bounded `LIMIT`.
  Sort keys can use source fields outside the projection and are excluded from the output schema.

  A one-based position refers to the SELECT output, including computed aliases and expanded `*`.

- For ordered queries, `OFFSET` skips globally sorted rows across batches before applying `LIMIT`.
- `COUNT(*)`, `COUNT(column)`, `SUM`, `MIN`, `MAX`, and `AVG`, with an optional single-column `GROUP BY`.
  `COUNT(column)` counts valid values after filtering, while `COUNT(*)` counts all selected rows.
  Numeric aggregate expressions such as `SUM(fare * 2) AS total` require an explicit output alias.


  Refer to the selected key by source name, a one-based SELECT position, or an unqualified alias that does not shadow a source column.
  Grouped results preserve SELECT column order and retain the key dictionary under the output name.

  Default aggregate aliases use the bound field name, such as `sum_fare` for `SUM(trips.fare)`.

- One `INNER`, `LEFT`, `SEMI`, or `ANTI JOIN` over a single equality key.

SQL keywords and registered table names are case-insensitive. Column names must match the
dataframe schema exactly, even when unquoted. Double-quote reserved names such as `"limit"`
and `"order"`. A quoted identifier such as `"fare.total"` names a single field. In
`trips."fare.total"`, `trips` qualifies the field. The period inside the quotes remains part of its name.

Unsupported statements, unknown columns, unregistered tables, unsupported strings, ambiguous
expressions, multiple sort/group keys, and pagination without ordering fail during CPU-only planning.
Applications still own command submission, synchronization, result readback, and cleanup.

The loaders.gl adapter currently supports predicate pushdown and output projection. It accepts
finite numeric, Boolean, and null predicate values, including reusable named parameters. Portable
source-order `limit`, streaming, in-flight cancellation, string/binary/date values, and relational
extensions are reported or rejected as unsupported instead of silently falling back to CPU work.

## Related modules

- [GPU Dataframe](/docs/api-reference/experimental/gpu-dataframe)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
- [Arrow](/docs/api-reference/arrow)
