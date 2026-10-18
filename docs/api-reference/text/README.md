# @luma.gl/text

`@luma.gl/text` provides an intent-level facade for experimental GPU-only 2D text rendering.

## Font Atlases

`FontAtlas` is the common input format for atlas-backed text. It keeps glyph metrics, baseline and
line-height data, optional kerning, image pages, and fragment sampling settings together so layout
and rendering code do not branch on the source font format.

Import font preparation from the dependency-isolated subpath:

```ts
import {
  buildBitmapFontAtlas,
  buildMsdfFontAtlas,
  buildSdfFontAtlas,
  loadMsdfFontAtlas,
  measureFontAtlasText,
  type FontAtlas
} from '@luma.gl/text/fonts';
```

The subpath has no luma.gl, loaders.gl, or GPU module imports. Existing imports from
`@luma.gl/text` remain supported.

- `buildBitmapFontAtlas()` measures and rasterizes a browser font into a bitmap atlas.
- `buildSdfFontAtlas()` uses the same measurement and packing path, but rasterizes glyphs as signed
  distance fields and records the required threshold and smoothing settings.

SDF atlases request `ceil(radius * (1 - cutoff))` pixels of padding (9 pixels with the
defaults). Following deck.gl, this automatic padding is capped at
`floor(atlasWidth / 2 - fontSize)` to leave room for wide glyphs. Very large font sizes or
distance-field radii can therefore still truncate the field. Larger caller-provided
`buffer` values are preserved. Glyph frames from `buildSdfFontAtlas()` include the
rasterized padding while layout advances and baselines remain unchanged.

Both builders cache identical inputs and incrementally add newly requested characters.

`@luma.gl/arrow` owns Arrow source data, source mapping, upload, and Arrow UTF-8/dictionary preparation. It converts Arrow vectors into `GPUVector` objects or prepared GPU state, then constructs renderer models that only know about GPU-resident resources.

`ArrowTextRenderer` accepts `Utf8`, `Utf8View`, `Dictionary<Utf8>`, and
`Dictionary<Utf8View>` label vectors. `Utf8View` is detected at runtime and normalized before GPU
upload, so applications can use Apache Arrow 21.2 view columns while the package remains compatible
with Apache Arrow 17 runtimes. Binary and `BinaryView` columns are not text inputs.

## Glyph range fonts

`GlyphRangeLoader` reads Mapbox/MapLibre-compatible glyph PBF endpoints without a DOM or GPU.
`parseGlyphRange(bytes)` is also exported for callers that already own transport. Glyph bitmaps
include a three-pixel border; width, height, left/top bearings and advances use 24 pixels per em.

```ts
import {GlyphRangeLoader, buildGlyphFontAtlas} from '@luma.gl/text/fonts';

const glyphs = new GlyphRangeLoader({
  url: 'https://fonts.example.com/{fontstack}/{range}.pbf',
  maxRanges: 64,
  fetchOptions: {credentials: 'omit'}
});
const fontAtlas = await buildGlyphFontAtlas(glyphs, 'Noto Sans Regular', 'Hello');
// Supply fontAtlas to GPUTextResources as for other atlas builders.
```

Share one loader among consumers of the same endpoint and network policy. Concurrent range loads
share both fetch and decode; the least recently used completed ranges are evicted beyond
`maxRanges` (64 by default). In-flight ranges remain until they settle. A failed request rejects
all its waiters and is removed, so a later call retries. An absent glyph in a valid response is
omitted. No requests are issued for empty text. Font names are individually URL encoded;
dot-only names are rejected because URL parsers normalize them as path segments.

`loadGlyphs(fontStack, texts)` returns a snapshot map containing only requested code points.
The map survives cache eviction; treat its shared glyph records and bitmap bytes as read-only.
Call it again whenever the text or font stack changes, even if geometry is unchanged.
`createGlyphFontRenderer(glyphs)` adapts a loaded snapshot to the existing custom atlas renderer
interface, allowing callers to own packing themselves. Its `draw` result carries an explicit
`layoutOffsetX`: glyph bearings move the drawn text while bitmap cells remain separate.

`buildGlyphFontAtlas(loader, fontStack, characterSet)` waits for loading before packing and needs
a browser 2D canvas (`HTMLCanvasElement` or `OffscreenCanvas`). Each call creates an independent
atlas page, preserving server advances and bearings, with SDF threshold 0.75 and smoothing 0.1.
Missing glyphs have zero advance. Loader/decoder-only use works in Node and adds no dependency.
Local ideograph fallback, shaping, style selection, tile readiness, placement and GPU lifetime
remain consumer responsibilities. No MapLibre local-font substitution policy is imposed.

### Try glyph loading in Text Space Crawl

