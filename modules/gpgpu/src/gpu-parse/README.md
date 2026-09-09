# @luma.gl/gpgpu/gpu-parse

Experimental, composable WebGPU operations for turning encoded columnar page buffers into packed GPU
data without a decode/readback/re-upload round trip.

The initial focus is Apache Parquet. This package starts below the file-reader layer: a caller parses
Thrift metadata, selects a page, and uploads its bytes. `@luma.gl/gpgpu/gpu-parse` plans the serial control
data and contributes decoding operations to a `GPUCommandGraph`. Decoded physical bytes, lengths,
offsets, indices, and levels stay GPU-resident for later table, rendering, or GPGPU work.

The submodule is experimental while its page-buffer APIs settle.

## Design

Parquet mixes small serial structures—varints, run headers, length prefixes—with large parallel
payloads. The package splits those concerns:

1. CPU `parse...Plan` functions inspect headers and create compact `Uint32Array` descriptors.
2. The caller uploads the original bytes and descriptor arrays as packed `uint32` graph views.
3. `GPU...` classes add operations to a `GPUCommandGraph`; they do not submit or read back work.
4. Composite decoders reuse generic scan, gather, and LZ operations, with graph-owned transient
   buffers between stages.

Buffers preserve physical Parquet bytes. INT64, DOUBLE, and fixed-length byte arrays remain usable
even when WGSL cannot express their logical type. Logical typing and Arrow conversion belong in a
later adapter.

## Generic graph operations

These `@luma.gl/gpgpu/gpu-core` operations were extracted because they are useful beyond Parquet.

| Operation | Use when | Result |
| --- | --- | --- |
| `GPUScan` | lengths, flags, or deltas need prefix sums | inclusive or exclusive uint32 prefixes |
| `GPUScanUint64` | split low/high words need an inclusive 64-bit prefix sum | modulo-2^64 low/high prefixes with carry propagation |
| `GPUFlagOffsets` | one binary flag stream needs stable dense indices and a GPU count | exclusive offsets and one scalar count |
| `GPUSegmentOffsets` | logical-element offsets need list/group boundaries | segment indices, list-style offsets, and segment count |
| `GPUSegmentedLayout` | format-specific classification has produced value, element, and segment-start flags | dense value/element offsets, segment indices, list-style segment offsets, and scalar counts |
| `GPUCompaction` | flagged uint32 values must be packed while preserving order | compacted values and the accepted count |
| `GPUUint32Gather` | rows must be selected or reordered by indices | one uint32 per index; invalid indices use a fallback |
| `GPUByteRangeGather` | variable byte ranges must be concatenated | packed bytes from source offsets, lengths, and output offsets |
| `GPULZByteDecompressor` | a format parser can describe literals and backreferences | race-free packed bytes, including overlapping LZ copies |

`GPUByteRangeGather` dispatches one invocation per output word, avoiding races when adjacent bytes
share a packed `uint32` destination.

`GPUFlagOffsets` and `GPUSegmentOffsets` are the smaller pieces to use when several nesting depths
share one leaf-validity stream. `GPUParquetNestedColumnLayout` scans that leaf stream once, then
composes the two primitives for each requested depth. `GPUSegmentedLayout` remains the convenient
single-depth operation and deliberately starts after format parsing. Its three slot-aligned inputs are
binary flags: whether a slot owns a physical value, represents a logical element, and begins a new
segment after the implicit first segment. Use it for null/value offsets, list offsets, or grouped
sequences. Compose `GPUCompaction` when the physical values themselves must be packed, or consume
the emitted offsets directly when a later shader can address the original payload. Parquet's
definition and repetition levels are one producer of these flags, but the operation contains no
Parquet rules.

Operation names stay generic when the ordinary native representation is sufficient. A materially
different contract uses an operation-first specialization such as `GPUScanUint64`; this avoids a
public class matrix for every scalar type. Object-oriented operations such as `GPUUint32Gather` and
`GPUByteRangeGather` retain names that say what they gather.

## Planning operations

