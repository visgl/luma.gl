# GPUTraceAnomalyScoring

[Time Index](https://luma.gl/next/docs/api-reference/experimental/gpu-trace/temporal-index.md)[Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-trace/aggregation.md)[Critical Path](https://luma.gl/next/docs/api-reference/experimental/gpu-trace/critical-path.md)[Comparison](https://luma.gl/next/docs/api-reference/experimental/gpu-trace/comparison.md)[Anomalies](https://luma.gl/next/docs/api-reference/experimental/gpu-trace/anomaly-scoring.md)

## Overview[​](#overview "Direct link to Overview")

`GPUTraceAnomalyScoring` scores every canonical span against dense peer-group baselines. The scoring policy is explicit and replaceable: duration deviation and error-rate deviation have independent weights, duration can be slow-only or two-sided, and the caller owns the threshold.

## At a glance

| Question                 | Answer                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **Problem**              | Score canonical spans against explicit peer-group duration and error baselines.                    |
| **Reads / writes**       | Reads span metrics, group IDs, and baselines; writes per-span scores, anomaly mask, and summary.   |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.       |
| **Output contract**      | Source-aligned scores/mask plus a compact maximum and validation summary.                          |
| **Expected work**        | Linear scoring plus bounded summary reduction.                                                     |
| **Chunks**               | Preserves declared views and source identity; it does not implicitly concatenate or repack chunks. |
| **Conditions / budgets** | Supports maximumRowsPerPass and resumable publication of complete generations.                     |
| **Neighborhood**         | peer baselines + trace columns → GPUTraceAnomalyScoring → filter, color, label, or aggregation.    |

**Cost**Selected span count and reduction; small summaries do not remove per-span scoring work.

**Common mistake**Do not present policy scores as causal explanations.

## When to use[​](#when-to-use "Direct link to When to use")

Use this contributor after a grouping or comparison stage has produced explicit peer baselines. It is intended for explainable policy scores, not model training or an embedded observability policy.

## Usage[​](#usage "Direct link to Usage")

```
import {GPUTraceAnomalyScoring} from '@luma.gl/experimental/gpu-trace';



new GPUTraceAnomalyScoring({

  groupIndices,

  durations,

  errorMask,

  baselineDurationMeans,

  baselineDurationStandardDeviations,

  baselineErrorRates,

  threshold: 3,

  maximumRowsPerPass: 262_144,

  output: {scores, anomalyMask, summary}

}).addToGraph(graph);
```

Baselines may come from a saved trace, a deployment cohort, or another GPU Core aggregation. The primitive does not embed one observability product's grouping or anomaly semantics.

## Score[​](#score "Direct link to Score")

For each valid span, the default slow-only score is:

```
durationWeight × max((duration - peerMean) / max(peerDeviation, floor), 0)

+ errorWeight × abs(errorValue - peerErrorRate)
```

Set `durationMode: 'two-sided'` to use the absolute duration z-score. Invalid group indices, durations, or baselines produce a zero score, stay out of the mask, and set a validation flag.

## Inputs and outputs[​](#inputs-and-outputs "Direct link to Inputs and outputs")

| View          | Meaning                                                               |
| ------------- | --------------------------------------------------------------------- |
| `scores`      | Nonnegative policy score per canonical span                           |
| `anomalyMask` | One when the score reaches `threshold`                                |
| `summary[0]`  | Number of thresholded anomalies                                       |
| `summary[1]`  | Maximum score encoded as positive `f32` bits                          |
| `summary[2]`  | Lowest canonical index attaining the maximum score                    |
| `summary[3]`  | Invalid-group, invalid-duration, invalid-baseline, and overflow flags |

The per-span outputs remain GPU-resident for rendering, filtering, label priority, or follow-up aggregation. A UI can sample only the four-word summary.

Scoring, summary reduction, and stable maximum selection publish invocation bounds to the command graph. `maximumRowsPerPass` optionally turns each source chunk and full-output reduction into smaller resumable nodes. Applications can combine that with `compiled.createExecution(...)`, submit one bounded step at a time, and cancel between steps without exposing partial results as a completed analysis.

## Execution and ownership[​](#execution-and-ownership "Direct link to Execution and ownership")

The contributor adds graph work only. Source columns and public outputs are caller-owned; graph scratch may use transient allocations. Submission, cancellation, and publication remain with the application.

## Capacity, validation, and failure behavior[​](#capacity-validation-and-failure-behavior "Direct link to Capacity, validation, and failure behavior")

Invalid groups, durations, and baselines are excluded and reported through summary flags. Output capacity is fixed by the canonical span count compiled into the graph.

## Performance[​](#performance "Direct link to Performance")

Work is linear in the selected span count plus a bounded summary reduction. Use `maximumRowsPerPass` and resumable execution for large global analyses.

## Limitations[​](#limitations "Direct link to Limitations")

Peer construction and baseline policy are intentionally outside this contributor. Scores identify statistical deviation under the supplied policy; they do not establish causality.

## Comparison workflow[​](#comparison-workflow "Direct link to Comparison workflow")

Use stable operation dictionary IDs as `groupIndices`, produce baseline columns from the reference trace, and score the current trace without CPU row materialization. The same score and mask columns can feed `GPUTraceAggregation`, histograms, semantic colors, and selection workflows. Compose [`GPUTraceComparison`](https://luma.gl/next/docs/api-reference/experimental/gpu-trace/comparison.md) in the same command graph when the UI also needs group-level count, duration, and error-rate deltas.
