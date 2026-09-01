# @deck.gl-community/gpu-layers

Reusable deck.gl layers for GPU-selected spatial data.

## GPUVector layer core

The GPU layer family defines the rendering ABI below Arrow, classic JavaScript, and classic binary
inputs. It consumes caller-owned GPU data, does not import Apache Arrow, and never destroys input
vectors.

The fixed-width primitives are `GPUArcLayer`, `GPUColumnLayer`, `GPUGridCellLayer`, `GPUIconLayer`,
`GPULineLayer`, `GPUPointCloudLayer`, and `GPUScatterplotLayer`. They consume row-aligned
`GPUVector` objects and preserve every physical chunk as a separate draw batch. `GPUBitmapLayer`
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

`LuSpatialPointLayer` binds caller-owned position and point-ID buffers directly and replays a
caller-owned `DrawCommandBuffer`. The layer owns only its render model and style-uniform buffer;
query results, indirect commands, and source positions remain owned by the application.

The command buffer must use the non-indexed `draw` layout. Its selected record keeps
`vertexCount: 6` and `firstVertex: 0`; GPU queries normally update only `instanceCount`.

The root layer entry point deliberately does not import Arrow, GeoArrow, or the luSpatial query
algorithms. Applications can produce the fixed-width buffers with any ingestion and query pipeline;
the optional query entry point described below supplies one reusable geographic workflow.

```ts
import {LuSpatialPointLayer} from '@deck.gl-community/gpu-layers';

const layer = new LuSpatialPointLayer({
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
counts on the GPU; the two `outputs` objects can be passed directly to `LuSpatialPointLayer`.

```ts
import {LuSpatialPointLayer} from '@deck.gl-community/gpu-layers';
import {LuSpatialGeographicPointQueryEffect} from '@deck.gl-community/gpu-layers/query';

const queryEffect = new LuSpatialGeographicPointQueryEffect(device, {
  longitudeLatitudes,
  sourceBounds: [-74.1, 40.65, -73.84, 40.85],
  projectionOrigin: [-73.97, 40.75],
  projectedBounds: [-12, -10, 12, 10],
  gridSize: [256, 256],
  initialSelection: {center: [-73.9855, 40.758], radiusKilometres: 0.35},
  selectionRadiusRangeKilometres: [0.05, 5],
  onStats: stats => updateInspector(stats.inspectorSnapshot)
});

const contextLayer = new LuSpatialPointLayer({
  id: 'context-points',
  ...queryEffect.outputs.viewport
});
const selectionLayer = new LuSpatialPointLayer({
  id: 'selected-points',
  ...queryEffect.outputs.selection
});

deck.setProps({effects: [queryEffect], layers: [contextLayer, selectionLayer]});
queryEffect.setSelection([-73.99, 40.75], 0.5);
```

The caller supplies source bounds in WGS84 degrees and projected bounds in the same
cuSpatial-compatible sinusoidal space selected by `projectionOrigin`. The effect compiles an
adaptive luProj plan once and uses it for both resident rows and mutable selections. This keeps
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
