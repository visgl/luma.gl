import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {LuvsBenchmark} from '@site/src/components/docs/luvs-benchmark';

# luVS: GPU Vector Similarity and Clustering

<ExperimentalDocsTabs active="luvs" />

## Overview

`@luma.gl/experimental/luvs` is a headless WebGPU computation backend for high-dimensional vector
similarity. Applications use its GPU-resident nearest neighbors, scores, selection counts, cluster
labels, and centroids for semantic selection, similar-item highlighting, color encoding, and other
visualization workflows.

luVS does not provide a graph visualization, graph-based approximate index, embedding explorer,
vector database, hosted inference, or renderer. Applications retain their existing visualization
stack and own command submission, output buffers, optional readback, and rendering.

## Concepts

### Why vector similarity belongs in a visualization pipeline

A chart can already filter records by numeric range, category, or visible region. Embeddings add
another useful relationship: records with nearby coordinates may represent similar documents,
images, products, or events. A selected record can therefore drive a linked selection of its
nearest neighbors, while cluster labels can provide a reusable visual grouping or color channel.

Transferring every embedding to the CPU for each interaction makes that relationship expensive and
breaks composition with GPU-resident filters. luVS contributes bounded compute passes to the same
`GPUCommandGraph` as the existing selection and rendering workflow. The result is ordinary GPU
data that later passes can consume; applications still decide what to draw and when to submit.

### Why embeddings are table columns rather than a second matrix owner

An embedding is one logical table value containing a fixed number of coordinates. It should stay
aligned with the same row as its stable identifier, category, validity, or other visualization
attributes. The canonical `fixed-size-list<float32,768>` GPU format expresses that row shape
without inventing an unsupported `float32x768` vertex format.

```text
Arrow FixedSizeList<Float32>[768]
    -> GPUVector<'fixed-size-list<float32,768>'>
    -> GPURecordBatch / GPUTable column
    -> borrowed GraphEmbeddingMatrix view
    -> exact search, clustering, or IVF-flat graph passes
```

`GPUData` owns or borrows one underlying buffer, `GPUVector` preserves its ordered chunks, and
`GPUTable` preserves source batches and column ownership. `GraphEmbeddingMatrix` is only a
non-owning, graph-specific description of those existing rows; it neither uploads values nor adds
another lifetime to destroy. This keeps Apache Arrow in `@luma.gl/arrow`, generic storage in
`@luma.gl/tables`, and similarity algorithms in the optional experimental subpath.

### Stable identifiers, logical rows, and validity serve different purposes

A logical row position locates an embedding inside the original ordered batches. A stable source
identifier names the application record and can be sparse, reordered, or unrelated to that
position. A validity flag decides whether the row participates. Treating these three values as
interchangeable would break linked filtering, picking, chunk preservation, or prebuilt indexes.

For example, the second physical row may hold application ID `90`; search returns `90`, but still
uses row position `1` to read its coordinates and the corresponding source-aligned filter flag.
`GPURecordBatch.sourceInfo` supplies contiguous source positions when explicit IDs are unnecessary.
Arbitrary stable IDs and GPU-resident validity remain ordinary caller-selected Uint32 sibling
columns. Parent or coordinate nulls require an explicit uploaded validity sibling, while null
stable IDs are rejected because replacing them with zero would silently change record identity.

### Exact search trades a complete scan for a guaranteed answer

`GPUSimilaritySearch` compares each eligible dataset row with every query and retains the best `k`
results. For `Q` queries, `N` rows, and `D` coordinates, the distance work is `O(Q * N * D)`.
The implementation processes preserved chunks and bounded storage-binding tiles; it never
allocates a `Q * N` distance matrix. Persistent caller-owned output contains at most `Q * k` IDs
and scores, with deterministic source-ID tie breaking.

This is the right baseline when the dataset is modest, the selected population is small, the
vectors change frequently, or correctness requires the true nearest neighbors. Filters do not
turn a full scan into an index: they exclude rows from ranking but do not remove the need to
inspect the relevant source flags. Stable-ID allowlists larger than 16 entries use a bounded GPU
hash index to avoid linearly rescanning the complete allowlist for every candidate.

### Why deterministic k-means precedes an inverted index

