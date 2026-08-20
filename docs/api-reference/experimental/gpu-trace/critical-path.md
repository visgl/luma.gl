import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUTraceCriticalPath

<ExperimentalDocsTabs active="trace-critical-path" />

## Overview

`GPUTraceCriticalPath` performs exact duration-weighted analysis over a trace's canonical parent
forest. It keeps source identity intact and publishes ordinary graph views that renderers,
filters, aggregations, and readback rings can consume without translating results through CPU
objects.

<GPUOperationContract operation="gpu-trace-critical-path" />

## When to use

Use this contributor when a trace has one canonical parent per span and the application needs the
longest parent chain, per-span slack, or a critical-path mask. Use a dependency-DAG analysis instead
when spans may have several causal predecessors.

## Usage

```ts
import {GPUTraceCriticalPath} from '@luma.gl/experimental/gpu-trace';

new GPUTraceCriticalPath({
  parentIndices,
  durations,
  maximumRowsPerPass: 262_144,
  output: {
    pathDurations,
    slackDurations,
    criticalPredecessors,
    rootIndices,
    hopCounts,
    criticalMask,
    summary
  }
}).addToGraph(graph);
```

## Inputs and outputs

| View | Meaning |
| --- | --- |
| `pathDurations` | Inclusive duration from each span through its canonical parents |
| `slackDurations` | Winning duration minus the row's valid parent-path duration |
| `criticalPredecessors` | Validated parent identity or `0xffffffff` |
| `rootIndices` | Resolved root identity or `0xffffffff` for cyclic rows |
| `hopCounts` | Parent-edge distance to the root |
| `criticalMask` | One for spans on the selected longest path |
| `summary[0]` | Maximum duration encoded as positive `f32` bits |
| `summary[1]` | Lowest stable endpoint attaining that duration |
| `summary[2]` | Maximum resolved hop count |
| `summary[3]` | Validation and incomplete-result flags |

## Execution and ownership

The contributor initializes one compact state record per span and then uses pointer jumping to
resolve every parent chain in `ceil(log2(spanCount)) + 1` passes. Each pass doubles the resolved
ancestor distance. Valid rows publish their root, hop count, and inclusive cumulative duration.
The maximum duration is selected on the GPU, ties choose the lowest canonical endpoint index, and
one bounded walk marks the exact winning path.

No submission or readback occurs inside the contributor. Scratch state is graph-owned and may be
transiently allocated; all public outputs remain caller-owned.

Every pass publishes a static invocation bound. A caller can therefore use
`compiled.createExecution({maximumInvocationCount})` to submit dependency-ordered pieces over
multiple frames. `maximumRowsPerPass` optionally divides initialization, pointer-jump,
finalization, endpoint, and slack work into smaller graph nodes when an application needs a hard
per-submission row bound. Leaving it unset minimizes pipeline count; setting it trades additional
compiled nodes for finer queue scheduling.

## Capacity, validation, and failure behavior

The summary flags distinguish invalid parents, invalid durations, cycles, numeric overflow, and a
critical path that exceeded `maximumCriticalPathLength`. Invalid or cyclic parent chains cannot
win endpoint selection. Applications can expose these flags directly in graph diagnostics instead
of presenting a silent partial result.

## Limitations

This contract is exact for one canonical parent per span. It deliberately does not pretend that a
parent forest is a general dependency DAG: multi-parent topological preparation, full CPM earliest
and latest times, and dependency-level wait attribution are the next causal-analysis layer. The
stable outputs here are designed to feed that extension without changing canonical span identity.
