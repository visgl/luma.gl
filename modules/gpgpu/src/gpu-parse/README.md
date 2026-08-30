# @luma.gl/gpgpu/gpu-parse

Experimental, composable WebGPU operations for turning encoded columnar page buffers into packed GPU
data without a decode/readback/re-upload round trip.

The initial focus is Apache Parquet. This package starts below the file-reader layer: a caller parses
Thrift metadata, selects a page, and uploads its bytes. `@luma.gl/gpgpu/gpu-parse` plans the serial control
data and contributes decoding operations to a `GPUCommandGraph`. Decoded physical bytes, lengths,
offsets, indices, and levels stay GPU-resident for later table, rendering, or GPGPU work.

The package is experimental and private while its page-buffer APIs settle.

## Design

Parquet mixes small serial structures—varints, run headers, length prefixes—with large parallel
payloads. The package splits those concerns:

1. CPU `parse...Plan` functions inspect headers and create compact `Uint32Array` descriptors.
2. The caller uploads the original bytes and descriptor arrays as packed `uint32` graph views.
3. `GPU...` classes add operations to a `GPUCommandGraph`; they do not submit or read back work.
4. Composite decoders reuse `GPUScan`, `GPUUint32Gather`, and `GPUByteRangeGather`, with graph-owned
   transient buffers between stages.

Buffers preserve physical Parquet bytes. INT64, DOUBLE, and fixed-length byte arrays remain usable
even when WGSL cannot express their logical type. Logical typing and Arrow conversion belong in a
later adapter.

## Generic graph operations

These `@luma.gl/gpgpu/gpu-core` operations were extracted because they are useful beyond Parquet.

| Operation | Use when | Result |
| --- | --- | --- |
| `GPUScan` | lengths, flags, or deltas need prefix sums | inclusive or exclusive uint32 prefixes |
| `GPUUint32Gather` | rows must be selected or reordered by indices | one uint32 per index; invalid indices use a fallback |
| `GPUByteRangeGather` | variable byte ranges must be concatenated | packed bytes from source offsets, lengths, and output offsets |

`GPUByteRangeGather` dispatches one invocation per output word, avoiding races when adjacent bytes
share a packed `uint32` destination.

## Planning operations

| Function | Use when | Produces |
| --- | --- | --- |
| `planParquetColumnDecode` | choosing fixed-width PLAIN or BYTE_STREAM_SPLIT | byte sizes and decode strategy |
| `parseParquetPlainByteArrayPlan` | PLAIN BYTE_ARRAY has interleaved lengths | source offsets, lengths, compacted offsets, output size |
| `parseParquetRleBitPackedRunPlan` | an unframed hybrid stream is isolated | fixed-width run descriptors |
| `parseParquetDictionaryIndicesPlan` | indices include a leading bit-width byte | bit width and rebased run descriptors |
| `parseParquetLengthPrefixedRleBitPackedRunPlan` | Data Page V1 RLE/levels include a length | rebased run descriptors |
| `parseParquetBitPackedRunPlan` | deprecated standalone BIT_PACKED is encountered | an adapter plan for the hybrid decoder |
| `parseParquetDeltaBinaryPackedPlan` | INT32 uses DELTA_BINARY_PACKED | mini-block descriptors and first value |
| `parseParquetDeltaLengthByteArrayPlan` | BYTE_ARRAY uses DELTA_LENGTH_BYTE_ARRAY | length plan and payload boundary |
| `parseParquetDeltaByteArrayPlan` | BYTE_ARRAY uses prefix compression | prefix/suffix plans and suffix boundary |
| `parseLZ4RawDecompressionPlan` | a page uses LZ4_RAW | sequence descriptors and exact output size |

Plans retain offsets into the original input. Pass that same packed input view to the GPU operation
unless a function explicitly documents an isolated slice.

## GPU operation catalog

