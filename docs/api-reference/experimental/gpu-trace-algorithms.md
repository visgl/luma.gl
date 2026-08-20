import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# How gpu-trace scales execution traces

<ExperimentalDocsTabs active="gpu-trace-algorithms" />

## Overview

`@luma.gl/experimental/gpu-trace` keeps trace identity, selection, analysis, and most intermediate
results on the GPU. It does not prescribe one renderer or take ownership of command submission.
Instead, it contributes trace-aware operations to a caller-owned
[`GPUCommandGraph`](/docs/api-reference/experimental/gpu-core/gpu-command-graph), and exposes
ordinary graph views that rendering and additional analysis can consume.

This page describes the algorithms implemented today. The advanced GPU trace viewer also contains
some application-level policies—adaptive density rendering, label admission, dependency display
budgets, and framebuffer picking—which are identified separately below.

## Design invariants

The implementation is organized around five invariants:

1. **Canonical identity never changes.** A source row, application object ID, and compacted display
   position are distinct values. Filtering never renumbers the source trace.
2. **Source batches remain visible.** Upload, streaming, and GPU work preserve chunk boundaries
   instead of silently combining the full trace into one buffer.
3. **Interactive state is small.** A view change updates control words such as time bounds, lane
   bounds, expansion masks, and selection IDs rather than rebuilding JavaScript span arrays.
4. **Selection composes.** Temporal candidates, visibility masks, compacted IDs, analytical masks,
   and indirect commands remain GPU-resident graph views.
5. **Work is explicit and bounded.** Fixed capacities report overflow, invalid topology is surfaced
   through validation words, and expensive graphs can be encoded over multiple frames.

## End-to-end data flow

The common path separates persistent construction from view-dependent work:

```text
source batches
  ├─ canonical span columns ───────────────┐
  ├─ parent rows                          │
  ├─ dependency rows ──> forward/reverse CSR
  └─ batch summaries ──> temporal hierarchy
                                             persistent GPU state
small view controls                            │
  ├─ time + lane window                       │
  ├─ process/thread expansion                 │
  ├─ classification filters                  │
  └─ selection/focus depth                    │
          │                                   │
          └─> temporal query ─> stable candidates
                                ├─> exact visibility ─> indirect span draws
                                ├─> density bins ─────> aggregate draws
                                ├─> fitted labels
                                ├─> dependency candidates and focus
                                ├─> picking
                                └─> aggregation, histograms, and time buckets
```

The command graph infers buffer hazards and fixes dependency order when it compiles. Encoding the
compiled graph records commands; the application still decides when to submit them and when a
small result warrants asynchronous readback.

## Canonical storage and topology

[`GPUTraceScene`](/docs/api-reference/experimental/gpu-trace/scene) stores packed
canonical spans, parents, dependencies, and explicit source partitions. Each canonical span
projects into a generic `GPUScene` row, allowing normal visibility and indirect-draw primitives to
operate without learning trace-specific schemas.

Dependencies have two representations:

- packed edge records preserve the identity and metadata of each directed dependency;
- forward and reverse compressed sparse row (CSR) adjacency make bounded upstream and downstream
  traversal proportional to the visited frontier rather than the complete edge set.

CSR stores one monotonic offset range per span and a packed neighbor array. The neighbor interval
for span `i` is `offsets[i]..offsets[i + 1]`. Forward adjacency answers “what depends on this span?”;
reverse adjacency answers “what does this span depend on?”.

## Vertical hierarchy and stable compaction

[`GPUTraceInteraction`](/docs/api-reference/experimental/gpu-trace/interaction)
derives effective thread heights from process and thread expansion state. A GPU prefix scan turns
those heights into display-lane offsets. Every downstream pass therefore uses the same vertical
layout without a CPU-generated coordinate array.

Filtering first produces source-aligned predicates. Scan and scatter then turn those predicates
into a stable, compact list of canonical row IDs:

- **scan** computes the output position of each accepted row;
- **scatter** writes the canonical row ID to that position;
- stable source order makes labels, drawing, telemetry, and tests deterministic.

