# GPU Core implementation roadmap

This maintainer roadmap tracks the phased development and graduation of GPU Core. The
[user-facing GPU Core guide](../../docs/api-reference/experimental/gpu-core/README.md)
documents shipped behavior, constraints, and reference pages.

## Phased roadmap

The command-graph foundation and hierarchical-trace, analysis, texture, picking, and spatial
filtering v1 milestones are implemented. The remaining work is ordered by dependency so that later
APIs build on measured, reusable contracts instead of demo-specific behavior.

Impact estimates how broadly a phase unlocks GPU-driven applications. Complexity/cost estimates
relative engineering scope, integration risk, and validation effort; it is not a staffing or
schedule commitment.

| Phase | Outcome | Status | Impact | Complexity/cost |
| --- | --- | :---: | :---: | :---: |
| 0 — Current foundation | Command graph, masks, hierarchy layout, graph traversal, ancestor projection, compaction, indirect drawing, picking, analysis primitives, and three working consumers | Implemented | High | Complete |
| 1 — Hardening and observability | GPU timestamps, performance baselines, adapter capability reporting, boundary and overflow validation, memory statistics, and device-loss and resource-lifetime coverage | Implemented | High | Medium |
| 2 — Reusable visibility workflows | Renderer-independent time-range, bounds, LOD, and selection workflows that publish stable IDs, counts, and indirect commands | Implemented | High | Medium |
| 3 — Algorithm and table scaling | Multi-chunk coverage, segmented and inclusive scans, weighted statistics, richer histograms, and batch-preserving algorithms | Core implemented; topology extensions deferred | High | Large |
| 4 — Picking and texture coverage | Region picking, asynchronous staging rings, multisample resolves, frame-scoped swapchain imports, and sampled-only external-image contracts | Implemented | Medium | Large |
| 5 — Spatial acceleration | `GPUGridIndex` and `GPUBVH` with explicit build, update, query, correctness, and cost-comparison contracts | V1 implemented; conditional extensions deferred | High | Large |
| 6 — GPUScene | A flat GPU draw database with stable identity, bounds, transforms, grouping, geometry references, and indirect command slots | Storage, mutation, source adapters, draw generation, and resource grouping implemented; cross-domain consumers planned | High | Large |
| 7 — API graduation | Stable package contracts and a dependency-safe direct move out of experimental packages | Planned | High | Large |

### Spatial v1 milestones

Phase 4 is implemented through Tranche 4.4. The spatial stack now includes compact 2D/3D
`GPUGridIndex` construction, conservative queries, exact point refinement with an unindexed GPU
oracle, deterministic complete-binary `GPUBVH` storage and refit, and exact BVH bounds/point
traversal. These are foundations, not a claim that incremental grid updates or source-order BVH
topology are always profitable. A shared benchmark harness now rejects incomplete or incorrect
paths before reporting timings and records why optional update, topology, and ray extensions remain
deferred.

| Milestone | Implemented outcome |
| --- | --- |
| 5.1a — `GPUGridIndex` build | Stable cell offsets and capacity-bounded IDs for packed 2D/3D points |
| 5.2a — `GPUGridIndex` query | Point, bounds, and radius cell candidates with masks, counts, and overflow |
| 5.2b — Exact query consumers | Indexed and unindexed 2D/3D point predicates feeding one visibility contract |
| 5.3a — `GPUBVH` storage and refit | Flat complete-binary nodes, stable leaf slots, explicit capacity, and bottom-up refit |
| 5.4a — `GPUBVH` bounds and point query | Exact 2D/3D traversal with stable IDs, masks, count, overflow, and visited-node metrics |
| 5.2c / 5.4c — Benchmark and cost model | Correctness-gated scan/grid/BVH timings, phase distributions, memory, work counters, and reuse amortization |
| 5.1b / 5.3b / 5.4b — Decision gates | Incremental grid updates, topology rebuild, and ray traversal deferred pending consumer semantics and positive evidence |

### Remaining tranche map

The first larger-compute slice can proceed independently of package graduation because it uses the
existing table-independent graph contract. Tranche 8.1a is implemented: `GPUHashIndex` rebuilds a
fixed-capacity sparse `uint32` identity map from one packed batch, `GPUBatchHashIndex` builds the
same shared map from preserved right-side chunks without concatenation, and `GPUHashIndexQuery`
performs bounded lookup against either index with deterministic duplicate values, explicit invalid
and overflow counts, and probe statistics.
Tranche 8.2a is also implemented: `GPUHashJoin` composes lookup and stable scan into bounded
many-to-one row-pair materialization with exact required-count and overflow reporting. It
propagates incomplete source indices rather than presenting partial matches as complete. Tranche
8.3a adds `GPUBatchHashJoin`: ordered left chunks independently query one shared right index and
retain per-batch capacities, counts, overflow, and probe statistics without packing. The current
contracts intentionally stop before deletion, independently partitioned right indices, multi-match
joins, and payload materialization establish their own consumer-driven contracts.

