# @luma.gl/text

`@luma.gl/text` provides experimental GPU-only 2D text rendering utilities.

## Font Atlases

`FontAtlas` is the common input format for atlas-backed text. It keeps glyph metrics, baseline and
line-height data, optional kerning, image pages, and fragment sampling settings together so layout
and rendering code do not branch on the source font format.

- `buildBitmapFontAtlas()` measures and rasterizes a browser font into a bitmap atlas.
- `buildSdfFontAtlas()` uses the same measurement and packing path, but rasterizes glyphs as signed
  distance fields and records the required threshold and smoothing settings.

Both builders cache identical inputs and incrementally add newly requested characters.

`@luma.gl/arrow` owns Arrow source data, source mapping, upload, and Arrow UTF-8/dictionary preparation. It converts Arrow vectors into `GPUVector` objects or prepared GPU state, then constructs renderer models that only know about GPU-resident resources.

## Public Architecture

| Responsibility | Public APIs |
| --- | --- |
| Arrow facade in `@luma.gl/arrow` | `ArrowTextRenderer`, `resolveArrowTextSourceVectors()`, `convertArrowTextToAttribute()`, `convertArrowTextToStorage()`, `convertArrowTextToDictionary()` |
| Pure rendering in `@luma.gl/text` | `TextAttributeModel`, `TextStorageModel`, `TextRowIndexedStorageModel`, `TextDictionaryModel` |
| GPU input contracts in `@luma.gl/text` | `TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA`, `TEXT_STORAGE_GPU_INPUT_SCHEMA`, `TEXT_DICTIONARY_GPU_INPUT_SCHEMA` |

New code should perform Arrow conversion through `@luma.gl/arrow` and construct one of the pure models with flat prepared props.

## Attribute Path

Use `convertArrowTextToAttribute()` to upload Arrow source vectors, then `convertArrowTextToAttributeModelProps()` to build flat model props for `TextAttributeModel`.

The attribute path supports row colors and per-character color lists. It expands text rows into generated glyph vertex attributes and renders through a GPU table.

Atlas-backed text requires a normalized `fontAtlas`. Build browser-font atlases explicitly with
`buildBitmapFontAtlas()` or `buildSdfFontAtlas()` before constructing a text renderer or model.

## Storage Path

Use `convertArrowTextToStorage()` and `convertArrowTextToStorageModelProps()` when rendering with WebGPU storage buffers. Pass the resulting flat props to `TextStorageModel` or `TextRowIndexedStorageModel`.

`TextRowIndexedStorageModel` stores one extra source-row index per generated glyph. This avoids shader-side row lookup by binary search at the cost of a larger generated glyph vertex record.

## Dictionary Path

Use `convertArrowTextToDictionary()` and `convertArrowTextToDictionaryModelProps()` for dictionary-encoded UTF-8 text. The dictionary model stores shared glyph records per dictionary value and per-row dictionary references.

## Resource Ownership

Conversion results and prepared props own GPU resources. Layers should destroy converted `GPUVector` bundles when they are replaced or removed. Models should be constructed with `ownsAttributeState` or `ownsStorageState` when the model should destroy prepared resources.
