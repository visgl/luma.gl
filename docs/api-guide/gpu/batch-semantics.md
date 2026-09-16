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
| `GPUMask` | Row-wise boolean composition, canonical zero/one output | Packed `uint32`; inputs and output require equal logical lengths and may use independent atomic/vector boundaries | No writes for zero rows; output is overwritten for every encoded row |
| `GPUReduction` | Global aggregate; one row, two for extent | Packed `uint32`, `sint32`, or `float32`; optional packed `uint32` mask has equal logical length and independent boundaries | Zero for empty or fully excluded input; every encoding replaces output |
| `GPUHistogram` | Global aggregate into caller-sized bins | Scalar input may be strided; optional packed `uint32` mask has equal length and independent boundaries; automatic domain requires packed input | Clears bins every encoding, including empty input |
| `GPUGroupAggregation` | Global aggregate into caller-sized dense groups | `uint32` keys/masks and `float32` values can be strided and independently partitioned; participating columns have equal logical length | Counts/sums zero; min/max/mean NaN for groups with no accepted finite values; initializes every encoding |
| `GPUCompaction` | Stable selection into a caller-sized destination and one accepted-row count | Packed `uint32` input and flags have equal logical length and may use independent atomic/vector boundaries; output may use any atomic/vector capacity topology | Count is cleared for zero rows; selected values preserve logical order and overwrite the accepted prefix |
| `GPUVisibilityWorkflow` | Predicate intersection, stable source IDs, compacted output, and count | Predicate masks, optional output mask, and source IDs require equal logical length and may use independent atomic/vector boundaries; output may use any capacity topology | Empty source publishes zero count; generated IDs preserve logical row order |

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
are separate properties to specify when global sort, joins, and gather/scatter are audited.

## Conformance evidence

`gpu-batch-conformance.spec.ts` shares partition fixtures for atomic input, one chunk, uneven
chunks, leading/interior/trailing empty chunks, and differing operand boundaries. It checks the
six reference families, repeated encoding, empty aggregation, heterogeneous formats, nonzero byte
offsets, and strided histogram/group inputs. Scan cases exercise carry across boundaries and
segment heads inside and at chunk boundaries. Node tests verify zero-copy alignment and reject
unsupported lengths/layouts/topologies. `gpu-program-vectors.*.spec.ts` covers GPU conditional
execution, exact MADD aliases, and rejection of overlapping writable views.

## Coverage inventory

The six reference families above are audited for the stated contract. `GPUSort` remains a
single-view API; unifying global order with batch sort is follow-up work. Program CSR SpMV lowering
still requires one physical chunk per operand because its column indices address a global vector.
Neither limitation permits implicit packing. The exported operation classes below are **unaudited
for this contract**; being listed does not imply missing batching or claim conformance. Helpers,
resource descriptors, inspectors, benchmark runners, and execution containers are outside this
operation inventory. The exhaustive API/function audit remains tranche 4.

- `GPUScanUint64`
- `GPUUint32Gather`
- `GPUByteRangeGather`
- `GPUGather`
- `GPULZByteDecompressor`
- `GPULZByteBatchDecompressor`
- `GPUSegmentedSort`
- `GPUFlagOffsets`
- `GPUSegmentOffsets`
- `GPUSegmentedLayout`
- `GPUIndexedRangeCompaction`, `GPUPartitionedIndexedRangeCompaction`
- `GPUChunkedIndexedScatter`
- `GPUTextSelection`
- `GPUVirtualGeometrySelection`
- `GPUMask`
- `GPUHierarchyLayout`
- `GPUGraphTraversal`
- `GPUAncestorProjection`
- `GPUBatchSort`
- `GPUGallopingSearch`
- `GPUTranspose`
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