The remaining work is divided into reviewable contracts. A tranche should land only when its entry
dependency is present and its measurable exit evidence can be produced. Numbering groups related
contracts; table order and the recommended sequence express dependency order, not staffing or
schedule commitments. Conditional implementation tranches are entered only when the preceding
decision gate shows that their added memory and complexity pay for themselves in representative
consumers.

| Tranche | Outcome | Entry dependency | Measurable exit | Impact | Cost |
| --- | --- | --- | --- | :---: | :---: |
| 8.1b — Mutable hash maintenance | Deletion and tombstone or rebuild-threshold policy grounded in a dynamic consumer | Implemented bounded `GPUHashIndex` build/query plus measured mutation workload | Lookup parity across deletion and reinsertion; bounded degradation and explicit rebuild trigger | Medium | Medium |
| 8.2b — Sparse grouping and multi-match decision | Decide sparse aggregate rows, one-to-many storage, and payload materialization separately | Implemented bounded many-to-one `GPUHashJoin` plus two requesting consumers | Each expansion contract is accepted with output bounds and CPU-oracle evidence or explicitly deferred | High | Large |
| 8.3b — Partitioned-right decision | Decide paired partitions, key routing, or global addressing for multiple right indices | Implemented shared-right `GPUBatchHashJoin` plus a consumer with partitioned right ownership | One routing contract is accepted with empty/uneven batch evidence or explicitly deferred | High | Large |
| 8.4 — Sparse graph analytics | Frontier/visited representations and graph algorithms selected by demonstrated consumers | Partitioned identity contracts from 3.2 and the 8.3b decision | Bounded CPU-oracle parity on disconnected, cyclic, and high-degree graphs | High | Large |
| 8.5 — Field and solver composition | Reusable graph-native stencil, advection, and solver building blocks behind live simulations | Two existing simulation consumers agree on field and boundary contracts | Shared primitives replace consumer-local kernels without hidden submission | High | Large |
| 3.2 — Partitioned topology | Implemented: global-ID and chunk-base contracts for hierarchy and CSR inputs without hidden packing | Implemented Phase 3 primitives plus a preserved-batch consumer | CPU-oracle parity across empty and uneven chunks; no implicit repack | High | Large |
| 3.3 — Extension decision gate | Implemented: sparse/multidimensional histograms, custom scans, and shader predicates explicitly deferred pending consumer evidence | Tranche 3.2 plus at least two requesting consumers | Each proposal is accepted with a fixed contract or explicitly deferred with evidence | Medium | Small |
| 6.3a — Conventional scene consumer | Implemented: an application-owned CPU scene graph uses shared flat storage, GPU visibility and picking, renderer resource groups, measured mutation, and indirect draw generation | Tranche 6.2b and Phase 4 | Stable application IDs, one compiled graph, explicit update costs, and no consumer-specific fields or CPU draw filtering | High | Medium |
| 6.3b — Table-oriented scene consumer | A preserved-batch table application uses the same runtime contracts | Tranches 6.1c, 6.2b, and 3.2 | Shares public primitives with 6.3a without repacking or adapter casts | High | Medium |
| T.1 — Canonical GPU trace scene | Stable spans, process/thread ownership, preserved source partitions, parents, dependency CSR, and generic scene projection | Implemented `GPUScene`, draw generation, and renderer-owned resource groups | Source identity, empty/uneven batches, bidirectional links, ownership, and scene draw/group integration pass GPU tests | High | Medium |
| T.2 — Interactive GPU trace policies | Implemented: time windows, process/thread expansion, linked-span focus, ancestor retention, and stable indirect draws | Tranche T.1 plus hierarchy, mask, traversal, and visibility workflows | Policy-only updates reuse one graph with GPU-tested stable masks, row IDs, hierarchy offsets, ancestry, and indirect draws | High | Large |
| T.3 — Scene-backed trace showcase | Implemented: a bounded live trace explorer combines canonical trace scenes, GPU interactions, picking, resource groups, stable indirect drawing, and command-graph inspection | Tranche T.2 plus existing picking and graph-inspection contracts | Representative traces pan, filter, collapse, focus, and pick without CPU draw selection or graph recompilation | High | Large |
| 7.1 — Dependency audit and API freeze | Freeze names, ownership, failures, capacities, submission, and package graph | Phase 6 exits and two consumers per graduation candidate | Acyclic dependency report and owner for every public resource boundary | High | Medium |
| 7.2 — Scheduling-core extraction | Move table-independent graph scheduling directly to `@luma.gl/engine` | Tranche 7.1 | Engine builds without tables, gpgpu, or Arrow; all repository imports use the final owner | High | Large |
| 7.3 — Adapter and algorithm migration | Keep table adapters in `@luma.gl/tables`; move optional workflows to `@luma.gl/gpgpu` | Tranche 7.2 | Package tests enforce dependency direction and examples use final owners | High | Large |
| 7.4 — Documentation and graduation | Stable docs, release notes, and experimental-removal criteria | Tranche 7.3 | API reports and links pass; obsolete experimental exports are absent | High | Medium |

