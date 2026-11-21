# GPUTraceComparison

[Time Index](https://luma.gl/docs/api-reference/experimental/gpu-trace/temporal-index.md)[Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-trace/aggregation.md)[Critical Path](https://luma.gl/docs/api-reference/experimental/gpu-trace/critical-path.md)[Comparison](https://luma.gl/docs/api-reference/experimental/gpu-trace/comparison.md)[Anomalies](https://luma.gl/docs/api-reference/experimental/gpu-trace/anomaly-scoring.md)

## Overview[​](#overview "Direct link to Overview")

`GPUTraceComparison` compares compact aggregate columns from a current trace and a saved baseline or peer cohort. Rows are aligned by the caller's dense operation dictionary or grouping key.

## At a glance

| Question                 | Answer                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **Problem**              | Align current and baseline trace groups and compute explicit regression deltas.                     |
| **Reads / writes**       | Reads compact group metrics and dictionary-aligned keys; writes deltas, scores, masks, and summary. |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.        |
| **Output contract**      | Bounded group-aligned comparison rows and stable maximum regression.                                |
| **Expected work**        | Linear in aligned group capacity plus a bounded maximum reduction.                                  |
| **Chunks**               | Compares compact group domains; it does not allocate per-span baseline rows.                        |
| **Conditions / budgets** | Supports conditioned and resumable analysis with generation-checked publication.                    |
| **Neighborhood**         | current + baseline aggregates → GPUTraceComparison → anomaly scoring or comparison overlays.        |

**Cost**Aligned group count, not raw trace row count, when aggregation is reused.

**Common mistake**Do not align groups by display order when stable dictionary IDs are available.

## When to use[​](#when-to-use "Direct link to When to use")

Use this contributor when current and baseline traces already share a stable dense grouping key. Compare per-span values with `GPUTraceAnomalyScoring` instead.

## Usage[​](#usage "Direct link to Usage")

```
import {GPUTraceComparison} from '@luma.gl/experimental/gpu-trace';



new GPUTraceComparison({

  current: {counts, durationMeans, errorRates},

  baseline: {

    counts: baselineCounts,

    durationMeans: baselineDurationMeans,

    errorRates: baselineErrorRates

  },

  threshold: 0.25,

  output: {

    countDeltas,

    durationDeltas,

    durationRatios,

    errorRateDeltas,

    scores,

    regressionMask,

    summary

  }

}).addToGraph(graph);
```

The primitive operates on group summaries rather than canonical span rows. This keeps storage and dispatch cost proportional to the operation dictionary even when each trace contains tens of millions of spans. A renderer can map `scores` or `regressionMask` back to spans through the same dense group ID.

## Score[​](#score "Direct link to Score")

The default score counts only regressions:

```
durationWeight × max(currentMean / max(baselineMean, floor) - 1, 0)

+ errorWeight × max(currentErrorRate - baselineErrorRate, 0)

+ countWeight × abs(currentCount - baselineCount) / max(baselineCount, 1)
```

`countWeight` defaults to zero because volume change is not inherently a performance regression. All weights, the duration floor, and the threshold are explicit policy inputs.

## Inputs and outputs[​](#inputs-and-outputs "Direct link to Inputs and outputs")

| View              | Meaning                                               |
| ----------------- | ----------------------------------------------------- |
| `countDeltas`     | Signed current-minus-baseline count per group         |
| `durationDeltas`  | Signed current-minus-baseline mean duration per group |
| `durationRatios`  | Current mean divided by the guarded baseline mean     |
| `errorRateDeltas` | Signed current-minus-baseline error probability       |
| `scores`          | Nonnegative weighted regression score                 |
| `regressionMask`  | One when the score reaches `threshold`                |
| `summary[0]`      | Number of regressed groups                            |
| `summary[1]`      | Maximum score encoded as positive `f32` bits          |
| `summary[2]`      | Lowest group index attaining the maximum score        |
| `summary[3]`      | Invalid-current, invalid-baseline, and overflow flags |

Compose this contributor with `GPUTraceAnomalyScoring` when a workflow needs both compact group comparison and per-span outlier scores. Both can share baseline views in one `GPUCommandGraph`.
