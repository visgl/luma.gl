import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUTraceComparison

<ExperimentalDocsTabs active="trace-comparison" />

## Overview

`GPUTraceComparison` compares compact aggregate columns from a current trace and a saved baseline
or peer cohort. Rows are aligned by the caller's dense operation dictionary or grouping key.

<GPUOperationContract operation="gpu-trace-comparison" />

## When to use

Use this contributor when current and baseline traces already share a stable dense grouping key.
Compare per-span values with `GPUTraceAnomalyScoring` instead.

## Usage

```ts
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

The primitive operates on group summaries rather than canonical span rows. This keeps storage and
dispatch cost proportional to the operation dictionary even when each trace contains tens of
millions of spans. A renderer can map `scores` or `regressionMask` back to spans through the same
dense group ID.

## Score

The default score counts only regressions:

```text
durationWeight × max(currentMean / max(baselineMean, floor) - 1, 0)
+ errorWeight × max(currentErrorRate - baselineErrorRate, 0)
+ countWeight × abs(currentCount - baselineCount) / max(baselineCount, 1)
```

`countWeight` defaults to zero because volume change is not inherently a performance regression.
All weights, the duration floor, and the threshold are explicit policy inputs.

## Inputs and outputs

| View | Meaning |
| --- | --- |
| `countDeltas` | Signed current-minus-baseline count per group |
| `durationDeltas` | Signed current-minus-baseline mean duration per group |
| `durationRatios` | Current mean divided by the guarded baseline mean |
| `errorRateDeltas` | Signed current-minus-baseline error probability |
| `scores` | Nonnegative weighted regression score |
| `regressionMask` | One when the score reaches `threshold` |
| `summary[0]` | Number of regressed groups |
| `summary[1]` | Maximum score encoded as positive `f32` bits |
| `summary[2]` | Lowest group index attaining the maximum score |
| `summary[3]` | Invalid-current, invalid-baseline, and overflow flags |

Compose this contributor with `GPUTraceAnomalyScoring` when a workflow needs both compact group
comparison and per-span outlier scores. Both can share baseline views in one `GPUCommandGraph`.
