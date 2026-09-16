# Batch semantics and coverage

A `GPUVector` is an ordered logical array backed by `GPUData[]`. Chunk boundaries describe
storage, not independent problems. A global reduction produces one global result, and a scan
carries state across chunks. Empty chunks contain no rows and remain in the caller's topology.

`GPUVectorLike` and `GPUVectorInput` remain the binding foundation. `GPUProgramVector` declares a
symbolic resource; binding it does not concatenate or upload its chunks. Changing formats, lengths,
or partitions requires recompilation. Imported contents may change between encodings.

## Row order and physical storage

Logical row `i` is found by summing preceding chunk lengths. Corresponding operands must agree on
logical length where the table below requires it. They need not share physical boundaries unless
explicitly required. MADD preserves logical row order and cardinality while allowing the caller to
choose a different destination partition.

Alignment intersects boundaries and borrows subviews with each column's original format, buffer,
byte offset, byte stride, and row width. It does not create packed storage. Whole-chunk views retain
their identity; equal slices of the same source view reuse one view. Distinct source views are not
silently merged. Output buffers belong to the caller; reduction partials and scan carries are
explicit graph-owned scratch.

## Reference contracts

| Family | Work and result shape | Partitions and layout | Empty input / reset |
| --- | --- | --- | --- |
| MADD (`GPUProgramVectorMADD`) | Row-wise, same logical length and order | Equal lengths; independent input/addend/output boundaries; packed `float32` | No writes for zero rows; each encoding overwrites its destination |
| Dot (`GPUProgramDotProduct`) | Global aggregate, one scalar | Equal lengths; independent boundaries; packed `float32` | Zero; first partial overwrites, subsequent partials accumulate on every encoding |
| `GPUScan` | Stateful prefix, same logical row order | Packed `uint32`; input and segment flags cover the scanned rows, scalar destinations may provide extra capacity, and all may use independent chunk boundaries | No writes for zero rows; carry is rebuilt per encoding |
| `GPUScanUint64` | Inclusive modulo-2^64 prefix over split low/high words | Four packed `uint32` operands may use independent atomic/vector boundaries; inputs have equal lengths and outputs cover them | No writes for zero rows; spare capacity is untouched; carry is rebuilt per encoding |
| `GPUMask` | Row-wise boolean composition, canonical zero/one output | Packed `uint32`; inputs and output require equal logical lengths and may use independent atomic/vector boundaries | No writes for zero rows; output is overwritten for every encoded row |
| `GPUReduction` | Global aggregate; one row, two for extent | Packed `uint32`, `sint32`, or `float32`; optional packed `uint32` mask has equal logical length and independent boundaries | Zero for empty or fully excluded input; every encoding replaces output |
| `GPUHistogram` | Global aggregate into caller-sized bins | Scalar input may be strided; optional packed `uint32` mask has equal length and independent boundaries; automatic domain requires packed input | Clears bins every encoding, including empty input |
| `GPUGroupAggregation` | Global aggregate into caller-sized dense groups | `uint32` keys/masks and `float32` values can be strided and independently partitioned; participating columns have equal logical length | Counts/sums zero; min/max/mean NaN for groups with no accepted finite values; initializes every encoding |
| `GPUCompaction` | Stable selection into a caller-sized destination and one accepted-row count | Packed `uint32` input and flags have equal logical length and may use independent atomic/vector boundaries; output may use any atomic/vector capacity topology | Count is cleared for zero rows; selected values preserve logical order and overwrite the accepted prefix |
| `GPUVisibilityWorkflow` | Predicate intersection, stable source IDs, compacted output, and count | Predicate masks, optional output mask, and source IDs require equal logical length and may use independent atomic/vector boundaries; output may use any capacity topology | Empty source publishes zero count; generated IDs preserve logical row order |
| `GPUFlagOffsets` | Exclusive binary-flag offsets and one global count | Packed `uint32`; independent atomic/vector partitions; destination capacity must cover flags | Empty input clears count; extra destination capacity is untouched; every encoding replaces the active prefix |
| `GPUSegmentOffsets` | Exclusive start-flag prefixes, global list offsets, and segment count | Packed `uint32`; slot views cover element flags with independent partitions; list offsets remain one atomic destination | Empty input clears count and terminal offset; every encoding rebuilds the valid offset prefix |
| `GPUGather`, `GPUUint32Gather` | Global indexed row selection; one output row per index, in index order | Independent atomic/vector partitions; packed fixed-width word-aligned rows and uint32 indices; output capacity covers indices | Empty indices leave output untouched; empty source fills invalid rows; each encoding rewrites the active prefix and preserves spare capacity |
| `GPUByteRangeGather` | Byte ranges addressed in global source/output byte order | Five packed `uint32` operands may have independent atomic/vector partitions; metadata lengths match; output ranges are sorted and nonoverlapping | Empty metadata or zero capacity writes nothing; empty source fills zero; each encoding clears gaps, invalid bytes, and final-word padding; spare words are untouched |
| `GPUTranspose` | One global row-major matrix becomes its transposed row-major matrix | Packed `uint32`, `sint32`, or `float32`; independent input/output partitions may split rows and tiles; both capacities cover the matrix | Zero rows or columns write nothing; spare capacity is untouched; every encoding overwrites the transposed matrix and preserves raw value bits |
| `GPUElementwise` | Copy, add, subtract, multiply, multiply-add, min, or max at each logical row | Equal lengths and packed `uint32`, `sint32`, or `float32`; all input/output boundaries may differ | Empty input writes nothing; each encoding overwrites all output rows |
| `GPUFiniteDifference2D`, `GPUFiniteDifference3D` | Gradient, divergence, curl, or Laplacian of one global field | Independent input/output boundaries may split rows or planes; scalar or vector `float32` formats depend on the operator | Dimensions remain at least four; spare capacity is untouched; every encoding refreshes stencil samples and output |
| `GPUSegmentedLayout` | Physical-value and logical-element offsets, inclusive segment indices, list offsets, and three counts | Six packed `uint32` slot views may use independent atomic/vector partitions; all cover the value-flag domain; list offsets and counts remain atomic | Empty input clears counts and the first list offset; nonempty input has one implicit first segment; extra slot-output capacity is untouched |