The compacted position is temporary. Dependencies, picking, hierarchy, and application inspection
continue to address the canonical row.

## Current temporal index

[`GPUTraceTemporalIndex`](/docs/api-reference/experimental/gpu-trace/temporal-index)
indexes source-preserving span batches rather than individual spans. Each leaf summary contains a
time interval, lane interval, renderer group, and maximum individual span duration. Persistent
hierarchy levels summarize bounded contiguous leaf ranges without crossing renderer-group or
source-partition boundaries.

For a view update, the application selects a hierarchy level based on projected time width. The
GPU then:

1. tests nodes at that level against the guarded time window, visible lanes, and enabled groups;
2. stably compacts matching nodes;
3. expands their bounded leaf ranges into source-ordered candidate batch IDs;

The query publishes one conservative candidate list. Rendering consumers then classify admitted
spans as exact, representative, density, or wide-span exceptions without launching a second
hierarchy query.

[`GPUTraceTemporalIndexBuilder`](/docs/api-reference/experimental/gpu-trace/temporal-index)
populates hierarchy summaries on the GPU. Topology is stable and caller-owned. Dirty-partition
words allow an uploaded partition to rebuild its summaries without rebuilding unrelated
partitions, and a validation word reports invalid ranges, partition crossings, or group crossings.

This hierarchy is conservative: a coarse node may admit an offscreen leaf, but it must not omit an
intersecting leaf. Exact span classification inside the admitted batches resolves the remaining
false positives.

## Exact and aggregate rendering

The advanced trace viewer routes the temporal candidates into two semantic levels of detail:

- **exact mode** classifies candidate spans and publishes source IDs into per-group indirect draw
  commands;
- **density mode** accumulates span coverage into fixed lane/time/group bins, while sufficiently
  wide spans remain exact;
- the optional smooth handoff blends the two representations, while the default hard handoff
  dispatches only one ordinary representation at a time.

Density accumulation is application policy rather than a current `gpu-trace` public class. A span
contributes to every time bin it crosses, preserving the visible coverage of long spans. Aggregate
marks use a distinct pattern so they cannot be mistaken for exact spans.

The example's minimap renders the coarsest level of the same GPU-built temporal hierarchy. It does
not rescan canonical spans or allocate another full-trace summary. Semantic groups occupy separate
sub-bands inside each node's lane envelope so overlapping coarse summaries retain their colors.
The visible-time window is drawn on top, and clicking the minimap recenters the current view.

The important bound is that raster output depends on the viewport bin count, not directly on the
total number of source spans. The current remaining cost is classifying spans inside conservative
candidate batches and atomically accumulating their bins.

## Dependency focus and display

The package-level interaction workflow expands selected spans through forward, reverse, or
bidirectional CSR adjacency. Each hop operates on a compact frontier and a source-aligned
reachability bitset. The maximum hop count and frontier capacity are compiled bounds, with overflow
reported rather than silently treated as a complete result.

Hidden dependency endpoints can project to their nearest visible ancestor. This preserves useful
relationships when a process or thread is collapsed.

The advanced viewer adds display-specific culling:

1. reject dependency batches whose endpoint envelope cannot affect the view;
2. resolve visible or projected endpoints;
3. retain edges whose line segment intersects the viewport, even when both endpoints are outside;
4. admit a stable hash tier within a global edge budget;
5. gradually increase that budget as exact spans become legible.

Stable admission avoids replacing most displayed edges on every small zoom change. In dense views,
the renderer quantizes endpoint positions into stable time/lane hubs and draws three-segment shared
corridors. Low per-edge opacity makes repeated routes accumulate into readable bundle strength
without washing out spans. The closest views use straight lines, while selected or hovered
dependencies always return to their full-bright exact route. Rendered and analytical picking use
the same effective route and canonical dependency identity.

## Picking and labels

The package exports a compute picking shader that tests visible spans and publishes a canonical
source row. It is useful when an application already owns a source-aligned visibility mask.

