# @luma.gl/text

Experimental text utilities for luma.gl. The package contains:

- 3D text geometry helpers adapted from THREE.js text and extrusion utilities.
- Arrow-native 2D text utilities adapted from deck.gl's atlas and text layout internals.
- `ArrowTextModel`, an `ArrowModel`-derived one-line label renderer that expands Arrow UTF-8 rows into glyph instances.
- `ArrowStorageTextModel`, a WebGPU-only renderer that consumes storage-backed glyph state generated from Arrow UTF-8 input or supplied as reusable `ArrowStorageTextState`.

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

`ArrowTextModel` keeps label text in Arrow UTF-8 form while it builds glyph rows, repeats compatible Arrow-backed label attributes for each glyph, emits generated `rowIndices` for source-row picking, and delegates GPU upload/update behavior to `ArrowModel`. Pass optional Arrow `clipRects` as `FixedSizeList<Int16>[4]` rows containing `[x, y, width, height]` glyph-layout units; negative width or height disables clipping on that axis. The generated per-glyph clipping attribute stays packed at 8 bytes per glyph.

`ArrowStorageTextModel` is the WebGPU storage-backed path. It requires `labelTable.positions` as `FixedSizeList<Float32>[2]`, stores those rows once in a read-only storage buffer, stores optional `clipRects` once as two packed `uint32` words per label, keeps shared glyph frame definitions in storage, and renders generated glyph offsets, glyph indexes, and source `rowIndices`. Arbitrary extra numeric label columns are intentionally not exposed through storage in this first pass.

Call `createArrowStorageTextState(device, props)` when storage-state construction should be decoupled from rendering. The returned `ArrowStorageTextState` owns its storage buffers, atlas texture, generated render buffers, byte/timing diagnostics, and a `destroy()` method. `ArrowStorageTextModel` accepts either the original Arrow input props and owns the generated state, or `{storageState}` plus render overrides when the caller wants to reuse and manage that state directly. With `characterSet: 'auto'`, the CPU builds compact glyph IDs and spans before compute expansion. With an explicit non-auto character set, the state builder uploads normalized Arrow UTF-8 bytes plus row byte ranges and decodes glyph IDs directly on the GPU, avoiding CPU UTF-8/glyph-stream construction.