| Function | Use when | Produces |
| --- | --- | --- |
| `planParquetColumnDecode` | choosing fixed-width PLAIN or BYTE_STREAM_SPLIT | byte sizes and decode strategy |
| `parseParquetPlainByteArrayPlan` | PLAIN BYTE_ARRAY has interleaved lengths | source offsets, lengths, compacted offsets, output size |
| `parseParquetRleBitPackedRunPlan` | an unframed hybrid stream is isolated | fixed-width run descriptors |
| `parseParquetDictionaryIndicesPlan` | indices include a leading bit-width byte | bit width and rebased run descriptors |
| `parseParquetLengthPrefixedRleBitPackedRunPlan` | Data Page V1 levels or RLE values include a length | rebased run descriptors |
| `parseParquetBitPackedRunPlan` | deprecated standalone BIT_PACKED is encountered | validated MSB-first payload metadata |
| `parseParquetDeltaBinaryPackedPlan` | INT32 uses DELTA_BINARY_PACKED | mini-block descriptors and first value |
| `parseParquetDeltaBinaryPackedInt64Plan` | INT64 uses DELTA_BINARY_PACKED | split-word mini-block descriptors and first value |
| `parseParquetDeltaLengthByteArrayPlan` | BYTE_ARRAY uses DELTA_LENGTH_BYTE_ARRAY | length plan and payload boundary |
| `parseParquetDeltaByteArrayPlan` | BYTE_ARRAY uses prefix compression | prefix/suffix plans and suffix boundary |
| `parseLZ4RawDecompressionPlan` | a page uses LZ4_RAW | sequence descriptors and exact output size |
| `parseSnappyDecompressionPlan` | a page uses raw Snappy | generic literal/backreference descriptors and declared output size |
| `planGPUParquetEncodedPageBatch` | loaders.gl returned deferred encoded pages | validated mixed GPU/CPU decisions and one aligned upload containing pages, dictionaries, and descriptors |

Plans retain offsets into the original input. Pass that same packed input view to the GPU operation
unless a function explicitly documents an isolated slice.

## GPU operation catalog

| Operation | Use when | Composition or output |
| --- | --- | --- |
| `GPUParquetByteStreamSplitDecoder` | numeric or fixed values use BYTE_STREAM_SPLIT | value-major physical bytes |
| `GPUParquetPlainBooleanDecoder` | BOOLEAN uses PLAIN | LSB-first bits expanded to uint32 rows |
| `GPUParquetPlainByteArrayDecoder` | BYTE_ARRAY uses PLAIN | adapter over `GPUByteRangeGather` |
| `GPUParquetRleBitPackedDecoder` | levels, booleans, or dictionary indices use the hybrid encoding | one uint32 per value, using hybrid LSB-first ordering |
| `GPUParquetBitPackedDecoder` | deprecated standalone BIT_PACKED levels are encountered | one uint32 per value, using legacy MSB-first ordering |
| `GPUParquetDictionaryDecoder` | dictionary entries have fixed width | byte gather through decoded indices |
| `GPUParquetRleDictionaryDecoder` | fixed values use RLE_DICTIONARY | hybrid decode + dictionary gather |
| `GPUParquetByteArrayDictionaryDecoder` | dictionary entries are variable BYTE_ARRAY | two uint32 gathers + scan + byte-range gather |
| `GPUParquetDeltaBinaryPackedUnpacker` | another workflow needs raw deltas | first value and unpacked deltas |
| `GPUParquetDeltaBinaryPackedDecoder` | INT32 uses DELTA_BINARY_PACKED | unpacker + inclusive wrapping scan |
| `GPUParquetDeltaBinaryPackedInt64Decoder` | INT64 uses DELTA_BINARY_PACKED | split-word unpacker + `GPUScanUint64` |
| `GPUParquetDeltaLengthByteArrayDecoder` | BYTE_ARRAY uses delta lengths | delta decoder + exclusive scan; payload stays zero-copy |
| `GPUParquetDeltaByteArrayDecoder` | BYTE_ARRAY uses prefix compression | two delta decoders + two scans + prefix reconstruction |
| `GPUParquetLevelLayout` | decoded levels must become null/value and repeated-row layout | Parquet classification followed by generic `GPUSegmentedLayout` materialization |
| `GPUParquetNestedColumnLayout` | required, optional, list, or nested-list levels must preserve page chunks | one shared leaf layout plus element/row/list offsets for every requested schema depth |
| `GPULZ4RawDecompressor` | a page body uses LZ4_RAW | semantic wrapper over `GPULZByteDecompressor` |
| `GPUSnappyDecompressor` | a Parquet page body uses raw Snappy | semantic wrapper over `GPULZByteDecompressor` |
| `addGPUParquetEncodedPageBatchToGraph` | a loaders.gl page-batch plan should become executable GPU work | decompression, level decoding, value decoding, dictionary reuse, and result graph views |
| `GPUParquetEncodedPageBatchStream` | repeated page batches have one stable decode layout | a fixed pool of upload buffers, compiled decode/consumer graphs, and FIFO backpressure |

