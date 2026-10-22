# @luma.gl/gpgpu/gpu-parse

Experimental WebGPU operations for decoding encoded columnar page buffers into GPU-resident data.

See the [GPU Parse API reference](../../../../docs/api-reference/gpgpu/gpu-parse.md) for
planners, decoding operations, integration recipes, support limits, and ownership boundaries.

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
| 6. Streaming and throughput | Compatible-page batching complete; measure next | `GPUParquetEncodedPageBatchStream` reuses exact-layout compiled graphs and pooled storage; compressed `BYTE_STREAM_SPLIT` pages now share one runtime-described LZ dispatch and one byte restoration dispatch; capacity-class graph reuse and CPU/GPU crossover benchmarks remain | Sustained row-group streaming has bounded memory and published evidence for when GPU deferral pays off |
| 7. Conformance and hardening | Ongoing | Add files from multiple Parquet writers, differential CPU/GPU decoding, planner fuzzing, malformed/truncated inputs, empty/all-null pages, large offsets, and maximum-width stress cases | Every automatic path is covered by independent writer fixtures and corruption tests; fallbacks remain distinguishable from malformed data |
| 8. Demand-driven format additions | Optional | Evaluate ALP and focused logical conversions such as DECIMAL or legacy INT96 only when real datasets justify them | A new operation has a bounded layout, a reusable primitive where possible, fixtures, benchmarks, and a documented CPU fallback |

The intended next step is representative crossover and sustained-throughput measurement for tranche
6, followed by capacity-class graph reuse only where those measurements show layout churn. Tranche
8 is not a completeness checklist.

### Roadmap stop line

The roadmap does not include GPU Thrift/schema parsing, file I/O, page indexes, encryption,
checksums, or a second Arrow/table implementation. Those remain loader or adapter responsibilities.
It also does not currently include Zstandard, Gzip, Brotli, deprecated framed LZ4, or a general GPU
parser for serial encoding headers. These are substantial independent projects and should only be
reconsidered with workload profiles showing that CPU or WebAssembly decompression is the dominant
bottleneck after GPU value decoding is enabled.
