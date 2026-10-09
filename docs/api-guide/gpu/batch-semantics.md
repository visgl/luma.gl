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

Operation trees and lowering decisions remain the existing inspection interfaces. The API adds no parallel batch wrapper classes or unconsumed scheduling flags. Shape/layout checks and
alignment in the concrete lowerers enforce these contracts. Repartitioning and cardinality expansion
are separate properties to specify when global sort, joins, and scatter are audited.

## Compatibility and verification

The contracts above apply to the named operations. Other APIs may require a single physical
chunk or matching batch topology; consult their reference before binding independently partitioned
vectors. No limitation permits implicit packing.

The repository's internal [batch conformance review](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-batch-conformance-review.md)
tracks test evidence and implementation follow-ups.