## Common recipes

### PLAIN and BYTE_STREAM_SPLIT

- PLAIN INT32, INT64, INT96, FLOAT, DOUBLE, or FIXED_LEN_BYTE_ARRAY is already value-major and can
  remain zero-copy.
- BYTE_STREAM_SPLIT INT32, INT64, FLOAT, DOUBLE, or FIXED_LEN_BYTE_ARRAY uses
  `GPUParquetByteStreamSplitDecoder`.
- PLAIN BOOLEAN uses `GPUParquetPlainBooleanDecoder`.
- RLE BOOLEAN uses `parseParquetLengthPrefixedRleBitPackedRunPlan` followed by
  `GPUParquetRleBitPackedDecoder` with bit width one. The automatic page adapter consumes the
  four-byte value-stream envelope and returns the same one-uint32-per-row layout as PLAIN BOOLEAN.
- PLAIN BYTE_ARRAY uses `parseParquetPlainByteArrayPlan` and
  `GPUParquetPlainByteArrayDecoder`. Its metadata layout is directly compatible with
  `GPUByteRangeGather`.

### Dictionary data

Use `parseParquetDictionaryIndicesPlan`, then either:

- `GPUParquetRleDictionaryDecoder` for fixed-width entries; or
- `GPUParquetRleBitPackedDecoder` followed by `GPUParquetByteArrayDictionaryDecoder` for
  variable-width entries.

`PLAIN_DICTIONARY` is a deprecated name for the same data-page index representation.

### Delta byte arrays

`GPUParquetDeltaLengthByteArrayDecoder` outputs lengths and exclusive offsets. The payload after
`payloadByteOffset` is already contiguous. `GPUParquetDeltaByteArrayDecoder` additionally follows
prefix references across any number of preceding rows and emits fully reconstructed bytes.

`DELTA_BYTE_ARRAY` does not carry its final reconstructed byte length in the encoded payload.
Automatic planning therefore needs `getPageOutputByteLength` to return an exact length from
application or loader metadata. Without it, the page remains an explicit `missing-output-capacity`
CPU fallback instead of guessing an allocation or adding a GPU readback barrier:

```ts
const plan = planGPUParquetEncodedPageBatch(encodedBatch, {
  getPageOutputByteLength: (column, page) =>
    decodedSizes.get(`${column.path.join('.')}:${page.pageOrdinal}`)
});
```

An all-null page has zero physical values and therefore a known empty result. The adapter emits an
`empty-byte-array` plan for that case without invoking the callback or parsing absent delta headers.

### Levels and page versions

- Data Page V1 levels have a four-byte encoded-length prefix; use
  `parseParquetLengthPrefixedRleBitPackedRunPlan`.
- Data Page V2 stores level byte lengths in its header and omits that prefix; slice the payload and
  use `parseParquetRleBitPackedRunPlan`.
- Deprecated standalone BIT_PACKED is a different, MSB-first encoding. Use
  `parseParquetBitPackedRunPlan` and `GPUParquetBitPackedDecoder`, not the hybrid decoder.
- After level expansion, use `GPUParquetLevelLayout` for one scalar or repeated depth. It classifies
  Parquet definition/repetition levels into binary flags, then composes `GPUSegmentedLayout`.
- Use `GPUParquetNestedColumnLayout` when one column has multiple requested schema depths or page
  chunks must remain explicit. It accepts matching definition/repetition `GraphVectorView`s, scans
  leaf validity across the vector, and composes chunk-aware `GPUFlagOffsets` plus
  `GPUSegmentOffsets` per depth.
  Required, optional, list, and nested-list layouts differ only in their schema-derived definition
  and repetition thresholds. Slot-aligned vectors retain page topology, while dense indices and one
  global list-offset stream carry through page boundaries so a repeated row is never split.

