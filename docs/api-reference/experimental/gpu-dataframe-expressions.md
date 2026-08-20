---
title: GPU Dataframe expressions and filtering
description: Plan filters and nullable derived columns, then compile reusable GPU-resident results.
---

import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPU Dataframe expressions and filtering

<ExperimentalDocsTabs active="gpu-dataframe-expressions" />

## Plan expressions and filters without GPU work

Constructing a dataframe, selecting columns, and creating query plans never allocates GPU outputs,
encodes commands, or submits work. Expressions are immutable typed trees; column names and scalar
parameters never become unchecked WGSL identifiers or source strings.

```ts
const query = dataframe
  .filter(
    and(
      column('fare').greaterThan(parameter('minimumFare', 10)),
      column('customerId').isValid()
    )
  )
  .select(['fare', 'customerId']);
```

Scalar expressions provide arithmetic, comparisons, `isValid()`, and `isNull()`. Compose predicates
with `and`, `or`, and `not`; use `literal(value)` for fixed numeric or boolean values and
`parameter(name, initialValue)` for values updated when encoding an already-compiled graph.

Nullable expressions follow SQL-style three-valued logic:

| Expression | Result |
| --- | --- |
| `false AND null` | `false` |
| `true AND null` | `null` |
| `true OR null` | `true` |
| `false OR null` | `null` |
| `NOT null` | `null` |
| `isValid(null)` / `isNull(null)` | `false` / `true` |

A filter accepts only a valid `true` predicate. A nonempty nullable source field without an
explicit validity sidecar is rejected instead of silently treating its rows as valid.

## Add nullable derived columns

`withColumn` appends a new logical column, preserves existing query immutability, and propagates
the expression's null validity into a separate GPU-backed sidecar when needed:

```ts
const adjusted = dataframe
  .withColumn('adjustedFare', column('fare').multiply(literal(1.2)), {
    format: 'float32'
  })
  .withColumn('serviceCharge', column('adjustedFare').subtract(column('fare')))
  .filter(column('serviceCharge').greaterThan(literal(1)))
  .select(['customerId', 'adjustedFare', 'serviceCharge']);
```

Later derived expressions may reference earlier derived columns; hidden dependencies remain
available even when the final projection excludes them. Formats are inferred from compatible
source operands, and an explicit format must match the inferred scalar format. Replacing an
existing column, implicit casts, arbitrary string values, and mixed scalar arithmetic are not
supported.

## Compile, encode, and retain GPU-resident results

Each query compiles into one caller-provided command graph. Encoding updates named parameters
without recompiling and records work into an application-owned command encoder:

```ts
const graph = new GPUCommandGraph<GPUDataFrameQueryParameters>(device);
const compiled = query.compile(graph);

const commandEncoder = device.createCommandEncoder({id: 'gpu-dataframe-interaction'});
compiled.encode(commandEncoder, {minimumFare: 25});
device.submit(commandEncoder.finish());

compiled.table;
compiled.validity;
compiled.dictionaries;
compiled.selectionMask;
compiled.rowIndices;
compiled.selectedCounts;
```

`selectionMask` is source-aligned, `rowIndices` contains stable selected source identifiers, and
`selectedCounts` contains one GPU count per original batch. Derived values, reductions, category
groups, histograms, and joined row identifiers are also exposed as GPU-backed tables or vectors.
No GPU Dataframe method submits the command encoder or performs implicit CPU readback.

Compile each independent plan into a new `GPUCommandGraph`; a graph becomes immutable once
compiled. Re-encode the same compiled query with new parameters for repeated interactions.

## Related pages

- [GPU Dataframe overview](/docs/api-reference/experimental/gpu-dataframe)
- [GPU Dataframe operations index](/docs/api-reference/experimental/gpu-dataframe-operations)
- [GPU tables](/docs/api-reference/tables)
