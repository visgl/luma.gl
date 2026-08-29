# @luma.gl/gpu-parse

Experimental WebGPU-native building blocks for decoding columnar storage formats.

The first tranche targets Parquet page payloads after page headers have been parsed and compression
has been removed:

- Fixed-width `PLAIN` payloads are recognized as zero-copy GPU inputs.
- `BYTE_STREAM_SPLIT` payloads are transposed into their original fixed-width byte representation by
  one command-graph compute node.
- `INT32`, `INT64`, `FLOAT`, `DOUBLE`, and `FIXED_LEN_BYTE_ARRAY` byte-stream-split columns are
  supported. `INT96` is supported only for `PLAIN` payloads.
- RLE/bit-packed hybrid streams with bit widths from 0 through 32 use a small CPU control-plane
  parser for run headers followed by one GPU-parallel expansion node. This covers the encoded index
  stream used by `RLE_DICTIONARY` and the same hybrid representation used for Parquet levels.
- Fixed-width dictionary gather accepts decoded indices as an independent stage and preserves
  arbitrary physical byte widths. `GPUParquetRleDictionaryDecoder` composes hybrid expansion and
  gather through graph-owned transient storage for an end-to-end `RLE_DICTIONARY` value path.
- `DELTA_BINARY_PACKED` INT32 control data is parsed on the CPU. A reusable GPU unpack stage emits
  wrapping uint32 deltas, and `GPUParquetDeltaBinaryPackedDecoder` composes it with the graph-native
  inclusive prefix scan to reconstruct signed INT32 bit patterns.

The decoder intentionally operates on bytes represented by packed `uint32` graph views. It preserves
the physical Parquet representation, including 64-bit and fixed-length values that WGSL cannot
natively interpret. A later adapter can assign logical types or construct GPU vectors without making
the parsing layer depend on Apache Arrow.

## Scope

This package does not yet parse Thrift metadata, decompress page bodies, apply decoded definition or
repetition levels to values, or implement delta length/byte-array encodings. LZ4 is a useful
back-references require a separate block scheduler and are not part of the initial byte-transpose
kernel.

The package is private while its page-buffer and command-graph interfaces settle.