For the three aggregation families, an atomic view and vector may be mixed. An input of length
zero is different from an output of length zero: histogram and dense group output still require
at least one bin/group. Reductions require the exact result shape. Histogram automatic domains
include the original input population, independent of its selection mask.

Integer additions follow the operation's 32-bit wrapping rules. Floating reductions and atomic
statistics may change rounding with partition or execution order; compare numerically with a
suitable tolerance rather than requiring bitwise partition invariance. Existing non-finite filtering
and signed-zero rules remain those documented by each operation.

### Aliasing, capacity, and predicates

MADD supports exact in-place input/addend aliases, retaining view identity and reading aliased
operands through the single writable binding. Partial writable overlap is not an in-place contract;
graph binding validation rejects overlapping writable bindings. Do not use shifted or reordered
aliases across chunks. Aggregations require output storage separate from their inputs and masks.
Scan segment flags must not share destination buffers. These rules are independent of capacity:
adequate destination capacity does not make an alias valid.

A false GPU conditional skips its body, including aggregate initialization, and preserves prior
output contents. Repeating an enabled encoding resets aggregate results and scan carry. Repeating
an in-place MADD intentionally reads the previous result as its new input.

### Metadata boundary

Operation trees and lowering decisions remain the existing inspection interfaces. This tranche
adds no parallel batch wrapper classes or unconsumed scheduling flags. Shape/layout checks and
alignment in the concrete lowerers enforce these contracts. Repartitioning and cardinality expansion
are separate properties to specify when global sort, joins, and scatter are audited.

## Conformance evidence

`gpu-batch-conformance.spec.ts` shares partition fixtures for atomic input, one chunk, uneven
chunks, leading/interior/trailing empty chunks, and differing operand boundaries. It checks the
reference families, repeated encoding, empty aggregation, heterogeneous formats, nonzero byte
offsets, and strided histogram/group inputs. Scan cases exercise carry across boundaries and
segment heads inside and at chunk boundaries. Node tests verify zero-copy alignment and reject
unsupported lengths/layouts/topologies. `gpu-program-vectors.*.spec.ts` covers GPU conditional
execution, exact MADD aliases, and rejection of overlapping writable views.

`gpu-offset-batching.*.spec.ts` checks independent offset partitions, mixed atomic/vector views,
nonzero byte offsets, empty chunks, extra capacity, and repeated encodings with changed flags.
The prefix helper borrows storage and retains complete chunk identities.
`gpu-segmented-layout-batching.*.spec.ts` covers independent partitions, segments spanning chunks,
empty chunks, multi-workgroup scans, unused capacity, and changed flags across repeated encodings
on WebGPU CORE. Chunked list-offset destinations remain follow-up work.

`gpu-gather-batching.*.spec.ts` checks global indexing across independently partitioned sources,
indices, and destinations on WebGPU CORE. Coverage includes raw float bit preservation, fixed-size
lists, custom uint32 invalid values, empty sources/indices, nonzero offsets, spare capacity, and
changed inputs across repeated encodings. Lowering allocates no scratch or packed storage. Its
index traversal cost scales with source chunk count; routing optimization remains follow-up work.

