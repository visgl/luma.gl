# @luma.gl/text

Experimental Arrow-native 2D text utilities for luma.gl. The package contains:

- Arrow-native 2D text utilities adapted from deck.gl's atlas and text layout internals.
- `ArrowTextModel`, an `ArrowModel`-derived one-line label renderer that expands UTF-8 `GPUVector` rows into glyph instances.
- `ArrowStorageTextModel`, a WebGPU-only renderer that consumes storage-backed glyph state generated from UTF-8 `GPUVector` input or supplied as reusable `ArrowStorageTextState`.

## Usage

```ts
import * as arrow from 'apache-arrow'
import {GPUVector, makeArrowVectorFromArray} from '@luma.gl/arrow'
import {ArrowTextModel} from '@luma.gl/text'

const positions = new GPUVector({
  device,
  name: 'positions',
  vector: makeArrowVectorFromArray([0, 0, 0.5, 0.25], new arrow.Float32(), 2)
})
const texts = new GPUVector({
  device,
  name: 'texts',
  vector: makeArrowVectorFromArray(['hello', 'luma.gl'], new arrow.Utf8())
})

const model = new ArrowTextModel(device, {
  id: 'arrow-text',
  positions,
  texts,
  characterSet: 'auto',
  fontSettings: {sdf: true}
})
```

`ArrowTextModel` accepts top-level GPU-resident row vectors such as `positions`, `colors`, `angles`, `sizes`, and `pixelOffsets`, with `texts` supplied as `GPUVector<Utf8>`. UTF-8 GPU vectors preserve one `GPUData` entry per Arrow source chunk and retain the chunk metadata needed for text expansion, so chunked and sliced sources stay addressable without collapsing them into one host string array. The model repeats compatible Arrow-backed row attributes for each glyph, emits generated `rowIndices` for source-row picking, and delegates GPU upload/update behavior to `ArrowModel`. Pass optional `clipRects` as `GPUVector<FixedSizeList<Int16>[4]>` rows containing `[x, y, width, height]` glyph-layout units; negative width or height disables clipping on that axis. The generated per-glyph clipping attribute stays packed at 8 bytes per glyph. When the built-in fragment shader is used, `fontSettings.sdf`, `cutoff`, and `smoothing` also drive SDF atlas decoding automatically; custom fragment shaders remain responsible for their own atlas-alpha interpretation.

`ArrowStorageTextModel` is the WebGPU storage-backed path. It requires top-level `positions` as `GPUVector<FixedSizeList<Float32>[2]>` plus `texts`, accepts optional row-style `colors`, `angles`, `sizes`, `pixelOffsets`, `textAnchors`, and `alignmentBaselines` GPUVectors, and falls back to constant deck-like props when a style vector is absent. Storage inputs keep their existing aligned GPUData batches; the model binds each batch directly, renders interleaved `compactGlyphVertexData` buffers containing offsets, glyph indexes, and global source `rowIndices`, and only allocates model-owned storage for generated glyph state, small fallback/style config buffers, glyph definitions, and optional packed clip rectangles. Large generated glyph payloads are split into multiple render batches when device buffer limits require it. Text anchors use `Uint8` row enums `0=start`, `1=middle`, `2=end`; alignment baselines use `0=center`, `1=top`, `2=bottom`.

Both render paths keep caller-owned row vectors separate from model-generated per-glyph data. The attribute path stores generated offsets, inline glyph frames, and row ids in `expandedGlyphVertexData`; the storage path stores generated offsets, glyph ids, and row ids in `compactGlyphVertexData`. That split keeps style vectors independently updateable while reducing generated glyph buffer fan-out.

Text input vectors:

