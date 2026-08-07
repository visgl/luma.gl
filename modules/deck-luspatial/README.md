# @deck.gl-community/luspatial

Reusable deck.gl adapters for GPU-native spatial and graph data.

## Spatial layers

`LuSpatialPointLayer` binds caller-owned position and point-ID buffers directly and replays a
caller-owned `DrawCommandBuffer`. The layer owns only its render model and style-uniform buffer;
query results, indirect commands, and source positions remain owned by the application.

The command buffer must use the non-indexed `draw` layout. Its selected record keeps
`vertexCount: 6` and `firstVertex: 0`; GPU queries normally update only `instanceCount`.

The spatial layer does not depend on Arrow, GeoArrow, or the luSpatial query algorithms.
Applications can produce the fixed-width buffers with any ingestion and query pipeline. The separate
graph adapter uses `@luma.gl/experimental/lugraph` without coupling the spatial layer to a particular
query algorithm.

```ts
import {LuSpatialPointLayer} from '@deck.gl-community/luspatial';

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

## Graph effects and layers

`LuGraphDeckEffect` composes topology, PageRank, weak components, neighborhood search, and
progressive force layout inside deck.gl's existing frame. Deck owns queue submission; the effect
retains original source and target edge partitions, including empty batches, without staging or
reading graph data back to the CPU.

```ts
import {
  LuGraphDeckEffect,
  LuGraphEdgeLayer,
  LuGraphNodeLayer,
  type LuGraphDeckDataset
} from '@deck.gl-community/luspatial';

const dataset: LuGraphDeckDataset = {
  vertexCount,
  sourceChunks,
  targetChunks,
  positions,
  velocities
};
const effect = new LuGraphDeckEffect(device, dataset);
```

`LuGraphNodeLayer` consumes the exact progressive position allocation alongside resident PageRank,
component, distance, and selection outputs. Create one `LuGraphEdgeLayer` per nonempty original edge
partition to render caller-owned source and target buffers directly. The graph algorithms remain in
`@luma.gl/experimental/lugraph`; only this private adapter package depends on deck.gl.
