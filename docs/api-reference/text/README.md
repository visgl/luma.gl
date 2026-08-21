# @luma.gl/text

`@luma.gl/text` provides an intent-level facade for experimental GPU-only 2D text rendering.

## Font Atlases

`FontAtlas` is the common input format for atlas-backed text. It keeps glyph metrics, baseline and
line-height data, optional kerning, image pages, and fragment sampling settings together so layout
and rendering code do not branch on the source font format.

- `buildBitmapFontAtlas()` measures and rasterizes a browser font into a bitmap atlas.
- `buildSdfFontAtlas()` uses the same measurement and packing path, but rasterizes glyphs as signed
  distance fields and records the required threshold and smoothing settings.

Both builders cache identical inputs and incrementally add newly requested characters.

## Public Architecture

| Responsibility | Public APIs |
| --- | --- |
| Stable rendering in `@luma.gl/text` | `GPUTextResources`, `GPUTextData`, `TextRenderer` |
| Adapter and benchmark internals | `@luma.gl/text/experimental` preparation contracts, specialized models, and forced strategies |

`FontAtlas` contains CPU-side pages and metrics. `GPUTextResources` owns their device-specific
texture upload and can be shared by any number of prepared batches and renderers. Each
`GPUTextData` owns one source batch's generated buffers while borrowing the shared resources.

`appendData()` adds a prepared source batch without reconstructing the model or touching existing
batches. `setProps()` remains available for complete replacement. Neither method destroys
caller-owned data, and `destroy()` releases only the renderer's render and picking models.

## Automatic Strategy Selection

| Condition | Strategy |
| --- | --- |
| WebGL, per-character colors, or unsupported WebGPU storage | Attribute |
| Supported WebGPU dictionary input | Dictionary storage |
| Other supported WebGPU text | Storage |

Row-indexed storage remains force-selectable from `@luma.gl/text/experimental` for benchmarks but
is not selected automatically.

`GPUTextData.stats` exposes strategy, row and glyph counts, source and render batch counts,
preparation time, retained bytes, and transient compute-input bytes. Strategy-specific buffers,
schemas, shader contracts, and prepared state remain experimental.

## Attribute Path

The automatic strategy uses the attribute path for WebGL and per-character colors.

The attribute path supports row colors and per-character color lists. It expands text rows into generated glyph vertex attributes and renders through a GPU table.

Atlas-backed text requires a normalized `fontAtlas`. Build browser-font atlases explicitly with
`buildBitmapFontAtlas()` or `buildSdfFontAtlas()`, or load BMFont JSON MSDF atlases with
`buildMsdfFontAtlas()` or `loadMsdfFontAtlas()` before constructing a text renderer or model.

## Storage Path

Supported WebGPU inputs automatically use storage-backed text.

`TextRowIndexedStorageModel` stores one extra source-row index per generated glyph. This avoids shader-side row lookup by binary search at the cost of a larger generated glyph vertex record.

## Clip Rectangles

Text clipping is optional. When `clipRects` is absent, renderers bind a constant disabled rectangle
and do not maintain one rectangle per text row. When supplied, use a `GPUVector<'float32x4'>`
containing `[x, y, width, height]`.
Negative width disables horizontal clipping and negative height disables vertical clipping.

## Dictionary Path

Supported dictionary-encoded WebGPU input automatically uses compressed dictionary storage.

## Resource Ownership

`GPUTextData` owns one source batch and its generated buffers. `GPUTextResources` separately owns
the uploaded atlas texture. `TextRenderer` and its internal models borrow both. Destroy renderers
first, then every data batch, and finally the shared resources. This split permits multiple
renderers and streams to share one atlas upload without hidden caches or ambiguous ownership.

Direct specialized model construction is intentionally unstable. Import the models and forced
strategy preparation contracts from `@luma.gl/text/experimental` only in benchmarks and
diagnostic tools.
