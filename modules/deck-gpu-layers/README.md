# @deck.gl-community/gpu-layers

Reusable deck.gl layers that consume caller-owned GPU buffers.

## Water surfaces

`WaterSurfaceLayer` shades flat, triangulated water polygons on WebGPU and WebGL2 using the shared
`@luma.gl/shadertools` water material. Supply packed `float32x3` positions in local east/north/up
meters, `vertexCount`, and Deck's `coordinateOrigin`. The layer borrows the position buffer and owns
only its render model; the application must release the buffer after removing/finalizing the layer.

```ts
const water = new WaterSurfaceLayer({
  id: 'river',
  positions,
  vertexCount,
  coordinateOrigin: [-74.006, 40.7128, 0],
  data: [{name: 'River'}],
  pickable: true,
  time: () => elapsedSeconds,
  material: {normalStrength: 0.55, coordinateScale: [0.22, 0.22]}
});
```

Import `WaterSurfaceLayer` from `@deck.gl-community/gpu-layers`. All triangles form one pickable
surface (`index: 0`). Supply separate layers for independently selectable surfaces. `time` accepts
seconds or a callback; the caller schedules frames, for example with Deck's `_animate` option, and
disables animation when paused. Material defaults use opaque water and planar UV coordinates in
local meters, so ripple wavelength is independent of the polygon's triangulation.
The prototype assumes a flat local surface with a +Z normal and fixed ambient/directional lighting.
It provides animated normal shading, not geometry displacement, terrain draping, scene reflections,
or general LayerExtension support. See `examples/deck/city-scene` for a complete application.

## Spatial points

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

## Auxiliary scene buffers

`SceneBufferEffect` captures participating layers into luma.gl `GBuffer` textures before Deck's
normal display pass. This WebGPU adapter makes HDR scene color, sampleable opaque depth, encoded
view normals/roughness, and an opaque selection mask available to subsequent effects. It does not
replace Deck's display output or modify the picking pass.

```ts
import {SceneBufferEffect} from '@deck.gl-community/gpu-layers';

const sceneBuffers = new SceneBufferEffect({
  history: true,
  getLayerOptions: layer => {
    if (layer.id === 'buildings') {
      return {mode: 'opaque', surfaceBuffer: true, selected: true};
    }
    if (layer.id === 'glass') return {mode: 'transparent'};
    return null;
  }
});
deck.setProps({effects: [sceneBuffers]});

// Read after SceneBufferEffect.preRender, for example from another effect's postRender.
const frame = sceneBuffers.getFrame('main');
if (frame) {
  const colorTexture = frame.buffer.colorTexture;
  const depthTexture = frame.buffer.depthTexture;
  const normalTexture = frame.buffer.normalRoughnessTexture;
  const selectionTexture = frame.buffer.getExtraColorTexture('selection');
  // Pass these borrowed textures to a luma.gl shader-pass pipeline.
}
```

Opaque participants write color and depth. Transparent participants blend color afterward without
changing opaque depth, normals, or selection. Declare their alpha/blending parameters as for normal
Deck rendering. Layer visibility, filtering, projection, transitions, and shader-module effects are
handled by Deck's layer pass. Place capture after effects whose pre-render work its layers need.
Selection includes only visible opaque fragments from selected layers implementing `surfaceBuffer`.
Nonparticipating layers and an external basemap are not represented in these textures.

### Normal and selection output

A participating mesh opts into the exported `surfaceBuffer` shader module. Its fragment shader must
branch before material output:

```wgsl
if (surfaceBuffer.enabled != 0) {
  return surfaceBuffer_encode(commonSpaceNormal, roughness);
}
```

The module converts the supplied common-space normal to view space, packs it into RGB in [0, 1],
and stores roughness in alpha. Apply any model/projection normal transformation before calling it.
The capture pass also uses this function for white selection-mask output. Normal material output
uses `enabled = 0`; the adapter restores that mode and model render parameters after auxiliary
passes. Layers without the module may still provide scene color and opaque depth; their normal
pixels retain the default roughness of 1.

### Views and history

Each view ID has separate full-canvas targets. `viewportBounds` locates its region in top-origin
physical texture pixels. Normal rendering, side-by-side views, and vertically split views use the
same pinned Deck viewport-origin correction. The adapter supplies its own cleared targets, so it
omits per-view clear operations that would nest WebGPU render passes in this Deck version.

`history: true` retains the previous completed capture in a second slot. `previousBuffer` is absent
on the first frame, after allocation resize, or after viewport bounds change. Call
`sceneBuffers.resetHistory(viewId)` for camera cuts, teleports, discontinuous time changes, or scene
replacement; omit the ID to reset all views. Camera matrices are copied per frame in Deck's native
common-space/OpenGL clip convention. They are not motion vectors, and retaining history does not
perform reprojection or temporal filtering by itself.

All returned textures are borrowed. Do not destroy them or retain them beyond the slot's next reuse.
Removing a view destroys its targets. Resize replaces its targets. Removing the effect or finalizing
Deck releases all captures; repeated cleanup is safe. Default formats use approximately 17 bytes per
canvas pixel per view, doubled when history is enabled, plus driver overhead. Capture issues four
passes per view and preserves the normal Deck display pass, so callers should measure the cost for
their scenes. The adapter currently requires WebGPU and explicit layer participation.

The repository's pinned Deck patch also adds depth to the first postprocessing scene target.
Without it, depth-writing layers are incompatible with that color-only WebGPU target as soon
as a `postRender` effect is installed. The second fullscreen swap target remains color-only.