| Operation | Use when | Composition or output |
| --- | --- | --- |
| `GPUParquetByteStreamSplitDecoder` | numeric or fixed values use BYTE_STREAM_SPLIT | value-major physical bytes |
| `GPUParquetPlainBooleanDecoder` | BOOLEAN uses PLAIN | LSB-first bits expanded to uint32 rows |
| `GPUParquetPlainByteArrayDecoder` | BYTE_ARRAY uses PLAIN | adapter over `GPUByteRangeGather` |
| `GPUParquetRleBitPackedDecoder` | levels, booleans, indices, or BIT_PACKED need expansion | one uint32 per value |
| `GPUParquetDictionaryDecoder` | dictionary entries have fixed width | byte gather through decoded indices |
| `GPUParquetRleDictionaryDecoder` | fixed values use RLE_DICTIONARY | hybrid decode + dictionary gather |
| `GPUParquetByteArrayDictionaryDecoder` | dictionary entries are variable BYTE_ARRAY | two uint32 gathers + scan + byte-range gather |
| `GPUParquetDeltaBinaryPackedUnpacker` | another workflow needs raw deltas | first value and unpacked deltas |
| `GPUParquetDeltaBinaryPackedDecoder` | INT32 uses DELTA_BINARY_PACKED | unpacker + inclusive wrapping scan |
| `GPUParquetDeltaLengthByteArrayDecoder` | BYTE_ARRAY uses delta lengths | delta decoder + exclusive scan; payload stays zero-copy |
| `GPUParquetDeltaByteArrayDecoder` | BYTE_ARRAY uses prefix compression | two delta decoders + two scans + prefix reconstruction |
| `GPULZ4RawDecompressor` | a page body uses LZ4_RAW | packed bytes, including overlapping matches |

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
- The caller supplies the schema-derived bit width. Level expansion is supported; scattering nulls
  and assembling nested rows is future composition work.

## Proposed loaders.gl integration

A Parquet loader option such as `parquet.deferPageDecoding: 'gpu'` could parse the file and page
metadata while preserving GPU-tractable page work. The returned object should be a transport-neutral
description rather than a luma.gl command graph:

```ts
type DeferredParquetPage = {
  encoding: string;
  compression: string;
  physicalType: string;
  valueCount: number;
  nonNullValueCount: number;
  typeLength?: number;
  maxDefinitionLevel: number;
  maxRepetitionLevel: number;
  pageVersion: 1 | 2;
  pageBytes: Uint8Array;
  repetitionLevels?: {byteOffset: number; byteLength: number};
  definitionLevels?: {byteOffset: number; byteLength: number};
  values: {byteOffset: number; byteLength: number};
  dictionaryPageId?: number;
};
```

Recommended behavior:

- The loader still handles file I/O, Thrift metadata, schema traversal, page boundaries, checksums,
  encryption, and unsupported codec fallback.
- `pageBytes` keeps compressed bytes only when the codec is GPU-supported; otherwise the loader
  decompresses but preserves the encoded value representation.
- Data Page V1/V2 level ranges are normalized explicitly so the GPU adapter never guesses framing.
- Dictionary pages remain associated with data pages by a stable page ID and share ownership with
  the returned batch.
- CPU decoding remains the default. Deferred mode is opt-in and may return a mixed batch where only
  supported pages are deferred.
- The loader owns byte buffers until the consumer releases the batch. The GPU adapter may upload,
  cache, or stream pages without loaders.gl depending on WebGPU.

An adapter in luma.gl can map this object to the appropriate `parse...Plan` and `GPU...` operations.
Keeping the contract free of `Device`, `Buffer`, and `GPUCommandGraph` types lets loaders.gl expose
the option to other GPU runtimes too.

## Support matrix

| Encoding or codec | Status | Notes |
| --- | --- | --- |
| PLAIN fixed, BOOLEAN, BYTE_ARRAY | Supported | zero-copy, bit expansion, or generic range gather |
| RLE / hybrid bit packing | Supported | bit widths 0–32; V1/V2 framing adapters |
| BIT_PACKED | Compatibility support | deprecated encoding adapted to hybrid decoder |
| RLE_DICTIONARY / PLAIN_DICTIONARY | Supported | fixed and variable dictionaries |
| DELTA_BINARY_PACKED | INT32 supported | INT64 is future work |
| DELTA_LENGTH_BYTE_ARRAY | Supported | lengths, offsets, zero-copy payload |
| DELTA_BYTE_ARRAY | Supported | full prefix reconstruction |
| BYTE_STREAM_SPLIT | Supported | all specified physical types except INT96 |
| LZ4_RAW | Supported | raw blocks and overlapping matches |
| ALP | Not supported | newer floating-point encoding |
| Snappy | Not yet supported | good candidate for sequence planning and GPU resolution |
| Gzip, Brotli, Zstandard | Not supported | better supplied by dedicated implementations |
| legacy LZ4 | Not supported | deprecated framing distinct from LZ4_RAW |

## Boundaries

The package does not parse Thrift metadata, decrypt pages, evaluate logical type annotations,
materialize null/nested rows, or construct Arrow arrays. A planned input/output region uses uint32
indices and must fit below 4 GiB; callers should preserve page and batch boundaries for larger data.