### Recommended execution order

1. Add the preserved-batch table consumer (6.3b) beside the implemented conventional scene
   consumer (6.3a) to prove the same shared visibility, picking, generated draws, and
   renderer-owned resource groups without packing or consumer-specific scene fields.
2. Preserve the implemented canonical trace-scene, reusable interaction, and live scene-backed
   showcase contracts (T.1–T.3); add larger trace features only when a consumer establishes their
   resource bounds and measurable benefit.
3. Preserve the implemented partitioned hierarchy/CSR topology and explicit extension decision
   gate (3.2–3.3); reopen extensions only when new consumers fix their memory and identity costs.
4. Reopen incremental grid maintenance, spatial BVH rebuild, or ray traversal only when the
   documented decision gate gains a requesting consumer and positive evidence.
5. Graduate packages only after both scene consumers prove the final APIs and dependency direction.
6. Develop the larger compute vocabulary independently where contracts are already bounded:
   single-batch `GPUHashIndex`, preserved-right-batch `GPUBatchHashIndex`, bounded many-to-one
   `GPUHashJoin`, and shared-right `GPUBatchHashJoin` are implemented; require consumers and
   measurements before adding mutable
   maintenance, partitioned-right routing, multi-match joins, sparse graph algorithms, or
   generalized field solvers.

### Phase 0 — Current foundation

**Entry dependencies:** None. This is the implemented baseline.

The baseline includes fixed-capacity buffer and logical-texture scheduling across compute, render,
and copy nodes; hazard inference; imported-resource overrides; graph-owned attachments; transient
reuse; ownership validation; and allocation statistics. Implemented algorithms cover exclusive,
inclusive, and segmented scans; stable compaction; chunk-preserving boolean masks; bounded CSR
traversal; nearest-visible parent projection; paired sort; scalar reduction; histogram counting;
spatial grid binning; and GPU-written indirect commands.

`GPUIndexPickingTarget` provides single-pixel and bounded-region integer object and batch picking;
`GPUReadbackRing` overlaps reusable staging slots without mapped-buffer reuse. The hierarchical
trace viewer adds GPU-scanned process/thread layout, source and topology filtering, dependency
focus, click picking, collapsed activity, projected edges, and stable indirect span and edge groups.
The frustum-culling and GPU data-analysis examples provide two additional consumers.

**Exit criteria:** Achieved by the current exported primitives, reference documentation, CPU
oracles, WebGPU tests, and the three independent examples.

### Phase 1 — Hardening and observability

**Status:** Implemented in the experimental API.

**Entry dependencies:** Phase 0 behavior remains experimental but functionally complete.

Add capability-gated timestamp allocation per graph node without adding readback to normal
encoding. Establish repeatable performance and memory baselines for empty inputs, workgroup
boundaries, maximum example capacities, dense dependency graphs, and repeated parameter-only
updates. Extend adapter diagnostics, capacity and overflow tests, device-loss handling, and
resource-lifetime coverage.

`CompiledGPUCommandGraph.capabilities` reports graph-relevant adapter support and limits. Expanded
`stats` account for imported, logical, and owned transient memory. Every `encode()` returns
synchronous whole-graph and per-node CPU costs; timestamp-enabled encoders additionally support an
explicit post-submit `readTimings()` call. The documented benchmark protocol covers boundary and
maximum example capacities without making readback part of the frame loop.

**Exit criteria:** Achieved by capability reporting, encoding and timestamp diagnostics, expanded
memory statistics, safe-range and adapter-limit validation, device-loss rejection, lifecycle tests,
and the repeatable benchmark protocol.

### Phase 2 — Reusable visibility workflows

**Status:** Implemented in the experimental API.

**Entry dependencies:** Phase 1 establishes measurement, failure, and lifetime contracts.

Standardize graph fragments for bounding spheres, axis-aligned boxes, time ranges, LOD thresholds,
and selection masks. A workflow publishes source-aligned masks, compacted stable IDs, counts, and
optional indirect-command fields rather than a renderer-specific object. Refactor the trace viewer
and frustum-culling example to consume the same workflow contract.

General application-defined WGSL predicates remain deferred until fixed-contract workflows reveal
the necessary shader-extension points.

`GPUVisibilityWorkflow` now accepts source-aligned time-range, bounds, LOD, and selection masks,
intersects them, optionally publishes the canonical mask, generates or consumes stable source IDs,
and writes compacted IDs plus one GPU-resident count. Atomic and multi-chunk vector inputs share
the same contract. The hierarchical trace viewer and frustum-culling example both use the workflow
and send its count directly to indirect rendering; changing view and selection data does not
recompile either graph.

**Exit criteria:** Achieved by two consumers sharing one workflow without application-owned scan or
compaction plumbing, parameter-only interaction updates on compiled graphs, and GPU-resident counts
flowing directly into indirect rendering.

### Phase 3 — Algorithm and table scaling

