import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUTraceAnomalyScoring

<ExperimentalDocsTabs active="trace-anomaly-scoring" />

## Overview

`GPUTraceAnomalyScoring` scores every canonical span against dense peer-group baselines. The
scoring policy is explicit and replaceable: duration deviation and error-rate deviation have
independent weights, duration can be slow-only or two-sided, and the caller owns the threshold.

<GPUOperationContract operation="gpu-trace-anomaly-scoring" />

## When to use

Use this contributor after a grouping or comparison stage has produced explicit peer baselines. It
is intended for explainable policy scores, not model training or an embedded observability policy.

## Usage

```ts
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

Baselines may come from a saved trace, a deployment cohort, or another GPU scheduling aggregation. The
primitive does not embed one observability product's grouping or anomaly semantics.

## Score

For each valid span, the default slow-only score is:

```text
durationWeight × max((duration - peerMean) / max(peerDeviation, floor), 0)
+ errorWeight × abs(errorValue - peerErrorRate)
```

Set `durationMode: 'two-sided'` to use the absolute duration z-score. Invalid group indices,
durations, or baselines produce a zero score, stay out of the mask, and set a validation flag.

## Inputs and outputs

| View | Meaning |
| --- | --- |
| `scores` | Nonnegative policy score per canonical span |
| `anomalyMask` | One when the score reaches `threshold` |
| `summary[0]` | Number of thresholded anomalies |
| `summary[1]` | Maximum score encoded as positive `f32` bits |
| `summary[2]` | Lowest canonical index attaining the maximum score |
| `summary[3]` | Invalid-group, invalid-duration, invalid-baseline, and overflow flags |

The per-span outputs remain GPU-resident for rendering, filtering, label priority, or follow-up
aggregation. A UI can sample only the four-word summary.

Scoring, summary reduction, and stable maximum selection publish invocation bounds to the command
graph. `maximumRowsPerPass` optionally turns each source chunk and full-output reduction into
smaller resumable nodes. Applications can combine that with `compiled.createExecution(...)`,
submit one bounded step at a time, and cancel between steps without exposing partial results as a
completed analysis.

## Execution and ownership

The contributor adds graph work only. Source columns and public outputs are caller-owned; graph
scratch may use transient allocations. Submission, cancellation, and publication remain with the
application.

## Capacity, validation, and failure behavior

Invalid groups, durations, and baselines are excluded and reported through summary flags. Output
capacity is fixed by the canonical span count compiled into the graph.

## Performance

Work is linear in the selected span count plus a bounded summary reduction. Use
`maximumRowsPerPass` and resumable execution for large global analyses.

## Limitations

Peer construction and baseline policy are intentionally outside this contributor. Scores identify
statistical deviation under the supplied policy; they do not establish causality.

## Comparison workflow

Use stable operation dictionary IDs as `groupIndices`, produce baseline columns from the reference
trace, and score the current trace without CPU row materialization. The same score and mask columns
can feed `GPUTraceAggregation`, histograms, semantic colors, and selection workflows. Compose
[`GPUTraceComparison`](/docs/api-reference/experimental/gpu-trace/comparison) in the
same command graph when the UI also needs group-level count, duration, and error-rate deltas.