The nested operation allocates public results as graph transients with storage and copy-source
usage. Keep them transient when the consumer is in the same graph. If results must outlive the
compiled graph, copy selected chunks to imported caller-owned buffers and wrap those buffers as
`GPUData`/`GPUVector` in the adapter. The global list-offset stream already contains its terminal.

### Compression

Both supported codecs use CPU planning plus the same `GPULZByteDecompressor` GPU primitive:

- LZ4_RAW tokens become literal and match spans through `parseLZ4RawDecompressionPlan`.
- Parquet Snappy blocks are raw Snappy, not the optional framed stream format. Their preamble and
  tags become spans through `parseSnappyDecompressionPlan`.

Use the codec-specific GPU wrapper when operation names and metrics should retain codec semantics;
use `GPULZByteDecompressor` directly when another byte-oriented LZ format can produce the same
descriptor contract.

Codec support is a capability statement, not a performance promise. The generic resolver favors
compact descriptors and deterministic overlapping-copy semantics; binary descriptor searches and
irregular backreference chains can make either LZ4_RAW or Snappy slower than a mature CPU/Wasm
decoder. Measure with representative pages. Prefer CPU decompression followed by deferred GPU value
decoding when that split gives a better crossover, and reserve preserved compression for workloads
where transfer savings and GPU reuse repay planning and execution costs.

## loaders.gl integration

loaders.gl 5.0.0-alpha.4 implements the transport-neutral boundary through
`ParquetSource.readPages()`. It retains file I/O, Thrift metadata, schema traversal, page indexes,
checksums, encryption, and range requests while returning `ParquetEncodedPageBatch` objects. The
loader contract contains no luma.gl device or graph types.

Install loaders.gl explicitly when using this optional adapter:

```sh
yarn add @loaders.gl/parquet@5.0.0-alpha.4
```

Request encoded pages and preserve only codecs that `gpu-parse` can decompress:

```ts
import {ParquetSourceLoader} from '@loaders.gl/parquet/parquet-source-loader';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  addGPUParquetEncodedPageBatchToGraph,
  createGPUParquetEncodedPageBatchInputBuffer,
  planGPUParquetEncodedPageBatch
} from '@luma.gl/gpgpu/gpu-parse';

const source = ParquetSourceLoader.createDataSource(parquetBlob, {});

for await (const encodedBatch of source.readPages({
  columns: ['position', 'category'],
  preserveCompression: ['SNAPPY', 'LZ4_RAW']
})) {
  const plan = planGPUParquetEncodedPageBatch(encodedBatch, {
    minimumGPUByteLength: 64 * 1024
  });
  const inputBuffer = createGPUParquetEncodedPageBatchInputBuffer(device, plan);
  const graph = new GPUCommandGraph(device);
  const decodedBatch = addGPUParquetEncodedPageBatchToGraph(graph, plan, inputBuffer);

  // Add table, filtering, rendering, or readback operations that consume decodedBatch.pages.
  const compiled = graph.compile();
  // Encode and submit the compiled graph, then destroy compiled and inputBuffer when finished.
}
```

### What the adapter does

- Validates page counts, ordinals, compression metadata, and every advertised section range before
  uploading data.
- Copies page sections and CPU-parsed descriptors into one four-byte-aligned upload instead of
  creating one GPU buffer per page.
- Reuses one immutable dictionary plan and graph resource across every dictionary data page in the
  column chunk.
- Composes Snappy or LZ4_RAW decompression, V1/V2 level decoding, and supported value decoders in
  one command graph.
- Returns packed-byte, uint32, split-uint64, or byte-array result views for downstream graph work.
- Keeps unsupported pages in source order as `CPUParquetPageFallbackPlan`; no page is silently
  omitted.

`minimumGPUByteLength` is an application policy rather than a fixed library heuristic. Use zero
after explicitly choosing GPU deferral, or set a measured crossover size when CPU decoding is
available. `requireGPU: true` converts every fallback into an exception and is useful for tests and
controlled pipelines.

### Deliberate automatic-fallback cases

- Compression codecs other than Snappy and LZ4_RAW.
- Compressed V1 pages containing levels. V1 compresses the entire body, so level/value boundaries
  are unknowable until decompression. V2 leaves level sections addressable and is fully composable.