Run `yarn workspace luma.gl-examples-text-space-crawl start`, then choose **Server glyph SDF atlas**
in the Rendering control, or append `?textRendering=glyphs` to the example URL. It loads Noto Sans Regular
ranges from OpenFreeMap (network access required), packs them with `buildGlyphFontAtlas`, and draws
them through the same `AtlasTextRenderer` used by the other atlas modes. Switch away and back to
exercise the shared loader cache. No API key is required; the existing MSDF mode remains the default.

## Public Architecture

| Responsibility | Public APIs |
| --- | --- |
| CPU font preparation in `@luma.gl/text/fonts` | `FontAtlas`, atlas builders/loaders, mapping, kerning, and measurement |
| Arrow conversion in `@luma.gl/arrow` | `makeGPUTextDataFromArrow()`, `makeGPUTextDataFromArrowStream()`, `ArrowTextRenderer` |
| Stable rendering in `@luma.gl/text` | `GPUTextResources`, `GPUTextData`, `TextRenderer` |
| Benchmark internals | `@luma.gl/text/experimental` specialized models and forced strategies |

`FontAtlas` contains CPU-side pages and metrics. `GPUTextResources` owns their device-specific
texture upload and can be shared by any number of prepared batches and renderers. Each
`GPUTextData` owns one source batch's generated buffers while borrowing the shared resources.

```ts
const resources = new GPUTextResources(device, {fontAtlas});
const data = makeGPUTextDataFromArrow(device, {...textProps, resources});
const renderer = new TextRenderer(device, {data});

renderer.draw(renderPass);

const nextData = makeGPUTextDataFromArrow(device, {...nextTextProps, resources});
for (const batch of nextData) renderer.appendData(batch);

renderer.destroy();
for (const batch of data) batch.destroy();
for (const batch of nextData) batch.destroy();
resources.destroy();
```

`appendData()` adds a prepared source batch without reconstructing the model or touching existing
batches. `setProps()` remains available for complete replacement. Neither method destroys
caller-owned data, and `destroy()` releases only the renderer's render and picking models.

`makeGPUTextDataFromArrowStream()` yields one `GPUTextData` per source chunk and preserves global
row and glyph bases. The caller appends each yielded object and retains it until the renderer is
destroyed. `ArrowTextRenderer.create()` is the convenience path for raw Arrow streams: it creates
and owns shared resources internally and incrementally uploads and appends each arriving batch.

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

Atlas-backed text requires a normalized `fontAtlas`. Use `@luma.gl/text/fonts` to build browser-font
atlases explicitly with `buildBitmapFontAtlas()` or `buildSdfFontAtlas()`, or load BMFont JSON MSDF
atlases with `buildMsdfFontAtlas()` or `loadMsdfFontAtlas()` before constructing a text renderer or
model.

## Storage Path

Supported WebGPU inputs automatically use storage-backed text.

`TextRowIndexedStorageModel` stores one extra source-row index per generated glyph. This avoids shader-side row lookup by binary search at the cost of a larger generated glyph vertex record.

## Clip Rectangles

Arrow text clipping is optional. When `clipRects` is absent, renderers bind a constant disabled
rectangle and do not maintain one rectangle per text row. When supplied, the column is a
`FixedSizeList<Float32, 4>` (or a `GPUVector<'float32x4'>`) containing `[x, y, width, height]`.
Negative width disables horizontal clipping and negative height disables vertical clipping.

In `ArrowTextLayer`, rectangle values are world-space offsets from the text anchor. The layer
projects the rectangle through the active deck viewport, including independent X/Y scale and
`flipY`. `contentAlignHorizontal` and `contentAlignVertical` can keep text aligned to the visible
part of a partially off-screen rectangle; `contentCutoffPixels` hides content when the visible
rectangle becomes smaller than the requested screen-pixel threshold. Glyph atlas coordinates are
independent of this feature—the rectangle clips positioned text, not atlas sampling.

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

## Custom browser font atlases

`@luma.gl/text/fonts` exports `buildBrowserFontAtlas`, `resolveBrowserFontAtlasSettings`,
and the `BrowserFontRenderer` type for integrations that supply their own glyph images.
The renderer measures glyphs and font-wide metrics and returns `ImageData` for each glyph.
Omitting `cacheKey` builds an independent atlas; callers that opt into shared caching must
provide a key that uniquely identifies the renderer and all rasterization settings.

```ts
import {buildBrowserFontAtlas, resolveBrowserFontAtlasSettings} from '@luma.gl/text/fonts';

const atlas = buildBrowserFontAtlas({
  settings: resolveBrowserFontAtlasSettings({characterSet: 'Hello'}),
  renderSettings: {mode: 'bitmap', threshold: 0, smoothing: 0},
  createRenderer: defaultMeasure => ({
    measure: defaultMeasure,
    draw: character => drawCustomGlyph(character)
  })
});
```

`setFontAtlasCacheLimit(limit)` resets the shared browser-font atlas cache and sets its
capacity. The default and minimum capacity are three atlases. Set it once during application
initialization; changing it clears existing cache entries. Uncached custom atlases are unaffected.
