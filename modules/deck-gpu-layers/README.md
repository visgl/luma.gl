# @deck.gl-community/gpu-layers

Reusable deck.gl layers for geographic rendering that consume caller-owned GPU buffers.

## Materialized Cartesian points

Use `GPUMaterializedPointLayer` to draw borrowed local `float32x2` positions and a
row-aligned `uint32` validity mask. A `GPUH3ProjectedPointSource` can produce those vectors
directly from resident split-uint64 H3 IDs. The source keeps the projected buffers across
updates. The layer reuses them for color rendering and picking.

```ts
import {GPUH3ProjectedPointSource, GPUMaterializedPointLayer} from '@deck.gl-community/gpu-layers';

const source = new GPUH3ProjectedPointSource(device, {
  cells, // GPUVector<'uint32x2'> with little-endian H3 IDs
  transform // ProjectionRenderTransform prepared for longitude/latitude input
});
source.updateChunks(); // Initial projection in source chunk order.

const layer = new GPUMaterializedPointLayer({
  id: 'h3-centers',
  positions: source.positions,
  validity: source.validity,
  transform: source.transform,
  getSourcePosition, // Optional CPU lookup for the picked row, for example from its H3 ID.
  pickable: true
});

// After a GPU producer updates the resident H3 buffer for chunk 1:
source.updateChunks([1]);
deck.redraw('H3 chunk updated');
```

Submit producer writes on the same device before calling `updateChunks`. Only the listed
nonempty chunks run H3 decoding and projection. Camera changes within the same frame and
picks need no source update. A pick returns global row and physical chunk identity. Supplying
both `transform` and `getSourcePosition` adds CPU projection metadata for the selected row.

The H3 source snapshots topology and the render frame. Create a replacement source when either
changes. Its inputs remain caller-owned. Detach the layer and let queued work finish before
destroying the source. The layer owns its draw model and leaves the position and validity
vectors with their owner. Pairing is opt-in via `groupChunks: true` and requires at least nine
storage bindings. A one-chunk update always uses a single projection dispatch.

## Inline CRS-projected points

`GPUProjectedPointLayer` renders raw binary64 coordinate pairs (`GPUVector<'uint32x4'>`) through a
prepared `ProjectionRenderTransform`, with an aligned `GPUVector<'uint32'>` validity mask. It borrows
vertex buffers and preserves their physical chunks. Projection and origin subtraction use the shared
platform-selected double-single implementation before narrowing local render coordinates to float32.

Use a non-geospatial Cartesian viewport such as `OrthographicView`, with explicit destination origin,
axis order and signed unit scales. Map/globe viewports, model matrices, extra coordinate origins and
altitude transforms are intentionally unsupported. The caller's `getSourcePosition(rowIndex)` CPU
mirror provides exact retained-transform picking metadata without reading the input buffers back.