**Status:** Implemented. Inclusive and segmented `uint32` scans, weighted floating-point grid and
categorical statistics, irregular-edge histograms, filtered categorical counts, batch-preserving
paired sort, and partitioned hierarchy and CSR topology are implemented.

**Entry dependencies:** Phase 2 provides real workflow demand for each added variant.

`GPUScan` now supports inclusive output and nonzero segment-start flags for both atomic data views
and chunk-preserving vectors. Segments continue across chunk boundaries, hierarchical summaries
preserve carry-in values when a later row starts a segment, and all arithmetic retains the
documented modulo-2^32 behavior. The data-analysis example uses inclusive scan for a histogram CDF
and a segmented inclusive scan for per-row spatial-grid prefixes.

`GPUGridAggregation` pairs `float32x2` positions with aligned `float32` weights and computes one
row-major sum, minimum, maximum, or mean per cell. Atomic data views and vectors with identical
chunk topology share the same initialize-once contract. Non-finite positions and weights are
ignored. Sum and mean use compare-exchange addition with explicit nondeterministic `float32`
accumulation order; minimum and maximum use ordered float encodings with native integer atomics.
Empty non-sum cells publish NaN. The data-analysis example validates all four operations over the
same imported Arrow batches.

`GPUHistogram` now supports literal and GPU-resident irregular edges in addition to equal-width
domains. It uses binary search with `[edge[i], edge[i + 1])` intervals and includes the final upper
edge. GPU edges are validated for finite, strictly increasing order by a graph pass, so applications
can update thresholds between encodings without a CPU readback or graph rebuild. Invalid GPU edges
produce zero counts. The data-analysis example switches between uniform and GPU-resident threshold
bins and validates both against a CPU oracle.

`GPUGroupAggregation` maps dense `uint32` identity codes directly to caller-owned group rows. Count
uses a `uint32` output; aligned `float32` values add sum, minimum, maximum, and mean outputs with the
same finite-value and empty-result contracts as grid aggregation. An optional source-aligned mask
lets visibility or selection workflows update categorical distributions and statistics without
downloading selected IDs. Atomic and vector inputs share one contract; vectors preserve aligned
source chunks without packing. Large chunks use bounded three-dimensional dispatches. The
data-analysis example groups the same Arrow rows by quadrant while a selectable value mask changes
both the accepted population and its per-group means.

`GPUBatchSort` applies stable paired `uint32` sorting independently to aligned GPU vector chunks.
It preserves the number, order, and length of source batches, never allocates a hidden packed
copy, and selects bitonic or radix sorting independently for each chunk. This supports streaming
record batches, per-tile ordering, and incremental ingestion where partition boundaries are part
of the storage and lifetime contract. The GPU sort example contrasts that behavior with one
explicit packed global sort and validates independently sorted batches against a CPU oracle.

`GPUSegmentedSort` addresses a different partition contract: many small domains already occupy
shared parent key and payload buffers. Explicit per-domain offsets and lengths retain segment
boundaries while equally sized workgroups share one dispatch. Segments of up to 256 rows require
at most eight width-bucket graph nodes regardless of segment count; gaps remain untouched and no
hidden packing or physical allocation occurs. This is useful for independent mesh-local Morton
orders, while separately allocated streaming chunks remain the domain of `GPUBatchSort`.

More batch-aware operations remain consumer-driven rather than being required to complete this
phase. Custom associative scans, sparse histograms, and multidimensional histograms should be added
only with a concrete consumer and an explicit numerical or memory contract.

#### Tranche 3.2 — Partitioned topology

**Status:** Implemented.

Define how chunk-local rows map to stable global IDs, including explicit base offsets and the
ownership of cross-chunk hierarchy or CSR edges. Extend at least one hierarchy primitive and one
CSR primitive to consume that contract without concatenating chunks behind the caller's back.

`GPUHierarchyLayout` now derives stable cumulative bases independently for parent and child
vectors, splits only the intersecting work when their boundaries differ, and scans offsets across
the preserved child topology. `GPUGraphTraversal` accepts one local CSR allocation per output
partition with global neighbor IDs and routes arbitrary cross-partition edges through explicit
source-to-target passes. The trace viewer exercises both contracts using two logical partitions
backed by its existing allocations.

**Exit evidence:** CPU-oracle tests cover empty chunks, cross-chunk references, uneven boundaries,
and incremental replacement of one batch. A hierarchy and graph consumer preserve their source
partitions while producing the same IDs and results as an explicitly packed input.

#### Tranche 3.3 — Extension decision gate

**Status:** Implemented as an explicit deferral decision.

Evaluate custom associative scans, sparse and multidimensional histograms, and shader predicate
callbacks against demonstrated consumers after partitioned topology lands. Each candidate must
state its numerical behavior, memory-growth bounds, composition model, and why existing fixed
contracts are insufficient. Explicit deferral is a valid outcome; this tranche does not require
inventing an extension API merely to complete a checklist.

