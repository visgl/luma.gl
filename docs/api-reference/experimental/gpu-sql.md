# GPU SQL

[Overview](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)[Operations](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-operations.md)[Expressions](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-expressions.md)[Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-aggregation.md)[Sorting](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-sorting.md)[Indexes & Joins](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-indexes-joins.md)[SQL](https://luma.gl/docs/api-reference/experimental/gpu-sql.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/experimental/gpu-sql` provides a bounded SQL frontend for [`GPUDataFrame`](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md). `LuSQLContext` registers existing GPU dataframes by name and lowers supported statements into the same immutable GPU dataframe planner. Planning does not upload, submit, allocate query output, or read GPU buffers.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use GPU SQL when an application already has GPU dataframe inputs and a constrained SQL surface is more convenient than manually composing expressions, filters, aggregations, ordering, and joins. Use GPU Dataframe directly when an application needs behavior outside the supported grammar.

## Execution boundary[​](#execution-boundary "Direct link to Execution boundary")

The execution boundary is explicit: caller-owned GPU table input → GPU dataframe execution → caller-owned output. Construct a `GPUDataFrame`, register it with `LuSQLContext`, compile the query into a caller-owned `GPUCommandGraph`, encode and submit the graph, then explicitly read back only the results the application needs.

## Supported grammar[​](#supported-grammar "Direct link to Supported grammar")

* `SELECT *`, named columns, numeric expressions, and explicit `AS` aliases.
* One registered `FROM` table with optional aliases.
* `WHERE` comparisons, `AND`, `OR`, `NOT`, parentheses, `IS NULL`, and `IS NOT NULL`.
* Named `:parameter` values with planning defaults and encoding-time updates.
* One `ORDER BY` column with direction, null ordering, and optional bounded `LIMIT`.
* `COUNT(*)`, `SUM`, `MIN`, `MAX`, and `AVG`, with an optional single-column `GROUP BY`.
* One `INNER`, `LEFT`, `SEMI`, or `ANTI JOIN` over a single equality key.

Unsupported statements, unknown columns, unregistered tables, unsupported strings, ambiguous expressions, multiple sort/group keys, and `LIMIT` without ordering fail during CPU-only planning. Applications still own command submission, synchronization, result readback, and cleanup.

## Related modules[​](#related-modules "Direct link to Related modules")

* [GPU Dataframe](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)
* GPU scheduling