K-means partitions similar rows into `clusterCount` groups. `GPUKMeans` first chooses valid source
rows near evenly spaced positions, then repeats two Lloyd steps: assign each finite row to the
closest squared-Euclidean centroid and recompute every centroid from its assigned rows. Cluster
labels can be visualized directly, and the same partition forms the lists used by IVF-flat.

Standard WebGPU does not provide portable Float32 atomic addition. Rather than hiding unsupported
atomics or accepting order-dependent compare-and-swap sums, one invocation per centroid
coordinate accumulates assigned rows in their preserved source order. This makes the centroid
update reproducible while exposing a real throughput tradeoff: deterministic segmented reduction
can be slower than device-specific atomic implementations.

The graph statically records at most `maxIterations`; after convergence, its assignment and
centroid-reduction shaders return early, although already-declared bookkeeping and dispatch
overhead remain. GPU-resident status publishes the executed iteration count, changed-label count,
and convergence flag without a mandatory CPU round trip. Empty clusters keep their previous
centroids, and invalid rows receive the reserved `0xffffffff` label.

### What an IVF-flat index actually stores

IVF means **inverted file**: each centroid owns a contiguous list of the rows assigned to it.
Flat means the original vectors remain uncompressed and candidate scores are computed against
their original Float32 coordinates. There are no approximate-neighbor graph edges, product
quantization codes, or copied embedding buffers.

Consider five rows with stable IDs `[42, 90, 17, 80, 52]` and three centroid assignments:

```text
logical row:     [ 0,  1,  2,  3,  4]
stable ID:       [42, 90, 17, 80, 52]
labels:          [ 1,  0,  1,  2,  0]

listCounts:      [ 2,  2,  1]
listOffsets:     [ 0,  2,  4,  5]
listSourceIds:   [90, 52, 42, 17, 80]
listRowIndices:  [ 1,  4,  0,  2,  3]
```

List `1` occupies the half-open range `[listOffsets[1], listOffsets[2])`, so its entries are
stable IDs `42` and `17` at logical rows `0` and `2`. `listSourceIds` cannot replace
`listRowIndices`: the former is the application-facing answer, while the latter locates the
unchanged embedding and filter row. Within each list, logical rows stay sorted so binary searches
can restrict preserved source tiles to actual indexed members.

The approximate persistent index size is
`4 * (listCount * dimensions + 3 * rowCount + 2 * listCount + 1)` bytes for Float32 centroids,
Uint32 labels, counts, offsets, stable IDs, and logical row references. This excludes source
embeddings, optional status, and graph-owned scratch. Every persistent packed index allocation
must fit the device's maximum storage-buffer binding size; oversized indexes fail explicitly.

### Probes exchange recall for bounded candidate work

For each query, IVF-flat first scores the centroids and chooses `probeCount` lists. It then reads
only those indexed row ranges, applies validity and linked-selection masks, and exactly scores
the surviving original vectors. For reasonably balanced lists, probing `P` of `C` centroids
visits roughly `P * N / C` candidates rather than all `N` rows. Real list populations may be
uneven, so applications should inspect candidate counts instead of assuming that estimate.

When `probeCount < listCount`, the result is approximate: an unprobed list may contain a closer
neighbor even when the selected lists already contain `k` valid results. Increasing probes
improves recall while increasing candidate work; probing every list restores complete coverage.
`recall@K` compares the returned stable IDs against exact search on the same dataset and filter.

The default `fallback: 'expand'` visits all lists only when the probed lists produce fewer than
`k` eligible candidates. It prevents a restrictive filter from returning unnecessarily short
results, but it does not guarantee exactness when the original probes already contain `k`
matches. `fallback: 'none'` retains the strict probe bound and can return fewer results.

### Choosing the appropriate operation

| Requirement | Operation | Main tradeoff |
| --- | --- | --- |
| True nearest neighbors for every query | `GPUSimilaritySearch` | Scans all eligible source rows; no index build. |
| Stable visual grouping or reusable centroid labels | `GPUKMeans` | Bounded training cost and deterministic Float32 reductions. |
| Repeated queries over a largely unchanged dataset | `GPUIVFFlatIndex` | Pays a build and index-storage cost to reduce per-query candidates. |
| Guaranteed complete IVF coverage | IVF-flat with `probeCount: listCount` | Examines every inverted list; little search-work advantage over exact search. |
| Strictly bounded approximate interaction | IVF-flat with fewer probes and `fallback: 'none'` | Faster candidate selection can lower recall and result counts. |

