# GPU SQL

[Overview](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)[Operations](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-operations.md)[Expressions](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-expressions.md)[Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-aggregation.md)[Sorting](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-sorting.md)[Indexes & Joins](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-indexes-joins.md)[SQL](https://luma.gl/docs/api-reference/experimental/gpu-sql.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/graph/gpu-sql` provides a bounded SQL frontend for [`GPUDataFrame`](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md). `GPUSQLContext` registers existing GPU dataframes by name and lowers supported statements into the same immutable GPU dataframe planner. Planning does not upload, submit, allocate query output, or read GPU buffers.

The optional loaders.gl integration lives in the [GPU data analysis example](https://github.com/visgl/luma.gl/blob/master/examples/experimental/gpu-data-analysis/src/loaders-sql-query.ts). Its `planGPUDataFrameQuery()` helper consumes the loaders.gl plan directly. Copy the adapter into your application and install `@loaders.gl/core` and `@loaders.gl/sql` when needed. The `@luma.gl/graph/gpu-sql` module exports the native frontend without a loaders.gl dependency.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use GPU SQL when an application already has GPU dataframe inputs and a constrained SQL surface is more convenient than manually composing expressions, filters, aggregations, ordering, and joins. Use GPU Dataframe directly when an application needs behavior outside the supported grammar.

Use the loaders.gl adapter when a query originates in a loader, catalog, or application component that already emits `TableQueryOptions` and `SQLPredicate` values:

```
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

The compiled result stays GPU-resident as `table`, `validity`, `dictionaries`, `rowIndices`, and `selectedCounts`. Rendering or another command graph can consume those resources directly. Arrow readback remains an explicit adapter operation rather than the query's required result type.

## Execution boundary[​](#execution-boundary "Direct link to Execution boundary")

The execution boundary is explicit: Arrow input → GPU dataframe execution → GPU consumers. Use `makeGPUAnalyticsTableFromArrowTable()` to upload input, construct a `GPUDataFrame`, compile the query into a caller-owned `GPUCommandGraph`, then encode and submit the graph. Downstream rendering and compute can use the compiled GPU resources directly. Call `makeArrowTableFromGPUAnalyticsTable()` only when the application explicitly needs CPU readback.

## Supported grammar[​](#supported-grammar "Direct link to Supported grammar")

* `SELECT *`, named columns, numeric expressions, and explicit `AS` aliases.
* One registered `FROM` table with optional aliases.
* `WHERE` comparisons, `AND`, `OR`, `NOT`, parentheses, `IS NULL`, and `IS NOT NULL`.
* Named `:parameter` values with planning defaults and encoding-time updates.
* One `ORDER BY` column with direction, null ordering, and optional bounded `LIMIT`.
* `COUNT(*)`, `SUM`, `MIN`, `MAX`, and `AVG`, with an optional single-column `GROUP BY`.
* One `INNER`, `LEFT`, `SEMI`, or `ANTI JOIN` over a single equality key.

Unsupported statements, unknown columns, unregistered tables, unsupported strings, ambiguous expressions, multiple sort/group keys, and `LIMIT` without ordering fail during CPU-only planning. Applications still own command submission, synchronization, result readback, and cleanup.

The loaders.gl adapter currently supports predicate pushdown and output projection. It accepts finite numeric, Boolean, and null predicate values, including reusable named parameters. Portable source-order `limit`, streaming, in-flight cancellation, string/binary/date values, and relational extensions are reported or rejected as unsupported instead of silently falling back to CPU work.

## Related modules[​](#related-modules "Direct link to Related modules")

* [GPU Dataframe](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)
* [GPU Core](https://luma.gl/docs/api-reference/experimental/gpu-core.md)
* [Arrow](https://luma.gl/docs/api-reference/arrow.md)
