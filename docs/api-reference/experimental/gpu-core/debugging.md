import {ClientOnlyLiveExample} from '@site/src/components/docs/client-only-live-example';
import {GPUTraceViewerExample} from '@site/src/examples';

# Debugging GPU Command Graphs

## Overview

Use **GPU Graph** to inspect graph-level costs and node summaries, then **GPU Trace** to examine
one encoding over time. Both consume collected diagnostics; neither needs to copy the source
dataset back to JavaScript.

## Explore the panels

The live trace viewer below exposes graph diagnostics and the GPU Trace panel alongside a real
GPU-resident workflow. Open its panel controls to inspect graph metrics and sampled execution.
The trace dataset visualized by the example is separate from the execution trace of its own graph.

<ClientOnlyLiveExample activationLabel="Run trace viewer" description="Inspect a GPU-resident workflow and its execution diagnostics. Requires WebGPU." height={640}>
  <GPUTraceViewerExample />
</ClientOnlyLiveExample>

[Open the full trace viewer](/examples/experimental/gpu-trace-viewer) for more room.
This example requires WebGPU; GPU timings also require timestamp-query support.

## GPU Graph: find the expensive stage

The **GPU Graph** tab uses the example-side `GPUCommandGraphDebugPanel`, which wraps
`GPUCommandGraphInspectorPanel` and retains its snapshot when the tab is unmounted. These render snapshots from
`GPUCommandGraphInspector`. Select a graph to inspect:

- encoding count and retained CPU/GPU p50 and p95 duration summaries;
- logical versus physical resource allocation and transient reuse;
- nodes in compiled schedule order with per-node timing summaries;
- application-supplied counters, such as candidates, matches, or overflow.

CPU time measures command encoding. GPU time measures sampled GPU work. A missing GPU sample is
not a zero-duration result. Counter collection is explicit: the inspector stores supplied scalar
values and does not read their buffers itself.

## GPU Trace: inspect one encoding

`GPUTracePanel` displays the latest report as CPU and GPU spans, preserving gaps between nodes.
Hover or keyboard-focus a span for node details. Separate CPU and GPU clocks are the default;
when correlation is available, **Combined timeline (estimated)** aligns them and shows uncertainty.
That alignment is an estimate, not exact CPU/GPU clock synchronization.

Copy nodes remain CPU-timed. Skipped nodes have no GPU span. Enabling per-node GPU timestamps
also changes compute-pass coalescing, so compare representative sampled and unprofiled runs.

## Collect once, show in both panels

The inspector belongs to the package; the DOM panels are reusable example helpers. In an example,
import `GPUCommandGraphInspectorPanel` from `examples/gpu-command-graph-inspector-panel.ts` and
`GPUTracePanel` from `examples/gpu-trace-panel.ts`. Include `tracePanel.panel` in the application's
panel collection and give the graph panel its own host element.

```ts
import {GPUCommandGraphInspector} from '@luma.gl/gpgpu/gpu-core';

const inspector = new GPUCommandGraphInspector({maxSamples: 120});
const observation = inspector.observeGraph(compiled);

const commandEncoder = device.createCommandEncoder();
const encoding = observation.encode(commandEncoder, {parameters});
device.submit(commandEncoder.finish());

// graphPanel and tracePanel are the mounted example helpers.
graphPanel.update(inspector.getSnapshot(), compiled.id);
tracePanel.update(encoding.stats, compiled.id);

// Sample after submission, using an encoder configured for timestamp queries.
if (encoding.canReadGPUTimings) {
  const report = await observation.recordGPUTimings(encoding);
  graphPanel.update(inspector.getSnapshot(), compiled.id);
  tracePanel.update(report, compiled.id);
}
```

Read timings at a chosen diagnostic cadence. Reuse the returned report for both views rather than
requesting another read. Detach the observation when removing the graph; destroy the panel helpers
and compiled graph according to their ownership.

## Diagnose common symptoms

| Symptom | Inspect | Next step |
| --- | --- | --- |
| Compilation rejects a resource alias | Declared reads, writes, views, and usages | Correct overlapping writable bindings or separate stages |
| CPU p95 rises while GPU time is stable | Compilation cadence and encoding node count | Cache compilation and inspect unnecessary per-frame setup |
| GPU time rises with sparse outputs | Candidate counters and per-node spans | Reduce candidate work before compaction or expensive analysis |
| Transient memory is unexpectedly high | Lifetimes, compatibility, logical/physical counts | Shorten unnecessary lifetimes and review retained outputs |
| Results are stale after skipping work | Conditions and downstream reads | Condition consumers or initialize/version retained output |
| Counts hit capacity | Demand and overflow counters | Increase explicit capacity or process bounded steps |

See the [command graph instrumentation API](./gpu-command-graph#gpucommandgraphinspector) for
query setup and report semantics, and [execution techniques](./execution-techniques) for the
allocation and scheduling rules behind the panels.