- Encodings whose serial control headers remain hidden inside a compressed value payload. The
  loader may CPU-decompress these pages while still deferring their value decoding.
- Encodings with no bounded automatic output allocation. Lower-level operations remain available
  when an application supplies an explicit output capacity. `DELTA_BYTE_ARRAY` is automatic when
  `getPageOutputByteLength` supplies its exact reconstructed length.

CPU decoding remains the loaders.gl default. `readPages()` is the explicit opt-in, and mixed
CPU/GPU execution remains caller-owned because loaders.gl should not depend on luma.gl.

### Reusing a decode layout across a stream

Use `GPUParquetEncodedPageBatchStream` when repeated `readPages()` results have the same page and
decoder layout. The template fixes page order, value counts, section offsets, encodings, descriptor
capacities, and shader control values. Later batches may replace payload and descriptor contents,
but a layout change requires another stream or the one-shot adapter. `isCompatible()` makes that
boundary explicit.

Each slot owns its upload buffer, compiled graph, graph transients, and the output returned by
`configureGraph`. Set `slotCount` to the number of batches that may be in flight. Use `tryAcquire()`
when an application should drop work or choose CPU decoding under pressure; use `acquire()` for FIFO
backpressure. A ticket must be encoded once and released only after the submitted work, a dependent
readback, or an application-owned GPU completion promise settles:

```ts
const templatePlan = planGPUParquetEncodedPageBatch(firstEncodedBatch, {requireGPU: true});
const stream = new GPUParquetEncodedPageBatchStream(device, templatePlan, {
  slotCount: 2,
  configureGraph: ({graph, batch, slotIndex}) => {
    // Add rendering, filtering, table materialization, or copies to slot-owned output buffers.
    return addConsumerToGraph(graph, batch, slotIndex);
  },
  destroyOutput: output => output.destroy()
});

for await (const encodedBatch of source.readPages(readOptions)) {
  const plan = planGPUParquetEncodedPageBatch(encodedBatch, {requireGPU: true});
  const ticket = await stream.acquire(plan);
  const commandEncoder = device.createCommandEncoder();
  ticket.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  await ticket.releaseWhen(getSubmittedWorkCompletion());
}

stream.destroy();
```

`releaseWhen()` releases even when its promise rejects, then propagates the rejection. Use
`cancel()` only for a reservation that was never encoded. Destroying a stream rejects queued
acquisitions immediately; active slots are destroyed when their tickets finish. The stream does
not submit commands or infer when GPU work is complete, because submission and synchronization
remain application-owned.

This operation removes repeated graph construction and pipeline-cache lookup from the steady-state
path and bounds reusable GPU memory. It does not promise that every Parquet row group has the same
layout, batch dissimilar shapes together, or decide the CPU/GPU crossover threshold.

## Conformance and hardening

The adapter tests real V1 and V2 pages emitted by loaders.gl's Parquet writer, including nullable,
all-null, fixed-width, and variable-width values. Additional fixtures cover dictionary reuse,
malformed section rejection, page thresholds, raw Snappy decompression, BYTE_STREAM_SPLIT, and
definition-level decoding. Every lower-level decoder also retains focused truncation and boundary
tests.

Malformed framing and contradictory metadata throw during planning. Only recognized capability or
policy boundaries become CPU fallbacks; corrupt data is never relabeled as an unsupported page.

## Support matrix

| Encoding or codec | Status | Notes |
| --- | --- | --- |
| PLAIN fixed, BOOLEAN, BYTE_ARRAY | Supported | zero-copy, bit expansion, or generic range gather |
| RLE / hybrid bit packing | Supported | bit widths 0–32; V1/V2 level framing and BOOLEAN values |
| BIT_PACKED | Compatibility support | deprecated MSB-first level encoding has a distinct decoder |
| RLE_DICTIONARY / PLAIN_DICTIONARY | Supported | fixed and variable dictionaries |
| DELTA_BINARY_PACKED | INT32 and INT64 supported | INT64 uses split uint32 words and modulo-2^64 scan |
| DELTA_LENGTH_BYTE_ARRAY | Supported | lengths, offsets, zero-copy payload |
| DELTA_BYTE_ARRAY | Supported | full prefix reconstruction; automatic adapter needs exact output byte length |
| BYTE_STREAM_SPLIT | Supported | all specified physical types except INT96 |
| LZ4_RAW | Supported | raw blocks and overlapping matches |
| Snappy | Supported | raw Snappy blocks, all literal and copy tag forms |
| ALP | Not supported | newer floating-point encoding |
| Gzip, Brotli, Zstandard | Not supported | better supplied by dedicated implementations |
| legacy LZ4 | Not supported | deprecated framing distinct from LZ4_RAW |

