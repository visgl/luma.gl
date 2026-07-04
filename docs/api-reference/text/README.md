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

`@luma.gl/arrow` owns Arrow source data, source mapping, upload, and Arrow UTF-8/dictionary preparation. It converts Arrow vectors into `GPUVector` objects or prepared GPU state, then constructs renderer models that only know about GPU-resident resources.

## Public Architecture

| Responsibility | Public APIs |
| --- | --- |
| Arrow conversion in `@luma.gl/arrow` | `makeGPUTextDataFromArrow()`, `ArrowTextRenderer`, source mapping helpers |
| Stable rendering in `@luma.gl/text` | `GPUTextData`, `TextRenderer` |
| Benchmark internals | `@luma.gl/text/experimental` specialized models and forced strategies |

New code should prepare caller-owned `GPUTextData`, pass it to `TextRenderer`, destroy the
renderer first, and then destroy the data.

```ts
const data = makeGPUTextDataFromArrow(device, textProps);
const renderer = new TextRenderer(device, {data});

renderer.draw(renderPass);

const nextData = makeGPUTextDataFromArrow(device, nextTextProps);
renderer.setProps({data: nextData});
data.destroy();

renderer.destroy();
nextData.destroy();
```

`setProps()` creates and binds the replacement model before destroying the previous model. It
never destroys caller-owned data. `destroy()` is idempotent and releases only the renderer's
render and picking models.

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

## Dictionary Path

Supported dictionary-encoded WebGPU input automatically uses compressed dictionary storage.

## Resource Ownership

`GPUTextData` owns source batches, generated buffers, atlas textures, and metrics. `TextRenderer`
and its internal models borrow these resources. Hosts must destroy renderers before their data.

Direct specialized model construction is intentionally unstable. Import the models and forced
strategy preparation contracts from `@luma.gl/text/experimental` only in benchmarks and
diagnostic tools.
