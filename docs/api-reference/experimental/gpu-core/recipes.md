import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUCoreExecutionLab} from '@site/src/components/docs/gpu-core-execution-lab';

# GPU Core Cookbook

<GPUCoreDocsTabs active="recipes" />

## Overview

This guide starts with application outcomes and maps them to small compositions of GPU Core
operations. Use it after the [first-graph tutorial](./tutorial) and before reading individual API
contracts. Each recipe names its durable inputs, bounded outputs, likely costs, and common mistake.

The arrows below describe GPU-resident dataflow, not CPU readbacks. Unless a recipe explicitly says
otherwise, the application compiles topology once, updates parameters or imported data, and encodes
the same graph again.

## Choose a recipe

| Outcome | Pipeline neighborhood | GPU-resident result | Routine CPU readback |
| --- | --- | --- | --- |
| Render a selected subset | mask → scan → compaction → indirect draw | stable IDs plus draw count | None |
| Summarize a selection | mask → reduction, histogram, or group aggregation | bounded bins or group rows | Only small chart output, if needed |
| Rank or order rows | keys → sort or segmented sort → downstream consumer | ordered IDs or key/value pairs | None |
| Query nearby objects | reusable index → bounded query → compaction | candidate or exact IDs plus count | None |
| Pick and highlight | integer picking target → bounded readback → highlight parameter | canonical object ID | One small asynchronous result |
| Skip optional work | CPU predicate or GPU indirect condition → dependent branch | retained or newly published output | None for GPU conditions |
| Spread analysis across frames | immutable graph → execution plan → bounded slices | continuation state plus eventual result | Progress only, if desired |
| Package a workflow | contributor → resources and nodes → caller-owned graph | reusable declared subgraph | None |

## Try execution policy safely

Toggle an optional branch, change the per-frame work budget, and deliberately undersize a bounded
output. The graph topology stays fixed while the execution plan and validation result remain
visible.

<GPUCoreExecutionLab />

## Select, compact, and render

**Pipeline neighborhood:** [`GPUMask`](./gpu-mask) → [`GPUScan`](./gpu-scan) →
[`GPUCompaction`](./gpu-compaction) → [`DrawCommandBuffer`](./draw-command-buffer)

Use a source-aligned mask when several predicates must combine or downstream work needs random
membership tests. Compact it when rendering or later compute should visit only accepted rows.
`GPUCompaction` owns its transient offsets; the application owns the source IDs, flags, output
capacity, and count destination. Point that count at an indirect command's `instanceCount` to avoid
waiting for JavaScript before drawing.

- **Cost to watch:** the mask visits the source capacity; scan and scatter visit the selected input
  domain even when the final output is small.
- **Common mistake:** treating every output slot as valid. Only the prefix named by the GPU-written
  count is published.
- **Shortcut:** [`GPUVisibilityWorkflow`](./gpu-visibility-workflow) packages common predicate-mask
  composition, stable IDs, compaction, and count publication.

## Aggregate a selection

**Pipeline neighborhood:** source-aligned mask → [`GPUReduction`](./gpu-reduction),
[`GPUHistogram`](./gpu-histogram), or [`GPUGroupAggregation`](./gpu-group-aggregation) → bounded
chart/stat output

Keep the selection as a mask when an aggregation already examines each source row. Compact first
only when several expensive downstream operations will reuse a much smaller selected set. The
application owns input columns and output capacity; contributors may allocate scratch reductions or
grouping state.

- **Cost to watch:** distinguish input rows, candidate groups, output capacity, and actual published
  groups. They are different workload measures.
- **Common mistake:** downloading source rows to build a chart. Keep large intermediate tables on
  the GPU and read back only the small bounded result that the UI needs.

## Sort or select top rows

**Pipeline neighborhood:** keys and optional values → [`GPUSort`](./gpu-sort) or
[`GPUSegmentedSort`](./gpu-segmented-sort) → ordered GPU consumer

Use `GPUSort` for one logical sequence and segmented sort when independent partitions should remain
independent. Preserve batch or chunk boundaries when they carry streaming or ownership meaning;
choose an explicitly packed output only when a global order requires it.

- **Cost to watch:** sort work depends on capacity, key width, pass count, and whether a global or
  segmented order is required.
- **Common mistake:** assuming that sorted chunks form one globally sorted sequence.

## Query a reusable spatial index

**Pipeline neighborhood:** positions → [`GPUGridIndex`](./gpu-grid-index) or [`GPUBVH`](./gpu-bvh)
→ [`GPUGridIndexQuery`](./gpu-grid-index-query) or [`GPUBVHQuery`](./gpu-bvh-query) → bounded IDs

Build an index when many changing queries reuse mostly static source data. A grid is a strong fit for
roughly uniform neighborhoods; a BVH better follows irregular spatial extent. Query output remains
bounded and should feed compaction, rendering, or analysis without returning the source dataset to
JavaScript.

