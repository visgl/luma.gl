# @luma.gl/text

Experimental 2D text utilities for luma.gl. The package contains:

- `FontAtlas`, the normalized glyph metrics, image pages, and sampling settings used by
  atlas-backed text.
- `buildBitmapFontAtlas()` and `buildSdfFontAtlas()`, explicit browser-font atlas builders.
- `GPUTextData`, caller-owned prepared text resources with representation-independent statistics.
- `TextRenderer`, a stable facade that borrows `GPUTextData` and selects an internal model.
- An `@luma.gl/text/experimental` entry point for forced strategies and low-level benchmarks.

## Usage

```ts
import * as arrow from 'apache-arrow';
import {
  makeGPUTextDataFromArrow,
  convertArrowTextToAttribute,
  makeArrowFixedSizeListVector
} from '@luma.gl/arrow';
import {
  buildSdfFontAtlas,
  TextRenderer
} from '@luma.gl/text';

const sourceVectors = {
  positions: makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 0.5, 0.25])
  ),
  texts: arrow.vectorFromArray(['hello', 'luma.gl'], new arrow.Utf8())
};

const convertedText = convertArrowTextToAttribute(device, {
  sourceVectors
});
const fontAtlas = buildSdfFontAtlas({characterSet: 'helo,lum.ag'});

const data = makeGPUTextDataFromArrow(device, {
  ...convertedText,
  fontAtlas,
  destroy: convertedText.destroy
});
const renderer = new TextRenderer(device, {data});

// Later, replace data without invalidating the old buffers while they are still bound.
const nextSourceVectors = {
  ...sourceVectors,
  texts: arrow.vectorFromArray(['updated', 'labels'], new arrow.Utf8())
};
const nextConvertedText = convertArrowTextToAttribute(device, {sourceVectors: nextSourceVectors});
const nextData = makeGPUTextDataFromArrow(device, {
  ...nextConvertedText,
  fontAtlas,
  destroy: nextConvertedText.destroy
});
renderer.setProps({data: nextData});
data.destroy();

// Destroy borrowing models before caller-owned data.
renderer.destroy();
nextData.destroy();
```

`@luma.gl/arrow` owns Arrow column mapping and conversion. The returned `GPUTextData` owns
uploaded and generated GPU resources. `TextRenderer` and its internal render/picking models borrow
that data.

Automatic strategy selection uses attributes for WebGL, per-character colors, and fallback;
dictionary storage for supported WebGPU dictionary input; and storage for other supported WebGPU
text. Row-indexed storage is available only through `@luma.gl/text/experimental` until benchmark
data supports an automatic-selection heuristic.

`GPUTextData.stats` reports the selected strategy, row and glyph counts, preserved source and
render batch counts, preparation time, retained bytes, and transient compute-input bytes without
exposing implementation buffers.

Atlas-backed text consumes the common `FontAtlas` format. Build generated browser-font atlases
with `buildBitmapFontAtlas()` or `buildSdfFontAtlas()`. Build or load BMFont JSON MSDF atlases
with `buildMsdfFontAtlas()` or `loadMsdfFontAtlas()`.

Text input vector support:

| Input Vector | Attribute State | Storage State |
| --- | --- | --- |
| positions | `GPUVector<'float32x2'>` | `GPUVector<'float32x2'>` |
| texts | `GPUVector<ValueList<'uint8'> \| Int>` | `GPUVector<ValueList<'uint8'> \| Int>` |
| colors? | `GPUVector<'unorm8x4' \| VertexList<'unorm8x4'>>` | `GPUVector<'unorm8x4'>` |
| angles? | `GPUVector<'float32'>` | `GPUVector<'float32'>` |
| sizes? | `GPUVector<'float32'>` | `GPUVector<'float32'>` |
| pixel offsets? | `GPUVector<'float32x2'>` | `GPUVector<'float32x2'>` |
| clip rects? | Expanded into generated per-glyph vertex data. | Packed into row storage. |
| text anchors? | Custom label attribute/shader responsibility. | `GPUVector<'uint8'>` |
| alignment baselines? | Custom label attribute/shader responsibility. | `GPUVector<'uint8'>` |

Text column support:

| Text Vector | Attribute State | Storage State | Dictionary State |
| --- | --- | --- | --- |
| `Vector<Utf8>` | Supported | Supported | Not supported |
| `Vector<Dictionary<Utf8, Int8 \| Int16 \| Int32 \| Uint8 \| Uint16 \| Uint32>>` | Supported | Supported | Supported with compressed dictionary glyph storage |

Text draw buffers:

| Buffer | Attribute Model | Storage Model | Description |
| --- | --- | --- | --- |
| row positions | vertex | row | Per-label anchor positions for the currently bound input rows or storage batch. |
| row colors | vertex | row | Optional packed RGBA8 per-label colors, or a one-row storage fallback buffer. |
| row angles | vertex | row | Optional per-label rotation angles, or a one-row storage fallback buffer. |
| row sizes | vertex | row | Optional per-label text sizes, or a one-row storage fallback buffer. |
| row pixel offsets | vertex | row | Optional per-label pixel offsets, or a one-row storage fallback buffer. |
| row clip rects | - | row | Optional packed `Int16[4]` clip rectangles remain row storage in the storage model; the attribute model expands them into `expandedGlyphVertexData`. |
| expandedGlyphVertexData | vertex | - | Expanded per-glyph vertex payload for the attribute model: model-generated offsets, inline glyph frames, and global source-row ids. |
| compactGlyphVertexData | - | vertex | Compact text-storage glyph payload: packed offsets, glyph ids, and optional global source-row ids. |
| glyph frames | vertex | data | Per-glyph atlas frame attributes in the attribute model; shared atlas-frame storage indexed by glyph id in the storage model. |
| atlas texture | data | data | Font atlas sampled by the fragment shader. |
| sampler | data | data | Sampler paired with the atlas texture. |
| style config uniform | - | data | Per-draw fallback style values, row-style presence flags, clip flag, row bases, and font alpha settings. |

`getGpuUtf8MapShaderSource()` and `getGpuUtf8MapShaderBindings()` expose reusable WebGPU UTF-8 mapping helpers. Consumers can compose sparse UTF-8 byte traversal, code point decode, and lookup-table mapping into text-oriented compute shaders.
