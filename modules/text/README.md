# @luma.gl/text

Experimental text utilities for luma.gl. The package contains:

- 3D text geometry helpers adapted from THREE.js text and extrusion utilities.
- Arrow-native 2D text utilities adapted from deck.gl's atlas and text layout internals.
- `ArrowTextModel`, an `ArrowModel`-derived one-line label renderer that expands UTF-8 `GPUVector` rows into glyph instances.
- `ArrowStorageTextModel`, a WebGPU-only renderer that consumes storage-backed glyph state generated from UTF-8 `GPUVector` input or supplied as reusable `ArrowStorageTextState`.

## Usage

```ts
import {TextGeometry, parseFont} from '@luma.gl/text/text-3d'
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
import {GPUVector, makeArrowFixedSizeListVector} from '@luma.gl/arrow'
import {ArrowTextModel} from '@luma.gl/text'

const labelVectors = {
  positions: new GPUVector({
    type: 'arrow',
    name: 'positions',
    device,
    vector: makeArrowFixedSizeListVector(
      new arrow.Float32(),
      2,
      new Float32Array([0, 0, 0.5, 0.25])
    )
  })
}
const texts = new GPUVector({
  type: 'arrow',
  name: 'texts',
  device,
  vector: arrow.vectorFromArray(['hello', 'luma.gl'], new arrow.Utf8())
})

const model = new ArrowTextModel(device, {
  id: 'arrow-text',
  labelVectors,
  texts,
  characterSet: 'auto',
  fontSettings: {sdf: true}
})
```

`ArrowTextModel` accepts GPU-resident label columns through `labelVectors`, with `texts` supplied as `GPUVector<Utf8>`. UTF-8 GPU vectors preserve one `GPUData` entry per Arrow source chunk and retain the chunk metadata needed for text expansion, so chunked and sliced sources stay addressable without collapsing them into one host string array. The model repeats compatible Arrow-backed label attributes for each glyph, emits generated `rowIndices` for source-row picking, and delegates GPU upload/update behavior to `ArrowModel`. Pass optional `clipRects` as `GPUVector<FixedSizeList<Int16>[4]>` rows containing `[x, y, width, height]` glyph-layout units; negative width or height disables clipping on that axis. The generated per-glyph clipping attribute stays packed at 8 bytes per glyph.

`ArrowStorageTextModel` is the WebGPU storage-backed path. It requires top-level `positions` as `GPUVector<FixedSizeList<Float32>[2]>` plus `texts`, accepts optional row-style `colors`, `angles`, `sizes`, `pixelOffsets`, `textAnchors`, and `alignmentBaselines` GPUVectors, and falls back to constant deck-like props when a style vector is absent. Storage inputs keep their existing aligned GPUData batches; the model binds each batch directly, renders generated glyph offsets, glyph indexes, and global source `rowIndices`, and only allocates model-owned storage for generated glyph state, small fallback/style config buffers, glyph definitions, and optional packed clip rectangles. Text anchors use `Uint8` row enums `0=start`, `1=middle`, `2=end`; alignment baselines use `0=center`, `1=top`, `2=bottom`.

Call `createArrowStorageTextState(device, props)` when storage-state construction should be decoupled from rendering. The returned `ArrowStorageTextState` owns its storage buffers, atlas texture, generated render buffers, byte/timing diagnostics, and a `destroy()` method. `ArrowStorageTextModel` accepts either the original GPUVector input props and owns the generated state, or `{storageState}` plus render overrides when the caller wants to reuse and manage that state directly. With `characterSet: 'auto'`, the CPU builds compact glyph IDs and spans before compute expansion. With an explicit non-auto character set, the state builder uploads normalized Arrow UTF-8 bytes plus row byte ranges and decodes glyph IDs directly on the GPU, avoiding CPU UTF-8/glyph-stream construction.

`getGpuUtf8MapShaderSource()` and `getGpuUtf8MapShaderBindings()` expose the reusable WebGPU UTF-8 mapping fragment behind that explicit-character-set path. Consumers can compose the shared sparse byte-indexed UTF-8 row traversal, code point decoding, and lookup-table mapping into a one-pass text-oriented compute shader without taking on a separate compact-output stage.
