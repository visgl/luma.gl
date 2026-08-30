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
| `GPUUint32Gather` | rows must be selected or reordered by indices | one uint32 per index; invalid indices use a fallback |
| `GPUByteRangeGather` | variable byte ranges must be concatenated | packed bytes from source offsets, lengths, and output offsets |
| `GPULZByteDecompressor` | a format parser can describe literals and backreferences | race-free packed bytes, including overlapping LZ copies |

`GPUByteRangeGather` dispatches one invocation per output word, avoiding races when adjacent bytes
share a packed `uint32` destination.

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
| `parseParquetLengthPrefixedRleBitPackedRunPlan` | Data Page V1 RLE/levels include a length | rebased run descriptors |
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
| `GPUParquetLevelLayout` | decoded levels must become null/value and repeated-row layout | physical validity/value offsets, logical element offsets, row indices, list offsets, and counts |
| `GPULZ4RawDecompressor` | a page body uses LZ4_RAW | semantic wrapper over `GPULZByteDecompressor` |
| `GPUSnappyDecompressor` | a Parquet page body uses raw Snappy | semantic wrapper over `GPULZByteDecompressor` |
| `addGPUParquetEncodedPageBatchToGraph` | a loaders.gl page-batch plan should become executable GPU work | decompression, level decoding, value decoding, dictionary reuse, and result graph views |

## Common recipes

### PLAIN and BYTE_STREAM_SPLIT

- PLAIN INT32, INT64, INT96, FLOAT, DOUBLE, or FIXED_LEN_BYTE_ARRAY is already value-major and can
  remain zero-copy.
- BYTE_STREAM_SPLIT INT32, INT64, FLOAT, DOUBLE, or FIXED_LEN_BYTE_ARRAY uses
  `GPUParquetByteStreamSplitDecoder`.
- PLAIN BOOLEAN uses `GPUParquetPlainBooleanDecoder`.
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

### Levels and page versions

- Data Page V1 levels have a four-byte encoded-length prefix; use
  `parseParquetLengthPrefixedRleBitPackedRunPlan`.
- Data Page V2 stores level byte lengths in its header and omits that prefix; slice the payload and
  use `parseParquetRleBitPackedRunPlan`.
- Deprecated standalone BIT_PACKED is a different, MSB-first encoding. Use
  `parseParquetBitPackedRunPlan` and `GPUParquetBitPackedDecoder`, not the hybrid decoder.
- After level expansion, use `GPUParquetLevelLayout` once per repeated ancestor that needs offsets.
  It keeps null compaction and repeated-row assembly GPU-resident and exposes intermediate flags and
  indices for custom nested-layout composition.

### Compression

Both supported codecs use CPU planning plus the same `GPULZByteDecompressor` GPU primitive:

- LZ4_RAW tokens become literal and match spans through `parseLZ4RawDecompressionPlan`.
- Parquet Snappy blocks are raw Snappy, not the optional framed stream format. Their preamble and
  tags become spans through `parseSnappyDecompressionPlan`.

Use the codec-specific GPU wrapper when operation names and metrics should retain codec semantics;
use `GPULZByteDecompressor` directly when another byte-oriented LZ format can produce the same
descriptor contract.

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
  when an application supplies an explicit output capacity.

CPU decoding remains the loaders.gl default. `readPages()` is the explicit opt-in, and mixed
CPU/GPU execution remains caller-owned because loaders.gl should not depend on luma.gl.

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
| RLE / hybrid bit packing | Supported | bit widths 0–32; V1/V2 framing adapters |
| BIT_PACKED | Compatibility support | deprecated MSB-first level encoding has a distinct decoder |
| RLE_DICTIONARY / PLAIN_DICTIONARY | Supported | fixed and variable dictionaries |
| DELTA_BINARY_PACKED | INT32 and INT64 supported | INT64 uses split uint32 words and modulo-2^64 scan |
| DELTA_LENGTH_BYTE_ARRAY | Supported | lengths, offsets, zero-copy payload |
| DELTA_BYTE_ARRAY | Supported | full prefix reconstruction |
| BYTE_STREAM_SPLIT | Supported | all specified physical types except INT96 |
| LZ4_RAW | Supported | raw blocks and overlapping matches |
| Snappy | Supported | raw Snappy blocks, all literal and copy tag forms |
| ALP | Not supported | newer floating-point encoding |
| Gzip, Brotli, Zstandard | Not supported | better supplied by dedicated implementations |
| legacy LZ4 | Not supported | deprecated framing distinct from LZ4_RAW |

## Boundaries

The package does not parse Thrift metadata, decrypt pages, evaluate logical type annotations, build
complete multi-column record batches, or construct Arrow arrays. `GPUParquetLevelLayout`
materializes one repeated depth at a time; callers still compose those depths according to the
schema. A planned input/output region uses uint32 indices and must fit below 4 GiB; callers should
preserve page and batch boundaries for larger data.
