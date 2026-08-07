# @deck.gl-community/arrow-layers

Private deck.gl layers backed by the Arrow adapters and `GPUVector` objects from
`@luma.gl/arrow`.

The layers intentionally do not use deck.gl `AttributeManager` for Arrow columns.
Arrow data is converted once into `GPUVector`/`GPUTable` inputs and bound directly
to luma.gl models.

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
} from '@deck.gl-community/arrow-layers';

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
