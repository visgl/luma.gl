# @luma.gl/text

Experimental 2D text utilities for luma.gl. The package contains:

- GPU-only text input schemas and preparation primitives.
- `AttributeTextModel`, a one-line label renderer that renders prepared attribute vertex buffers.
- `StorageTextModel`, a WebGPU-only renderer that renders prepared storage-backed glyph state.
- `DictionaryTextModel`, a WebGPU-only renderer that renders prepared dictionary-compressed glyph state.

## Usage

```ts
import * as arrow from 'apache-arrow';
import {
  convertArrowTextToAttribute,
  convertArrowTextToAttributeModelProps,
  makeArrowFixedSizeListVector
} from '@luma.gl/arrow';
import {
  AttributeTextModel
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

const model = new AttributeTextModel(device, convertArrowTextToAttributeModelProps(device, {
  ...convertedText,
  characterSet: 'auto',
  fontSettings: {sdf: true}
}));
```

`@luma.gl/arrow` owns Arrow source vectors, table mapping, upload, and glyph preparation. `@luma.gl/text` models consume flat prepared GPUVector props plus generated GPU resources.

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
| compactGlyphVertexData | - | vertex | Compact storage-path glyph payload: packed offsets, glyph ids, and optional global source-row ids. |
| glyph frames | vertex | data | Per-glyph atlas frame attributes in the attribute model; shared atlas-frame storage indexed by glyph id in the storage model. |
| atlas texture | data | data | Font atlas sampled by the fragment shader. |
| sampler | data | data | Sampler paired with the atlas texture. |
| style config uniform | - | data | Per-draw fallback style values, row-style presence flags, clip flag, row bases, and SDF alpha threshold/smoothing. |

`getGpuUtf8MapShaderSource()` and `getGpuUtf8MapShaderBindings()` expose reusable WebGPU UTF-8 mapping helpers. Consumers can compose sparse UTF-8 byte traversal, code point decode, and lookup-table mapping into text-oriented compute shaders.