The advanced viewer instead draws spans and dependencies into a shared ID framebuffer and reads
the cursor pixel through a small readback ring. The encoded value identifies both object type and
canonical index. Hover highlighting remains on the GPU: shaders compare their canonical index
with a small hovered-object control value.

Dictionary-backed labels are generated only for shared candidates retained by exact visibility whose complete string fits in
the span clip rectangle. Candidate selection happens before glyph expansion, so text work scales
with useful visible labels rather than the full dictionary-expanded trace.

## Analytics, causal paths, and comparison

The analytical contributors consume canonical columns plus an optional source-aligned selection:

- [`GPUTraceAggregation`](/docs/api-reference/experimental/gpu-trace/aggregation)
  groups counts and duration statistics by a built-in or caller-provided dense trace dimension;
- `GPUTraceTimeBuckets` clips span overlap into equal-width trace-time intervals and can derive
  average concurrency, lane utilization, and idle lane-time into GPU-resident output series;
- `GPUHistogram` and generic reductions provide compact distributions and totals;
- [`GPUTraceCriticalPath`](/docs/api-reference/experimental/gpu-trace/critical-path)
  resolves the longest canonical parent path with logarithmic pointer jumping;
- [`GPUTraceComparison`](/docs/api-reference/experimental/gpu-trace/comparison)
  compares aligned group summaries rather than allocating a second per-span result;
- [`GPUTraceAnomalyScoring`](/docs/api-reference/experimental/gpu-trace/anomaly-scoring)
  publishes replaceable per-span scores and masks from explicit peer baselines.

Time-bucket clipped duration is exact integrated concurrency even when spans overlap. Dividing it
by bucket width gives exact average concurrency. Interpreting the same value as occupied versus
idle lane capacity additionally requires non-overlapping spans within each logical lane; the
generated viewer dataset enforces that invariant. Sources that allow same-lane overlap should
assign overlap depths as separate logical lanes or treat lane utilization as bounded load rather
than unique occupied time.

The advanced viewer demonstrates a custom operation dimension without widening canonical span
storage. Its selection pass derives the same small operation-dictionary ID used by fitted labels,
then `GPUTraceAggregation` groups that transient GPU column alongside renderer group, status,
process, and thread. Only the compact dictionary-sized count series is read back for the panel.

Viewport analytics issue their own hierarchical temporal-index query using the analytical minimum
duration, then fuse exact filtering, grouping, histogram, and time-bucket accumulation over only
the GPU-published candidate batches. This remains exact because the index summaries are
conservative. Measured intervals reuse the canonical selection graph because their fixed range may
differ from the live viewport. A full-trace analysis is inherently global, so the application
preflights its estimated workload and may use
`CompiledGPUCommandGraph.createExecution()` to encode dependency-ordered node ranges over multiple
animation frames. Before execution, `getExecutionPlan()` reports how many submissions are needed,
their invocation/command/read/write bounds, and whether an indivisible node exceeds a requested
budget. Individual graph nodes remain atomic; partitions provide the scheduling granularity.
Aggregation, parent critical-path, and anomaly-scoring contributors publish workload estimates.
The latter two accept `maximumRowsPerPass` when an application needs finer preemption than their
natural source chunks and algorithm passes provide. The advanced example submits each planned step
separately, waits for submitted GPU work, displays stable step progress and oversized-operation
diagnostics, and checks a generation token before continuing.

The example labels index construction and full-trace analytics as background work while keeping
explicit user-triggered causal and anomaly queries interactive. Its full-trace analytics graph
also declares coherent summary, histogram, and complete-profile boundaries. Progressive execution
publishes only those safe stages after their queue submission completes; the default atomic policy
for other graphs keeps intermediate buffers private.

## Current cost model

