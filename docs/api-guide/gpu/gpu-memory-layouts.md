# GPU Memory Layouts

GPU buffers are byte ranges. A layout describes how shader-visible rows and columns are mapped onto those bytes.

This page uses three layout terms:

- **Packed** - one logical column in one tightly packed buffer.
- **Interleaved** - multiple columns share one buffer, with each row storing all columns together.
- **Segmented** - multiple packed columns share one buffer, stored as separate contiguous byte ranges.

## Layout Shapes

### Packed

A packed buffer stores one column with no unrelated data between rows.

```text
positions buffer
row 0: position
row 1: position
row 2: position
```

Use packed layout when a column is updated, transferred, or bound independently.

### Interleaved

An interleaved buffer stores multiple columns inside each row.

```text
instance buffer
row 0: position, color, radius
row 1: position, color, radius
row 2: position, color, radius
```

Use interleaved layout when columns are usually consumed together by a render or transform pipeline.

### Segmented

A segmented buffer stores multiple packed columns in one buffer.

```text
table buffer
segment 0: position row 0, position row 1, position row 2
segment 1: color row 0, color row 1, color row 2
segment 2: radius row 0, radius row 1, radius row 2
```

Use segmented layout when a table should have one allocation but columns should remain columnar for storage-buffer access.

## Terminology

| Term | Columns per buffer | Row layout | Column layout | Typical use |
| --- | ---: | --- | --- | --- |
| Packed | 1 | One column value per row | Contiguous | Independent attributes, storage arrays |
| Interleaved | Many | All column values per row | Strided | Vertex attributes consumed together |
| Segmented | Many | One column value per row inside each segment | Contiguous per segment | Storage-buffer tables, grouped allocations |

`Packed` and `segmented` are both columnar. The difference is allocation: packed uses one buffer per column, while segmented stores several packed columns in one buffer.

`Interleaved` and `segmented` both store multiple columns in one buffer. The difference is order: interleaved is row-major, while segmented is column-major.

## GPU Pipeline Compatibility

| Layout | Render vertex attributes | WebGL transform feedback | WebGPU compute storage buffers | Buffer copy commands |
| --- | --- | --- | --- | --- |
| Packed | Direct | Direct | Direct | Direct |
| Interleaved | Direct with `BufferLayout.attributes` | Direct as input or output, not in-place | Usable with explicit strided reads | Row ranges are not contiguous per column |
| Segmented | Usable as separate attribute bindings into one buffer range | Usable with explicit offsets | Direct for columnar storage reads | Column segments are contiguous |

Render pipelines use `BufferLayout` and vertex formats to interpret bytes. This supports normalized attributes such as `unorm8x4` because vertex fetch converts them to shader-visible values.

Compute pipelines use storage bindings. They read raw storage values, so normalized formats are not decoded unless the compute shader does that work explicitly.

## luma.gl Concepts

| Concept | Packed | Interleaved | Segmented |
| --- | --- | --- | --- |
| `Buffer` | One buffer per column | One buffer for several columns | One buffer for several column segments |
| `BufferLayout` | `name` plus `format` | `attributes` with offsets and shared `byteStride` | Multiple layouts or explicit segment metadata |
| `ArrowGPUVector` | Numeric Arrow type | `Binary` plus `bufferLayout` | `Binary` plus `segmentedBufferLayout` |
| `ArrowGPUTable` | Multiple vectors | Interleaved vector contributes multiple attributes | Segmented vector contributes one column per segment |

## Operation Patterns

These rows describe useful memory-layout patterns. They are not a list of currently exported APIs.

| Operation | Packed input | Interleaved input | Segmented input |
| --- | --- | --- | --- |
| `add` | Direct | Deinterleave or use strided shader reads | Direct by segment |
| `interleave` | Produces an interleaved buffer | Appends or rebuilds interleaved rows | Reads segments and writes row-major output |
| `deinterleave` | No-op or copy | Extracts one attribute to a packed buffer | Selects or copies one segment |
| `segment` | Produces a segmented buffer | Requires attribute extraction first | Appends or rebuilds segment ranges |
| `desegment` | No-op or copy | Requires attribute extraction first | Extracts one segment to a packed buffer |
| `fround` | Direct for packed `Float64` | Requires attribute extraction or strided reads | Direct by segment |

The initial Arrow GPGPU API uses out-of-place operations: inputs are not mutated or destroyed, and returned vectors own generated buffers.

In-place operations are future work. They require stricter ownership and aliasing rules. They are practical with WebGPU read-write storage buffers when the input and output have compatible byte layouts. They are not a good fit for WebGL transform feedback, where input and output buffers should not alias.

## Choosing a Layout

| Need | Prefer |
| --- | --- |
| Bind one attribute independently | Packed |
| Minimize vertex-buffer bindings for attributes consumed together | Interleaved |
| Keep table columns in one allocation for compute | Segmented |
| Use normalized vertex formats | Packed or interleaved render attributes |
| Run compute over raw storage values | Packed or segmented |
| Extract one column frequently | Packed or segmented |

## Arrow Notes

Arrow is naturally columnar. A normal Arrow column maps cleanly to a packed GPU vector.

Interleaved GPU buffers do not map to a single numeric Arrow column. In luma.gl they are represented as `ArrowGPUVector<Binary>` with `bufferLayout` metadata describing the attributes inside each row.

Segmented buffers are still columnar, but the columns share one GPU allocation. In luma.gl they are represented as `ArrowGPUVector<Binary>` with `segmentedBufferLayout` metadata so each segment name can resolve to a buffer, byte offset, byte length, row count, row stride, and Arrow type. Arrow GPGPU segmented outputs use 256-byte segment alignment.