An index is useful only when enough repeated searches amortize its k-means training, list
construction, and additional storage. Changing embedding rows or their assignments requires an
explicit rebuild; `updatePolicy` is `'rebuild'`. Changing only queries or a source-aligned
selection mask can reuse the existing index and a compatible compiled search-only command graph.

Exact search also supports stable-ID `candidateIds`, query-specific `queryFilterMask`, and
`excludeSelf`; the current IVF-flat search deliberately supports only a source-aligned
`filterMask`, probe selection, and its configured fallback. Applications that require the
additional exact-only constraints should keep the exact path or encode equivalent source-aligned
selection flags explicitly before using IVF-flat.

### Lifecycle, ownership, and current limits

Applications own the source table, stable-ID and validity columns, result buffers, and persistent
IVF index buffers. A `GPUCommandGraph` borrows those imports and owns only its declared transient
scratch and node-created pipelines or computations after compilation. Contributors add passes;
they never compile the graph, submit work, read results back, resize caller storage, or destroy
borrowed allocations.

Build and search can share one graph, but every encoding of that graph reruns all declared build
passes and retrains the index. To amortize training, submit and complete a dedicated build graph,
then reimport the source embedding table and every persistent caller-owned index buffer into a
separate search-only graph. Graph views belong to the graph that imported them, even when both
graphs borrow the same physical buffers. Repeated encodings of the search graph can then change
queries or selection flags without rebuilding. Source data, indexes, and render consumers must
share the same WebGPU device. Query output and embedding chunks are tiled to active device limits,
while persistent packed IVF arrays and the bounded query-by-list probe flags must each fit a
storage binding.

The current scope is Float32 fixed-size embeddings, Uint32 row identities, squared-Euclidean
k-means, exact or IVF-flat search, full index rebuilds, and explicit selection masks. Native
Float64 arithmetic, incremental index updates, distributed search, hierarchical graph indexes,
product quantization, and direct WebGL interoperation are not provided.

### Device loss invalidates compiled graphs and indexes

All WebGPU buffers and compiled graph state belong to the device that created them. Monitor
`device.lost` and stop encoding or submitting work when that promise resolves; a lost device
cannot safely resume an existing graph, and an index created on it cannot be transferred to a
replacement device.

To recover, destroy the compiled graph's owned resources, dispose caller-owned tables and index
buffers according to their existing ownership rules, and create a new device. Re-upload the
original Arrow or application data, reconstruct the table and borrowed graph views, allocate new
outputs, and rebuild any IVF-flat index before accepting another query. This explicit boundary is
particularly important for resource-constrained software adapters used by browser test runners.

## Attribution

