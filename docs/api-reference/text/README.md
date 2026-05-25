# @luma.gl/text

`@luma.gl/text` provides experimental 2D text rendering utilities built around a clean split between data conversion and rendering.

Layer or data-preparation code owns Arrow source data. It converts Arrow vectors into `GPUVector` objects or prepared GPU state, then constructs renderer models that only know about GPU-resident resources.

## Public Architecture

| Responsibility | Public APIs |
| --- | --- |
| Arrow-to-GPUVector upload | `convertArrowTextToAttribute()`, `convertArrowTextToStorage()`, `convertArrowTextToDictionary()` |
| Arrow-to-prepared-state conversion | `convertArrowTextToAttributeState()`, `convertArrowTextToStorageState()`, `convertArrowTextToDictionaryState()` |
| Pure rendering | `AttributeTextModel`, `StorageTextModel`, `RowIndexedStorageTextModel`, `DictionaryTextModel` |
| UTF-8/glyph utilities | `buildArrowUtf8Chunks()`, `buildGpuUtf8TextInput()`, `buildGpuDictionaryUtf8TextInput()`, `buildArrowGlyphLayout()` |

The deprecated Arrow wrapper models are intentionally not exported. New code should perform conversion in the layer and construct one of the pure models with prepared state.

## Attribute Path

Use `convertArrowTextToAttribute()` to upload Arrow source vectors, then `convertArrowTextToAttributeState()` to build glyph-instance attributes. Pass the result to `AttributeTextModel`.

The attribute path supports row colors and per-character color lists. It expands text rows into generated glyph vertex attributes and renders through a GPU table.

## Storage Path

Use `convertArrowTextToStorage()` and `convertArrowTextToStorageState()` when rendering with WebGPU storage buffers. Pass the resulting state to `StorageTextModel` or `RowIndexedStorageTextModel`.

`RowIndexedStorageTextModel` stores one extra source-row index per generated glyph. This avoids shader-side row lookup by binary search at the cost of a larger generated glyph vertex record.

## Dictionary Path

Use `convertArrowTextToDictionary()` and `convertArrowTextToDictionaryState()` for dictionary-encoded UTF-8 text. The dictionary model stores shared glyph records per dictionary value and per-row dictionary references.

## Resource Ownership

Conversion results and prepared states own GPU resources. Layers should destroy converted `GPUVector` bundles when they are replaced or removed. Models should be constructed with `ownsAttributeState` or `ownsStorageState` when the model should destroy prepared state resources.
