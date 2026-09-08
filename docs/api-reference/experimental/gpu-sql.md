import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPU SQL

<ExperimentalDocsTabs active="gpu-sql" />

## Overview

`@luma.gl/experimental/gpu-sql` provides a bounded SQL frontend for
[`GPUDataFrame`](/docs/api-reference/experimental/gpu-dataframe). `LuSQLContext` registers
existing GPU dataframes by name and lowers supported statements into the same immutable GPU
dataframe planner. Planning does not upload, submit, allocate query output, or read GPU buffers.

The same subpath also adapts the portable predicate and table-query syntax introduced by
`@loaders.gl/sql` 5.0. `planGPUDataFrameQuery()` consumes the loaders.gl plan directly; luma.gl does
not maintain a copied query planner or a second predicate syntax for this integration.

## When to use it

Use GPU SQL when an application already has GPU dataframe inputs and a constrained SQL surface is
more convenient than manually composing expressions, filters, aggregations, ordering, and joins.
Use GPU Dataframe directly when an application needs behavior outside the supported grammar.

Use the loaders.gl adapter when a query originates in a loader, catalog, or application component
that already emits `TableQueryOptions` and `SQLPredicate` values:

```ts
import {parseSQLPredicate} from '@loaders.gl/sql';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {planGPUDataFrameQuery} from '@luma.gl/experimental/gpu-sql';

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

- `SELECT *`, named columns, numeric expressions, and explicit `AS` aliases.
- One registered `FROM` table with optional aliases.
- `WHERE` comparisons, `AND`, `OR`, `NOT`, parentheses, `IS NULL`, and `IS NOT NULL`.
- Named `:parameter` values with planning defaults and encoding-time updates.
- One `ORDER BY` column with direction, null ordering, and optional bounded `LIMIT`.
- `COUNT(*)`, `SUM`, `MIN`, `MAX`, and `AVG`, with an optional single-column `GROUP BY`.
- One `INNER`, `LEFT`, `SEMI`, or `ANTI JOIN` over a single equality key.

Unsupported statements, unknown columns, unregistered tables, unsupported strings, ambiguous
expressions, multiple sort/group keys, and `LIMIT` without ordering fail during CPU-only planning.
Applications still own command submission, synchronization, result readback, and cleanup.

The loaders.gl adapter currently supports predicate pushdown and output projection. It accepts
finite numeric, Boolean, and null predicate values, including reusable named parameters. Portable
source-order `limit`, streaming, in-flight cancellation, string/binary/date values, and relational
extensions are reported or rejected as unsupported instead of silently falling back to CPU work.

## Related modules

- [GPU Dataframe](/docs/api-reference/experimental/gpu-dataframe)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
- [Arrow](/docs/api-reference/arrow)