luVS is inspired by [NVIDIA RAPIDS cuVS](https://github.com/NVIDIA/cuvs), which is distributed under
the [Apache License 2.0](https://github.com/NVIDIA/cuvs/blob/main/LICENSE).

luVS is an independently implemented, MIT-licensed luma.gl WebGPU module. No cuVS source code, CUDA
kernels, or FAISS implementations are copied into this module. It is not affiliated with or endorsed
by NVIDIA or the RAPIDS project, and it neither implements a compatible cuVS API nor claims feature
parity.

## Live CPU versus WebGPU benchmark

Run the benchmark explicitly to compare the same deterministic vectors on your browser's CPU and
WebGPU adapter. Dataset size, dimensions, query count, K, selection density, IVF list count, and
probe count are configurable. The exact GPU paths are checked against an independent CPU oracle;
the approximate IVF-flat path reports recall@K against exact search.

<LuvsBenchmark />

GPU query measurements include command encoding, submission, and an explicit completion fence.
Initial upload, IVF training/index construction, and correctness readback are reported separately.
Warmups precede repeated measured runs, and displayed query times are medians. Results depend on
the current browser, WebGPU adapter, data dimensions, filtering, thermal conditions, and workload.

## Fixed-size GPU table embedding columns

High-dimensional values such as 384-, 768-, or 1,536-component embeddings are not GPU vertex
formats: a format such as `float32x768` does not exist. They are ordinary row-aligned GPU table
columns whose canonical memory format describes a fixed number of scalar elements:

```ts
import {GPUData, GPUVector, type FixedSizeList} from '@luma.gl/tables';

const embeddingChunk = new GPUData({
  buffer: embeddingBuffer,
  format: 'fixed-size-list<float32,768>',
  length: firstBatchRowCount,
  ownsBuffer: false
});

const embeddingColumn = new GPUVector<FixedSizeList<'float32', 768>>({
  type: 'data',
  name: 'embedding',
  format: 'fixed-size-list<float32,768>',
  data: [embeddingChunk]
});

embeddingColumn.length; // Number of logical table rows.
embeddingColumn.valueLength; // Number of flattened Float32 coordinates.
```

The embedding width is encoded in the format and remains available when a column is detached from
its table. `GPUData.byteStride` may exceed `rowByteLength` for padded rows; `byteOffset` identifies
the first logical row in its allocation. `GPUTable` and `GPURecordBatch` preserve batch boundaries,
source-row provenance, and ownership. Stable source IDs and optional GPU validity are separate,
ordinary row-aligned Uint32 columns. luVS borrows those table resources; it does not introduce a
second owning matrix abstraction or silently concatenate, repack, or copy source batches.
Its graph bindings align packed buffer offsets internally; ordinary generic WebGPU table bindings
still require storage offsets aligned to the active device limit.

Storage bindings are bounded by the active WebGPU device. At a 128 MiB binding limit, one packed
binding holds about 87,381 rows at 384 dimensions, 43,690 rows at 768 dimensions, or 21,845 rows
at 1,536 dimensions. luVS processes original chunks in bounded tiles and merges their candidates
into one deterministic global top-K without materializing a complete query-by-dataset score matrix.

## Ingest Apache Arrow embedding columns

Apache Arrow conversion belongs to `@luma.gl/arrow`, not the generic table runtime or experimental
similarity package:

```ts
import {makeGPUTableFromArrowTable} from '@luma.gl/arrow';

const datasetTable = makeGPUTableFromArrowTable(device, embeddingTable, {
  shaderLayout: {
    attributes: [],
    bindings: [
      {name: 'embedding', type: 'read-only-storage', group: 0, location: 0},
      {name: 'sourceIds', type: 'read-only-storage', group: 0, location: 1}
    ]
  },
  validityColumns: {embedding: 'embeddingValidity'}
});
```

An Arrow `FixedSizeList<Float32>` field wider than four scalar elements maps directly to
`GPUVector<'fixed-size-list<float32,768>'>`. Existing short geometry fields preserve their
`float32x2`, `float32x3`, and `float32x4` vertex formats. Parent-list offsets, child offsets,
sliced arrays, nullable parent rows, nullable child coordinates, omitted trailing-null child
values, record-batch identity, and empty source chunks remain represented by the ordinary table.

`validityColumns` explicitly requests a table-owned Uint32 sibling with one source-aligned flag
per embedding row. Supply a normal, non-null `sourceIds` Arrow column whenever IDs are not the
contiguous row positions recorded in `GPURecordBatch.sourceInfo`. Null source identifiers are
rejected instead of being silently interpreted as zero. In particular, Arrow `Vector.slice()` can
discard preceding chunks and their original provenance; explicit source-ID columns preserve global
identity across those boundaries.

If an embedding column contains null parent rows or null child coordinates, select its explicit
GPU validity sibling when importing it into luVS. Nullable embedding data without a selected
validity column is rejected instead of admitting zero-filled null rows as candidate vectors.

```ts
import {makeGPUVectorFromArrow} from '@luma.gl/arrow';

const embeddingVector = makeGPUVectorFromArrow(device, arrowEmbeddingColumn, {
  name: 'embedding',
  format: 'fixed-size-list<float32,768>'
});
```

The explicit format also preserves the precise `GPUVector<FixedSizeList<'float32', 768>>`
TypeScript result when importing a vector directly. The adapter preserves Arrow data chunks and
logical row counts. Existing GPU allocations can also be wrapped in ordinary borrowed `GPUData`
and assembled into a `GPURecordBatch`;
`GPUTable.destroy()` follows the existing per-chunk ownership contract.

## Encode an exact nearest-neighbor search

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPUSimilaritySearch,
  importGPUEmbeddingTable
} from '@luma.gl/experimental/luvs';

const graph = new GPUCommandGraph(device, {id: 'semantic-selection'});
const dataset = importGPUEmbeddingTable(graph, datasetTable, {
  id: 'dataset',
  column: 'embedding',
  sourceRowIds: 'sourceIds',
  validity: 'embeddingValidity'
});
const queries = importGPUEmbeddingTable(graph, queryTable, {
  id: 'queries',
  column: 'embedding'
});

new GPUSimilaritySearch({
  id: 'nearest-embeddings',
  dataset,
  queries,
  outputIds: resultSourceIds,
  outputScores: resultScores,
  resultCounts,
  candidateCounts,
  k: 10,
  metric: 'cosine'
}).addToGraph(graph);

const compiled = graph.compile();
const encoder = device.createCommandEncoder({id: 'nearest-embeddings'});
compiled.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());
```

`outputIds` and `outputScores` are caller-owned packed views with `queryCount * k` slots in
query-major order. `resultCounts` and optional `candidateCounts` contain one Uint32 value per
query. The graph imports and borrows every source allocation; it does not submit work, read data
back, or destroy caller-owned tables or buffers. `importGPUEmbeddingVector()` accepts an existing
fixed-size-list vector directly when a complete table is unnecessary.

The optional `dimensions` import option can select meaningful leading coordinates when an Arrow
fixed-size-list row intentionally contains trailing padding. Configure the companion mask with
`validityColumns: {embedding: {name: 'embeddingValidity', dimensions: 768}}` to ignore null padding
while still rejecting null parent rows or null meaningful coordinates.
For one-to-four-element Arrow rows, also select `fixedSizeListColumns: ['embedding']` so the
ordinary table adapter preserves fixed-size-list storage semantics instead of its default
vertex-compatible format.

Supported metrics are:

| Metric | Ranking | Meaning |
| --- | --- | --- |
| `'squared-euclidean'` | Smaller scores first | Squared Euclidean distance; no square root is required. |
| `'cosine'` | Larger scores first | Cosine similarity computed from the dot product and vector norms. |
| `'inner-product'` | Larger scores first | Maximum raw vector inner product. |

Equal scores are ordered by stable source-row ID, and duplicate vector rows remain independently
eligible. Two zero vectors have cosine similarity `1`; one zero vector paired with a nonzero vector
has cosine similarity `0`. Candidates containing `NaN` or infinity are excluded; a nonfinite query
produces no matches. Finite embedding values whose Float32 distance or inner product overflows remain
eligible and are ranked with their positive or negative infinity score; indeterminate `NaN` scores
are excluded. `k: 0` writes zero result counts, an empty query batch records no search work, and an
empty dataset or short eligible population leaves unfilled IDs at `0xffffffff`. Unfilled scores are
positive infinity for squared distance and negative infinity for similarity metrics.
The sentinel `0xffffffff` is reserved and cannot be used as an explicit source-row identifier.
`excludeSelf: true` omits candidates whose stable source-row ID equals the corresponding query ID.
An optional `tileSize` bounds candidate work without changing exact global result order.

## Reuse GPU-resident linked selections

Pass a source-aligned Uint32 view or chunk-preserving vector of selection flags directly into the
search. Zero rejects the row; nonzero accepts it. Existing LuxFilter masks already use this layout:

```ts
import {LuxFilterSelection} from '@luma.gl/experimental/luxfilter';
import {GPUSimilaritySearch} from '@luma.gl/experimental/luvs';

