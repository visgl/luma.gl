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

## Coverage inventory

The reference families above are audited for the stated contract. `GPUSort` remains a
single-view API; unifying global order with batch sort is follow-up work. Program CSR SpMV lowering
still requires one physical chunk per operand because its column indices address a global vector.
Neither limitation permits implicit packing. The exported operation classes below are **unaudited
for this contract**; being listed does not imply missing batching or claim conformance. Helpers,
resource descriptors, inspectors, benchmark runners, and execution containers are outside this
operation inventory. The exhaustive API/function audit remains tranche 4.

- `GPULZByteDecompressor`
- `GPULZByteBatchDecompressor`
- `GPUSegmentedSort`
- `GPUIndexedRangeCompaction`, `GPUPartitionedIndexedRangeCompaction`
- `GPUChunkedIndexedScatter`
- `GPUTextSelection`
- `GPUVirtualGeometrySelection`
- `GPUHierarchyLayout`
- `GPUGraphTraversal`
- `GPUAncestorProjection`
- `GPUBatchSort`
- `GPUGallopingSearch`
- `GPUFFT1D`
- `GPUConvolution`
- `GPUFiniteDifference2D`
- `GPUFiniteDifference3D`
- `GPUGridBinning`
- `GPUGridIndex`
- `GPUGridIndexQuery`
- `GPUPointSpatialFilter`
- `GPUBVH`
- `GPUSegmentedBVH`
- `GPUBVHQuery`
- `GPUSceneDrawGeneration`
- `GPUSceneResourceGroups`
- `GPUGridAggregation`
- `GPUHashIndex`, `GPUHashIndexQuery`
- `GPUBatchHashIndex`
- `GPUHashJoin`
- `GPUBatchHashJoin`
- `GPUCompositeOperation`, `GPUConditionalOperation`, `GPULoopOperation`
- `GPUProgramScalarLiteral`
- `GPUProgramScalarOperation`
- `GPUProgramSpMV`

Next work: audit the remaining operations, then separately design global CSR addressing,
sort/Top-K/join repartitioning, and strided numeric kernels. No new PR stack is required.