`gpu-uint64-scan-batching.*.spec.ts` compares split-word prefixes with a BigInt reference on
WebGPU CORE, including low-word overflow at chunk boundaries, full 64-bit wrap, empty chunks,
multiple workgroups, nonzero offsets, spare capacity, and changed inputs across repeated encodings.
Adjusted high-word scratch follows the high input's chunks. Low output buffers must be separate
from both inputs and the high output. The high output may reuse high input storage because carry
classification finishes before the high scan. Output chunks must not overlap.

`gpu-byte-range-gather-batching.*.spec.ts` checks independently partitioned source words, three
range metadata columns, and output words on WebGPU CORE. It covers ranges crossing source chunks,
metadata spans sharing output words, empty ranges/chunks, partial words, gaps, invalid source
addresses, capacity truncation, repeated encodings, and zero-copy lowering. The implementation
uses no scratch storage; dispatch count grows with the product of source chunks, aligned metadata
spans, and output chunks. More efficient routing for fragmented data remains follow-up work.

`gpu-transpose-batching.*.spec.ts` checks independent partitions, row/tile boundary splits, empty
chunks, rectangular matrices, spare capacity, changed inputs, and exact 32-bit preservation for all
three formats on WebGPU CORE. Node tests verify allocation-free lowering, alias/ownership checks,
and restriction to shared tiles. Each source/destination pair uses a bounded region of the existing
padded tile kernel; pairs with no shared elements emit no commands. Planning still considers the
product of input and output chunks, and fragmented boundaries may repeat tile workgroups.

`gpu-elementwise-batching.spec.ts` checks all seven operators and all three scalar formats,
independent input/B/C/output boundaries, empty chunks, offsets, integer wrapping, and updated
inputs across repeated encodings. Lowering intersects boundaries without allocating buffers.

`gpu-finite-difference-batching.spec.ts` checks all four operators in 2D and 3D, both boundary
policies, independent partitions, offsets, spare capacity, scratch reuse, and updated inputs.
Results are compared with the atomic kernel using floating-point tolerance; analytic tests also
cover polynomial fields. A single source chunk needs no scratch. Multiple source chunks gather
the existing stencil's samples into one reusable buffer for at most 4096 output rows, reduced
further to fit device limits. The stencil expressions retain their arithmetic order; this is
algorithm scratch, not concatenation of caller inputs. Gather dispatch count scales with source
chunks times output blocks; halo routing and unnecessary sample removal remain performance work.
`gpu-numeric-batching.node.spec.ts` verifies allocation bounds, alias/layout/ownership validation,
and fields whose total byte size exceeds a single binding while individual chunks fit.

Elementwise and finite-difference destinations must use separate buffers from their inputs, and
output chunks must not overlap. Finite-difference vector offsets must align with the stored WGSL
array element (8 bytes for `float32x2`, 16 for `float32x4`).

`gpu-transform-batching.*.spec.ts` covers FFT1D and convolution with independent partitions,
empty chunks, offsets, spare capacity, and changed inputs across repeated encodings. FFT tests
split transforms across chunks, cross reusable scratch-block boundaries, and exercise portable
and subgroup-capable devices. Bit reversal borrows source spans into at most two bounded scratch
buffers; final butterflies write directly to output chunks. Atomic FFT bindings that exceed the
device limit use the same span routing.

Convolution tests compare direct, FFT, and automatic strategies with CPU results for zero and
wrap boundaries, including kernels larger than the field. Direct execution uses no scratch;
spectral packing writes into the existing nine padded complex fields and crops to caller chunks.
Direct accumulation order can change with partitioning. Each active convolution chunk must fit a
binding, and spectral scratch still requires one binding per padded field. Neither operation
concatenates caller storage. Node tests check limit-aware support, allocation bounds, aliases,
overlapping output, and ownership of empty chunks. Fragmented routing and dispatch overhead remain
performance work.

`gpu-dense-batching.*.spec.ts` audits `GPUMatVec` and `GPUMatMul` with independent partitions,
splits inside rows and tiles, empty chunks, offsets, spare capacity, and updated operands across
repeated encodings. Both borrow caller buffers without scratch allocation. MatVec retains its
workgroup reduction and MatMul its shared-memory tiles; chunk pairs accumulate into each output
chunk. Zero inner dimensions write zero each time. Different partitions can change floating-point
summation order. Node tests cover bounded dispatch, binding limits, ownership, aliases, and
overlapping outputs. Both classes and their props are exported from `@luma.gl/gpgpu/gpu-core`.
Chunk-pair selection and fragmented tile work remain performance debt.