const selection = new LuxFilterSelection(graph, {
  id: 'visible-category',
  kind: 'range',
  input: categoryValues
});

selection.addToGraph(graph);

new GPUSimilaritySearch({
  dataset,
  queries,
  outputIds,
  outputScores,
  resultCounts,
  candidateCounts,
  k: 10,
  filterMask: selection.mask
}).addToGraph(graph);
```

Update `selection.setRange([minimum, maximum])` and encode the previously compiled graph again.
The current selection and embedding candidates remain on the GPU. Optional `candidateIds` restrict
search to stable source identifiers. Allowlists with more than 16 entries use a bounded GPU hash
index; smaller lists use direct membership checks. Oversized allowlists are rejected, so use a
source-aligned filter mask when the requested identifiers exceed bounded index capacity. Optional
`queryFilterMask` supplies query-specific source-aligned flags. Candidate counts distinguish no
eligible rows from a valid but short nearest-neighbor list.

## Generate GPU k-means clusters

`GPUKMeans` assigns source rows to reusable centroids without float32 atomics. Its deterministic,
bounded segmented reductions produce caller-owned cluster labels and centroid buffers suitable for
cluster-based coloring or IVF training:

```ts
import {GPUKMeans} from '@luma.gl/experimental/luvs';

new GPUKMeans({
  dataset,
  clusterCount: 16,
  centroids,
  labels,
  counts,
  status,
  maxIterations: 12,
  seed: 'evenly-spaced'
}).addToGraph(graph);
```

`centroids` contains `clusterCount * dimensions` Float32 values, `labels` preserves dataset rows or
chunks, and `counts` contains one Uint32 population per cluster. Optional `status` exposes
`[executedIterations, changedLabels, converged]` on the GPU. Empty clusters retain their preceding
centroids; invalid source rows do not receive an eligible cluster assignment.

## Build and query an IVF-flat index

`GPUIVFFlatIndex` trains ordinary flat k-means centroids, counts list memberships, prefix-scans
list offsets, and publishes parallel packed source IDs and dataset-row references. Searches
traverse the selected inverted lists directly instead of scanning unrelated dataset rows. The
index does not build or traverse an approximate neighbor graph:

```ts
import {GPUIVFFlatIndex} from '@luma.gl/experimental/luvs';