| Candidate | Decision | Evidence required to reopen |
| --- | --- | --- |
| Custom associative scans | Defer | Two consumers sharing an associative operation, identity value, overflow behavior, and shader value layout that the fixed `uint32` scan cannot express |
| Sparse histograms | Defer | A high-cardinality consumer where dense output is demonstrably the dominant memory cost, plus bounded key storage and overflow semantics |
| Multidimensional histograms | Defer | Two consumers requiring joint distributions that cannot compose `GPUGridBinning`, `GPUGridAggregation`, or dense group IDs without materializing an avoidable column |
| Application WGSL predicate callbacks | Defer | Two visibility consumers sharing binding, validation, cache-key, diagnostic, and composition requirements beyond the fixed workflow masks |

This decision keeps numerical behavior and shader interfaces inspectable. A future proposal should
name the missing fixed-contract capability and its capacity bound rather than exposing an
unconstrained callback as a shortcut.

**Exit evidence:** Every candidate has two motivating consumers or remains documented as deferred,
and any accepted API has a CPU oracle plus explicit capacity, overflow, and shader-compatibility
contracts.

Irregular histogram edges primarily target heavy-tailed measurements such as trace duration and
request latency. Explicit microsecond-to-second boundaries preserve resolution across orders of
magnitude, align results with service-level thresholds, and let applications compare dynamic
filtered subsets without first generating a log-transformed column. The histogram reference
documents the use case, interval semantics, and update contract.

**Exit criteria:** Each new variant has a deterministic CPU oracle, empty and boundary coverage,
multi-chunk tests where applicable, explicit overflow and floating-point behavior, and at least one
application or renderer consumer.

### Phase 4 — Picking and texture coverage

**Entry dependencies:** Phase 1 defines resource-lifetime and asynchronous readback behavior;
Phase 2 defines stable visible identity.

Region picking, reusable asynchronous staging-buffer rings, multisample resolves, frame-scoped
swapchain imports, and sampled-only external-image imports are implemented. Their access,
ownership, and asynchronous or frame lifetime are explicit.
Callback, highlighting, tooltip, and color-encoded fallback policies remain higher-level workflow
or application concerns.

#### Tranche 4.1 — Region picking

`GPUIndexPickingTarget.addRegionPass()` publishes object IDs, batch IDs, a total result count, and
an overflow flag into caller-sized GPU storage. One covered pixel produces one pair, duplicates are
preserved, and atomic append order is unspecified. Selection semantics such as nearest-only,
toggling, deduplication, or highlighting stay above the primitive.

**Exit evidence:** Tests cover empty regions, overlapping primitives, duplicate IDs, exact capacity,
and overflow. An example uses stable IDs from `GPUVisibilityWorkflow` without a CPU-side identity
translation.

#### Tranche 4.2 — Asynchronous readback ring

`GPUReadbackRing` provides reusable staging tickets with immediate and waiting acquisition paths,
explicit cancellation, safe mapped-buffer reuse, destruction, and device-loss propagation. It owns
staging allocations but neither submits command buffers nor silently waits for a mapped slot.

**Exit evidence:** Repeated region picks can overlap rendering and readback without reusing a
mapped buffer or serializing every frame. Tests cover ring exhaustion, out-of-order completion,
cancellation, destruction, and device loss.

#### Tranche 4.3 — Render-target graph contracts

Graph render attachments now model multisample resolve targets with explicit mip, layer, aspect,
access, format, extent, and sample validation. `importFrameTexture()` requires caller-acquired
swapchain textures to carry one coherent, strictly increasing frame ID per encoding. The graph
validates hazards but never acquires, presents, or destroys a swapchain texture on the
application's behalf.

**Exit evidence:** Compute, render, copy, and resolve nodes order conflicting subresource access;
multisample and swapchain examples encode through the graph; invalid same-pass access,
stale-frame, and ownership mistakes fail before submission.

#### Tranche 4.4 — External-texture contracts

`importExternalTexture()` represents external images as a distinct sampled-only resource rather
than pretending they are ordinary texture storage. Each encoding requires a fresh concrete
binding and a strictly increasing frame ID coherent with every other frame resource. Render nodes
resolve the current snapshot through `getExternalTexture()`; views, storage, copies, attachments,
and graph ownership are deliberately unavailable. Media scheduling, frame acquisition, and
fallback conversion stay outside the graph.

This boundary matters for video, camera, and browser-compositor sources. Their native WebGPU path
can avoid a per-frame copy, but the resulting `texture_external` binding is opaque and short-lived.
Making that lifetime explicit prevents an application from caching yesterday's browser binding or
accidentally routing it through APIs that require reusable texture memory. The video-texture
example demonstrates successive native bindings while retaining an explicit copied WebGL fallback.

**Exit evidence:** Validation prevents persistence into incompatible compiled encodings; common
device-loss checks cover encoding; replacement, cross-resource frame coherence, stale IDs, fresh
binding identity, and borrowed destruction are tested; and the video-texture consumer imports
successive native frames without graph-owned destruction or accidental cross-frame reuse.

**Exit criteria:** Region results preserve stable object and batch identity; repeated picks do not
serialize rendering on mapped buffers; and resolve, swapchain, and external resources participate
in graph validation without accidental ownership or cross-frame reuse.