`gpu-hash-batching.*.spec.ts` covers index construction, lookup, and stable joins with independent
keys/value/diagnostic/output boundaries, empty chunks, offsets, generated global IDs, earliest-row
duplicate selection, empty and truncated publication, global scan carry, and repeated rebuilds.
Caller storage stays borrowed; join scratch follows key chunks. Hash tables remain single bounded
bindings. `GPUBatchHashIndex` retains its specialized matching-topology validity and per-chunk ID
bases; `GPUBatchHashJoin` retains separate publication domains and diagnostics for each batch.

`gpu-spatial-batching.*.spec.ts` covers grid binning, all four weighted grid statistics, and 2D/3D
bounds/radius point filtering. Inputs, cell outputs, masks, and global candidate IDs use independent
partitions, including empty chunks and nonzero offsets. Tests compare CPU results across repeated
encodings, mutable bounds/queries, candidate truncation, and bounded 3D dispatch. Grid accumulation
revisits input spans per output chunk; indexed filtering revisits candidate chunks per aligned
source span. Binning and filtering allocate no scratch; mean counts follow cell-output chunks.
The source vectors are never concatenated. Fragmented routing remains performance debt.

## Remaining work, grouped for review

The reference families above are audited for the stated contract. `GPUSort` remains a
single-view API; unifying global order with batch sort is follow-up work. Program CSR SpMV lowering
still requires one physical chunk per operand because its column indices address a global vector.
Neither limitation permits implicit packing. The former inventory listed 38 classes after the
transpose work, mixing missing support with partial support and operations that do not themselves
process arrays. It was an audit queue, not 38 required implementation PRs. It also omitted some
newer numeric implementations. Group related operations into substantial PRs based on current
master, with shared lowering, conformance tests, and documented exceptions in each group.

| Review group | Operations to cover together | Current gap or audit question |
| --- | --- | --- |
| Two-dimensional transforms | `GPUFFT2D` | FFT1D and convolution now accept independent graph chunks. FFT2D still has a device-owned raw-buffer encode API; migrate its composition and resource contract together. Spectral convolution also retains bounded contiguous algorithm scratch. |
| Sparse algebra | `GPUProgramSpMV`, `GPUAdaptiveSpMV` | Dense MatVec/MatMul now accept independent chunks and have public exports. CSR lowering still requires one chunk; route row-offset pairs, nonzeros, and global vector indices together while preserving adaptive strategies. |
| Ordering and search | `GPUSort`, `GPUBatchSort`, `GPUSegmentedSort`, `GPUGallopingSearch` | Reuse existing batch-sort work; establish global order, segment boundaries, and stable row IDs across independently stored chunks. Include Top-K callers where affected. |
| Hash follow-ups | `GPUBatchHashIndex`, `GPUBatchHashJoin` and hash routing | Core build/query/global joins support independent chunks. Specialized batch variants still require matching per-batch topology. Tables remain single bindings; fragmented finalization/scatter routing and one-to-many joins remain separate work. |
| Indexed movement and hierarchy | `GPUIndexedRangeCompaction`, `GPUPartitionedIndexedRangeCompaction`, `GPUChunkedIndexedScatter`, `GPUTextSelection`, `GPUVirtualGeometrySelection`, `GPUHierarchyLayout`, `GPUGraphTraversal`, `GPUAncestorProjection` | Some APIs already represent partitions/chunks. Audit global indices, cross-chunk ranges, output topology, and shared hierarchy callers as one family. |
| Spatial operations | `GPUGridIndex`, `GPUGridIndexQuery`, `GPUBVH`, `GPUSegmentedBVH`, `GPUBVHQuery`, `GPUSceneDrawGeneration`, `GPUSceneResourceGroups` | Binning, weighted grid statistics, and exact point filtering now accept independent chunks. Grid indexing/query and segmented hierarchies still need a universal vector contract. Group grid operations and hierarchy/query operations into coherent blocks if this family is too large for one review. |
| Decoding | `GPULZByteDecompressor`, `GPULZByteBatchDecompressor` | Existing batch decoding needs a cross-chunk history, addressing, output-capacity, and ownership audit. |

`GPUCompositeOperation`, `GPUConditionalOperation`, and `GPULoopOperation` are composition/control
flow containers; scalar literals and scalar operations intentionally represent single values.
Audit their propagation of batched child resources and parameters alongside each family, rather
than creating separate “batchified scalar” APIs or PRs. Helpers, descriptors, inspectors, and
benchmark/execution containers likewise do not each need a batch implementation.

These are review groups, not a fixed PR count. Split a group only for a substantial independent
algorithm or review-size concern; avoid one PR per operation. The exhaustive API/function audit,
strided numeric kernels, and chunk-routing performance remain explicit follow-up work.