## Follow-up roadmap

Tranches 1–4 are complete: the package has composable low-level operations; loaders.gl encoded-page
batches can be validated, uploaded once, and executed as mixed GPU/CPU command graphs; and
decompressed V1 framing, variable dictionaries, RLE BOOLEAN, and bounded `DELTA_BYTE_ARRAY` pages
flow through the automatic adapter. Format-specific level classification now composes generic
segmented layout, compaction, gather, and byte-range operations. Further work should remain
incremental. Each tranche below has a useful stopping point and does not require turning
`gpu-parse` into a complete Parquet parser.

| Tranche | Priority | Scope | Completion bar |
| --- | --- | --- | --- |
| 3. Close inexpensive adapter gaps | Complete | Loader-selected preserved compression or CPU-decompressed encoded pages; automatic bounded `DELTA_BYTE_ARRAY`; variable dictionaries; decompressed V1 level framing; RLE BOOLEAN values | Common supported encodings no longer fall back for adapter-only gaps; no GPU metadata parser was introduced |
| 4. Extract generic materialization primitives | Complete | `GPUSegmentedLayout` owns validity/value and segment offsets; existing `GPUCompaction`, gathers, and scatter operations own payload movement | Another columnar format can materialize offsets and values without importing Parquet-specific classes |
| 5. Assemble nested GPU columns | Graph-native complete | `GPUParquetNestedColumnLayout` composes multiple definition/repetition depths into chunk-preserving validity, row, and list-offset `GraphVectorView`s; imported output buffers can be wrapped as `GPUData`/`GPUVector` without Arrow | Common required, optional, list, and nested-list columns remain GPU-resident through an in-graph or caller-owned-buffer consumer boundary |
| 6. Streaming and throughput | Foundation complete; measure next | `GPUParquetEncodedPageBatchStream` reuses exact-layout compiled graphs, pools upload/output buffers, and provides fixed-capacity FIFO backpressure; compatible-page batching and CPU/GPU crossover benchmarks remain | Sustained row-group streaming has bounded memory and published evidence for when GPU deferral pays off |
| 7. Conformance and hardening | Ongoing | Add files from multiple Parquet writers, differential CPU/GPU decoding, planner fuzzing, malformed/truncated inputs, empty/all-null pages, large offsets, and maximum-width stress cases | Every automatic path is covered by independent writer fixtures and corruption tests; fallbacks remain distinguishable from malformed data |
| 8. Demand-driven format additions | Optional | Evaluate ALP and focused logical conversions such as DECIMAL or legacy INT96 only when real datasets justify them | A new operation has a bounded layout, a reusable primitive where possible, fixtures, benchmarks, and a documented CPU fallback |

The intended next step is representative crossover and sustained-throughput measurement for tranche
6, or conformance coverage from tranche 7. Tranche 8 is not a completeness checklist.

### Roadmap stop line

The roadmap does not include GPU Thrift/schema parsing, file I/O, page indexes, encryption,
checksums, or a second Arrow/table implementation. Those remain loader or adapter responsibilities.
It also does not currently include Zstandard, Gzip, Brotli, deprecated framed LZ4, or a general GPU
parser for serial encoding headers. These are substantial independent projects and should only be
reconsidered with workload profiles showing that CPU or WebAssembly decompression is the dominant
bottleneck after GPU value decoding is enabled.

## Boundaries

The package does not parse Thrift metadata, decrypt pages, evaluate logical type annotations, build
complete multi-column record batches, or construct Arrow arrays. `GPUParquetNestedColumnLayout`
materializes schema depths supplied by the caller but does not infer them from Parquet schema
metadata. A planned input/output region uses uint32 indices and must fit below 4 GiB; callers should
preserve page and batch boundaries for larger data.