### Phase 5 — Spatial acceleration

**Entry dependencies:** Phase 1 supplies measurement, Phase 2 supplies reusable visibility, and
Phase 3 supplies the required scan, compaction, and batching behavior.

`GPUGridIndex` was implemented before `GPUBVH` to validate build, update, storage, and query
interfaces on a simpler structure. Grid-index consumers established the shared identity, capacity,
overflow, and measurement contracts reused by BVH traversal. Both are library-built storage-buffer
structures, not native WebGPU acceleration resources, and expose their construction and query
costs.

#### Tranche 5.1 — `GPUGridIndex` build and update

**Status:** Compact full-build storage is implemented. Incremental maintenance is deferred pending
a moving-data consumer and a positive measured update-policy decision.

Build a flat index of cell offsets and stable object IDs from bounded positions or bounds. Expose
capacity and overflow, distinguish full rebuilds from supported incremental updates, and keep cell
size and domain policy caller-controlled.

`GPUGridIndex` builds 2D `float32x2` or 3D `float32x3` point inputs into exclusive row-major cell
offsets and capacity-bounded stable IDs. It accepts one packed view or preserved vector chunks,
generates logical IDs or consumes aligned explicit IDs, and reports the full accepted count plus
overflow without writing past capacity. Exact maximum coordinates enter the final cell; non-finite
and out-of-domain rows are ignored.

The current update policy is explicitly `'rebuild'`: callers may upload a bounded input range or
replace one vector chunk, but the next encoding clears, scans, and scatters the complete compact
index. The 5.1b decision gate deferred bounded relocation and reserved-cell designs because no
moving-data consumer yet demonstrates a positive crossover after memory overhead, fragmentation,
adversarial movement, and overflow behavior. Tranche 5.1c reopens only if that evidence justifies an
incremental design; `'rebuild'` is the complete v1 policy.

**Implemented evidence:** Two-dimensional and three-dimensional builds match CPU oracles across
empty, clustered, out-of-domain, and capacity-boundary inputs.

**Decision:** Full rebuild is the supported v1 update contract. The benchmark reports its build cost
separately from query cost. Bounded relocation or reserved-cell maintenance reopens only when a
moving-data consumer demonstrates a crossover that repays added memory, fragmentation, and
overflow complexity.

#### Tranche 5.2 — `GPUGridIndex` query

**Status:** Conservative queries, exact 2D/3D point-refinement consumers, and the shared benchmark
contract are implemented.

Add bounds, radius, and point queries whose masks or compacted IDs compose directly with visibility
and region-picking outputs. Query contracts preserve stable identity and do not require downloading
candidate lists before filtering or drawing.

`GPUGridIndexQuery` consumes the flat grid storage and a mutable GPU-resident point, bounds, or
radius query. It publishes capacity-bounded stable candidate IDs, the stored-prefix candidate count,
propagated index or output overflow, and an optional source-ID-addressed mask. Point queries select
one cell; bounds and radius queries conservatively select intersecting cells. Exact object tests are
deliberately a following application or visibility predicate, so the index does not embed one object
shape or confuse cell overlap with an exact hit.

`GPUPointSpatialFilter` supplies a fixed-contract exact predicate for packed points. It runs over
either every source row or compact candidate row IDs and publishes the same source-aligned mask in
both modes. Two- and three-dimensional tests feed the exact mask into `GPUVisibilityWorkflow`,
intersect it with selection, and compare indexed results with an unindexed GPU scan after dynamic
query changes. Candidate overflow remains visible because a refined result cannot be complete when
its broad phase was truncated.

Tranche 5.2c turns the indexed and unindexed paths into one repeatable benchmark harness. The harness
uses identical data and queries, validates exact result parity, rejects overflow, and reports
distributions rather than a single favorable sample.

**Implemented evidence:** `runGPUSpatialQueryBenchmark` reports build, query, exact-predicate, memory,
candidate, and reuse-amortization metrics with optional GPU timestamps. Representative consumers
still choose and publish their own crossover; the library does not encode one adapter-specific
threshold as policy.

#### Tranche 5.3 — `GPUBVH` build and refit

**Status:** Flat complete-binary storage, deterministic GPU refit, exact traversal, and
topology-quality measurement are implemented. Spatial topology rebuild is deferred pending positive
consumer evidence.

Define flat node and leaf storage, stable leaf identity, bounds encoding, and explicit rebuild and
refit policies. Reuse the grid index's ownership and measurement conventions where possible while
allowing BVH-specific topology.

`GPUBVH` reserves a power-of-two leaf capacity and publishes `2 * leafCapacity - 1` row-major node
bounds and child pairs plus stable leaf IDs. Source order defines leaf slots. Each encoding reloads
the bounded source prefix and reduces parent bounds bottom-up, so changing bounds refits without
graph recompilation or identity changes. Hierarchies of up to 128 leaves fuse the complete build
into one workgroup; larger hierarchies retain explicit, safely ordered level passes. Optional
caller-supplied source identifiers are published without exceeding the default eight-buffer WebGPU
CORE limit. Count, overflow, topology, update policy, level count, and caller-owned output bytes
remain explicit.