| Input Vector | `ArrowTextModel` | `ArrowStorageTextModel` |
| --- | --- | --- |
| positions | `GPUVector<FixedSizeList<Float32>[2]>` | `GPUVector<FixedSizeList<Float32>[2]>` |
| texts | `GPUVector<Utf8>` | `GPUVector<Utf8>` |
| colors? | `GPUVector<FixedSizeList<Uint8>[4]>` | `GPUVector<FixedSizeList<Uint8>[4]>` |
| angles? | `GPUVector<Float32>` | `GPUVector<Float32>` |
| sizes? | `GPUVector<Float32>` | `GPUVector<Float32>` |
| pixel offsets? | `GPUVector<FixedSizeList<Float32>[2]>` | `GPUVector<FixedSizeList<Float32>[2]>` |
| clip rects? | `GPUVector<FixedSizeList<Int16>[4]>`; expanded into generated per-glyph vertex data. | `GPUVector<FixedSizeList<Int16>[4]>`; packed into row storage. |
| text anchors? | Custom label attribute/shader responsibility. | `GPUVector<Uint8>` |
| alignment baselines? | Custom label attribute/shader responsibility. | `GPUVector<Uint8>` |

Text draw buffers:

| Buffer | Attribute Model | Storage Model | Description |
| --- | --- | --- | --- |
| row positions | vertex | row | Per-label anchor positions for the currently bound input rows or storage batch. |
| row colors | vertex | row | Optional packed RGBA8 per-label colors, or a one-row storage fallback buffer. |
| row angles | vertex | row | Optional per-label rotation angles, or a one-row storage fallback buffer. |
| row sizes | vertex | row | Optional per-label text sizes, or a one-row storage fallback buffer. |
| row pixel offsets | vertex | row | Optional per-label pixel offsets, or a one-row storage fallback buffer. |
| row clip rects | - | row | Optional packed `Int16[4]` clip rectangles remain row storage in the storage model; the attribute model expands them into `expandedGlyphVertexData`. |
| expandedGlyphVertexData | vertex | - | Expanded 16-byte per-glyph vertex payload for the attribute model: model-generated offsets, inline glyph frames, and global source-row ids. Optional generated packed clip rectangles add 8 bytes per glyph. User-supplied row/style columns stay separate. Multiple buffers are emitted when device limits require batching. |
| compactGlyphVertexData | - | vertex | Compact 12-byte storage-path glyph payload: packed signed `Int16[2]` offsets, packed `Uint16[2]` glyph index word, and global source-row id. Multiple buffers are emitted when device limits require batching. |
| glyph frames | vertex | data | Per-glyph atlas frame attributes in the attribute model; shared atlas-frame storage indexed by glyph id in the storage model. |
| atlas texture | data | data | Font atlas sampled by the fragment shader. |
| sampler | data | data | Sampler paired with the atlas texture. |
| style config uniform | - | data | Per-draw fallback style values, row-style presence flags, clip flag, `batchRowIndexBase`, and SDF alpha threshold/smoothing. |

Call `createArrowStorageTextState(device, props)` when storage-state construction should be decoupled from rendering. The returned `ArrowStorageTextState` owns its storage buffers, atlas texture, generated render buffers, byte/timing diagnostics, row-binding batches, generated render batches, and a `destroy()` method. `ArrowStorageTextModel` accepts either the original GPUVector input props and owns the generated state, or `{storageState}` plus render overrides when the caller wants to reuse and manage that state directly. With `characterSet: 'auto'`, the CPU builds compact glyph IDs and spans before compute expansion. With an explicit non-auto character set, the state builder uploads normalized Arrow UTF-8 bytes plus row byte ranges and decodes glyph IDs directly on the GPU, avoiding CPU UTF-8/glyph-stream construction.

For streamed Arrow tables that retain source `GPURecordBatch` boundaries, `ArrowTextModel.appendTextBatches(...)` and `ArrowStorageTextModel.appendTextBatches(...)` convert only the newly arrived row batches into generated glyph render batches. Previously generated glyph buffers stay resident; one source batch may still fan out into multiple generated render batches when device buffer limits require splitting.

`getGpuUtf8MapShaderSource()` and `getGpuUtf8MapShaderBindings()` expose the reusable WebGPU UTF-8 mapping fragment behind that explicit-character-set path. Consumers can compose the shared sparse byte-indexed UTF-8 row traversal, code point decoding, and lookup-table mapping into a one-pass text-oriented compute shader without taking on a separate compact-output stage.