See [GPU Project](https://luma.gl/docs/api-reference/experimental/gpu-project#inline-cartesian-rendering-and-cpu-picking)
for the frame, validity, invalidation and ownership contracts. This is interoperability coverage,
not a native projection optimization or a claim of GPU speedup.

## GPUVector layer core

The GPU layer family defines the rendering ABI below Arrow, classic JavaScript, and classic binary
inputs. It consumes caller-owned GPU data, does not import Apache Arrow, and never destroys input
vectors.

The fixed-width primitives are `GPUArcLayer`, `GPUColumnLayer`, `GPUGridCellLayer`, `GPUIconLayer`,
`GPULineLayer`, `GPUPointCloudLayer`, and `GPUScatterplotLayer`. They consume row-aligned
`GPUVector` objects. Each layer owns one `GPUVectorModel`, which preserves every physical chunk as
a separate draw call without creating a model or deck child layer per chunk. `GPUBitmapLayer`
accepts an already loaded `Texture`; a bitmap has no tabular column to convert.

```ts
import {GPUScatterplotLayer} from '@deck.gl-community/gpu-layers';

const layer = new GPUScatterplotLayer({
  id: 'points',
  getPosition: positions, // GPUVector<'float32x2'>
  getRadius: radii, // number or GPUVector<'float32'>
  getFillColor: colors // Color or GPUVector<'unorm8x4'>
});
```

All non-constant vectors must have identical row counts and physical chunk boundaries. This makes
streaming and ownership deterministic: adapters append batches explicitly, while the renderer
neither combines nor repacks them. Picking uses global row indices and attaches physical batch
provenance as `PickingInfo.gpuVector`.

Variable geometry stays GPU-native as well:

- `GPUPathLayer` consumes `GPUVector<'vertex-list<float32xN>'>` and expands segments on the GPU.
- `GPUSolidPolygonLayer` consumes tessellated position, row-index, color, and triangle-index
  GPUVectors prepared by an adapter.
- `GPUPolygonLayer` composes the solid fill and path outline cores without copying either input.
- `GPUTextLayer` consumes caller-owned `GPUTextData`, whose chosen strategy owns glyph GPUVectors
  and atlas metadata.

GeoJSON and GeoArrow are source formats rather than rendering primitives. Their adapters split
features into these GPU cores. The same rule applies to future classic JavaScript and classic
binary compatibility: each input family converts or borrows GPUVectors and delegates to the same
renderer.

`GPUSpatialPointLayer` binds caller-owned position and point-ID buffers directly and replays a
caller-owned `DrawCommandBuffer`. The layer owns only its render model and style-uniform buffer;
query results, indirect commands, and source positions remain owned by the application.

The command buffer must use the non-indexed `draw` layout. Its selected record keeps
`vertexCount: 6` and `firstVertex: 0`; GPU queries normally update only `instanceCount`.

The root layer entry point deliberately does not import Arrow, GeoArrow, or the GPU Spatial query
algorithms. Applications can produce the fixed-width buffers with any ingestion and query pipeline;
the optional query entry point described below supplies one reusable geographic workflow.

```ts
import {GPUSpatialPointLayer} from '@deck.gl-community/gpu-layers';

const layer = new GPUSpatialPointLayer({
  id: 'selected-points',
  pickable: true,
  positions,
  pointIds: selectedPointIds,
  drawCommands,
  commandIndex: 0,
  color: [60, 220, 245, 210],
  radiusPixels: 1.5,
  radiusScale: viewport => Math.max(1, 2 ** ((viewport.zoom - 12) * 0.15)),
  highlightRadiusScale: 1.5
});
```

`positions` contains packed `vec2<f32>` rows interpreted through the layer's Deck coordinate
settings. `pointIds` contains `u32` row indices into that buffer. Picking returns those row indices
through Deck's normal `PickingInfo.index` field, so an application can map them to its own source
metadata without a readback.

Deck's RGB24 picking reserves zero for “no object,” so indices through `16_777_214` are pickable.
Larger indices continue to render but are intentionally omitted from the picking pass; use compact
resident row indices and keep any global corpus-ID mapping in the application.

## Geographic point queries

The optional `@deck.gl-community/gpu-layers/query` subpath adds a WebGPU Deck effect that projects
WGS84 longitude/latitude rows into local kilometres, builds a flat uniform-grid index once, and
runs viewport-bounds plus local-radius queries before each draw. It keeps result IDs and clamped
counts on the GPU; the two `outputs` objects can be passed directly to `GPUSpatialPointLayer`.

```ts
import {GPUSpatialPointLayer} from '@deck.gl-community/gpu-layers';
import {GPUSpatialGeographicPointQueryEffect} from '@deck.gl-community/gpu-layers/query';

const queryEffect = new GPUSpatialGeographicPointQueryEffect(device, {
  longitudeLatitudes,
  sourceBounds: [-74.1, 40.65, -73.84, 40.85],
  projectionOrigin: [-73.97, 40.75],
  projectedBounds: [-12, -10, 12, 10],
  gridSize: [256, 256],
  initialSelection: {center: [-73.9855, 40.758], radiusKilometres: 0.35},
  selectionRadiusRangeKilometres: [0.05, 5],
  onStats: stats => updateInspector(stats.inspectorSnapshot)
});

const contextLayer = new GPUSpatialPointLayer({
  id: 'context-points',
  ...queryEffect.outputs.viewport
});
const selectionLayer = new GPUSpatialPointLayer({
  id: 'selected-points',
  ...queryEffect.outputs.selection
});

deck.setProps({effects: [queryEffect], layers: [contextLayer, selectionLayer]});
queryEffect.setSelection([-73.99, 40.75], 0.5);
```

The caller supplies source bounds in WGS84 degrees and projected bounds in the same
cuSpatial-compatible sinusoidal space selected by `projectionOrigin`. The effect compiles an
adaptive GPU Project plan once and uses it for both resident rows and mutable selections. This keeps
ingestion and source metadata outside the package. Use
`setSelection`, `setSelectionRadius`, and `getSelection` for the mutable radius query. Set
`viewportId` when a Deck instance has multiple views; otherwise the first viewport is queried.

Selection centers pass through the same GPU projection kernel as resident points. CPU-derived
viewport corners are conservatively expanded by 20 metres, matching the documented projection
error envelope; set `viewportProjectionPaddingKilometres` to override that expansion.

`drawCommands` and `inspector` remain public for custom renderers and inspector UIs. Diagnostics
are sampled asynchronously and never gate the GPU-driven render path. Readbacks are enabled when
`onStats` is supplied, or explicitly with `enableDiagnostics`. The effect owns every buffer and
graph it creates; Deck calls `cleanup`, while applications may call `destroy` when an effect is
constructed but never adopted.

## Tiled sources

Tiled GPUVector and Arrow adapters are intentionally outside this layer core. They should integrate
with deck.gl's proposed shared tile layer so cache ownership, refinement, cancellation, and request
deduplication remain common infrastructure rather than being reimplemented in this package.

## Visual effects

The Deck visual effects and Wind Atlas are maintained in the [deck.gl-community examples gallery](https://visgl.github.io/deck.gl-community/examples).