`GPUSegmentedBVH` applies that same complete-binary contract to many independent hierarchies
already packed into shared source and destination buffers. It groups trees containing up to 128
leaves by leaf capacity and dispatches one workgroup per tree, so arbitrarily many same-sized mesh
BLASes need one graph node and mixed sizes need at most eight nodes. Packed offsets, invalid leaves,
overflow reporting, two- or three-dimensional bounds, and the eight-storage-buffer CORE limit stay
explicit.

The complete source-order topology is a correctness and refit baseline, not a promised spatial
quality heuristic. Tiled, Morton-ordered, or producer-sorted inputs may already have locality;
arbitrary order may create overlapping parents and poor traversal. The 5.3b decision gate uses
visited nodes, candidate ratios, and build/refit phases to compare source, producer, and externally
preordered input. Tranche 5.3c reopens only after representative measurements demonstrate that a
library spatial builder repays its sorting and topology cost.

**Implemented query evidence:** `GPUBVHQuery` traverses complete-binary 2D/3D hierarchies for exact
point containment and bounds intersection. CPU-oracle tests cover selective pruning, overlap,
invalid queries, output overflow, mutable queries, and source-ID-addressed masks. `visitedCount`
reports topology work independently from matches.

**Decision:** `visitedCount` and phase timings report topology quality separately from storage and
refit cost. A Morton or other topology builder reopens only when representative source, producer,
and preordered inputs demonstrate a material end-to-end win after sorting/build cost. Any future
builder must preserve query equivalence with refit.

#### Tranche 5.4 — `GPUBVH` query and cost model

**Status:** Bounds/point query and the Phase 5 selection cost model are implemented. Ray-like
traversal is deferred as a separate consumer-defined extension.

Tranche 5.4a is implemented. `GPUBVHQuery` connects exact bounds and point traversal to the same
bounded candidate, mask, count, and overflow contracts used by grid queries. It intentionally
precedes topology optimization: `visitedCount` measures whether a new topology improves useful
work.

Tranche 5.4b remains deferred until a picking or simulation consumer fixes ray/segment intersection,
nearest-hit behavior, and bounded traversal semantics. Traversal stack or work-queue capacity must
be explicit and overflow must never look like an empty hit set.

Tranche 5.4c publishes selection guidance rather than claiming one index is universally best. It
includes conditional incremental-grid or spatial-BVH builders only if their decision gates pass.

**Exit evidence:** The shared harness compares unindexed scan, grid, and BVH paths with the same
inputs and correctness oracle, including build amortization, selectivity, memory, candidates,
topology quality, visited nodes, and query time. Update rates remain consumer inputs rather than a
hard-coded library threshold.

**Exit criteria:** Achieved by 2D/3D grid and BVH build/query tests, exact point-filter integration,
visibility composition, stable output contracts, and the correctness-gated cost model. Picking can
consume the same stable-ID masks; ray traversal is not required for spatial filtering v1.

### Phase 6 — GPUScene

**Entry dependencies:** Phase 2 provides visibility output, Phase 4 provides interaction and
texture resource contracts, and Phase 5 provides spatial queries.

Define `GPUScene` as a flat draw database containing stable object IDs, bounds, transforms, group
membership, geometry references, and indirect command slots. CPU scene graphs may update this
database, and table-oriented applications may construct it directly; `GPUScene` does not introduce
a second game-engine hierarchy.

#### Tranche 6.1 — Scene storage and updates

Specify flat draw records, stable IDs, bounded update ranges, group membership, geometry references,
and command-slot ownership. Provide explicit adapters for CPU scene graphs and GPU tables without
making either representation canonical.

The table-independent record contract (6.1a) is implemented as a fixed 128-byte interleaved record
with explicit stable identity, references, bounds, transforms, state, capacity, ownership, and
typed graph views. Transactional CPU-authored insert, patch, removal, stable compaction, overflow,
and exact upload-cost reporting complete 6.1b. Tranche 6.1c adds two explicit source boundaries:
stable preorder callbacks flatten an application-owned CPU hierarchy into normal mutable records,
while canonical interleaved `GPUTable` batches are borrowed as ordered scene partitions without
readback, concatenation, or hidden packing. Empty batches retain their partition slots and global
record bases. Independent buffer ownership lets each adapted scene release its state block while
leaving table record storage with the table.

**Exit evidence:** Insert, update, removal, and compaction tests preserve identity and references;
partial updates have measurable upload bounds; no scene hierarchy or table type enters the core
storage contract.

#### Tranche 6.2 — GPU draw generation

Translate visibility and spatial-query results into capacity-bounded indirect-command slots grouped
by compatible pipeline and resource bindings. WebGPU binding constraints remain explicit rather
than being presented as a bindless renderer.