| Operation | Current work bound | Important qualification |
| --- | --- | --- |
| Temporal coarse query | Selected hierarchy-level nodes plus admitted leaf ranges | Conservative nodes can include false-positive leaves |
| Wide-span exceptions | All leaf-batch summaries | Leaf summaries, not all span rows, are tested |
| Exact classification | Span rows in candidate batches | Indirect dispatch skips non-candidate batches |
| Density classification | Span rows in candidate batches plus crossed bins | Atomic contention rises at extreme overview zoom |
| Dependency focus | Visited compact frontier and bounded hops | Overflow is explicit |
| Dependency display | Candidate edge batches, then intersecting edges within budget; bundled mode emits three line segments per admitted edge | Admission is stable but intentionally incomplete at wide zoom; shared corridors rely on low-alpha overdraw |
| Trace minimap | Coarsest temporal-hierarchy level plus four overlay rectangles | No canonical-span rescan or additional full-trace summary |
| Pixel boundaries | Tiled binary seeds plus forward galloping searches | Ordered queries share prior results inside each tile |
| Pixel representative, compact | Disjoint span ranges totaling `O(N + M)` | Lower memory; a single bursty pixel can load-imbalance |
| Pixel representative, indexed | `O(M log C)` range-maximum nodes plus one predecessor | Persistent tree uses `2C` words per lane, where `C` is its leaf capacity |
| Parent critical path | `O(spanCount × log(maximumDepth))` | The current contract is a parent forest, not a general DAG |
| Group comparison | Dense group count | Independent of canonical span count after aggregation |
| Anomaly scoring | Selected or complete canonical span count | Results remain source-aligned and GPU-resident |

## Why the graph does not run continuously

Static traces do not need continuous GPU submission. The advanced viewer invalidates rendering when
the viewport, interaction state, asynchronous result, or animation changes. Otherwise it leaves
the compiled graph idle. This keeps telemetry meaningful and avoids consuming GPU time for an
unchanged image.

## Measuring overview rendering

The advanced viewer keeps separate bounded frame histories for the effective `exact`, `density`,
and `representative` renderers. Each sample measures end-to-end queue completion for one requested
frame; switching modes therefore does not mix old density measurements into representative-span
percentiles. The Overview frame card reports p50/p95 for the active renderer and the detail panel
shows how many samples have been collected for each mode. Samples accumulate only while a view or
interaction actually requests a frame. Changing zoom, canvas size, filters, hierarchy, labels, or
dependency settings clears the comparison histories; panning at a fixed scale retains them so the
same workload envelope can be sampled across different trace regions.

The graph inspector also records `overview-renderer`, `overview-pixel-columns`,
`overview-output-upper-bound`, and `representative-search-cells`. The last counter separates the
chunk-local lane/pixel searches from the final canonical output bound: each chunk may nominate one
span per lane/pixel, while the cross-chunk resolution still publishes at most one stable span ID
per lane/pixel.

For comparable 4M and 25M measurements:

1. Use the same adapter, canvas size, trace duration, filters, hierarchy state, and dependency
   budget.
2. Select Density aggregation, perform the fixed pan/zoom interaction, and retain at least 20
   samples.
3. Select Representative spans, repeat the same interaction, and compare p50/p95, candidate span
   batches, overview output, and representative search cells.
4. Test Auto separately to validate the handoff rather than treating its mixed-scale history as a
   single algorithm benchmark.

Queue completion includes culling, compaction, dependencies, and rasterization, so it represents
interactive frame cost. Per-node timestamp-query histories remain the tool for attributing a
regression to one graph operation.

## Opt-in 25M reference validation

The GPU Core tab exposes a deliberately manual **Run validation** action only after an exact
25M-span and 25M-dependency dataset is ready. It never changes dataset capacity, starts generation,
or runs during ordinary page load. The 21-second script gives each stable benchmark scenario three
seconds and continuously pans a bounded trace window:

- expanded, collapsed, filtered, focused, and framebuffer-picking exact views;
- density aggregation at overview scale;
- representative-span rendering at the same overview scale.

Each completed queue submission records its end-to-end frame time, CPU encoding time, effective
renderer, candidate span/dependency batches, and visible output counts. The picking phase records
request-to-readback latency separately. The final versioned JSON report also contains the adapter
profile key, canvas dimensions, storage limits, persistent allocation, largest buffer, deferred
picks, queue stalls, and device-loss state.

