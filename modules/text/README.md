# @luma.gl/text

Experimental text utilities for luma.gl. The package contains:

- 3D text geometry helpers adapted from THREE.js text and extrusion utilities.
- Arrow-native 2D text utilities adapted from deck.gl's atlas and text layout internals.
- `ArrowTextModel`, an `ArrowModel`-derived one-line label renderer that expands Arrow UTF-8 rows into glyph instances.
- `StorageTextModel`, a WebGPU-only renderer that keeps per-label positions and packed clip rects in read-only storage buffers addressed by glyph `rowIndex`.
- `StorageIndexedTextModel`, a WebGPU-only variant that also stores shared glyph atlas frames once in a storage buffer and keeps compact glyph frame indexes in each glyph row.
- `GpuExpandedTextModel`, a WebGPU-only compute path that uploads compact glyph streams and expands renderable glyph instances on the GPU.
- `IndirectTextModel`, which stores per-glyph `uint16` frame indexes and reads shared `Float32x4` atlas frames from a texture.

## Usage

```ts
import {TextGeometry, parseFont} from '@luma.gl/text'
import helvetiker from './fonts/helvetiker_regular.typeface.json'

const font = parseFont(helvetiker)
const geometry = new TextGeometry('Hello luma.gl', {
  font,
  align: 'center',
  size: 24,
  depth: 4,
  curveSegments: 8,
  bevelEnabled: true,
  bevelThickness: 1,
  bevelSize: 0.5,
  bevelSegments: 2
})
```

The resulting `TextGeometry` exposes position, normal, and UV attributes ready for consumption by luma.gl models.

## Arrow-Native 2D Text

```ts
import * as arrow from 'apache-arrow'
import {makeArrowFixedSizeListVector} from '@luma.gl/arrow'
import {ArrowTextModel} from '@luma.gl/text'

const labelTable = new arrow.Table({
  positions: makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 0.5, 0.25])
  )
})
const texts = arrow.vectorFromArray(['hello', 'luma.gl'], new arrow.Utf8())

const model = new ArrowTextModel(device, {
  id: 'arrow-text',
  labelTable,
  texts,
  characterSet: 'auto',
  fontSettings: {sdf: true}
})
```

`ArrowTextModel` keeps label text in Arrow UTF-8 form while it builds glyph rows, repeats compatible Arrow-backed label attributes for each glyph, emits generated `rowIndices` for source-row picking, and delegates GPU upload/update behavior to `ArrowModel`. Pass optional Arrow `clipRects` as `FixedSizeList<Int16>[4]` rows containing `[x, y, width, height]` glyph-layout units; negative width or height disables clipping on that axis. The generated per-glyph clipping attribute stays packed at 8 bytes per glyph. `IndirectTextModel` exposes the same Arrow-facing contract while reducing per-glyph frame attributes to a shared texture lookup.

`StorageTextModel` narrows that contract for WebGPU memory experiments. It requires `labelTable.positions` as `FixedSizeList<Float32>[2]`, stores those rows once in a read-only storage buffer, stores optional `clipRects` once as two packed `uint32` words per label, and leaves glyph rows with only offsets, direct atlas frames, and source `rowIndices`. Arbitrary extra numeric label columns are intentionally not exposed through storage in this first pass.

`StorageIndexedTextModel` keeps the same row-storage contract, but deduplicates atlas frame rectangles too. Glyph rows carry padded `uint16` frame indexes, while the referenced `Float32x4` frame records live in a read-only WebGPU storage buffer.

`GpuExpandedTextModel` keeps the same Arrow UTF-8 and row-storage contract while moving per-glyph render-instance generation into a WebGPU compute pass. With `characterSet: 'auto'`, the CPU produces compact packed glyph IDs, row glyph spans, and shared glyph definitions; compute generates glyph offsets, frame indexes, and source row indexes before rendering. With an explicit non-auto character set, the model instead uploads normalized Arrow UTF-8 bytes plus row byte ranges and decodes glyph IDs directly on the GPU, avoiding CPU UTF-8/glyph-stream construction. That direct-decode path reserves one render slot per UTF-8 byte, so continuation-byte slots are emitted as invisible records; ASCII-heavy inputs are effectively exact. Transient compute inputs are released after expansion, leaving only generated render buffers plus row and atlas-frame state for drawing.