- **Cost to watch:** separate index-build cost from per-query cost, and candidates from exact hits.
- **Common mistake:** rebuilding an unchanged index for every view update.

## Pick and highlight

**Pipeline neighborhood:** rendered canonical IDs → [`GPUIndexPickingTarget`](./gpu-index-picking-target)
→ [`GPUReadbackRing`](./gpu-readback-ring) → hover parameter → normal render

Render integer IDs into a small picking attachment, copy the requested pixel or region into a
bounded readback slot, and publish only the newest completed generation. Use the returned canonical
ID as a render parameter so highlighting does not require rebuilding source data.

- **Cost to watch:** picking latency includes rendering, copy, queue completion, and mapping—not just
  the byte count.
- **Common mistake:** allowing an older asynchronous pick to overwrite a newer pointer position.

## Condition optional work

**Pipeline neighborhood:** CPU-known state or GPU-written indirect record → conditioned graph node
→ explicitly conditioned consumers

Use a CPU condition when parameters already say that work is unnecessary. Use a GPU indirect
condition when the decision is produced on the GPU and a readback would introduce a stall. See
[Conditional execution](./concepts#conditional-execution) for the exact ownership rules.

```ts
type Parameters = {analysisEnabled: boolean};

graph.addComputePass({
  id: 'optional-analysis',
  condition: {
    id: 'analysis-enabled',
    source: 'cpu',
    evaluate: parameters => parameters.analysisEnabled
  },
  resources: [
    {buffer: source, usage: 'storage-read'},
    {buffer: analysis, usage: 'storage-write'}
  ],
  compile: compileAnalysis
});
```

- **Cost to watch:** a GPU condition avoids shader invocations for a zero dispatch, but upstream work
  that computes the condition still runs.
- **Common mistake:** conditioning a writer but allowing its dependent readers to consume retained,
  stale contents unintentionally.

## Spread analysis across frames

**Pipeline neighborhood:** compiled immutable topology → `planExecution()` → bounded execution
slices → generation-checked publication

Use resumable execution for work that is useful but cannot monopolize an interactive frame. The
operation exposes legal steps; the application selects a bounded set using an explicit budget and
retains continuation state. Data batches remain data batches—an execution slice only controls how
much scheduled work advances now.

```ts
const budget = {
  maximumInvocationCount: 262_144,
  maximumReadByteLength: 16 * 1024 * 1024
};
const plan = compiled.getExecutionPlan(budget, {latencyPriority: 'background'});
const execution = compiled.createExecution(budget, {latencyPriority: 'background'});

function encodeNextSlice(): void {
  const commandEncoder = device.createCommandEncoder();
  const step = execution.encodeNext(commandEncoder, {parameters});
  device.submit(commandEncoder.finish());
  if (!step.completed) requestAnimationFrame(encodeNextSlice);
}
```

Inspect `plan.oversizedStepCount` before starting. A nonzero value means at least one indivisible
node exceeds the requested budget and must run alone for the execution to make progress.

- **Cost to watch:** record actual queue time, invocations, bytes, and completion fraction per slice.
- **Common mistake:** publishing a partial or superseded generation as if it were a complete result.

See [Resumable execution and work budgets](./concepts#resumable-execution-and-work-budgets).

## Package a reusable operation

**Pipeline neighborhood:** typed props → contributor `addToGraph()` → logical resources and nodes →
caller compilation and encoding

A contributor validates its fixed contract, declares every resource use, creates any bounded
transients, and adds nodes with stable identifiers. It does not submit commands, own the frame loop,
or map application data. Expose ordinary graph views, masks, counts, and indirect commands so the
next operation can compose without CPU translation.

```ts
class VisibleItems implements GPUCommandGraphContributor {
  constructor(readonly props: VisibleItemsProps) {}

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    new GPUMask({
      inputs: this.props.predicateMasks,
      output: this.props.visibleMask,
      operation: 'and'
    }).addToGraph(graph);

    new GPUCompaction({
      input: this.props.sourceIds,
      flags: this.props.visibleMask,
      output: this.props.visibleIds,
      count: this.props.visibleCount
    }).addToGraph(graph);
  }
}
```

- **Cost to watch:** attach estimates for invocations, bytes, dispatches, draws, and whether each
  estimate is exact or an upper bound.
- **Common mistake:** hiding allocation, readback, submission, or mutable topology inside a helper
  that appears to be a declarative contributor.

See [Composition levels](./concepts#composition-levels) and the
[`GPUCommandGraph` extension contracts](./gpu-command-graph#extension-libraries).

## Related APIs

- [GPU Core tutorial](./tutorial) explains mask, scan, compaction, and indirect drawing visually.
- [Execution and composition](./concepts) defines ownership, hazards, conditions, budgets, and
  instrumentation.
- [`GPUCommandGraph`](./gpu-command-graph) is the complete construction and execution reference.
- The [GPU Core overview](./) indexes every operation family and domain module.