A complete report requires at least three completed frames per scenario, frame p95 at or below
33 ms, picking p95 below 100 ms, no one-second queue stall, no device loss, and no persistent buffer
larger than the reported adapter limits. A non-25M run or missing scenario is `incomplete`, not a
passing scale claim. The report is reference evidence rather than a universal hardware promise:
reference results must retain the adapter identity and exact canvas size.

Compilation, encoding, submission, and readback remain separate phases. Static construction can be
cached; view-dependent passes can be re-encoded; small readbacks can use a ring; and large global
analyses can advance through a bounded execution cursor.

## Implemented, application-level, and next

| Status | Algorithms |
| --- | --- |
| Public `gpu-trace` API | Canonical scene storage, CSR adjacency, hierarchy interaction, temporal batch index and builder, lane/time index builder, pixel mipmap boundaries and representatives, persistent range-maximum index, aggregation, reusable compact analytics outputs, time buckets, resumable parent critical path, comparison, resumable anomaly scoring, compute picking |
| Advanced example composition | Adaptive `Auto / Density / Representative spans` LOD, filter-aware longest-per-lane/pixel selection, exact wide-span exceptions, hierarchy-backed interactive minimap, stable dependency budgets and shared corridors, line/viewport culling, fitted dictionary labels, shared framebuffer picking, render-on-demand scheduling, bounded full-trace analytics with progress and cancellation, aggregate regression tinting, and optional per-span anomaly overlays |
| Next direction | Feed measured GPU time back into trace-specific policies, validate representative versus density results at 4M and 25M spans, and implement general dependency-DAG critical path and wait attribution. Out-of-core streaming is intentionally deferred. |

The pixel-mipmap foundation is inspired by Lalit Maganti's
[description of Perfetto's batched exponential search](https://lalitm.com/post/exponential-search/)
and [Perfetto PR #4648](https://github.com/google/perfetto/pull/4648). Perfetto exploits sorted
pixel-boundary queries by performing one binary search and then galloping forward from each prior
result. `GPUGallopingSearch` generalizes that ordered-query operation. `GPUTraceLaneIndexBuilder`,
`GPUTraceMipmapBoundaries`, `GPUTraceRangeMaximumIndexBuilder`, and `GPUTracePixelMipmap` compose it
with lane/depth ordering and longest-span preservation. The GPU version deliberately tiles query
streams to retain parallelism, so its performance must be measured rather than assuming Perfetto's
CPU speedup transfers unchanged to WebGPU.

The same query can follow a compact `rowOrder` index over strided canonical span records. That form
is important for 25M-scale chunked storage: it adds one 32-bit row ID per span instead of copying
start, duration, and canonical-ID columns into another monolithic allocation.

The trace viewer builds one such row order per source chunk, applies its active filters as a bitset
before representative selection, and resolves chunk-local candidates to one stable canonical ID
per lane/pixel. Winners are added to the normal exact-span visibility masks, so labels, indirect
draws, hover highlighting, and picking retain the same identity and code paths.

The range-maximum tree is an optional memory/performance tradeoff. Without it, each pixel scans only
its disjoint start-time interval and the total comparisons remain linear in spans plus pixels. With
it, each pixel performs a logarithmic tree query and then compares the immediately preceding span,
which preserves a wide non-overlapping span that began before the pixel or viewport. Sources with
overlapping spans must first assign overlap depths so each indexed lane/depth segment is disjoint;
the lane index builder reports violations explicitly.

For the generated 256-lane workload, 64 MiB canonical chunks, and a 1920-pixel query width, the
example preflight reports:

| Spans | Chunks | Compact row-order mode | With range-maximum trees | Largest added binding |
| ---: | ---: | ---: | ---: | ---: |
| 4M | 2 | 19,934,216 bytes | 53,488,648 bytes | 16 MiB |
| 25M | 12 | 123,605,296 bytes | 324,931,888 bytes | 16 MiB |

These are additional mipmap allocations, not total trace residency. The viewer must show the
preflight before opting into persistent trees; compact mode remains the default when memory is more
valuable than worst-cell query latency.
