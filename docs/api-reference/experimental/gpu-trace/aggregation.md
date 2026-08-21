# GPUTraceAggregation

[Time Index](https://luma.gl/docs/api-reference/experimental/gpu-trace/temporal-index.md)[Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-trace/aggregation.md)[Critical Path](https://luma.gl/docs/api-reference/experimental/gpu-trace/critical-path.md)[Comparison](https://luma.gl/docs/api-reference/experimental/gpu-trace/comparison.md)[Anomalies](https://luma.gl/docs/api-reference/experimental/gpu-trace/anomaly-scoring.md)

## Overview[​](#overview "Direct link to Overview")

`GPUTraceAggregation` computes dense counts and duration statistics over canonical trace columns. `GPUTraceTimeBuckets` computes interval occupancy and clipped active duration over trace time. Both are exported from `@luma.gl/experimental/gpu-trace`; the underlying generic aggregations remain [`GPUGroupAggregation`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md) and [`GPUHistogram`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-histogram.md).

### GPU Hierarchical Trace Viewer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-viewer)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

The live viewer uses a separate analysis command graph. It can profile the entire trace, the visible viewport, or a measured time interval; viewport updates are deferred until navigation settles. The graph keeps group counts, duration histograms, and clipped time buckets on the GPU and reads back only the small fixed-size chart result. Unchanged scope generations reuse cached output.

## At a glance

| Question                 | Answer                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Problem**              | Compute trace-domain counts, duration statistics, and trace-time occupancy.                                  |
| **Reads / writes**       | Reads canonical trace columns, scope masks, and time intervals; writes dense groups, buckets, and summaries. |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                 |
| **Output contract**      | Bounded group rows and time buckets with counts, clipped durations, and validation status.                   |
| **Expected work**        | Linear selected-row aggregation plus bounded group or bucket finalization.                                   |
| **Chunks**               | Preserves canonical source partitions and aggregates into explicit result domains.                           |
| **Conditions / budgets** | Caches by scope generation and supports budgeted full-trace analysis.                                        |
| **Neighborhood**         | viewport/measurement/full-trace mask → GPUTraceAggregation → charts and cross-filtering.                     |

**Cost**Scope cardinality, group count, and bucket count—not only final chart size.

**Common mistake**Do not reuse a cached result across a different analysis scope or selection generation.

## Reusable chart-output layout[​](#reusable-chart-output-layout "Direct link to Reusable chart-output layout")

`GPUTraceAnalyticsOutputLayout` packs named `uint32` and `float32` series into one compact result buffer. It calculates aligned offsets, creates typed graph views for contributors, and decodes the same named series after a small asynchronous readback. Applications therefore do not need to duplicate byte-offset arithmetic between their GPU graph and chart UI.

```
import {GPUTraceAnalyticsOutputLayout} from '@luma.gl/experimental/gpu-trace';



const outputLayout = new GPUTraceAnalyticsOutputLayout([

  {id: 'service-counts', format: 'uint32', length: serviceCount},

  {id: 'service-duration', format: 'float32', length: serviceCount},

  {id: 'time-bucket-counts', format: 'uint32', length: 64}

]);



const resultBuffer = device.createBuffer({

  byteLength: outputLayout.byteLength,

  usage: Buffer.STORAGE | Buffer.COPY_SRC

});



const resultHandle = graph.importBuffer({id: 'analytics-results'}, resultBuffer);

const serviceCounts = outputLayout.createUint32View(graph, resultHandle, 'service-counts');



// After an explicitly requested compact readback:

const counts = outputLayout.decodeUint32(bytes, 'service-counts');
```

The layout owns no buffers, submission policy, or charts. The same views can remain GPU-resident for a renderer; decoding is only for applications that choose to draw small DOM or canvas charts.

## Usage[​](#usage "Direct link to Usage")

```
import {GPUTraceAggregation} from '@luma.gl/experimental/gpu-trace';



new GPUTraceAggregation({

  trace: traceView,

  dimension: 'process',

  metric: 'duration-mean',

  selection: interaction.visibleMask,

  output: meanDurationByProcess

}).addToGraph(graph);
```

Built-in dimensions are `lane`, `group`, `process`, `thread`, and `classification`. Applications may instead supply a dense unsigned key column, such as an operation dictionary ID. Inputs may be packed or interleaved and may preserve multiple source chunks.

The supported metrics are `count`, `duration-sum`, `duration-min`, `duration-max`, and `duration-mean`. Count outputs use `uint32`; duration outputs use `float32`. Output length defines the accepted dense key range, and keys outside that range are ignored.

## Trace-time buckets[​](#trace-time-buckets "Direct link to Trace-time buckets")

```
import {GPUTraceTimeBuckets} from '@luma.gl/experimental/gpu-trace';



new GPUTraceTimeBuckets({

  trace: traceView,

  domain: [traceStart, traceEnd],

  selection: interaction.visibleMask,

  countOutput: intersectingSpanCounts,

  durationOutput: clippedDurationSums

}).addToGraph(graph);
```

The output length defines an equal-width trace-time partition. A span contributes once to every bucket it intersects, and its duration contribution is clipped at the bucket boundaries. For traces that guarantee non-overlapping spans within each lane, dividing a bucket's duration sum by `bucketDuration * laneCount` yields utilization. Overlapping spans intentionally produce summed occupancy rather than an interval union.

## Execution contract[​](#execution-contract "Direct link to Execution contract")

* The contributor declares graph work only; it never compiles, submits, or maps buffers.
* The optional selection must contain one zero/nonzero row per canonical span and preserve input chunk boundaries when the trace uses multiple chunks.
* Outputs are cleared on every graph encoding and remain GPU-resident.
* Dataset-wide aggregations should be cached or encoded only when their input generation changes; do not attach a full-trace aggregation to every viewport-only frame.