const index = new GPUIVFFlatIndex({
  dataset,
  listCount: 32,
  centroids,
  labels,
  listCounts,
  listOffsets,
  listSourceIds,
  listRowIndices,
  maxIterations: 12
});

index.addToGraph(graph);

index.addSearchToGraph(graph, {
  queries,
  outputIds,
  outputScores,
  resultCounts,
  candidateCounts,
  k: 10,
  metric: 'squared-euclidean',
  probeCount: 4,
  filterMask: currentSelection,
  fallback: 'expand'
});
```

`listSourceIds` and `listRowIndices` each contain up to `dataset.rowCount` Uint32 entries in
matching list order. A source ID is the stable application-facing identifier returned by search;
its parallel row index locates the original chunk-preserving embedding and source-aligned filter
flag. For each probed list, the search visits only entries between `listOffsets[list]` and
`listOffsets[list + 1]`; candidate work therefore follows actual list membership rather than
performing a full dataset eligibility scan.

When `probeCount` is smaller than `listCount`, results are **approximate** because unprobed lists
may contain closer rows. Candidate distances inside the probed lists are reranked exactly against
the original Float32 embeddings; recall@K should be measured against exact search. The default
`'expand'` fallback considers all lists when restrictive filters leave fewer than K eligible
candidates. Select `'none'` to keep probing bounded and accept fewer results.

Index construction, command encoding, submission, reuse, and disposal remain explicit. To schedule
training separately from reusable searches, import the same caller-owned physical index buffers
into a second command graph, construct a second `GPUIVFFlatIndex` descriptor around those views,
and call `addSearchToGraph()` only after submitting the original build. List storage and embedding
buffers stay on one WebGPU device; luVS does not claim distributed processing or cross-API
zero-copy sharing with a WebGL-based renderer.

## Integrate GPU results with rendering

Use stable result IDs as an input to selection compaction, highlighting, shader-side color lookup,
or a deck.gl-compatible WebGPU visualization workflow. Bind the existing GPU buffers directly
when both compute and rendering use the same WebGPU device; read back only when application UI
needs concrete CPU values.

WebGPU buffers cannot be handed directly to a renderer that owns an unrelated WebGL context.
Interoperation with WebGL-based applications such as a WebGL cosmos.gl renderer requires an
explicit supported transfer or readback boundary; luVS does not claim WebGPU-to-WebGL zero-copy.

See [LuxFilter](/docs/api-reference/experimental/luxfilter),
[GPU command graphs](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph), and
[Apache Arrow GPU conversion](/docs/api-reference/arrow/arrow-conversion) for the related
filtering, execution, and ingestion contracts.