Tranche 6.2a is implemented by `GPUSceneDrawGeneration`. Active, optionally visible scene rows
claim explicit fixed-capacity indirect-command slots; the lowest scene row deterministically wins a
collision. The graph clears and publishes only instance count and first instance, preserving
renderer-authored geometry arguments. Required and published counts plus overflow distinguish
complete, colliding, and out-of-range results without CPU draw selection, hidden allocation,
submission, or readback. Tranche 6.2b is implemented by `GPUSceneResourceGroups`: immutable
renderer-owned group IDs and command windows preserve pipeline/binding order while generated draw
membership, empty groups, geometry mismatches, misplaced slots, unknown groups, and per-group
overflow remain GPU-resident and observable. Re-encoding after scene mutation reclassifies groups
without claiming bindless WebGPU behavior or hiding resource binding policy.

**Exit evidence:** A compiled graph updates counts and commands after parameter-only changes with
no CPU draw selection. Tests cover empty groups, stable ordering, capacity overflow, and geometry
or material group changes.

#### Tranche 6.3 — Cross-domain scene consumers

Prove that the storage contract serves both a conventional scene graph and a table-oriented
application. Both consumers use the same identity, visibility, picking, and indirect-draw path
while retaining their own update and presentation policies.

Tranche 6.3a is implemented by the live GPU Scene Graph Explorer. An application-owned hierarchy
is flattened through `makeGPUSceneFromCPUScene`; GPU bounds visibility, stable-row compaction,
source-indexed indirect draw generation, renderer-owned resource windows, visibility-aware
picking, and explicit mutation costs share one compiled command graph. The hierarchy stays on the
CPU, stable application IDs differ from physical scene slots, and group diagnostics never drive
CPU draw selection.

The preserved-batch table consumer follows as 6.3b. Phase 6 does not exit until that second
independent consumer uses the same public runtime contracts without casts, hidden packing, or
consumer-specific record fields.

**Exit evidence:** Two independent consumers share the public scene primitives without adapter
casts, hidden packing, or consumer-specific fields in `GPUScene`.

**Exit criteria:** Incremental updates preserve stable identity, visibility and spatial-query
results write draw commands without CPU draw selection, and both scene-graph and table-oriented
consumers use the same storage contract.

### Phase 7 — API graduation

**Entry dependencies:** Phases 1–6 have stable failure, ownership, extension, and package-boundary
contracts, and every candidate abstraction has at least two independent consumers.

Move the table-independent scheduling core to `@luma.gl/engine`, keep generic GPU table types and
graph adapters in `@luma.gl/tables`, and move optional algorithms and reusable workflows to
`@luma.gl/gpgpu`. Keep Arrow conversion and readback adapters in `@luma.gl/arrow`. Audit
`DrawCommandBuffer` and split its core from table integration if that is required to avoid an engine
dependency on tables. These APIs are new and experimental, so graduation is a direct move: update
repository consumers atomically and do not retain compatibility exports, duplicate public paths,
or a deprecation window.

#### Tranche 7.1 — Dependency audit and API freeze

Freeze ownership, naming, submission, lifetime, failure, capacity, and extension contracts only
after every graduation candidate has at least two consumers. Produce the target package graph and
identify every repository import that must move atomically with the implementation.

**Exit evidence:** The audit demonstrates an acyclic package graph, no Arrow leakage into tables or
gpgpu, no table dependency in the engine core, and an owner for every public resource and command
submission boundary.

#### Tranche 7.2 — Scheduling-core extraction

Move the table-independent command-graph core to `@luma.gl/engine`, limited to buffers, textures,
passes, generic graph views, scheduling, hazards, and allocation. Remove its experimental exports
in the same change so there is exactly one public owner.

**Exit evidence:** Engine builds without tables, gpgpu, or Arrow; all repository consumers import
the final engine owner; direct engine consumers need no table-shaped adapter; no compatibility
export preserves the former path.

#### Tranche 7.3 — Adapter and algorithm migration

Keep generic GPU data and graph adapters in `@luma.gl/tables`, move optional algorithms and reusable
workflow builders to `@luma.gl/gpgpu`, and retain Arrow conversion, upload, and readback helpers in
`@luma.gl/arrow`. Split `DrawCommandBuffer` integration if necessary to preserve that direction.

**Exit evidence:** Package-level tests and dependency checks enforce the intended arrows, public
examples import from their final owners, and no algorithm or adapter remains exported by both its
old and final packages.

#### Tranche 7.4 — Documentation and graduation

Publish stable reference pages, release notes, and removal criteria for the experimental surface.
Treat candidate names as provisional until this tranche exits. Because this is a new experimental
surface, describe final package ownership without promising compatibility aliases.

**Exit evidence:** All examples and tests use graduated entry points, links and API reports pass,
the former experimental entry points are absent, and experimental removal has an explicit release
boundary.

**Exit criteria:** The final package graph has no dependency cycle or Arrow leakage into tables or
gpgpu; each API has one public package owner and no compatibility export; public API documentation
names ownership and submission responsibilities; and all existing consumers build against the
graduated packages.
